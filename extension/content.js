/* ===================================================================
   NetBots CRM Lead Scraper — Content Script
   Injects scrape buttons into Google Maps search result panels.
   =================================================================== */

(() => {
  'use strict';

  const SELECTED_LEADS = {};   // keyed by placeId or name
  const PROCESSED_NODES = new WeakSet();

  /* ---------- helpers ---------- */

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /** Build a unique key for a business listing */
  const leadKey = (name, addr) => `${(name || '').trim().toLowerCase()}__${(addr || '').trim().toLowerCase()}`;

  /** Safely grab innerText from a selector inside a container */
  const txt = (container, sel) => {
    const el = container.querySelector(sel);
    return el ? el.innerText.trim() : '';
  };

  /* ---------- icon SVG ---------- */
  const NB_ICON_CHECKED = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const NB_ICON_UNCHECKED = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><text x="6" y="17" font-size="11" font-weight="800" fill="#3b82f6" stroke="none" font-family="sans-serif">NB</text></svg>`;

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

    // Social media & hours — try info items
    const infoItems = document.querySelectorAll('div[class*="rogA2c"], a[data-item-id]');
    infoItems.forEach(item => {
      const href = (item.href || '').toLowerCase();
      const label = (item.getAttribute('aria-label') || '').toLowerCase();
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

    // Name from the main link
    const nameEl = el.querySelector('.fontHeadlineSmall, .qBF1Pd');
    data.Name = nameEl ? nameEl.innerText.trim() : '';

    // Rating
    const ratingEl = el.querySelector('.MW4etd');
    data.AverageRating = ratingEl ? parseFloat(ratingEl.innerText) : 0;

    // Review count
    const reviewEl = el.querySelector('.UY7F9');
    if (reviewEl) {
      const rText = reviewEl.innerText.replace(/[^0-9]/g, '');
      data.ReviewCount = parseInt(rText) || 0;
    }

    // Category
    const tags = el.querySelectorAll('.W4Efsd span, .DkEaL');
    if (tags.length > 0) data.Category = tags[0].innerText.trim().replace(/·/g, '').trim();

    // Address (second W4Efsd row usually)
    const bodyDivs = el.querySelectorAll('.W4Efsd');
    if (bodyDivs.length > 1) {
      const parts = bodyDivs[1].innerText.split('·').map(s => s.trim());
      if (parts.length > 1) data.Address = parts[parts.length - 1];
      else data.Address = parts[0] || '';
    }

    // Phone from body text
    bodyDivs.forEach(div => {
      const phoneMatch = div.innerText.match(/(\+?\d[\d\s\-()]{7,})/);
      if (phoneMatch) data.Phone = phoneMatch[1].trim();
    });

    return data;
  }

  /* ---------- inject buttons into result feed ---------- */

  function injectButtons() {
    // Google Maps result items
    const resultItems = document.querySelectorAll('div.Nv2PK, div[jsaction*="mouseover"]');

    resultItems.forEach(item => {
      if (PROCESSED_NODES.has(item)) return;
      if (item.querySelector('.nb-scrape-btn')) return;

      const nameEl = item.querySelector('.fontHeadlineSmall, .qBF1Pd');
      if (!nameEl) return;

      PROCESSED_NODES.add(item);

      const basicData = scrapeResultCard(item);
      const key = leadKey(basicData.Name, basicData.Address);

      // Create the NB button
      const btn = document.createElement('div');
      btn.className = 'nb-scrape-btn';
      btn.dataset.key = key;
      btn.title = 'Add to NetBots CRM';
      btn.innerHTML = SELECTED_LEADS[key] ? NB_ICON_CHECKED : NB_ICON_UNCHECKED;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (SELECTED_LEADS[key]) {
          // Deselect
          delete SELECTED_LEADS[key];
          btn.innerHTML = NB_ICON_UNCHECKED;
          btn.title = 'Add to NetBots CRM';
          btn.classList.remove('nb-checked');
        } else {
          // Try clicking the item to open detail panel for richer data
          btn.innerHTML = `<div class="nb-loading"></div>`;
          
          // Click the listing to open details
          const link = item.querySelector('a[href]');
          if (link) {
            link.click();
            await sleep(2000); // wait for panel to load
          }

          // Scrape detailed data (merges with basic)
          const detailedData = scrapeDetailPanel();
          const merged = { ...basicData, ...detailedData };

          // Ensure Name is captured
          if (!merged.Name) merged.Name = basicData.Name;

          SELECTED_LEADS[key] = merged;
          btn.innerHTML = NB_ICON_CHECKED;
          btn.title = 'Added to NetBots CRM (click to remove)';
          btn.classList.add('nb-checked');
        }

        // Notify popup of count change
        chrome.runtime.sendMessage({
          type: 'NB_LEADS_UPDATE',
          count: Object.keys(SELECTED_LEADS).length,
          leads: Object.values(SELECTED_LEADS)
        }).catch(() => {});
      });

      // Insert button — try to place it next to the actions area
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

  /* ---------- listen for messages from popup ---------- */

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'NB_GET_LEADS') {
      sendResponse({
        count: Object.keys(SELECTED_LEADS).length,
        leads: Object.values(SELECTED_LEADS)
      });
    }
    if (msg.type === 'NB_CLEAR_LEADS') {
      // Clear all selections
      Object.keys(SELECTED_LEADS).forEach(k => delete SELECTED_LEADS[k]);
      document.querySelectorAll('.nb-scrape-btn').forEach(btn => {
        btn.innerHTML = NB_ICON_UNCHECKED;
        btn.classList.remove('nb-checked');
      });
      sendResponse({ success: true });
    }
    return true; // keep channel open for async
  });

  /* ---------- mutation observer for dynamic loading ---------- */

  const observer = new MutationObserver(() => {
    injectButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial inject
  setTimeout(injectButtons, 2000);
  setTimeout(injectButtons, 5000);

})();
