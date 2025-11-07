// =====================================================
// DETAILS.JS - Tour/Service details page
// Enhanced with proper sharing & copy functionality
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
    showError('No item ID provided. Redirecting to homepage...');
    setTimeout(() => {
      window.location.href = __toAbs('/index.html');
    }, 2000);
    return;
  }

  detailType = type;

  cmsData = await fetchCMSData();
  if (!cmsData) {
    showError('Failed to load data. Redirecting to homepage...');
    setTimeout(() => {
      window.location.href = __toAbs('/index.html');
    }, 2000);
    return;
  }

  let item = null;

  if (type === 'tour') {
    item = cmsData.featured_tours?.find(t => t.id === id);
  } else if (type === 'offering' || type === 'service') {
    item = cmsData.offerings?.find(o => o.id === id);
  }

  if (!item) {
    showError(`${type === 'tour' ? 'Tour' : 'Service'} not found. Redirecting to homepage...`);
    setTimeout(() => {
      window.location.href = __toAbs('/index.html');
    }, 2000);
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
      breadcrumbType.href = __toAbs('/tours/index.html');
    } else {
      breadcrumbType.textContent = 'Services';
      breadcrumbType.href = __toAbs('/services/index.html');
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

  // Sidebar price/duration (TOURS ONLY)
  if (type === 'tour') {
    if (item.price) {
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

    // Show "Book This Package" button (TOURS ONLY)
    const bookBtn = document.getElementById('book-package-btn');
    if (bookBtn) {
      bookBtn.style.display = 'inline-flex';
      bookBtn.href = __toAbs(`/booking/index.html?id=${item.id}&type=tour`);
      bookBtn.addEventListener('click', (e) => {
        // Store in session for auto-fill
        sessionStorage.setItem('lastBookingData', JSON.stringify({ id: item.id, type: 'tour' }));
      });
    }
  } else {
    // Hide/style differently for offerings
    const bookBtn = document.getElementById('book-package-btn');
    if (bookBtn) {
      bookBtn.style.display = 'none'; // Hide for offerings
    }

    // Show contact CTA instead
    const contactCTA = document.getElementById('contact-cta');
    if (contactCTA) {
      contactCTA.style.display = 'block';
      contactCTA.innerHTML = `
        <div class="cta-section">
          <h3>Interested in this service?</h3>
          <p>Contact our team to customize this service for your needs.</p>
          <a href="${__toAbs('/contact/index.html')}" class="btn btn-primary">Get in Touch</a>
        </div>
      `;
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
 * Render detail page FAQs - NOT OPEN INITIALLY
 */
function renderDetailFAQs() {
  const container = document.getElementById('details-faq-list');
  if (!container) return;

  const faqs = currentDetail.faqs || cmsData.faqs || [];
  if (faqs.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Show all FAQs but CLOSED initially
  container.innerHTML = faqs.map((faq, i) => `
    <details class="faq" data-faq-index="${i}">
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  // Use the FAQAccordion from common.js if available
  if (typeof FAQAccordion !== 'undefined') {
    new FAQAccordion('#details-faq-list', { initialShow: 3 });
    console.log('[DETAILS] FAQ Accordion initialized');
  } else {
    // Fallback: setup basic accordion
    setupDetailFAQAccordion(container);
  }
}

/**
 * Setup FAQ accordion - only one open at a time
 * Fallback if FAQAccordion class not available
 */
function setupDetailFAQAccordion(container) {
  const faqs = container.querySelectorAll('.faq');
  
  faqs.forEach(faq => {
    faq.addEventListener('toggle', (e) => {
      if (faq.open) {
        // Close all others
        faqs.forEach(other => {
          if (other !== faq) other.open = false;
        });
      }
    });
  });
}

/* =====================================================
   SHARING & COPY FUNCTIONALITY (ENHANCED)
   ===================================================== */

/**
 * Update share buttons with proper URLs and handlers
 */
function updateShareButtons(item) {
  // Get the current page URL
  const pageUrl = location.href;
  const pageTitle = item.name || item.title;
  
  console.log('[SHARE] Setting up share buttons for:', pageTitle);
  console.log('[SHARE] URL:', pageUrl);

  // Facebook Share
  const fbBtn = document.getElementById('shareBtn-facebook');
  if (fbBtn) {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    fbBtn.href = fbUrl;
    fbBtn.target = '_blank';
    fbBtn.rel = 'noopener noreferrer';
    
    fbBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(fbUrl, 'facebook-share', 'width=600,height=400');
      showToast('📘 Opening Facebook share...', 'info');
      console.log('[SHARE] Facebook clicked');
      return false;
    });
  }

  // WhatsApp Share
  const waBtn = document.getElementById('shareBtn-whatsapp');
  if (waBtn) {
    const waText = `Check out "${pageTitle}" on Guru Nanak Tours & Travels`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText + ' ' + pageUrl)}`;
    waBtn.href = waUrl;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    
    waBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(waUrl, 'whatsapp-share', 'width=600,height=400');
      showToast('💬 Opening WhatsApp...', 'info');
      console.log('[SHARE] WhatsApp clicked');
      return false;
    });
  }

  // Copy Link
  const copyBtn = document.getElementById('shareBtn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        console.log('[SHARE] Copying URL to clipboard:', pageUrl);
        
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(pageUrl);
          showToast('✅ Link copied to clipboard!', 'success');
          console.log('[SHARE] Copied via Clipboard API');
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = pageUrl;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showToast('✅ Link copied to clipboard!', 'success');
          console.log('[SHARE] Copied via execCommand');
        }
      } catch (err) {
        console.error('[SHARE] Copy failed:', err);
        showToast('❌ Failed to copy link', 'error');
      }
    });
  }

  console.log('[SHARE] All share buttons configured');
}

/**
 * Fallback sharing using Web Share API (if available)
 */
async function shareNatively(title, text, url) {
  if (!navigator.share) {
    console.warn('[SHARE] Web Share API not available');
    return false;
  }

  try {
    await navigator.share({
      title: title,
      text: text,
      url: url
    });
    console.log('[SHARE] Native share successful');
    return true;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[SHARE] Native share error:', err);
    }
    return false;
  }
}

/**
 * Show error with redirect
 */
function showError(msg) {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="error-message">
        <div class="error-icon">⚠️</div>
        <h2>${msg}</h2>
        <p>Redirecting you to homepage...</p>
        <a href="${__toAbs('/index.html')}" class="btn btn-primary">← Go Back Now</a>
      </div>
    `;
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DETAILS] Page initialized');
  setTimeout(() => {
    loadDetails();
  }, 200);
});
