/* ===================================================================
   NetBots CRM Lead Scraper — Popup Logic
   Handles auth, lead display, and CRM import.
   =================================================================== */

// ===== CONFIGURATION =====
// Change this to your production CRM server URL (no trailing slash, no /api)
const CRM_BASE_URL = 'https://api.netbots.io';
// =========================

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // Elements
  const authSection     = $('auth-section');
  const connectedSection = $('connected-section');
  const btnLogin        = $('btn-login');
  const btnLogout       = $('btn-logout');
  const btnImport       = $('btn-import');
  const btnClear        = $('btn-clear');
  const authError       = $('auth-error');
  const importResult    = $('import-result');
  const leadCount       = $('lead-count');
  const leadsList       = $('leads-list');
  const connectedUser   = $('connected-user');
  const crmEmailInput   = $('crm-email');
  const crmPasswordInput = $('crm-password');

  let currentLeads = [];

  /* ---------- Storage helpers ---------- */

  function saveAuth(data) {
    chrome.storage.local.set({
      nb_crm_token: data.token,
      nb_crm_user: data.user
    });
  }

  function clearAuth() {
    chrome.storage.local.remove(['nb_crm_token', 'nb_crm_user']);
  }

  function getAuth() {
    return new Promise(resolve => {
      chrome.storage.local.get(['nb_crm_token', 'nb_crm_user'], resolve);
    });
  }

  /* ---------- UI state ---------- */

  function showAuth() {
    authSection.classList.remove('hidden');
    connectedSection.classList.add('hidden');
  }

  function showConnected(user) {
    authSection.classList.add('hidden');
    connectedSection.classList.remove('hidden');
    connectedUser.textContent = user?.name || user?.email || 'Connected';
  }

  function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }

  function showResult(msg, isSuccess) {
    importResult.textContent = msg;
    importResult.className = `result-msg ${isSuccess ? 'success' : 'error'}`;
    importResult.classList.remove('hidden');
    setTimeout(() => importResult.classList.add('hidden'), 6000);
  }

  /* ---------- Render leads ---------- */

  function renderLeads(leads) {
    currentLeads = leads;
    leadCount.textContent = leads.length;
    btnImport.disabled = leads.length === 0;

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

  /* ---------- Login ---------- */

  btnLogin.addEventListener('click', async () => {
    const email = crmEmailInput.value.trim();
    const password = crmPasswordInput.value;

    if (!email || !password) {
      showError(authError, 'Please enter email and password.');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Signing In...';

    try {
      const res = await fetch(`${CRM_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success && data.data?.token) {
        saveAuth({ token: data.data.token, user: data.data.user });
        showConnected(data.data.user);
        fetchLeadsFromTab();
      } else {
        showError(authError, data.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      showError(authError, 'Connection failed. CRM server may be offline.');
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Sign In';
    }
  });

  /* ---------- Logout ---------- */

  btnLogout.addEventListener('click', () => {
    clearAuth();
    showAuth();
  });

  /* ---------- Import to CRM ---------- */

  btnImport.addEventListener('click', async () => {
    if (currentLeads.length === 0) return;

    const auth = await getAuth();
    if (!auth.nb_crm_token) {
      showResult('Not connected to CRM. Please sign in.', false);
      return;
    }

    btnImport.disabled = true;
    btnImport.textContent = 'Importing...';

    try {
      const res = await fetch(`${CRM_BASE_URL}/api/import/extension-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.nb_crm_token}`
        },
        body: JSON.stringify({ leads: currentLeads })
      });

      const data = await res.json();

      if (data.success) {
        showResult(`Imported ${data.summary.success} of ${data.summary.total} leads!`, true);

        // Clear selections on the page
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'NB_CLEAR_LEADS' }).catch(() => {});
        }
        renderLeads([]);
      } else {
        showResult(data.error || 'Import failed.', false);
      }
    } catch (err) {
      showResult('Connection failed. Is the CRM server running?', false);
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

  (async () => {
    const auth = await getAuth();
    if (auth.nb_crm_token) {
      showConnected(auth.nb_crm_user);
      fetchLeadsFromTab();
    } else {
      showAuth();
    }
  })();
});
