/**
 * Parking Violation Reporter - Frontend Application
 */

// API Base URL
const API_BASE = '/api';

// Application State
const state = {
  profile: null,
  profileId: null,
  calls: [],
  language: 'el',
  isLoading: false,
  rateLimits: null
};

// DOM Elements
const elements = {
  reportBtn: null,
  profileForm: null,
  vehicleForm: null,
  historyList: null,
  alertBanner: null,
  alertMessage: null,
  statusIndicator: null,
  statusText: null,
  confirmModal: null,
  confirmAuthority: null,
  rateLimitInfo: null
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Cache DOM elements
  cacheElements();

  // Set up event listeners
  setupEventListeners();

  // Load saved profile ID from localStorage
  state.profileId = localStorage.getItem('parking_reporter_profile_id');

  // Load profile if exists
  if (state.profileId) {
    await loadProfile();
  }

  // Load language preference
  const savedLang = localStorage.getItem('parking_reporter_language');
  if (savedLang) {
    setLanguage(savedLang);
  }

  // Check API health
  await checkHealth();
}

function cacheElements() {
  elements.reportBtn = document.getElementById('report-btn');
  elements.profileForm = document.getElementById('profile-form');
  elements.vehicleForm = document.getElementById('vehicle-form');
  elements.historyList = document.getElementById('history-list');
  elements.alertBanner = document.getElementById('alert-banner');
  elements.alertMessage = document.getElementById('alert-message');
  elements.statusIndicator = document.getElementById('status-indicator');
  elements.statusText = document.getElementById('status-text');
  elements.confirmModal = document.getElementById('confirm-modal');
  elements.confirmAuthority = document.getElementById('confirm-authority');
  elements.rateLimitInfo = document.getElementById('rate-limit-info');
}

function setupEventListeners() {
  // Report button
  elements.reportBtn.addEventListener('click', handleReportClick);

  // Profile form
  elements.profileForm.addEventListener('submit', handleProfileSubmit);

  // Clear vehicle button
  document.getElementById('clear-vehicle-btn').addEventListener('click', clearVehicleForm);

  // Section toggles
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => toggleSection(header));
  });

  // Language toggles
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Alert close
  document.getElementById('alert-close').addEventListener('click', hideAlert);

  // Modal buttons
  document.getElementById('confirm-cancel').addEventListener('click', hideModal);
  document.getElementById('confirm-proceed').addEventListener('click', confirmAndReport);
}

