// =====================================================
// BOOKING.JS - Booking form with smart validation
// =====================================================

let autoFilledData = {};
let tourData = null;
let validationErrors = {};

/**
 * Get auto-fill data from query params or session storage
 */
function getAutoFillData() {
  const id = getQueryParam('id');
  const type = getQueryParam('type');
  
  if (id && type) {
    return { id, type };
  }
  
  // Check session storage
  const stored = sessionStorage.getItem('lastBookingData');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('[BOOKING] Invalid session data:', e);
      return null;
    }
  }
  
  return null;
}

/**
 * Auto-fill booking form with tour details
 */
async function autoFillBookingForm() {
  const data = getAutoFillData();
  if (!data || data.type !== 'tour') {
    console.log('[BOOKING] No auto-fill data');
    return;
  }

  const { id, type } = data;
  console.log('[BOOKING] Auto-filling for:', id);
  
  const cmsData = await fetchCMSData();
  if (!cmsData) return;

  const item = cmsData.featured_tours?.find(t => t.id === id);
  if (!item) {
    console.warn('[BOOKING] Tour not found:', id);
    return;
  }

  tourData = item;

  // Set trip type to tour
  const tourRadio = document.querySelector('input[name="trip_type"][value="tour"]');
  if (tourRadio) {
    tourRadio.checked = true;
    tourRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Set package name
  const packageInput = document.getElementById('package_name');
  if (packageInput) {
    packageInput.value = item.name || '';
    packageInput.classList.remove('error');
    packageInput.dispatchEvent(new Event('change', { bubbles: true }));
    autoFilledData.packageName = item.name || '';
  }

  updateBookingSummary();

  // Scroll to form
  const form = document.getElementById('bookingForm');
  if (form) {
    setTimeout(() => {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  showToast('✨ Package information pre-filled!', 'success');
  console.log('[BOOKING] Auto-fill complete');
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
  const whatsappClean = (contact.whatsapp || contact.phone || '').replace(/[^\d+]/g, '');

  const sidebarPhone = document.getElementById('sidebar-phone');
  if (sidebarPhone) {
    sidebarPhone.textContent = contact.phone || '+91 6283315156';
    sidebarPhone.href = `tel:${phoneClean}`;
  }

  const sidebarEmail = document.getElementById('sidebar-email');
  if (sidebarEmail) {
    sidebarEmail.textContent = emailClean || 'info@gntt.com';
    sidebarEmail.href = `mailto:${emailClean}`;
  }

  const sidebarWhatsapp = document.getElementById('sidebar-whatsapp');
  if (sidebarWhatsapp) {
    sidebarWhatsapp.href = `https://wa.me/${whatsappClean}`;
  }

  console.log('[BOOKING] Contact info loaded');
}

/**
 * Validate field value
 */
function validateField(input) {
  const name = input.name;
  const value = input.value.trim();
  let isValid = true;
  let errorMsg = '';

  // Clear previous error state
  input.classList.remove('error');
  removeFieldError(name);

  // Required field check
  if (input.hasAttribute('required') && !value) {
    isValid = false;
    errorMsg = '⚠️ This field is required';
  }
  // Email validation
  else if (input.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMsg = '❌ Please enter a valid email address';
    }
  }
  // Phone validation
  else if (input.type === 'tel' && value) {
    const phoneRegex = /^[\d\s+\-().]{7,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMsg = '❌ Please enter a valid phone number';
    }
  }
  // Number validation
  else if (input.type === 'number') {
    const num = parseInt(value);
    if (value && (isNaN(num) || num < 1 || num > 20)) {
      isValid = false;
      errorMsg = '❌ Number must be between 1 and 20';
    }
  }
  // Date validation (past date check)
  else if (input.type === 'date' && value) {
    const selectedDate = new Date(value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      isValid = false;
      errorMsg = '❌ Please select a future date';
    }
  }

  if (!isValid) {
    input.classList.add('error');
    validationErrors[name] = {
      element: input,
      message: errorMsg
    };
  }

  return isValid;
}

/**
 * Remove field error indicator
 */
function removeFieldError(fieldName) {
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorEl) {
    errorEl.remove();
  }
  delete validationErrors[fieldName];
}

/**
 * Show field error with tooltip
 */
function showFieldError(input) {
  const name = input.name;
  const error = validationErrors[name];

  if (!error) return;

  // Remove existing error element
  const existing = document.querySelector(`[data-error-for="${name}"]`);
  if (existing) existing.remove();

  // Create error tooltip
  const errorEl = document.createElement('div');
  errorEl.className = 'field-error-tooltip';
  errorEl.setAttribute('data-error-for', name);
  errorEl.innerHTML = `
    <span class="error-arrow"></span>
    <span class="error-text">${error.message}</span>
  `;

  // Insert after input
  input.parentElement.appendChild(errorEl);

  // Animate
  setTimeout(() => {
    errorEl.classList.add('show');
  }, 10);

  console.log('[VALIDATION] Error shown for:', name, error.message);
}

/**
 * Scroll to and highlight first error
 */
function scrollToFirstError() {
  const errors = Object.values(validationErrors);
  if (errors.length === 0) return;

  const firstError = errors[0];
  const element = firstError.element;

  // Add pulse animation
  element.classList.add('error-pulse');

  // Scroll with offset
  const offset = 100;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  
  window.scrollTo({
    top: top,
    behavior: 'smooth'
  });

  // Focus element
  setTimeout(() => {
    element.focus();
    showToast(firstError.message, 'error');
  }, 300);

  // Show all error tooltips
  errors.forEach(error => {
    showFieldError(error.element);
  });

  console.log('[VALIDATION] Scrolled to first error');
}

/**
 * Update booking summary in real-time
 */
function updateBookingSummary() {
  const typeRadio = document.querySelector('input[name="trip_type"]:checked');
  const packageInput = document.getElementById('package_name');
  const travelersInput = document.getElementById('travelers_count');
  const dateInput = document.getElementById('trip_date');

  // Trip type
  if (typeRadio) {
    const summaryType = document.getElementById('summary-type');
    if (summaryType) {
      const typeMap = {
        'tour': '🗺️ Tour',
        'flight': '✈️ Flight',
        'hotel': '🏨 Hotel',
        'visa': '📋 Visa'
      };
      summaryType.textContent = typeMap[typeRadio.value] || 'Not selected';
    }
  }

  // Package
  if (packageInput) {
    const summaryPackage = document.getElementById('summary-package');
    if (summaryPackage) {
      summaryPackage.textContent = packageInput.value || '-';
    }
  }

  // Travelers
  if (travelersInput) {
    const summaryTravelers = document.getElementById('summary-travelers');
    if (summaryTravelers) {
      const count = parseInt(travelersInput.value) || 1;
      summaryTravelers.textContent = count === 1 ? '1' : count;
    }
  }

  // Date
  if (dateInput && dateInput.value) {
    const date = new Date(dateInput.value + 'T00:00:00');
    const summaryDate = document.getElementById('summary-date');
    if (summaryDate) {
      summaryDate.textContent = date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  console.log('[BOOKING] Summary updated');
}

/**
 * Initialize booking form
 */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const result = document.getElementById('bookingResult');

  if (!form) return;

  // Real-time validation on input
  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateField(input);
      }
    });

    input.addEventListener('change', () => {
      validateField(input);
      updateBookingSummary();
    });
  });

  // Real-time summary updates
  form.addEventListener('change', updateBookingSummary);
  form.addEventListener('input', debounce(updateBookingSummary, 300));

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('[BOOKING] Form submission started');
    validationErrors = {};

    // Validate all required fields
    form.querySelectorAll('[required]').forEach(input => {
      validateField(input);
    });

    // Check for errors
    if (Object.keys(validationErrors).length > 0) {
      console.log('[BOOKING] Validation failed. Errors:', Object.keys(validationErrors));
      scrollToFirstError();
      showToast('❌ Please fix the errors and try again', 'error');
      return;
    }

    // Validate terms checkbox
    const termsCheckbox = document.getElementById('terms-checkbox');
    if (!termsCheckbox.checked) {
      showToast('❌ Please accept the terms and conditions', 'error');
      termsCheckbox.focus();
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    if (result) {
      result.textContent = '⏳ Submitting your booking...';
      result.hidden = false;
      result.className = 'result-message result-loading';
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

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
        if (result) {
          result.innerHTML = `
            <div class="result-success">
              <h3>✅ Booking Submitted Successfully!</h3>
              <p>Thank you for your interest. We will contact you within 24 hours.</p>
              <p><strong>Confirmation email sent to:</strong> ${object.email}</p>
            </div>
          `;
          result.className = 'result-message result-success';
        }
        
        form.reset();
        validationErrors = {};
        updateBookingSummary();
        sessionStorage.removeItem('lastBookingData');
        
        showToast('✅ Booking submitted successfully!', 'success');

        setTimeout(() => {
          if (result) result.hidden = true;
        }, 6000);

        console.log('[BOOKING] Submission successful');
      } else {
        if (result) {
          result.innerHTML = `
            <div class="result-error">
              <h3>❌ Submission Failed</h3>
              <p>${data.message || 'Please try again later.'}</p>
            </div>
          `;
          result.className = 'result-message result-error';
        }
        
        showToast(`❌ ${data.message || 'Submission failed'}`, 'error');
        console.error('[BOOKING] Submission failed:', data);
      }
    } catch (error) {
      console.error('[BOOKING] Error:', error);
      
      if (result) {
        result.innerHTML = `
          <div class="result-error">
            <h3>❌ Network Error</h3>
            <p>Please check your internet connection and try again.</p>
          </div>
        `;
        result.className = 'result-message result-error';
      }
      
      showToast('❌ Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  console.log('[BOOKING] Form initialized');
}

/**
 * Setup form interactions
 */
function setupFormInteractions() {
  // Set minimum date to today
  const dateInput = document.getElementById('trip_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  // Input focus animations
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
      if (!this.value) {
        this.parentElement.classList.remove('focused');
      }
    });
  });

  console.log('[BOOKING] Form interactions setup');
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[BOOKING] 📝 Page initialized');
  
  setTimeout(async () => {
    loadContactInfo();
    setupFormInteractions();
    initBookingForm();
    await autoFillBookingForm();
    updateBookingSummary();
  }, 200);
});

console.log('[BOOKING] ✅ Script loaded');
