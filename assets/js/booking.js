// =====================================================
// BOOKING.JS - FINAL PRODUCTION VERSION
// =====================================================

// Configuration
const CONFIG = {
  accessKey: 'ad236cf0-3ad7-45a1-b50c-f410840cf9dd',
  apiUrl: 'https://api.web3forms.com/submit',
  autoSaveInterval: 30000, // 30 seconds
  maxFileSize: 5 * 1024 * 1024 // 5MB
};

// Data
const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
  'Switzerland', 'Singapore', 'Japan', 'South Korea', 'UAE',
  'Thailand', 'Malaysia', 'Indonesia', 'Philippines', 'Vietnam',
  'China', 'Russia', 'Brazil', 'Mexico', 'Argentina'
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai',
  'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
  'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur',
  'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Hubli–Dharwad'
];

// State
let autoFilledData = {};
let tourData = null;
let validationErrors = {};
let autoSaveTimer = null;
let isDirty = false;
let activeAutocomplete = null;

// =====================================================
// AUTOCOMPLETE FUNCTIONALITY
// =====================================================

function createAutocomplete(input, suggestions, onSelect) {
  removeAutocomplete();

  const wrapper = document.createElement('div');
  wrapper.className = 'autocomplete-dropdown';
  wrapper.id = 'autocomplete-dropdown';

  const filteredSuggestions = suggestions.filter(item => 
    item.toLowerCase().includes(input.value.toLowerCase())
  ).slice(0, 8);

  if (filteredSuggestions.length === 0) {
    wrapper.innerHTML = '<div class="autocomplete-item no-results">No results found</div>';
  } else {
    filteredSuggestions.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      
      const regex = new RegExp(`(${input.value})`, 'gi');
      const highlighted = item.replace(regex, '<strong>$1</strong>');
      div.innerHTML = highlighted;
      
      div.addEventListener('click', () => {
        input.value = item;
        onSelect(item);
        removeAutocomplete();
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      wrapper.appendChild(div);
    });
  }

  const rect = input.getBoundingClientRect();
  wrapper.style.top = `${rect.bottom + window.scrollY}px`;
  wrapper.style.left = `${rect.left + window.scrollX}px`;
  wrapper.style.width = `${rect.width}px`;

  document.body.appendChild(wrapper);
  activeAutocomplete = wrapper;

  let selectedIndex = -1;
  const items = wrapper.querySelectorAll('.autocomplete-item:not(.no-results)');

  input.addEventListener('keydown', function handleKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
      input.removeEventListener('keydown', handleKeydown);
    } else if (e.key === 'Escape') {
      removeAutocomplete();
      input.removeEventListener('keydown', handleKeydown);
    }
  });

  function updateSelection() {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
}

function removeAutocomplete() {
  if (activeAutocomplete) {
    activeAutocomplete.remove();
    activeAutocomplete = null;
  }
}

function setupAutocomplete(inputId, suggestions, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.setAttribute('autocomplete', 'off');

  input.addEventListener('focus', () => {
    if (input.value.trim().length > 0) {
      createAutocomplete(input, suggestions, onSelect);
    }
  });

  input.addEventListener('input', debounce(() => {
    if (input.value.trim().length > 0) {
      createAutocomplete(input, suggestions, onSelect);
    } else {
      removeAutocomplete();
    }
  }, 200));

  input.addEventListener('blur', () => {
    setTimeout(() => {
      removeAutocomplete();
    }, 200);
  });
}

