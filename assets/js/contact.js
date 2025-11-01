// =====================================================
// CONTACT.JS - Contact form & map handler
// =====================================================

/**
 * Load contact information
 */
async function loadContactInfo() {
  const cmsData = await fetchCMSData();
  if (!cmsData || !cmsData.contact) return;

  const contact = cmsData.contact;

  // Phone
  const phoneEl = document.getElementById('contact-phone');
  const callLink = document.getElementById('call-link');
  if (callLink && contact.phone) {
    callLink.textContent = contact.phone;
    callLink.href = `tel:${contact.phone.replace(/\s+/g, '')}`;
  }

  // Email
  const emailLink = document.getElementById('email-link');
  if (emailLink && contact.email) {
    emailLink.textContent = contact.email;
    emailLink.href = `mailto:${contact.email}`;
  }

  // Address
  const addressEl = document.getElementById('contact-address');
  if (addressEl && contact.address) {
    addressEl.textContent = contact.address;
  }

  // Map
  const mapLink = document.getElementById('map-link');
  if (mapLink && contact.map_link) {
    mapLink.href = contact.map_link;
  }

  loadMap(contact.map_link);
  loadContactFAQs();
}

/**
 * Load contact map
 */
function loadMap(mapUrl) {
  if (!mapUrl) return;
  const mapContainer = document.getElementById('contactMap');
  if (!mapContainer) return;

  // Extract coordinates from Google Maps URL or build embed
  mapContainer.innerHTML = `
    <iframe 
      src="${mapUrl.includes('maps.google.com') ? mapUrl.replace('?q=', '?q=').replace('maps.google', 'google.com/maps/embed/v1/place?key=AIzaSyDXT8jAXY0vQ5-Tx9CnHmGY4CFoLVjHb8U&q=') : 'about:blank'}"
      width="100%" 
      height="100%" 
      style="border:0;" 
      allowfullscreen="" 
      loading="lazy" 
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  `;
}

/**
 * Load FAQs for contact page
 */
async function loadContactFAQs() {
  const cmsData = await fetchCMSData();
  if (!cmsData || !cmsData.faqs) return;

  const container = document.getElementById('contactFaqList');
  if (!container) return;

  const initial = Math.min(6, cmsData.faqs.length);
  container.innerHTML = cmsData.faqs.map((faq, i) => `
    <details class="faq"${i === 0 ? ' open' : ''} ${i >= initial ? 'data-hidden="true" style="display:none;"' : ''}>
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  if (cmsData.faqs.length > initial) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline';
    btn.textContent = 'Show More Questions';
    btn.style.marginTop = '1rem';
    container.parentElement?.appendChild(btn);
    btn.addEventListener('click', () => {
      const hidden = Array.from(container.querySelectorAll('.faq[data-hidden="true"]'));
      hidden.slice(0, 3).forEach(el => {
        el.style.display = '';
        el.removeAttribute('data-hidden');
      });
      if (!container.querySelector('.faq[data-hidden="true"]')) {
        btn.style.display = 'none';
      }
    });
  }
}

/**
 * Initialize contact form
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const result = document.getElementById('contactResult');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    result.textContent = '⏳ Sending...';
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
        result.textContent = '✅ Message sent! We\'ll reply soon.';
        result.style.background = '#ecfdf5';
        result.style.color = '#065f46';
        form.reset();
        setTimeout(() => {
          result.hidden = true;
        }, 5000);
      } else {
        result.textContent = `❌ ${data.message || 'Failed to send'}`;
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
  setTimeout(() => {
    loadContactInfo();
    initContactForm();
  }, 200);
});
