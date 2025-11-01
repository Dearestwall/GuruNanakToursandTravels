// =====================================================
// OFFERINGS.JS - Service/offering details page
// =====================================================

let cmsData = null;
let currentOffering = null;

/**
 * Load offering details
 */
async function loadOfferingDetails() {
  const id = getQueryParam('id');

  if (!id) {
    showError('No service ID provided');
    return;
  }

  cmsData = await fetchCMSData();
  if (!cmsData) {
    showError('Failed to load data');
    return;
  }

  const offering = cmsData.offerings?.find(o => o.id === id);

  if (!offering) {
    showError('Service not found');
    return;
  }

  currentOffering = offering;
  renderOfferingDetails();
  renderRelatedServices();
  renderOfferingFAQs();
}

/**
 * Render offering details
 */
function renderOfferingDetails() {
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = `${currentOffering.title} — GNTT`;

  const pageDesc = document.getElementById('page-desc');
  if (pageDesc) pageDesc.setAttribute('content', currentOffering.description || '');

  // Hero
  const heroTitle = document.getElementById('offering-title');
  if (heroTitle) heroTitle.textContent = currentOffering.title;

  const heroSubtitle = document.getElementById('offering-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = currentOffering.description;

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-current');
  if (breadcrumb) breadcrumb.textContent = currentOffering.title;

  // Icon
  const icon = document.getElementById('offeringIcon');
  if (icon) icon.textContent = currentOffering.icon;

  // Description
  const descText = document.getElementById('offering-description-text');
  if (descText) {
    descText.innerHTML = (currentOffering.long_description || currentOffering.description || '').replace(/\n/g, '<br>');
  }

  // Features
  const featuresList = document.getElementById('offering-features-list');
  if (featuresList && currentOffering.features) {
    featuresList.innerHTML = currentOffering.features.map(feature => `
      <li>${feature}</li>
    `).join('');
  }

  // Benefits
  const benefitsList = document.getElementById('offering-benefits-list');
  if (benefitsList && currentOffering.benefits) {
    benefitsList.innerHTML = currentOffering.benefits.map(benefit => `
      <div class="benefit-item">
        <div class="benefit-icon">✓</div>
        <p>${benefit}</p>
      </div>
    `).join('');
  }
}

/**
 * Render related services
 */
function renderRelatedServices() {
  const container = document.getElementById('relatedServices');
  if (!container || !cmsData.offerings) return;

  const related = cmsData.offerings.filter(o => o.id !== currentOffering.id).slice(0, 3);

  container.innerHTML = related.map(service => `
    <a href="${__toAbs(`/offerings/?id=${service.id}`)}" class="service-link">
      <span class="service-icon">${service.icon}</span>
      <span class="service-name">${service.title}</span>
    </a>
  `).join('');
}

/**
 * Render offering-specific FAQs
 */
function renderOfferingFAQs() {
  const container = document.getElementById('offering-faq-list');
  if (!container) return;

  // Use offering-specific FAQs or general FAQs
  const faqs = currentOffering.faqs || cmsData.faqs || [];

  if (faqs.length === 0) {
    container.innerHTML = '<p class="no-faqs">No FAQs available for this service.</p>';
    return;
  }

  container.innerHTML = faqs.map((faq, i) => `
    <details class="faq">
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  setupOfferingFAQAccordion();
}

/**
 * Setup FAQ accordion - close others when one opens
 */
function setupOfferingFAQAccordion() {
  const faqs = document.querySelectorAll('#offering-faq-list .faq');

  faqs.forEach(faq => {
    faq.addEventListener('click', (e) => {
      if (e.target.closest('.faq-summary')) {
        if (!faq.open) {
          faqs.forEach(otherFaq => {
            if (otherFaq !== faq) {
              otherFaq.open = false;
            }
          });
        }
      }
    });
  });
}

/**
 * Show error
 */
function showError(msg) {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `<div class="error-message"><p>⚠️ ${msg}</p><a href="/" class="btn">← Go Back</a></div>`;
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadOfferingDetails, 200);
});
