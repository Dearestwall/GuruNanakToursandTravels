// =====================================================
// CONTACT.JS - Contact form & map handler
// =====================================================

let contactData = null;
let validationErrors = {};
let allFAQs = [];
let faqsLoaded = 0;

/**
 * Load contact information from CMS
 */
async function loadContactInfo() {
  try {
    console.log('[CONTACT] Loading contact info...');
    
    const cmsData = await fetchCMSData();
    if (!cmsData || !cmsData.contact) {
      console.warn('[CONTACT] No contact data found');
      return;
    }

    contactData = cmsData.contact;
    console.log('[CONTACT] Contact data loaded');

    // Phone
    const callLink = document.getElementById('call-link');
    if (callLink && contactData.phone) {
      callLink.textContent = contactData.phone;
      callLink.href = `tel:${contactData.phone.replace(/\s+/g, '')}`;
    }

    // Email
    const emailLink = document.getElementById('email-link');
    if (emailLink && contactData.email) {
      emailLink.textContent = contactData.email;
      emailLink.href = `mailto:${contactData.email}`;
    }

    // WhatsApp
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappLink && contactData.whatsapp) {
      const whatsappNum = contactData.whatsapp.replace(/[^\d+]/g, '');
      whatsappLink.href = `https://wa.me/${whatsappNum}`;
    }

    // Address
    const addressEl = document.getElementById('contact-address');
    if (addressEl && contactData.address) {
      addressEl.textContent = contactData.address;
    }

    // Map
    const mapLink = document.getElementById('map-link');
    if (mapLink && contactData.map_link) {
      mapLink.href = contactData.map_link;
    }

    await loadContactMap();
    await loadContactFAQs();

  } catch (error) {
    console.error('[CONTACT] Error loading info:', error);
  }
}

/**
 * Convert Google Maps shortlink to embed URL
 */
function convertMapsUrlToEmbed(mapUrl) {
  try {
    console.log('[CONTACT] Converting map URL:', mapUrl);

    // Handle Google Maps shortlinks (goo.gl/...)
    if (mapUrl.includes('goo.gl') || mapUrl.includes('maps.app.goo.gl')) {
      const coords = 'Patti, Punjab, India';
      const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDXT8jAXY0vQ5-Tx9CnHmGY4CFoLVjHb8U&q=${encodeURIComponent(coords)}`;
      console.log('[CONTACT] Converted shortlink to embed');
      return embedUrl;
    }

    // Handle regular Google Maps URLs
    if (mapUrl.includes('maps.google.com') || mapUrl.includes('google.com/maps')) {
      const qMatch = mapUrl.match(/[?&]q=([^&]+)/);
      const placeMatch = mapUrl.match(/place\/([^/]+)/);
      const coordMatch = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

      let location = 'Patti, Punjab, India';

      if (qMatch) {
        location = decodeURIComponent(qMatch[1]);
      } else if (placeMatch) {
        location = decodeURIComponent(placeMatch[1]);
      } else if (coordMatch) {
        location = `${coordMatch[1]},${coordMatch[2]}`;
      }

      const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyDXT8jAXY0vQ5-Tx9CnHmGY4CFoLVjHb8U&q=${encodeURIComponent(location)}`;
      console.log('[CONTACT] Converted maps URL to embed');
      return embedUrl;
    }

    // If it's already an embed URL, return as-is
    if (mapUrl.includes('maps/embed')) {
      return mapUrl;
    }

    console.warn('[CONTACT] Could not parse map URL, using default location');
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyDXT8jAXY0vQ5-Tx9CnHmGY4CFoLVjHb8U&q=Patti,Punjab,India`;
  } catch (error) {
    console.error('[CONTACT] Map URL conversion error:', error);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyDXT8jAXY0vQ5-Tx9CnHmGY4CFoLVjHb8U&q=Patti,Punjab,India`;
  }
}

/**
 * Load contact map
 */
async function loadContactMap() {
  try {
    if (!contactData || !contactData.map_link) {
      console.warn('[CONTACT] No map link provided');
      return;
    }

    const mapContainer = document.getElementById('contactMap');
    if (!mapContainer) return;

    console.log('[CONTACT] Loading map...');

    const embedUrl = convertMapsUrlToEmbed(contactData.map_link);

    mapContainer.innerHTML = `
      <iframe 
        src="${embedUrl}"
        width="100%" 
        height="100%" 
        style="border:0; border-radius: 1rem;" 
        allowfullscreen="" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade"
        title="Guru Nanak Tours & Travels - Contact location map"
      ></iframe>
    `;

    console.log('[CONTACT] Map loaded successfully');
  } catch (error) {
    console.error('[CONTACT] Map error:', error);
  }
}

