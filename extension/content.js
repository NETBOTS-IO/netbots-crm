/* ===================================================================
   NetBots CRM Lead Scraper — Content Script (v1.3)
   Injects scrape buttons into Google Maps search result panels.
   Persists selections globally in chrome.storage.local.
   =================================================================== */

(() => {
  'use strict';

  /* ---------- helpers ---------- */

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

  /* ---------- scrape listing from the result card ---------- */

  function scrapeResultCard(el) {
    const data = {};

    // Find the main link container
    let linkEl = el.tagName.toLowerCase() === 'a' ? el : el.querySelector('a[href*="/maps/place/"]');
    
    // Name
    // Usually in an aria-label on the link, or the first prominent text element
    if (linkEl && linkEl.getAttribute('aria-label')) {
       data.Name = linkEl.getAttribute('aria-label').trim();
    } else {
       const nameEl = el.querySelector('.fontHeadlineSmall, .qBF1Pd, [role="heading"]');
       data.Name = nameEl ? nameEl.innerText.trim() : '';
    }

    // Rating
    const ratingEl = el.querySelector('.MW4etd, span.rating-number, [aria-label*="stars"]');
    data.AverageRating = ratingEl ? parseFloat(ratingEl.innerText) : 0;
    if (isNaN(data.AverageRating) && ratingEl && ratingEl.getAttribute('aria-label')) {
       const match = ratingEl.getAttribute('aria-label').match(/([\d.]+)\s*stars/);
       if (match) data.AverageRating = parseFloat(match[1]);
    }

    // Review count
    const reviewEl = el.querySelector('.UY7F9, span.review-count, [aria-label*="reviews"]');
    if (reviewEl) {
      const rText = reviewEl.innerText.replace(/[^0-9]/g, '');
      data.ReviewCount = parseInt(rText) || 0;
    }
    if (!data.ReviewCount && reviewEl && reviewEl.getAttribute('aria-label')) {
        const match = reviewEl.getAttribute('aria-label').match(/([\d,]+)\s*reviews/);
        if(match) data.ReviewCount = parseInt(match[1].replace(/,/g, ''));
    }

    // Category & Address
    // They are often in a container with class W4Efsd or similar, separated by middle dots
    const textBlocks = Array.from(el.querySelectorAll('.W4Efsd, .fontBodyMedium')).map(el => el.innerText.trim());
    
    for (const block of textBlocks) {
        if (!block) continue;
        const parts = block.split('·').map(s => s.trim());
        
        // Try to identify category
        if (!data.Category && parts.length > 0 && !parts[0].includes('(') && !parts[0].match(/[\d+]/)) {
            data.Category = parts[0];
        }

        // Try to identify address (usually comes after category or rating)
        if (parts.length > 1) {
            const potentialAddress = parts[parts.length - 1];
            if (potentialAddress.length > 5 && !potentialAddress.match(/Opens|Closed|\d{2}:\d{2}/i)) {
                 data.Address = potentialAddress;
            }
        }
    }

    // Phone
    const allText = el.innerText;
    const phoneMatch = allText.match(/(?:Phone: )?(\+?\d[\d\s\-()]{7,})/);
    if (phoneMatch) {
        data.Phone = phoneMatch[1].trim();
    }
    
    // Website (sometimes available directly on the card as a button)
    const websiteBtn = el.querySelector('a[href^="http"]:not([href*="google.com"])');
    if(websiteBtn) {
        data.Website = websiteBtn.href;
    }

    // Extract Place ID and GPS from URL if possible
    if (linkEl && linkEl.href) {
        const urlMatch = linkEl.href.match(/!1s(0x[^!]+)!.*!3d([-\d.]+)!4d([-\d.]+)/);
        if (urlMatch) {
            data.PlaceID = urlMatch[1];
            data.Latitude = parseFloat(urlMatch[2]);
            data.Longitude = parseFloat(urlMatch[3]);
        }
    }

    return data;
  }

  /* ---------- inject buttons into result feed ---------- */

  async function injectButtons() {
    const savedLeads = await getSavedLeads();
    
    // Select result items. A reliable selector is the anchor link containing '/maps/place/'
    // We want the parent container of that link.
    const placeLinks = document.querySelectorAll('a[href*="/maps/place/"]');
    
    placeLinks.forEach(link => {
      // Find a suitable parent container. Usually the grand-grand parent
      let item = link.closest('div[jsaction*="mouseover"]') || link.closest('.Nv2PK') || link.parentElement.parentElement;
      
      if (!item || item.hasAttribute('data-nb-processed')) return;

      const basicData = scrapeResultCard(item);
      if (!basicData.Name) return; // Need at least a name

      const key = leadKey(basicData.Name, basicData.Address);

      if (item.querySelector('.nb-scrape-btn-container')) return;

      // Mark as processed
      item.setAttribute('data-nb-processed', 'true');
      
      // Ensure the item has relative positioning for absolute child
      const currentPos = window.getComputedStyle(item).position;
      if (currentPos === 'static') {
          item.style.position = 'relative';
      }

      // Create button container
      const btnContainer = document.createElement('div');
      btnContainer.className = 'nb-scrape-btn-container';
      
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
          // Scrape and save immediately (no auto-clicking)
          // We re-scrape to get any newly rendered data
          const freshData = scrapeResultCard(item);
          // Ensure Name is captured
          if (!freshData.Name) freshData.Name = basicData.Name;

          const updatedSaved = await getSavedLeads();
          updatedSaved[key] = freshData;
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

      btnContainer.appendChild(btn);
      item.appendChild(btnContainer);
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

  // Debounced observer
  let observerTimeout;
  const observer = new MutationObserver(() => {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
        injectButtons();
    }, 500); // 500ms debounce
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial runs
  setTimeout(injectButtons, 1500);
  setTimeout(injectButtons, 3000);

})();