// ================== API Functions ==================

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (data.mock_mode) {
      showAlert('info', state.language === 'el'
        ? 'Λειτουργία δοκιμής - δεν θα πραγματοποιηθούν πραγματικές κλήσεις'
        : 'Test mode - no real calls will be made');
    }
  } catch (error) {
    showAlert('error', state.language === 'el'
      ? 'Αδυναμία σύνδεσης με τον διακομιστή'
      : 'Unable to connect to server');
  }
}

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/profile/${state.profileId}`);

    if (!response.ok) {
      if (response.status === 404) {
        // Profile not found, clear stored ID
        localStorage.removeItem('parking_reporter_profile_id');
        state.profileId = null;
        return;
      }
      throw new Error('Failed to load profile');
    }

    state.profile = await response.json();
    populateProfileForm();
    enableReportButton();
    await loadRateLimits();
    await loadCallHistory();

    // Expand profile section to show it's loaded
    const profileHeader = document.querySelector('[data-toggle="profile-form"]');
    if (profileHeader && !profileHeader.classList.contains('expanded')) {
      toggleSection(profileHeader);
    }

  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function saveProfile(profileData) {
  try {
    const method = state.profileId ? 'PUT' : 'POST';
    const url = state.profileId
      ? `${API_BASE}/profile/${state.profileId}`
      : `${API_BASE}/profile`;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save profile');
    }

    state.profile = await response.json();
    state.profileId = state.profile.id;
    localStorage.setItem('parking_reporter_profile_id', state.profileId);

    showAlert('success', state.language === 'el'
      ? 'Το προφίλ αποθηκεύτηκε'
      : 'Profile saved');

    enableReportButton();
    await loadRateLimits();

    return true;
  } catch (error) {
    showAlert('error', error.message);
    return false;
  }
}

async function loadRateLimits() {
  if (!state.profileId) return;

  try {
    const response = await fetch(`${API_BASE}/report/limits?profile_id=${state.profileId}`);
    if (response.ok) {
      state.rateLimits = await response.json();
      updateRateLimitDisplay();
    }
  } catch (error) {
    console.error('Error loading rate limits:', error);
  }
}

async function loadCallHistory() {
  if (!state.profileId) return;

  try {
    const response = await fetch(`${API_BASE}/calls?profile_id=${state.profileId}&limit=10`);
    if (response.ok) {
      state.calls = await response.json();
      renderCallHistory();
    }
  } catch (error) {
    console.error('Error loading call history:', error);
  }
}

async function submitReport() {
  if (!state.profile) {
    showAlert('error', state.language === 'el'
      ? 'Παρακαλώ αποθηκεύστε πρώτα το προφίλ σας'
      : 'Please save your profile first');
    return;
  }

  // Get vehicle details
  const vehicleData = getVehicleFormData();

  setLoading(true);
  showStatus(state.language === 'el' ? 'Καλείται...' : 'Calling...');

  try {
    const response = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: state.profileId,
        ...vehicleData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit report');
    }

    hideStatus();
    showAlert('success', state.language === 'el'
      ? `Η κλήση ξεκίνησε! (${data.calls_remaining} κλήσεις απομένουν σήμερα)`
      : `Call initiated! (${data.calls_remaining} calls remaining today)`);

    // Reload call history and rate limits
    await loadCallHistory();
    await loadRateLimits();

    // Poll for call status
    if (data.report_id) {
      pollCallStatus(data.report_id);
    }

  } catch (error) {
    hideStatus();
    showAlert('error', error.message);
  } finally {
    setLoading(false);
  }
}

async function pollCallStatus(reportId, attempts = 0) {
  if (attempts > 30) return; // Stop polling after 30 attempts (5 minutes)

  try {
    const response = await fetch(`${API_BASE}/calls/${reportId}/status`);
    if (response.ok) {
      const status = await response.json();

      if (status.completed || status.status === 'completed' || status.status === 'failed') {
        // Reload call history to show updated status
        await loadCallHistory();

        if (status.status === 'completed') {
          showAlert('success', state.language === 'el'
            ? 'Η κλήση ολοκληρώθηκε!'
            : 'Call completed!');
        }
        return;
      }
    }
  } catch (error) {
    console.error('Error polling status:', error);
  }

  // Continue polling
  setTimeout(() => pollCallStatus(reportId, attempts + 1), 10000);
}

// ================== UI Functions ==================

function populateProfileForm() {
  if (!state.profile) return;

  document.getElementById('full_name').value = state.profile.full_name || '';
  document.getElementById('address').value = state.profile.address || '';
  document.getElementById('phone_number').value = state.profile.phone_number || '';
  document.getElementById('preferred_authority').value = state.profile.preferred_authority || 'trochia';
  document.getElementById('authority_phone').value = state.profile.authority_phone || '';
}

function getVehicleFormData() {
  return {
    vehicle_plate: document.getElementById('vehicle_plate').value.trim() || null,
    vehicle_color: document.getElementById('vehicle_color').value || null,
    vehicle_make_model: document.getElementById('vehicle_make_model').value.trim() || null
  };
}

function clearVehicleForm() {
  document.getElementById('vehicle_plate').value = '';
  document.getElementById('vehicle_color').value = '';
  document.getElementById('vehicle_make_model').value = '';
}

function enableReportButton() {
  elements.reportBtn.disabled = false;
}

function disableReportButton() {
  elements.reportBtn.disabled = true;
}

function updateRateLimitDisplay() {
  if (!state.rateLimits) return;

  const { calls_today, limit, calls_remaining, can_make_call } = state.rateLimits;

  elements.rateLimitInfo.textContent = state.language === 'el'
    ? `${calls_today}/${limit} κλήσεις σήμερα`
    : `${calls_today}/${limit} calls today`;

  if (!can_make_call) {
    disableReportButton();
    elements.rateLimitInfo.style.color = 'var(--primary-red)';
  } else {
    elements.rateLimitInfo.style.color = 'var(--text-light)';
  }
}

function renderCallHistory() {
  if (!state.calls || state.calls.length === 0) {
    elements.historyList.innerHTML = `
      <p class="no-history" data-el="Δεν υπάρχουν κλήσεις ακόμα" data-en="No calls yet">
        ${state.language === 'el' ? 'Δεν υπάρχουν κλήσεις ακόμα' : 'No calls yet'}
      </p>
    `;
    return;
  }

  const html = state.calls.map(call => {
    const date = new Date(call.created_at);
    const dateStr = date.toLocaleDateString(state.language === 'el' ? 'el-GR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusLabels = {
      completed: state.language === 'el' ? 'Ολοκληρώθηκε' : 'Completed',
      in_progress: state.language === 'el' ? 'Σε εξέλιξη' : 'In Progress',
      failed: state.language === 'el' ? 'Απέτυχε' : 'Failed',
      pending: state.language === 'el' ? 'Αναμονή' : 'Pending',
      cancelled: state.language === 'el' ? 'Ακυρώθηκε' : 'Cancelled'
    };

    return `
      <div class="history-item">
        <div class="history-header">
          <span class="history-date">${dateStr}</span>
          <span class="history-status ${call.status}">${statusLabels[call.status] || call.status}</span>
        </div>
        <div class="history-details">
          ${call.vehicle_plate ? `<span>${state.language === 'el' ? 'Πινακίδα' : 'Plate'}: ${call.vehicle_plate}</span>` : ''}
          ${call.duration_seconds ? `<span>${state.language === 'el' ? 'Διάρκεια' : 'Duration'}: ${Math.round(call.duration_seconds)}s</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  elements.historyList.innerHTML = html;
}

function toggleSection(header) {
  const targetId = header.dataset.toggle;
  const target = document.getElementById(targetId);

  if (!target) return;

  const isExpanded = header.classList.contains('expanded');

  if (isExpanded) {
    header.classList.remove('expanded');
    target.classList.add('collapsed');
  } else {
    header.classList.add('expanded');
    target.classList.remove('collapsed');
  }
}

function setLanguage(lang) {
  state.language = lang;
  localStorage.setItem('parking_reporter_language', lang);

  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update all translatable elements
  document.querySelectorAll('[data-el][data-en]').forEach(el => {
    el.textContent = el.dataset[lang] || el.dataset.el;
  });

  // Re-render dynamic content
  updateRateLimitDisplay();
  renderCallHistory();
}

// ================== Event Handlers ==================

function handleReportClick() {
  if (!state.profile) {
    showAlert('warning', state.language === 'el'
      ? 'Παρακαλώ αποθηκεύστε πρώτα το προφίλ σας'
      : 'Please save your profile first');
    return;
  }

  // Show confirmation modal
  const authorityName = state.profile.preferred_authority === 'dimotiki'
    ? (state.language === 'el' ? 'Δημοτική Αστυνομία' : 'Municipal Police')
    : (state.language === 'el' ? 'Τροχαία' : 'Traffic Police');

  elements.confirmAuthority.textContent = `${authorityName} (${state.profile.authority_phone || 'Default number'})`;
  elements.confirmModal.classList.remove('hidden');
}

async function handleProfileSubmit(e) {
  e.preventDefault();

  const profileData = {
    full_name: document.getElementById('full_name').value.trim(),
    address: document.getElementById('address').value.trim(),
    phone_number: document.getElementById('phone_number').value.trim(),
    preferred_authority: document.getElementById('preferred_authority').value,
    authority_phone: document.getElementById('authority_phone').value.trim() || null
  };

  await saveProfile(profileData);
}

function confirmAndReport() {
  hideModal();
  submitReport();
}

// ================== Alert & Status Functions ==================

function showAlert(type, message) {
  elements.alertMessage.textContent = message;
  elements.alertBanner.className = `alert-banner ${type}`;
  elements.alertBanner.classList.remove('hidden');

  // Auto-hide after 5 seconds for non-error alerts
  if (type !== 'error') {
    setTimeout(hideAlert, 5000);
  }
}

function hideAlert() {
  elements.alertBanner.classList.add('hidden');
}

function showStatus(text) {
  elements.statusText.textContent = text;
  elements.statusIndicator.classList.remove('hidden');
}

function hideStatus() {
  elements.statusIndicator.classList.add('hidden');
}

function showModal() {
  elements.confirmModal.classList.remove('hidden');
}

function hideModal() {
  elements.confirmModal.classList.add('hidden');
}

function setLoading(loading) {
  state.isLoading = loading;
  elements.reportBtn.disabled = loading;

  if (loading) {
    elements.reportBtn.innerHTML = `
      <span class="status-spinner"></span>
      <span class="btn-text">${state.language === 'el' ? 'Καλείται...' : 'Calling...'}</span>
    `;
  } else {
    elements.reportBtn.innerHTML = `
      <span class="btn-icon">📞</span>
      <span class="btn-text">${state.language === 'el' ? 'Αναφορά Παράνομης Στάθμευσης' : 'Report Parking Violation'}</span>
    `;
  }
}
