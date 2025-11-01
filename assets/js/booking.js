// =====================================================
// BOOKING.JS - Booking/enquiry form handler
// =====================================================

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    result.textContent = '⏳ Submitting...';
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
        result.textContent = '✅ Thank you! We\'ll contact you soon.';
        result.style.background = '#ecfdf5';
        result.style.color = '#065f46';
        form.reset();
        setTimeout(() => {
          result.hidden = true;
        }, 5000);
      } else {
        result.textContent = `❌ ${data.message || 'Something went wrong'}`;
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
    initBookingForm();
  }, 200);
});
