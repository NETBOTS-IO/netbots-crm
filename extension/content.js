/* ===================================================================
   NetBots CRM Lead Scraper — Content Script (v1.2)
   Injects scrape buttons into Google Maps search result panels.
   Persists selections globally in chrome.storage.local.
   =================================================================== */

(() => {
  'use strict';

  const PROCESSED_NODES = new WeakSet();

  /* ---------- helpers ---------- */

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /** Build a unique key for a business listing */
  const leadKey = (name, addr) => `${(name || '').trim().toLowerCase()}__${(addr || '').trim().toLowerCase()}`;

  /* ---------- icon SVG ---------- */
  const NB_ICON_CHECKED = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const NB_ICON_UNCHECKED = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><text x="6" y="17" font-size="11" font-weight="800" fill="#3b82f6" stroke="none" font-family="sans-serif">NB</text></svg>`;

  /* ---------- Storage Helpers ---------- */

  function getSavedLeads() {
    return new Promise(resolve => {
      chrome.storage.local.get({ nb_scraped_leads: {} }, (data) => {
        resolve(data.nb_scraped_leads || {});
      });
    });
  }

  function saveLeads(leads) {
    return new Promise(resolve => {
      chrome.storage.local.set({ nb_scraped_leads: leads }, () => {
        resolve();
      });
    });
  }

  /* ---------- scrape one listing from the side panel ---------- */

  function scrapeDetailPanel() {
    const data = {};

    // Name
    const nameEl = document.querySelector('h1.DUwDvf, h1.fontHeadlineLarge');
    data.Name = nameEl ? nameEl.innerText.trim() : '';

    // Category
    const catEl = document.querySelector('button[jsaction*="category"] span, .DkEaL');
    data.Category = catEl ? catEl.innerText.trim() : '';

    // Address
    const addressBtns = document.querySelectorAll('button[data-item-id="address"]');
    addressBtns.forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      if (ariaLabel) data.Address = ariaLabel.replace(/^Address:\s*/i, '');
    });
    if (!data.Address) {
      const addrEl = document.querySelector('[data-item-id="address"] .fontBodyMedium');
      data.Address = addrEl ? addrEl.innerText.trim() : '';
    }

    // Phone
    const phoneBtns = document.querySelectorAll('button[data-item-id^="phone:"]');
    phoneBtns.forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      if (ariaLabel) data.Phone = ariaLabel.replace(/^Phone:\s*/i, '');
    });

    // Website
    const websiteBtns = document.querySelectorAll('a[data-item-id="authority"]');
    websiteBtns.forEach(a => {
      data.Website = a.href || '';
    });

    // Rating & Reviews
    const ratingEl = document.querySelector('.fontDisplayLarge, .F7nice span[aria-hidden]');
    if (ratingEl) data.AverageRating = parseFloat(ratingEl.innerText) || 0;

    const reviewEl = document.querySelector('button[jsaction*="reviews"] span, .F7nice span:last-child');
    if (reviewEl) {
      const rText = reviewEl.innerText.replace(/[^0-9]/g, '');
      data.ReviewCount = parseInt(rText) || 0;
    }

    // Place ID from URL
    const url = window.location.href;
    const placeMatch = url.match(/place\/[^/]+\/([-\d.]+),([-\d.]+)/);
    if (placeMatch) {
      data.Latitude = parseFloat(placeMatch[1]);
      data.Longitude = parseFloat(placeMatch[2]);
    }

    // CID from URL (data parameter)
    const cidMatch = url.match(/0x[0-9a-f]+:0x([0-9a-f]+)/i);
    if (cidMatch) data.CID = cidMatch[0];

    // PlaceId from URL (/place/ segment)
    const pidMatch = url.match(/!1s(0x[^!]+)/);
    if (pidMatch) data.PlaceID = pidMatch[1];
    if (!data.PlaceID && cidMatch) data.PlaceID = cidMatch[0];

    // Social media & info items
    const infoItems = document.querySelectorAll('div[class*="rogA2c"], a[data-item-id]');
    infoItems.forEach(item => {
      const href = (item.href || '').toLowerCase();
      if (href.includes('instagram.com')) data.Instagram = item.href;
      if (href.includes('facebook.com')) data.Facebook = item.href;
      if (href.includes('twitter.com') || href.includes('x.com')) data.Twitter = item.href;
      if (href.includes('linkedin.com')) data.Linkedin = item.href;
      if (href.includes('yelp.com')) data.Yelp = item.href;
      if (href.includes('youtube.com')) data.Youtube = item.href;
    });

    // Business hours
    const hoursTable = document.querySelector('table.eK4R0e, table.WgFkxc');
    if (hoursTable) {
      const rows = hoursTable.querySelectorAll('tr');
      const dayMap = {
        monday: '1_Monday', tuesday: '2_Tuesday', wednesday: '3_Wednesday',
        thursday: '4_Thursday', friday: '5_Friday', saturday: '6_Saturday', sunday: '7_Sunday'
      };
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const day = cells[0].innerText.trim().toLowerCase();
          const hours = cells[1].innerText.trim();
          if (dayMap[day]) data[dayMap[day]] = hours;
        }
      });
    }

    return data;
  }

  /* ---------- scrape basic info from the result card ---------- */

  function scrapeResultCard(el) {
    const data = {};

    // Name
    const nameEl = el.querySelector('.fontHeadlineSmall, .qBF1Pd');
    data.Name = nameEl ? nameEl.innerText.trim() : '';

    // Rating
    const ratingEl = el.querySelector('.MW4etd, span.rating-number');
    data.AverageRating = ratingEl ? parseFloat(ratingEl.innerText) : 0;

    // Review count
    const reviewEl = el.querySelector('.UY7F9, span.review-count');
    if (reviewEl) {
      const rText = reviewEl.innerText.replace(/[^0-9]/g, '');
      data.ReviewCount = parseInt(rText) || 0;
    }

    // Category
    const tags = el.querySelectorAll('.W4Efsd span, .DkEaL');
    if (tags.length > 0) data.Category = tags[0].innerText.trim().replace(/·/g, '').trim();

    // Address
    const bodyDivs = el.querySelectorAll('.W4Efsd');
    if (bodyDivs.length > 1) {
      const parts = bodyDivs[1].innerText.split('·').map(s => s.trim());
      if (parts.length > 1) data.Address = parts[parts.length - 1];
      else data.Address = parts[0] || '';
    }

    // Phone
    bodyDivs.forEach(div => {
      const phoneMatch = div.innerText.match(/(\+?\d[\d\s\-()]{7,})/);
      if (phoneMatch) data.Phone = phoneMatch[1].trim();
    });

    return data;
  }

  /* ---------- inject buttons into result feed ---------- */

  async function injectButtons() {
    const savedLeads = await getSavedLeads();
    const resultItems = document.querySelectorAll('div.Nv2PK, div[jsaction*="mouseover"]');

    resultItems.forEach(item => {
      if (PROCESSED_NODES.has(item)) return;

      const nameEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd');
      if (!nameEl) return;

      PROCESSED_NODES.add(item);

      const basicData = scrapeResultCard(item);
      const key = leadKey(basicData.Name, basicData.Address);

      if (item.querySelector('.nb-scrape-btn')) return;

      const btn = document.createElement('div');
      btn.className = 'nb-scrape-btn';
      btn.dataset.key = key;
      btn.title = 'Add to NetBots Scraper';
      
      const isChecked = !!savedLeads[key];
      btn.innerHTML = isChecked ? NB_ICON_CHECKED : NB_ICON_UNCHECKED;
      if (isChecked) btn.classList.add('nb-checked');

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentSaved = await getSavedLeads();

        if (currentSaved[key]) {
          // Deselect
          delete currentSaved[key];
          await saveLeads(currentSaved);
          btn.innerHTML = NB_ICON_UNCHECKED;
          btn.title = 'Add to NetBots Scraper';
          btn.classList.remove('nb-checked');
        } else {
          // Click the listing to open details panel
          btn.innerHTML = `<div class="nb-loading"></div>`;
          
          const link = item.querySelector('a[href]');
          if (link) {
            link.click();
            await sleep(2200); // wait for details panel
          }

          // Scrape detailed data
          const detailedData = scrapeDetailPanel();
          const merged = { ...basicData, ...detailedData };
          if (!merged.Name) merged.Name = basicData.Name;

          const updatedSaved = await getSavedLeads();
          updatedSaved[key] = merged;
          await saveLeads(updatedSaved);

          btn.innerHTML = NB_ICON_CHECKED;
          btn.title = 'Added (click to remove)';
          btn.classList.add('nb-checked');
        }

        // Notify popup of update
        const finalSaved = await getSavedLeads();
        chrome.runtime.sendMessage({
          type: 'NB_LEADS_UPDATE',
          count: Object.keys(finalSaved).length,
          leads: Object.values(finalSaved)
        }).catch(() => {});
      });

      // Position logic
      const actionsArea = item.querySelector('.lI9IFe, .bfdHYd, .UaQhfb');
      if (actionsArea) {
        actionsArea.style.position = 'relative';
        actionsArea.appendChild(btn);
      } else {
        item.style.position = 'relative';
        item.appendChild(btn);
      }
    });
  }

  /* ---------- sync UI states with background storage ---------- */

  async function syncButtonsUI() {
    const savedLeads = await getSavedLeads();
    document.querySelectorAll('.nb-scrape-btn').forEach(btn => {
      const key = btn.dataset.key;
      const isChecked = !!savedLeads[key];
      btn.innerHTML = isChecked ? NB_ICON_CHECKED : NB_ICON_UNCHECKED;
      if (isChecked) {
        btn.classList.add('nb-checked');
      } else {
        btn.classList.remove('nb-checked');
      }
    });
  }

  /* ---------- listen for messages from popup ---------- */

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'NB_GET_LEADS') {
      getSavedLeads().then(leads => {
        sendResponse({
          count: Object.keys(leads).length,
          leads: Object.values(leads)
        });
      });
      return true;
    }
    if (msg.type === 'NB_CLEAR_LEADS') {
      saveLeads({}).then(() => {
        syncButtonsUI();
        sendResponse({ success: true });
      });
      return true;
    }
  });

  // Observe page shifts/updates
  const observer = new MutationObserver(() => {
    injectButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial runs
  setTimeout(injectButtons, 1500);
  setTimeout(injectButtons, 3000);

})();
