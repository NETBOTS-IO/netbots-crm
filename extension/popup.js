/* ===================================================================
   NetBots CRM Lead Scraper — Popup Logic (v1.1)
   Direct Scraper access with CSV download and CRM import.
   =================================================================== */

const CRM_BASE_URL = 'https://api.netbots.io';

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // Elements
  const btnCsv        = $('btn-csv');
  const btnImport       = $('btn-import');
  const btnClear        = $('btn-clear');
  const importResult    = $('import-result');
  const leadCount       = $('lead-count');
  const leadsList       = $('leads-list');

  let currentLeads = [];

  // Required headers in exact order
  const CSV_HEADERS = [
    'Name', 'Phone', 'Email', 'Website', 'Address', 'Instagram', 'Facebook',
    'Twitter', 'Linkedin', 'Yelp', 'Youtube', 'PlaceID', 'CID', 'Category',
    'ReviewCount', 'AverageRating', 'Latitude', 'Longitude', '1_Monday',
    '2_Tuesday', '3_Wednesday', '4_Thursday', '5_Friday', '6_Saturday', '7_Sunday'
  ];

  /* ---------- UI state ---------- */

  function showResult(msg, isSuccess) {
    importResult.textContent = msg;
    importResult.className = `result-msg ${isSuccess ? 'success' : 'error'}`;
    importResult.classList.remove('hidden');
    setTimeout(() => importResult.classList.add('hidden'), 8000);
  }

  /* ---------- Render leads ---------- */

  function renderLeads(leads) {
    currentLeads = leads;
    leadCount.textContent = leads.length;
    
    const hasLeads = leads.length > 0;
    btnCsv.disabled = !hasLeads;
    btnImport.disabled = !hasLeads;

    leadsList.innerHTML = '';
    leads.forEach(lead => {
      const item = document.createElement('div');
      item.className = 'lead-item';
      item.innerHTML = `
        <span class="lead-name">${lead.Name || 'Unknown'}</span>
        <span class="lead-cat">${lead.Category || ''}</span>
      `;
      leadsList.appendChild(item);
    });
  }

  /* ---------- Fetch leads from content script ---------- */

  async function fetchLeadsFromTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url?.includes('google.com/maps')) {
        renderLeads([]);
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: 'NB_GET_LEADS' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          renderLeads([]);
          return;
        }
        renderLeads(response.leads || []);
      });
    } catch {
      renderLeads([]);
    }
  }

  /* ---------- Grab Token from CRM tab ---------- */

  async function getSessionToken() {
    // Try finding the active tab or any open tab that matches CRM domain
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('netbots.io') || tab.url.includes('localhost') || tab.url.includes('147.93.94.137'))) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => localStorage.getItem('token')
          });
          if (results && results[0] && results[0].result) {
            return results[0].result;
          }
        } catch (e) {
          console.warn('Could not read session from tab:', tab.url, e);
        }
      }
    }
    return null;
  }

  /* ---------- CSV Exporter ---------- */

  function escapeCsvValue(val) {
    if (val === undefined || val === null) return '';
    let stringVal = String(val);
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  }

  btnCsv.addEventListener('click', () => {
    if (currentLeads.length === 0) return;

    // Build rows
    const rows = [CSV_HEADERS.join(',')];

    currentLeads.forEach(lead => {
      const values = CSV_HEADERS.map(header => {
        const val = lead[header];
        return escapeCsvValue(val);
      });
      rows.push(values.join(','));
    });

    const csvContent = "\uFEFF" + rows.join('\n'); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scraped_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showResult('CSV File downloaded successfully!', true);
  });

  /* ---------- Direct Import via session token ---------- */

  btnImport.addEventListener('click', async () => {
    if (currentLeads.length === 0) return;

    btnImport.disabled = true;
    btnImport.textContent = 'Importing...';

    try {
      const token = await getSessionToken();
      if (!token) {
        showResult('Please log into your NetBots CRM website first to perform direct imports.', false);
        btnImport.disabled = false;
        btnImport.textContent = 'Import to CRM';
        return;
      }

      const res = await fetch(`${CRM_BASE_URL}/api/import/extension-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leads: currentLeads })
      });

      const data = await res.json();

      if (data.success) {
        showResult(`Imported ${data.summary.success} of ${data.summary.total} leads!`, true);

        // Clear selections
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'NB_CLEAR_LEADS' }).catch(() => {});
        }
        renderLeads([]);
      } else {
        showResult(data.error || 'Import failed.', false);
      }
    } catch (err) {
      showResult('Connection failed. CRM server may be offline.', false);
    } finally {
      btnImport.disabled = false;
      btnImport.textContent = 'Import to CRM';
    }
  });

  /* ---------- Clear ---------- */

  btnClear.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'NB_CLEAR_LEADS' }).catch(() => {});
    }
    renderLeads([]);
  });

  /* ---------- Listen for live updates from content script ---------- */

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'NB_LEADS_UPDATE') {
      renderLeads(msg.leads || []);
    }
  });

  /* ---------- Init ---------- */

  fetchLeadsFromTab();
});
