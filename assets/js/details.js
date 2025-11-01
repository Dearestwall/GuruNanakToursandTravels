// =====================================================
// DETAILS.JS - Tour/Service/Offering details page
// =====================================================

let cmsData = null;
let currentDetail = null;

/**
 * Load details based on URL parameters
 */
async function loadDetails() {
  const id = getQueryParam('id');
  const type = getQueryParam('type') || 'tour';

  if (!id) {
    showError('No item ID provided');
    return;
  }

  cmsData = await fetchCMSData();
  if (!cmsData) {
    showError('Failed to load data');
    return;
  }

  let item = null;

  if (type === 'tour') {
    item = cmsData.featured_tours?.find(t => t.id === id);
  } else if (type === 'service' || type === 'offering') {
    item = cmsData.offerings?.find(o => o.id === id);
  }

  if (!item) {
    showError(`${type} not found`);
    return;
  }

  currentDetail = item;
  renderDetails(item, type);
  renderSuggested(type);
  renderMoreServices(type);
  renderFAQs();
}

/**
 * Render main details
 */
function renderDetails(item, type) {
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = `${item.name || item.title} — GNTT`;

  const pagDesc = document.getElementById('page-desc');
  if (pagDesc) pagDesc.setAttribute('content', item.summary || item.description || '');

  // Hero
  const heroTitle = document.getElementById('details-title');
  if (heroTitle) heroTitle.textContent = item.name || item.title;

  const heroSubtitle = document.getElementById('details-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = item.summary || '';

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-current');
  if (breadcrumb) breadcrumb.textContent = item.name || item.title;

  // Image
  const mainImage = document.getElementById('details-main-image');
  if (mainImage && item.image) {
    mainImage.src = item.image;
    mainImage.alt = item.name || item.title;
  }

  // Description
  const descText = document.getElementById('details-description-text');
  if (descText) {
    descText.innerHTML = (item.description || item.summary || '').replace(/\n/g, '<br>');
  }

  // Inclusions/Exclusions
  renderSections(item);

  // Sidebar
  const sidebarPrice = document.getElementById('sidebar-price');
  if (sidebarPrice && item.price) {
    sidebarPrice.textContent = `₹${item.price.toLocaleString('en-IN')}`;
  }

  if (item.duration) {
    const durationCard = document.getElementById('sidebar-duration');
    if (durationCard) {
      durationCard.style.display = 'flex';
      const durationValue = document.getElementById('duration-value');
      if (durationValue) durationValue.textContent = item.duration;
    }
  }

  // Update share buttons
  updateShareButtons(item);
}

/**
 * Render inclusions/exclusions
 */
function renderSections(item) {
  const container = document.getElementById('detailsSections');
  if (!container) return;

  let html = '';

  if (item.includes && item.includes.length > 0) {
    html += `
      <div class="details-section">
        <h3>✅ What's Included</h3>
        <ul class="section-list">
          ${item.includes.map(inc => `<li>${inc}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (item.excludes && item.excludes.length > 0) {
    html += `
      <div class="details-section">
        <h3>❌ What's Not Included</h3>
        <ul class="section-list">
          ${item.excludes.map(exc => `<li>${exc}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Render suggested packages
 */
function renderSuggested(currentType) {
  const container = document.getElementById('suggestedPackages');
  if (!container) return;

  let items = [];
  if (currentType === 'tour' && cmsData.featured_tours) {
    items = cmsData.featured_tours.filter(t => t.id !== currentDetail.id).slice(0, 3);
  } else if ((currentType === 'service' || currentType === 'offering') && cmsData.offerings) {
    items = cmsData.offerings.filter(o => o.id !== currentDetail.id).slice(0, 3);
  }

  container.innerHTML = items.map(item => `
    <a href="${__toAbs(`/details/?id=${item.id}&type=${currentType}`)}" class="suggested-item">
      <div class="suggested-icon">${item.icon || '🎁'}</div>
      <h4>${item.name || item.title}</h4>
      ${item.price ? `<p class="price">₹${item.price.toLocaleString('en-IN')}</p>` : ''}
    </a>
  `).join('');
}

/**
 * Render more services
 */
function renderMoreServices(currentType) {
  const container = document.getElementById('moreServices');
  if (!container || currentType === 'offering') return;

  const services = cmsData.offerings?.slice(0, 4) || [];

  container.innerHTML = services.map(service => `
    <a href="${__toAbs(`/details/?id=${service.id}&type=offering`)}" class="service-item">
      <div class="service-icon">${service.icon}</div>
      <h5>${service.title}</h5>
    </a>
  `).join('');
}

/**
 * Render related packages
 */
function renderRelatedTours() {
  const container = document.getElementById('relatedTours');
  if (!container || !cmsData.featured_tours) return;

  const related = cmsData.featured_tours.filter(t => t.id !== currentDetail.id).slice(0, 3);

  container.innerHTML = related.map(tour => `
    <article class="tour">
      <div class="tour-image-wrapper">
        <img src="${tour.image}" alt="${tour.name}" class="tour-image" loading="lazy" />
      </div>
      <div class="tour-body">
        <h3 class="tour-title">${tour.name}</h3>
        <p class="tour-summary">${tour.summary}</p>
        <div class="tour-footer">
          <p class="tour-price">₹${tour.price.toLocaleString('en-IN')}</p>
          <a class="btn btn-sm" href="${__toAbs(`/details/?id=${tour.id}&type=tour`)}">View Details</a>
        </div>
      </div>
    </article>
  `).join('');
}

/**
 * Render FAQs
 */
function renderFAQs() {
  const container = document.getElementById('details-faq-list');
  if (!container || !cmsData.faqs) return;

  container.innerHTML = cmsData.faqs.map((faq, i) => `
    <details class="faq"${i === 0 ? ' open' : ''}>
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');
}

/**
 * Update share buttons
 */
function updateShareButtons(item) {
  const shareUrl = encodeURIComponent(location.href);
  const shareText = encodeURIComponent(`Check out ${item.name || item.title} from GNTT`);

  const fbBtn = document.getElementById('shareBtn-facebook');
  if (fbBtn) {
    fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    fbBtn.target = '_blank';
    fbBtn.rel = 'noopener';
  }

  const waBtn = document.getElementById('shareBtn-whatsapp');
  if (waBtn) {
    waBtn.href = `https://wa.me/?text=${shareText}%20${shareUrl}`;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener';
  }

  const copyBtn = document.getElementById('shareBtn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(location.href).then(() => {
        showToast('✅ Link copied to clipboard!', 'success');
      });
    });
  }
}

/**
 * Show error message
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
  setTimeout(() => {
    loadDetails();
    renderRelatedTours();
  }, 200);
});
