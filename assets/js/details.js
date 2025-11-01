// =====================================================
// DETAILS.JS - Tour/Service details page
// =====================================================

let cmsData = null;
let currentDetail = null;
let detailType = 'tour'; // 'tour' or 'offering'

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

  detailType = type;

  cmsData = await fetchCMSData();
  if (!cmsData) {
    showError('Failed to load data');
    return;
  }

  let item = null;

  if (type === 'tour') {
    item = cmsData.featured_tours?.find(t => t.id === id);
  } else if (type === 'offering' || type === 'service') {
    item = cmsData.offerings?.find(o => o.id === id);
  }

  if (!item) {
    showError(`${type === 'tour' ? 'Tour' : 'Service'} not found`);
    return;
  }

  currentDetail = item;
  renderDetails(item, type);
  renderSuggested(type);
  renderRelated(type);
  renderDetailFAQs();
}

/**
 * Render main details
 */
function renderDetails(item, type) {
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = `${item.name || item.title} — GNTT`;

  const pageDesc = document.getElementById('page-desc');
  if (pageDesc) pageDesc.setAttribute('content', item.summary || item.description || '');

  // Hero
  const heroTitle = document.getElementById('details-title');
  if (heroTitle) heroTitle.textContent = item.name || item.title;

  const heroSubtitle = document.getElementById('details-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = item.summary || '';

  // Breadcrumb type link
  const breadcrumbType = document.getElementById('breadcrumb-type');
  if (breadcrumbType) {
    if (type === 'tour') {
      breadcrumbType.textContent = 'Tours';
      breadcrumbType.href = __toAbs('/tours/');
    } else {
      breadcrumbType.textContent = 'Services';
      breadcrumbType.href = __toAbs('/services/');
    }
  }

  // Image/Icon
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

  // Render sections based on type
  if (type === 'tour') {
    renderTourSections(item);
  } else {
    renderOfferingSections(item);
  }

  // Sidebar price/duration
  if (type === 'tour' && item.price) {
    const sidebarPrice = document.getElementById('sidebar-price');
    if (sidebarPrice) {
      sidebarPrice.textContent = `₹${item.price.toLocaleString('en-IN')}`;
    }
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
 * Render tour-specific sections
 */
function renderTourSections(tour) {
  const container = document.getElementById('detailsSections');
  if (!container) return;

  let html = '';

  if (tour.includes && tour.includes.length > 0) {
    html += `
      <div class="details-section">
        <h3>✅ What's Included</h3>
        <ul class="section-list">
          ${tour.includes.map(inc => `<li>${inc}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (tour.excludes && tour.excludes.length > 0) {
    html += `
      <div class="details-section">
        <h3>❌ What's Not Included</h3>
        <ul class="section-list">
          ${tour.excludes.map(exc => `<li>${exc}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Optional highlights
  if (tour.highlights && tour.highlights.length > 0) {
    html += `
      <div class="details-section">
        <h3>🌟 Highlights</h3>
        <ul class="section-list">
          ${tour.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Render offering-specific sections
 */
function renderOfferingSections(offering) {
  const container = document.getElementById('detailsSections');
  if (!container) return;

  let html = '';

  if (offering.features && offering.features.length > 0) {
    html += `
      <div class="details-section">
        <h3>✨ Key Features</h3>
        <ul class="section-list">
          ${offering.features.map(feat => `<li>${feat}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (offering.benefits && offering.benefits.length > 0) {
    html += `
      <div class="details-section">
        <h3>🎯 Benefits</h3>
        <ul class="section-list">
          ${offering.benefits.map(ben => `<li>${ben}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Render suggested items
 */
function renderSuggested(currentType) {
  const container = document.getElementById('suggestedPackages');
  if (!container) return;

  let items = [];
  
  if (currentType === 'tour' && cmsData.featured_tours) {
    items = cmsData.featured_tours
      .filter(t => t.id !== currentDetail.id)
      .slice(0, 3);
  } else if ((currentType === 'offering' || currentType === 'service') && cmsData.offerings) {
    items = cmsData.offerings
      .filter(o => o.id !== currentDetail.id)
      .slice(0, 3);
  }

  container.innerHTML = items.map(item => {
    const typeParam = currentType === 'tour' ? 'tour' : 'offering';
    const url = __toAbs(`/details/?id=${item.id}&type=${typeParam}`);
    return `
      <a href="${url}" class="suggested-item">
        <div class="suggested-icon">${item.icon || item.name?.charAt(0) || '➜'}</div>
        <h4>${item.name || item.title}</h4>
        ${item.price ? `<p class="price">₹${item.price.toLocaleString('en-IN')}</p>` : ''}
      </a>
    `;
  }).join('');
}

/**
 * Render related services/tours
 */
function renderRelated(currentType) {
  const container = document.getElementById('relatedTours');
  if (!container) return;

  let items = [];

  if (currentType === 'tour' && cmsData.featured_tours) {
    items = cmsData.featured_tours
      .filter(t => t.id !== currentDetail.id)
      .slice(0, 3);
  } else if ((currentType === 'offering' || currentType === 'service') && cmsData.offerings) {
    items = cmsData.offerings
      .filter(o => o.id !== currentDetail.id)
      .slice(0, 3);
  }

  if (items.length === 0) {
    container.innerHTML = '';
    return;
  }

  if (currentType === 'tour') {
    container.innerHTML = items.map(tour => `
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
  } else {
    container.innerHTML = items.map(offering => `
      <article class="service-card">
        <div class="service-icon">${offering.icon}</div>
        <h3>${offering.title}</h3>
        <p>${offering.description}</p>
        <a class="btn btn-sm" href="${__toAbs(`/details/?id=${offering.id}&type=offering`)}">Learn More</a>
      </article>
    `).join('');
  }
}

/**
 * Render detail page FAQs with progressive reveal
 */
function renderDetailFAQs() {
  const container = document.getElementById('details-faq-list');
  if (!container) return;

  const faqs = currentDetail.faqs || cmsData.faqs || [];
  if (faqs.length === 0) {
    container.innerHTML = '';
    return;
  }

  const initial = Math.min(3, faqs.length);
  container.innerHTML = faqs.map((faq, i) => `
    <details class="faq"${i === 0 ? ' open' : ''} ${i >= initial ? 'data-hidden="true" style="display:none;"' : ''}>
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  // Show more button
  if (faqs.length > initial) {
    const moreBtn = document.createElement('button');
    moreBtn.className = 'btn btn-outline';
    moreBtn.textContent = 'Show more FAQs';
    moreBtn.style.marginTop = '1rem';
    container.parentElement?.appendChild(moreBtn);
    moreBtn.addEventListener('click', () => {
      const hidden = Array.from(container.querySelectorAll('.faq[data-hidden="true"]'));
      hidden.slice(0, 2).forEach(el => {
        el.style.display = '';
        el.removeAttribute('data-hidden');
      });
      if (!container.querySelector('.faq[data-hidden="true"]')) {
        moreBtn.style.display = 'none';
      }
    });
  }

  setupDetailFAQAccordion(container);
}

/**
 * Setup FAQ accordion
 */
function setupDetailFAQAccordion(container) {
  const faqs = container.querySelectorAll('.faq');
  faqs.forEach(faq => {
    faq.addEventListener('click', (e) => {
      if (e.target.closest('.faq-summary')) {
        if (!faq.open) {
          faqs.forEach(other => { if (other !== faq) other.open = false; });
        }
      }
    });
  });
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
 * Show error
 */
function showError(msg) {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="error-message">
        <p>⚠️ ${msg}</p>
        <a href="${__toAbs('/')} " class="btn">← Go Back</a>
      </div>
    `;
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    loadDetails();
  }, 200);
});