function getCitiesForCountry(country) {
  if (country.toLowerCase() === 'india') {
    return INDIAN_CITIES;
  }
  return [
    'Capital City', 'Major City 1', 'Major City 2', 'Major City 3',
    'Other City 1', 'Other City 2', 'Other City 3'
  ];
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatPhoneNumber(value) {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  if (cleaned.length <= 10) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
}

function sanitizeInput(value) {
  return value.replace(/[<>]/g, '').trim();
}

function calculateEstimatedPrice(tripType, travelers, days) {
  const basePrices = {
    'tour': 5000,
    'flight': 8000,
    'hotel': 3000,
    'visa': 2000
  };
  
  const basePrice = basePrices[tripType] || 5000;
  const travelersMultiplier = parseInt(travelers) || 1;
  const daysMultiplier = Math.max(1, days / 2);
  
  return Math.round(basePrice * travelersMultiplier * daysMultiplier);
}

// =====================================================
// AUTO-SAVE FUNCTIONALITY
// =====================================================

function autoSaveFormData() {
  const form = document.getElementById('bookingForm');
  if (!form || !isDirty) return;

  const formData = new FormData(form);
  const data = {};
  
  formData.forEach((value, key) => {
    // Skip access_key from auto-save
    if (key !== 'access_key') {
      data[key] = value;
    }
  });

  try {
    localStorage.setItem('booking_draft', JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
    console.log('[BOOKING] ✓ Auto-saved');
    showToast('💾 Draft saved', 'info', 2000);
  } catch (e) {
    console.error('[BOOKING] Auto-save failed:', e);
  }
}

function restoreFormData() {
  try {
    const saved = localStorage.getItem('booking_draft');
    if (!saved) return false;

    const { data, timestamp } = JSON.parse(saved);
    
    const age = Date.now() - timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('booking_draft');
      return false;
    }

    const form = document.getElementById('bookingForm');
    if (!form) return false;

    Object.keys(data).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'radio') {
          const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
          if (radio) radio.checked = true;
        } else if (input.type === 'checkbox') {
          input.checked = data[key] === 'on';
        } else {
          input.value = data[key];
        }
      }
    });

    updateBookingSummary();
    console.log('[BOOKING] ✓ Draft restored');
    
    // Show styled reload message
    showDraftRestoredBanner(timestamp);
    
    return true;
  } catch (e) {
    console.error('[BOOKING] Restore failed:', e);
    return false;
  }
}

