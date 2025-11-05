// =====================================================
// CONTACT.JS - CMS-powered contact page
// =====================================================

/**
 * Load contact information from CMS
 */
async function loadContactInfo() {
  console.log('📞 Loading contact information...');
  
  const cmsData = await fetchCMSData();
  if (!cmsData || !cmsData.contact) {
    console.warn('No contact data available');
    return;
  }

  const contact = cmsData.contact;

  // Update phone
  const phoneLink = document.getElementById('contact-phone-link');
  if (phoneLink && contact.phone) {
    phoneLink.textContent = contact.phone;
    phoneLink.href = `tel:${contact.phone.replace(/\s+/g, '')}`;
  }

  // Update email
  const emailLink = document.getElementById('contact-email-link');
  if (emailLink && contact.email) {
    emailLink.textContent = contact.email;
    emailLink.href = `mailto:${contact.email}`;
  }

  // Update address
  const addressEl = document.getElementById('contact-address');
  if (addressEl && contact.address) {
    addressEl.textContent = contact.address;
  }

  // Update office hours
  const hoursEl = document.getElementById('contact-hours');
  if (hoursEl && contact.office_hours) {
    const hours = contact.office_hours;
    hoursEl.innerHTML = `${hours.monday_friday || 'Mon-Fri: 9 AM - 7 PM'} | ${hours.saturday || 'Sat: 10 AM - 6 PM'}`;
  }

  // Update map link
  const mapLink = document.getElementById('contact-map-link');
  if (mapLink && contact.map_link) {
    mapLink.href = contact.map_link;
  }

  // Update social icons
  updateSocialIcons(contact.social_media);

  // Load map
  loadMap(contact.map_link);
  
  // Load FAQs
  loadContactFAQs(cmsData.faqs);
  
  console.log('✅ Contact info loaded');
}

/**
 * Update social media icons
 */
function updateSocialIcons(socialMedia) {
  const container = document.getElementById('contact-social-icons');
  if (!container || !socialMedia) return;

  const socials = [
    { platform: 'facebook', url: socialMedia.facebook, icon: 'f', label: 'Facebook' },
    { platform: 'instagram', url: socialMedia.instagram, icon: '📷', label: 'Instagram' },
    { platform: 'youtube', url: socialMedia.youtube, icon: '▶', label: 'YouTube' }
  ];

  container.innerHTML = socials
    .filter(s => s.url)
    .map(s => `
      <a href="${s.url}" target="_blank" rel="noopener" class="social-link ${s.platform}-link" title="${s.label}">
        ${s.icon}
      </a>
    `).join('');
}

/**
 * Load contact map iframe
 */
function loadMap(mapUrl) {
  if (!mapUrl) return;
  
  const mapContainer = document.getElementById('contactMap');
  if (!mapContainer) return;

  // Build Google Maps embed URL
  let embedUrl = mapUrl;
  
  if (mapUrl.includes('maps.google.com') && !mapUrl.includes('embed')) {
    const query = mapUrl.split('?q=')[1] || 'Guru+Nanak+Tour+Travels+Patti';
    embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`;
  }

  mapContainer.innerHTML = `
    <iframe 
      src="${embedUrl}"
      width="100%" 
      height="450" 
      style="border:0;" 
      allowfullscreen="" 
      loading="lazy" 
      referrerpolicy="no-referrer-when-downgrade"
      title="Guru Nanak Tour & Travels Location"
    ></iframe>
  `;
}

/**
 * Load FAQs for contact page
 */
function loadContactFAQs(faqs) {
  const container = document.getElementById('contactFaqList');
  if (!container || !faqs || faqs.length === 0) {
    if (container) container.innerHTML = '<p>No FAQs available at the moment.</p>';
    return;
  }

  const initial = Math.min(6, faqs.length);
  
  container.innerHTML = faqs.map((faq, i) => `
    <details class="faq" ${i === 0 ? 'open' : ''} ${i >= initial ? 'data-hidden="true" style="display:none;"' : ''}>
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  // Add "Show More" button if needed
  if (faqs.length > initial) {
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
 * Initialize contact form submission
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

    result.textContent = '⏳ Sending message...';
    result.hidden = false;
    result.className = 'result-message';

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
        result.textContent = '✅ Message sent successfully! We\'ll reply soon.';
        result.className = 'result-message success';
        showToast('Message sent successfully!', 'success');
        form.reset();
        
        setTimeout(() => {
          result.hidden = true;
        }, 5000);
      } else {
        result.textContent = `❌ ${data.message || 'Failed to send message'}`;
        result.className = 'result-message error';
        showToast('Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      result.textContent = '❌ Network error. Please try again or call us directly.';
      result.className = 'result-message error';
      showToast('Network error occurred', 'error');
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
