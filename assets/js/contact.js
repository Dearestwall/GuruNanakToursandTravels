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
  if (phoneEl) {
    phoneEl.textContent = contact.phone;
    document.getElementById('call-link').href = `tel:${contact.phone}`;
  }

  // Email
  const emailEl = document.getElementById('contact-email');
  if (emailEl) {
    emailEl.textContent = contact.email;
    document.getElementById('email-link').href = `mailto:${contact.email}`;
  }

  // Address
  const addressEl = document.getElementById('contact-address');
  if (addressEl) {
    addressEl.textContent = contact.address;
  }

  // Map
  const mapLink = document.getElementById('map-link');
  if (mapLink && contact.map_link) {
    mapLink.href = contact.map_link;
  }

  // Load map
  loadMap(contact.map_link);

  // FAQs
  loadContactFAQs();
}

/**
 * Load contact map
 */
function loadMap(mapUrl) {
  if (!mapUrl) return;
  const mapContainer = document.getElementById('contactMap');
  if (!mapContainer) return;

  // Embed Google Map iframe
  mapContainer.innerHTML = `
    <iframe 
      src="${mapUrl.replace(/^https:\/\/maps/, 'https://www.google.com/maps/embed')}&output=embed"
      width="100%" 
      height="400" 
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

  container.innerHTML = cmsData.faqs.map((faq, i) => `
    <details class="faq"${i === 0 ? ' open' : ''}>
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');
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