/**
 * Render initial FAQs (first 6)
 */
function renderInitialFAQs(container, faqs) {
  const initial = Math.min(6, faqs.length);
  
  const html = faqs.slice(0, initial).map((faq, i) => `
    <details class="faq" data-faq-index="${i}">
      <summary class="faq-summary">
        <span class="faq-question">${faq.q}</span>
        <span class="faq-icon">+</span>
      </summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  container.innerHTML = html;
  faqsLoaded = initial;

  setupFAQInteractions();
  console.log('[CONTACT] Rendered initial FAQs:', initial);
}

/**
 * Load more FAQs (next 3 items)
 */
function loadMoreFAQs() {
  const container = document.getElementById('contactFaqList');
  if (!container) return;

  const nextBatch = Math.min(3, allFAQs.length - faqsLoaded);
  if (nextBatch <= 0) {
    console.log('[CONTACT] All FAQs already loaded');
    return;
  }

  const html = allFAQs.slice(faqsLoaded, faqsLoaded + nextBatch).map((faq, i) => `
    <details class="faq" data-faq-index="${faqsLoaded + i}">
      <summary class="faq-summary">
        <span class="faq-question">${faq.q}</span>
        <span class="faq-icon">+</span>
      </summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  Array.from(tempDiv.children).forEach((el, idx) => {
    el.classList.add('fade-in');
    el.style.animationDelay = `${idx * 100}ms`;
    container.appendChild(el);
  });

  faqsLoaded += nextBatch;

  setupFAQInteractions();

  // Update button
  const showMoreBtn = document.getElementById('showMoreFaq');
  if (showMoreBtn) {
    const remaining = allFAQs.length - faqsLoaded;
    if (remaining > 0) {
      showMoreBtn.textContent = `📖 Show More Questions (${remaining} remaining)`;
    } else {
      showMoreBtn.textContent = '✓ All Questions Shown';
      showMoreBtn.disabled = true;
      showMoreBtn.style.opacity = '0.6';
    }
  }

  console.log('[CONTACT] Loaded more FAQs. Total loaded:', faqsLoaded);
}

/**
 * Load FAQs for contact page with enhanced logic
 */
async function loadContactFAQs() {
  try {
    const cmsData = await fetchCMSData();
    if (!cmsData || !cmsData.faqs || cmsData.faqs.length === 0) {
      console.warn('[CONTACT] No FAQs found');
      return;
    }

    allFAQs = cmsData.faqs;
    const container = document.getElementById('contactFaqList');
    if (!container) return;

    console.log('[CONTACT] Loading FAQs...', allFAQs.length, 'items');

    // Render initial FAQs
    renderInitialFAQs(container, allFAQs);

    // Setup Show More button
    if (allFAQs.length > 6) {
      setupShowMoreButton();
    }

    console.log('[CONTACT] FAQs loaded:', allFAQs.length);
  } catch (error) {
    console.error('[CONTACT] FAQ error:', error);
  }
}

/**
 * Setup Show More button
 */
function setupShowMoreButton() {
  const showMoreBtn = document.getElementById('showMoreFaq');
  if (!showMoreBtn) return;

  showMoreBtn.style.display = 'block';
  const remaining = allFAQs.length - faqsLoaded;
  showMoreBtn.textContent = `📖 Show More Questions (${remaining} remaining)`;

  showMoreBtn.addEventListener('click', loadMoreFAQs);
  console.log('[CONTACT] Show More button setup');
}

/**
 * Setup FAQ interactions (accordion behavior)
 */
function setupFAQInteractions() {
  const faqs = document.querySelectorAll('.faq');

  faqs.forEach((details) => {
    const icon = details.querySelector('.faq-icon');
    const summary = details.querySelector('.faq-summary');

    if (!icon) return;

    // Close all other FAQs when opening one
    details.addEventListener('toggle', () => {
      if (details.open) {
        // Close all other FAQs
        faqs.forEach((otherDetails) => {
          if (otherDetails !== details && otherDetails.open) {
            otherDetails.open = false;
          }
        });

        // Update icon and styles for opened FAQ
        icon.textContent = '−';
        summary.classList.add('active');
        details.classList.add('open');

        // Auto-scroll to opened FAQ
        setTimeout(() => {
          details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        console.log('[CONTACT] FAQ opened:', details.querySelector('.faq-question').textContent);
      } else {
        // Update icon and styles for closed FAQ
        icon.textContent = '+';
        summary.classList.remove('active');
        details.classList.remove('open');

        console.log('[CONTACT] FAQ closed:', details.querySelector('.faq-question').textContent);
      }
    });
  });

  console.log('[CONTACT] FAQ interactions setup for', faqs.length, 'FAQs');
}

/**
 * Validate contact form field
 */
function validateContactField(input) {
  const name = input.name;
  const value = input.value.trim();
  let isValid = true;
  let errorMsg = '';

  input.classList.remove('error');
  delete validationErrors[name];

  // Required check
  if (input.hasAttribute('required') && !value) {
    isValid = false;
    errorMsg = '⚠️ This field is required';
  }
  // Email validation
  else if (input.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMsg = '❌ Please enter a valid email';
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
  // Message min length
  else if (input.name === 'message' && value.length < 10) {
    isValid = false;
    errorMsg = '❌ Message must be at least 10 characters';
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
 * Show field error tooltip
 */
function showFieldError(input) {
  const name = input.name;
  const error = validationErrors[name];

  if (!error) return;

  // Remove existing
  const existing = document.querySelector(`[data-error-for="${name}"]`);
  if (existing) existing.remove();

  // Create tooltip
  const errorEl = document.createElement('div');
  errorEl.className = 'field-error-tooltip';
  errorEl.setAttribute('data-error-for', name);
  errorEl.innerHTML = `
    <span class="error-arrow"></span>
    <span class="error-text">${error.message}</span>
  `;

  input.parentElement.appendChild(errorEl);
  setTimeout(() => errorEl.classList.add('show'), 10);

  console.log('[CONTACT] Error shown for:', name);
}

/**
 * Scroll to first error
 */
function scrollToFirstError() {
  const errors = Object.values(validationErrors);
  if (errors.length === 0) return;

  const firstError = errors[0];
  const element = firstError.element;

  element.classList.add('error-pulse');

  const offset = 100;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  
  window.scrollTo({
    top: top,
    behavior: 'smooth'
  });

  setTimeout(() => {
    element.focus();
    showToast(firstError.message, 'error');
  }, 300);

  errors.forEach(error => showFieldError(error.element));
  console.log('[CONTACT] Scrolled to first error');
}

/**
 * Initialize contact form
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const result = document.getElementById('contactResult');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  console.log('[CONTACT] Initializing form...');

  // Real-time validation
  form.querySelectorAll('[required], [type="email"], [type="tel"], textarea[name="message"]').forEach(input => {
    input.addEventListener('blur', () => {
      validateContactField(input);
    });

    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        validateContactField(input);
      }
    });
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('[CONTACT] Form submission started');
    validationErrors = {};

    // Validate all required fields
    form.querySelectorAll('[required], [type="email"], [type="tel"], textarea[name="message"]').forEach(input => {
      validateContactField(input);
    });

    // Check for errors
    if (Object.keys(validationErrors).length > 0) {
      console.log('[CONTACT] Validation failed');
      scrollToFirstError();
      showToast('❌ Please fix the errors and try again', 'error');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Sending...';

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    if (result) {
      result.textContent = '⏳ Sending your message...';
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
              <h3>✅ Message Sent Successfully!</h3>
              <p>Thank you for reaching out. We'll respond to your message within 24 hours.</p>
              <p><strong>Sent from:</strong> ${object.email}</p>
            </div>
          `;
          result.className = 'result-message result-success';
        }
        
        form.reset();
        validationErrors = {};
        showToast('✅ Message sent successfully!', 'success');

        setTimeout(() => {
          if (result) result.hidden = true;
        }, 6000);

        console.log('[CONTACT] Submission successful');
      } else {
        if (result) {
          result.innerHTML = `
            <div class="result-error">
              <h3>❌ Sending Failed</h3>
              <p>${data.message || 'Please try again later.'}</p>
            </div>
          `;
          result.className = 'result-message result-error';
        }
        
        showToast(`❌ ${data.message || 'Failed to send'}`, 'error');
        console.error('[CONTACT] Submission failed:', data);
      }
    } catch (error) {
      console.error('[CONTACT] Error:', error);
      
      if (result) {
        result.innerHTML = `
          <div class="result-error">
            <h3>❌ Network Error</h3>
            <p>Please check your connection and try again.</p>
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

  console.log('[CONTACT] Form initialized');
}

/**
 * Setup form interactions
 */
function setupFormInteractions() {
  // Focus animations
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

  console.log('[CONTACT] Form interactions setup');
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[CONTACT] 💬 Page initialized');
  
  setTimeout(async () => {
    setupFormInteractions();
    initContactForm();
    await loadContactInfo();
  }, 200);
});

console.log('[CONTACT] ✅ Script loaded');