function showDraftRestoredBanner(timestamp) {
  const banner = document.createElement('div');
  banner.className = 'draft-restored-banner';
  banner.innerHTML = `
    <div class="banner-icon">📋</div>
    <div class="banner-content">
      <strong>Draft Restored</strong>
      <p>From ${new Date(timestamp).toLocaleString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })}</p>
    </div>
    <button class="banner-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  document.body.appendChild(banner);
  
  setTimeout(() => {
    banner.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  }, 5000);
}

function clearSavedDraft() {
  localStorage.removeItem('booking_draft');
  console.log('[BOOKING] ✓ Draft cleared');
}

// =====================================================
// AUTO-FILL FUNCTIONS
// =====================================================

function getAutoFillData() {
  const id = getQueryParam('id');
  const type = getQueryParam('type');
  
  if (id && type) {
    return { id, type };
  }
  
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

async function autoFillBookingForm() {
  const data = getAutoFillData();
  if (!data || data.type !== 'tour') {
    console.log('[BOOKING] No auto-fill data');
    return;
  }

  const { id } = data;
  console.log('[BOOKING] Auto-filling for:', id);
  
  const cmsData = await fetchCMSData();
  if (!cmsData) return;

  const item = cmsData.featured_tours?.find(t => t.id === id);
  if (!item) {
    console.warn('[BOOKING] Tour not found:', id);
    return;
  }

  tourData = item;

  const tourRadio = document.querySelector('input[name="trip_type"][value="tour"]');
  if (tourRadio) {
    tourRadio.checked = true;
    tourRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const packageInput = document.getElementById('package_name');
  if (packageInput) {
    packageInput.value = item.name || '';
    packageInput.classList.remove('error');
    packageInput.dispatchEvent(new Event('change', { bubbles: true }));
    autoFilledData.packageName = item.name || '';
  }

  updateBookingSummary();

  const form = document.getElementById('bookingForm');
  if (form) {
    setTimeout(() => {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }

  showToast('✨ Package information pre-filled!', 'success');
  console.log('[BOOKING] Auto-fill complete');
}

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

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

function validateField(input) {
  const name = input.name;
  const value = input.value.trim();
  let isValid = true;
  let errorMsg = '';

  input.classList.remove('error');
  removeFieldError(name);

  if (input.hasAttribute('required') && !value) {
    isValid = false;
    errorMsg = '⚠️ This field is required';
  }
  else if (input.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMsg = '❌ Please enter a valid email address';
    }
  }
  else if (input.type === 'tel' && value) {
    const phoneRegex = /^[\d\s+\-().]{7,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMsg = '❌ Please enter a valid phone number';
    }
  }
  else if (input.type === 'number') {
    const num = parseInt(value);
    if (value && (isNaN(num) || num < 1 || num > 20)) {
      isValid = false;
      errorMsg = '❌ Number must be between 1 and 20';
    }
  }
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

function removeFieldError(fieldName) {
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorEl) {
    errorEl.remove();
  }
  delete validationErrors[fieldName];
}

function showFieldError(input) {
  const name = input.name;
  const error = validationErrors[name];

  if (!error) return;

  const existing = document.querySelector(`[data-error-for="${name}"]`);
  if (existing) existing.remove();

  const errorEl = document.createElement('div');
  errorEl.className = 'field-error-tooltip';
  errorEl.setAttribute('data-error-for', name);
  errorEl.innerHTML = `
    <span class="error-arrow"></span>
    <span class="error-text">${error.message}</span>
  `;

  input.parentElement.appendChild(errorEl);

  setTimeout(() => {
    errorEl.classList.add('show');
  }, 10);

  console.log('[VALIDATION] Error shown for:', name, error.message);
}

function scrollToFirstError() {
  const errors = Object.values(validationErrors);
  if (errors.length === 0) return;

  const firstError = errors[0];
  const element = firstError.element;

  element.classList.add('error-pulse');

  const offset = 120;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  
  window.scrollTo({
    top: top,
    behavior: 'smooth'
  });

  setTimeout(() => {
    element.focus();
    showToast(firstError.message, 'error');
  }, 400);

  errors.forEach(error => {
    showFieldError(error.element);
  });

  console.log('[VALIDATION] Scrolled to first error');
}

// =====================================================
// UI UPDATE FUNCTIONS
// =====================================================

function updateBookingSummary() {
  const typeRadio = document.querySelector('input[name="trip_type"]:checked');
  const packageInput = document.getElementById('package_name');
  const travelersInput = document.getElementById('travelers_count');
  const dateInput = document.getElementById('trip_date');

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

  if (packageInput) {
    const summaryPackage = document.getElementById('summary-package');
    if (summaryPackage) {
      summaryPackage.textContent = packageInput.value || '-';
    }
  }

  if (travelersInput) {
    const summaryTravelers = document.getElementById('summary-travelers');
    if (summaryTravelers) {
      const count = parseInt(travelersInput.value) || 1;
      summaryTravelers.textContent = count;
    }
  }

  if (dateInput && dateInput.value) {
    const date = new Date(dateInput.value + 'T00:00:00');
    const summaryDate = document.getElementById('summary-date');
    if (summaryDate) {
      summaryDate.textContent = date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  updateEstimatedPrice();
}

function updateEstimatedPrice() {
  const typeRadio = document.querySelector('input[name="trip_type"]:checked');
  const travelersInput = document.getElementById('travelers_count');
  const dateInput = document.getElementById('trip_date');
  
  if (!typeRadio || !travelersInput || !dateInput || !dateInput.value) return;

  const tripType = typeRadio.value;
  const travelers = travelersInput.value;
  
  const tripDate = new Date(dateInput.value);
  const today = new Date();
  const days = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24));
  
  const estimated = calculateEstimatedPrice(tripType, travelers, days);
  
  const priceElement = document.getElementById('summary-price');
  if (priceElement) {
    priceElement.textContent = `₹${estimated.toLocaleString('en-IN')}`;
  }
}

function showCharacterCount(textarea, maxLength) {
  const current = textarea.value.length;
  const countEl = textarea.parentElement.querySelector('.char-count');
  
  if (countEl) {
    countEl.textContent = `${current}/${maxLength}`;
    countEl.style.color = current > maxLength * 0.9 ? '#e74c3c' : '#95a5a6';
  }
}

// =====================================================
// FORM INITIALIZATION & SUBMISSION
// =====================================================

function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const result = document.getElementById('bookingResult');

  if (!form) return;

  const hasDraft = restoreFormData();
  if (hasDraft) {
    isDirty = true;
  }

  setupAutocomplete('country', COUNTRIES, (selectedCountry) => {
    console.log('[AUTOCOMPLETE] Country selected:', selectedCountry);
    const cityInput = document.getElementById('city');
    if (cityInput) {
      cityInput.value = '';
      cityInput.placeholder = `Enter city in ${selectedCountry}`;
    }
  });

  setupAutocomplete('city', INDIAN_CITIES, (selectedCity) => {
    console.log('[AUTOCOMPLETE] City selected:', selectedCity);
  });

  const countryInput = document.getElementById('country');
  if (countryInput) {
    countryInput.addEventListener('change', () => {
      const cities = getCitiesForCountry(countryInput.value);
      setupAutocomplete('city', cities, (selectedCity) => {
        console.log('[AUTOCOMPLETE] City selected:', selectedCity);
      });
    });
  }

  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input);
    });

    input.addEventListener('input', () => {
      isDirty = true;
      
      if (input.classList.contains('error')) {
        validateField(input);
      }
      
      if (input.type === 'text' || input.type === 'email') {
        input.value = sanitizeInput(input.value);
      }
    });

    input.addEventListener('change', () => {
      validateField(input);
      updateBookingSummary();
    });
  });

  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      e.target.value = formatted;
    });
  }

  const textarea = document.getElementById('special_requests');
  if (textarea) {
    const maxLength = 500;
    textarea.setAttribute('maxlength', maxLength);
    
    const charCounter = document.createElement('small');
    charCounter.className = 'char-count form-help';
    charCounter.textContent = `0/${maxLength}`;
    textarea.parentElement.appendChild(charCounter);
    
    textarea.addEventListener('input', () => {
      showCharacterCount(textarea, maxLength);
    });
  }

  form.addEventListener('change', updateBookingSummary);
  form.addEventListener('input', debounce(updateBookingSummary, 300));

  autoSaveTimer = setInterval(autoSaveFormData, CONFIG.autoSaveInterval);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('[BOOKING] Form submission started');
    validationErrors = {};

    form.querySelectorAll('[required]').forEach(input => {
      validateField(input);
    });

    if (Object.keys(validationErrors).length > 0) {
      console.log('[BOOKING] Validation failed. Errors:', Object.keys(validationErrors));
      scrollToFirstError();
      showToast('❌ Please fix the errors and try again', 'error');
      return;
    }

    const termsCheckbox = document.getElementById('terms-checkbox');
    if (!termsCheckbox || !termsCheckbox.checked) {
      showToast('❌ Please accept the terms and conditions', 'error');
      if (termsCheckbox) termsCheckbox.focus();
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';

    const formData = new FormData(form);
    
    // IMPORTANT: Only add access_key once, check if it exists
    if (!formData.has('access_key')) {
      formData.append('access_key', CONFIG.accessKey);
    }

    if (result) {
      result.textContent = '⏳ Submitting your booking...';
      result.hidden = false;
      result.className = 'result-message result-loading';
    }

    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const email = formData.get('email');
        
        if (result) {
          result.innerHTML = `
            <div class="result-success">
              <div class="result-icon">✅</div>
              <h3>Booking Submitted Successfully!</h3>
              <p>Thank you for your interest. We will contact you within 24 hours.</p>
              <p><strong>Confirmation sent to:</strong> ${email}</p>
            </div>
          `;
          result.className = 'result-message result-success';
        }
        
        form.reset();
        validationErrors = {};
        isDirty = false;
        updateBookingSummary();
        sessionStorage.removeItem('lastBookingData');
        clearSavedDraft();
        
        showToast('✅ Booking submitted successfully!', 'success');

        setTimeout(() => {
          if (result) result.hidden = true;
        }, 6000);

        console.log('[BOOKING] Submission successful');
      } else {
        if (result) {
          result.innerHTML = `
            <div class="result-error">
              <div class="result-icon">❌</div>
              <h3>Submission Failed</h3>
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
            <div class="result-icon">⚠️</div>
            <h3>Network Error</h3>
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

function setupFormInteractions() {
  const dateInput = document.getElementById('trip_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

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

  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.form-input') && !e.target.closest('.autocomplete-dropdown')) {
      removeAutocomplete();
    }
  });

  console.log('[BOOKING] Form interactions setup');
}

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[BOOKING] 📝 Page initialized');
  
  setTimeout(async () => {
    await loadContactInfo();
    setupFormInteractions();
    initBookingForm();
    await autoFillBookingForm();
    updateBookingSummary();
  }, 300);
});

window.addEventListener('unload', () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
});

console.log('[BOOKING] ✅ Script loaded');
