// =====================================================
// BOOKING.JS - Booking form handler with auto-fill
// =====================================================

let autoFilledData = {};

/**
 * Get auto-fill data from query params or session storage
 */
function getAutoFillData() {
  const id = getQueryParam('id');
  const type = getQueryParam('type');
  
  if (id && type) {
    return { id, type };
  }
  
  // Check session storage for recent selection
  const stored = sessionStorage.getItem('lastBookingData');
  if (stored) {
    return JSON.parse(stored);
  }
  
  return null;
}

/**
 * Auto-fill booking form with package/tour details
 */
async function autoFillBookingForm() {
  const data = getAutoFillData();
  if (!data) return;

  const { id, type } = data;
  const cmsData = await fetchCMSData();
  if (!cmsData) return;

  let item = null;

  if (type === 'tour') {
    item = cmsData.featured_tours?.find(t => t.id === id);
  } else if (type === 'offering') {
    item = cmsData.offerings?.find(o => o.id === id);
  }

  if (!item) return;

  // Set trip type
  const tripTypeRadio = document.querySelector(`input[name="trip_type"][value="${type === 'offering' ? item.id?.split('-')[0] || 'tour' : 'tour'}"]`);
  if (tripTypeRadio) tripTypeRadio.checked = true;

  // Set package name
  const packageInput = document.getElementById('package_name');
  if (packageInput) {
    packageInput.value = item.name || item.title;
    autoFilledData.packageName = item.name || item.title;
  }

  // Update summary
  updateBookingSummary();

  // Scroll to form
  const form = document.getElementById('bookingForm');
  if (form) {
    form.scrollIntoView({ behavior: 'smooth' });
  }

  showToast('✨ Package information pre-filled!', 'success');
}

/**
 * Update booking summary in real-time
 */
function updateBookingSummary() {
  const packageInput = document.getElementById('package_name');
  const travelersInput = document.getElementById('travelers_count');
  const dateInput = document.getElementById('trip_date');

  if (packageInput) {
    document.getElementById('summary-package').textContent = packageInput.value || 'Select a package';
  }

  if (travelersInput) {
    document.getElementById('summary-travelers').textContent = travelersInput.value || '1';
  }

  if (dateInput) {
    const dateVal = dateInput.value;
    if (dateVal) {
      const date = new Date(dateVal);
      document.getElementById('summary-date').textContent = date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } else {
      document.getElementById('summary-date').textContent = 'Not selected';
    }
  }
}

/**
 * Load contact info into sidebar
 */
async function loadContactInfo() {
  const cmsData = await fetchCMSData();
  if (!cmsData || !cmsData.contact) return;

  const contact = cmsData.contact;
  const phoneClean = (contact.phone || '').replace(/\s+/g, '');
  const emailClean = contact.email || '';

  const sidebarPhone = document.getElementById('sidebar-phone');
  if (sidebarPhone) {
    sidebarPhone.textContent = contact.phone;
    sidebarPhone.href = `tel:${phoneClean}`;
  }

  const sidebarEmail = document.getElementById('sidebar-email');
  if (sidebarEmail) {
    sidebarEmail.textContent = emailClean;
    sidebarEmail.href = `mailto:${emailClean}`;
  }
}

/**
 * Initialize booking form
 */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const result = document.getElementById('bookingResult');

  if (!form) return;

  // Real-time summary updates
  ['package_name', 'travelers_count', 'trip_date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', updateBookingSummary);
      el.addEventListener('input', updateBookingSummary);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    result.textContent = '⏳ Submitting your booking...';
    result.hidden = false;

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: json
      });

      const data = await response.json();

      if (response.status === 200) {
        result.textContent = '✅ Booking inquiry submitted! Check your email for confirmation.';
        result.style.background = '#ecfdf5';
        result.style.color = '#065f46';
        form.reset();
        updateBookingSummary();
        setTimeout(() => {
          result.hidden = true;
        }, 5000);
      } else {
        result.textContent = `❌ ${data.message || 'Submission failed'}`;
        result.style.background = '#fee2e2';
        result.style.color = '#b91c1c';
      }
    } catch (error) {
      result.textContent = '❌ Network error. Please try again.';
      result.style.background = '#fee2e2';
      result.style.color = '#b91c1c';
    }
  });
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(async () => {
    loadContactInfo();
    initBookingForm();
    await autoFillBookingForm();
  }, 200);
});
