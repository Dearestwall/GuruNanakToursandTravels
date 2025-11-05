// =====================================================
// DETAILS.JS - Tour/Service details page with GitHub API
// Automatically loads from data/tours/ and data/offerings/
// =====================================================

let currentDetail = null;
let detailType = 'tour';
const DETAILS_CACHE_KEY = 'gntt_details_cache';
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * GitHub Configuration
 */
const GITHUB_CONFIG = {
  owner: 'dearestwall',
  repo: 'GuruNanakToursandTravels'
};

/**
 * Get query parameter from URL
 */
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get proper link with base path
 */
function getLinkHref(path) {
  if (window.__toAbs) {
    return window.__toAbs(path);
  }
  return path;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

/**
 * Load details based on URL parameters
 */
async function loadDetails() {
  const id = getQueryParam('id');
  const type = getQueryParam('type') || 'tour';

  console.log('🔍 URL Parameters:', { id, type, url: window.location.href });

  if (!id) {
    console.error('❌ No ID parameter found');
    showError('No item ID provided. Please select a tour or service from the listings.');
    return;
  }

  detailType = type;
  console.log(`📄 Loading ${type} details for ID: ${id}`);

  // Show loading state
  showLoadingState(true);

  try {
    // Try loading from cache first
    const cached = loadFromCache(`${type}-${id}`);
    if (cached) {
      console.log('✅ Loaded from cache');
      currentDetail = cached;
      showLoadingState(false);
      renderDetails(cached, type);
      await loadRelatedItems(type);
      return;
    }

    // Load from GitHub
    console.log('🌐 Loading from GitHub...');
    const item = await loadItemFromGitHub(id, type);
    
    if (!item) {
      console.error('❌ Item not found:', { id, type });
      showLoadingState(false);
      showError(`${type === 'tour' ? 'Tour' : 'Service'} not found. It may have been removed or the link is incorrect.`);
      return;
    }

    currentDetail = item;
    saveToCache(`${type}-${id}`, item);
    
    showLoadingState(false);
    renderDetails(item, type);
    await loadRelatedItems(type);
    
    console.log('✅ Details loaded successfully');
  } catch (e) {
    console.error('❌ Error loading details:', e);
    showLoadingState(false);
    showError('Failed to load details. Please try again later or contact us for assistance.');
  }
}

/**
 * Show/hide loading state
 */
function showLoadingState(show) {
  const heroTitle = document.getElementById('details-title');
  const heroSubtitle = document.getElementById('details-subtitle');
  
  if (show) {
    if (heroTitle) heroTitle.textContent = 'Loading details...';
    if (heroSubtitle) heroSubtitle.textContent = 'Please wait while we fetch the information';
    
    // Show loading spinner in main content
    const mainImage = document.getElementById('details-main-image');
    if (mainImage) {
      mainImage.style.display = 'none';
    }
  }
}

/**
 * Load item from GitHub folder
 */
async function loadItemFromGitHub(id, type) {
  try {
    const path = type === 'tour' ? 'data/tours' : 'data/offerings';
    const filename = `${id}.json`;
    
    console.log(`📡 Fetching ${path}/${filename} from GitHub...`);
    
    // Try direct file fetch first (faster)
    const fileUrl = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${path}/${filename}`;
    
    const response = await fetch(fileUrl);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Loaded ${filename} directly from raw GitHub`);
      return data;
    }
    
    console.warn(`⚠️ Direct fetch failed (${response.status}), trying API...`);
    
    // Fallback: List all files and find match
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    const listResponse = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!listResponse.ok) {
      console.error('❌ GitHub API failed:', listResponse.status);
      return null;
    }
    
    const files = await listResponse.json();
    const file = files.find(f => f.name === filename);
    
    if (file && file.download_url) {
      const fileResponse = await fetch(file.download_url);
      if (fileResponse.ok) {
        console.log(`✅ Loaded ${filename} via GitHub API`);
        return await fileResponse.json();
      }
    }
    
    console.error(`❌ File ${filename} not found in ${path}`);
    return null;
  } catch (e) {
    console.error(`❌ Error loading ${type} ${id}:`, e);
    return null;
  }
}

/**
 * Load related items from GitHub
 */
async function loadRelatedItems(type) {
  try {
    const path = type === 'tour' ? 'data/tours' : 'data/offerings';
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!response.ok) return;
    
    const files = await response.json();
    const jsonFiles = files.filter(f => 
      f.type === 'file' && 
      f.name.endsWith('.json') &&
      f.name !== `${currentDetail.id}.json`
    );
    
    // Load first 3 related items
    const fetchPromises = jsonFiles.slice(0, 3).map(async (file) => {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          return await fileResponse.json();
        }
      } catch (e) {
        console.warn(`Failed to load ${file.name}`);
      }
      return null;
    });
    
    const items = (await Promise.all(fetchPromises)).filter(item => item !== null);
    renderRelated(items, type);
    renderSuggested(items, type);
    
  } catch (e) {
    console.error('Error loading related items:', e);
  }
}

/**
 * Cache management
 */
function loadFromCache(key) {
  try {
    const cached = localStorage.getItem(`${DETAILS_CACHE_KEY}_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(`${DETAILS_CACHE_KEY}_${key}`);
    return null;
  } catch (e) {
    return null;
  }
}

function saveToCache(key, data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${DETAILS_CACHE_KEY}_${key}`, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

/**
 * Render main details
 */
function renderDetails(item, type) {
  console.log('🎨 Rendering details:', item);
  
  document.title = `${item.name || item.title} — Guru Nanak Tour & Travels`;

  const heroTitle = document.getElementById('details-title');
  if (heroTitle) heroTitle.textContent = item.name || item.title;

  const heroSubtitle = document.getElementById('details-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = item.summary || item.description || '';

  const breadcrumbType = document.getElementById('breadcrumb-type');
  if (breadcrumbType) {
    breadcrumbType.textContent = type === 'tour' ? 'Tours' : 'Services';
    breadcrumbType.href = getLinkHref(type === 'tour' ? 'tours/' : 'services/');
  }

  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = item.name || item.title;
  }

  const mainImage = document.getElementById('details-main-image');
  if (mainImage) {
    mainImage.style.display = 'block';
    mainImage.src = item.image || 'https://via.placeholder.com/800x600?text=Tour+Image';
    mainImage.alt = item.name || item.title;
    mainImage.onerror = () => {
      mainImage.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
    };
  }

  const descText = document.getElementById('details-description-text');
  if (descText) {
    descText.innerHTML = escapeHtml(item.description || item.summary || '').replace(/\n/g, '<br>');
  }

  if (type === 'tour') {
    renderTourSections(item);
  } else {
    renderOfferingSections(item);
  }

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

  updateShareButtons(item);
  console.log('✅ Details rendered successfully');
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
      <div class="details-section fade-up">
        <h3>✅ What's Included</h3>
        <ul class="section-list">
          ${tour.includes.map(inc => `<li>${escapeHtml(inc)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (tour.excludes && tour.excludes.length > 0) {
    html += `
      <div class="details-section fade-up">
        <h3>❌ What's Not Included</h3>
        <ul class="section-list">
          ${tour.excludes.map(exc => `<li>${escapeHtml(exc)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (tour.highlights && tour.highlights.length > 0) {
    html += `
      <div class="details-section fade-up">
        <h3>🌟 Tour Highlights</h3>
        <ul class="section-list">
          ${tour.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (tour.best_season) {
    html += `
      <div class="details-section fade-up">
        <h3>📅 Best Time to Visit</h3>
        <p>${escapeHtml(tour.best_season)}</p>
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

  if (offering.long_description) {
    html += `
      <div class="details-section fade-up">
        <h3>📖 Overview</h3>
        <p>${escapeHtml(offering.long_description)}</p>
      </div>
    `;
  }

  if (offering.features && offering.features.length > 0) {
    html += `
      <div class="details-section fade-up">
        <h3>✨ Key Features</h3>
        <ul class="section-list">
          ${offering.features.map(feat => `<li>${escapeHtml(feat)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (offering.benefits && offering.benefits.length > 0) {
    html += `
      <div class="details-section fade-up">
        <h3>🎯 Benefits</h3>
        <ul class="section-list">
          ${offering.benefits.map(ben => `<li>${escapeHtml(ben)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

/**
 * Render suggested items
 */
function renderSuggested(items, currentType) {
  const container = document.getElementById('suggestedPackages');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);">No suggestions available</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const typeParam = currentType === 'tour' ? 'tour' : 'offering';
    const url = getLinkHref(`details/?id=${item.id}&type=${typeParam}`);
    return `
      <a href="${url}" class="suggested-item">
        <div class="suggested-icon">${item.icon || (item.name || item.title).charAt(0)}</div>
        <h4>${escapeHtml(item.name || item.title)}</h4>
        ${item.price ? `<p class="price">₹${item.price.toLocaleString('en-IN')}</p>` : ''}
      </a>
    `;
  }).join('');
}

/**
 * Render related items
 */
function renderRelated(items, currentType) {
  const container = document.getElementById('relatedTours');
  if (!container) return;

  if (items.length === 0) {
    const section = container.closest('section');
    if (section) section.style.display = 'none';
    return;
  }

  if (currentType === 'tour') {
    container.innerHTML = items.map(tour => `
      <article class="tour fade-up">
        <div class="tour-image-wrapper">
          <img src="${escapeHtml(tour.image)}" alt="${escapeHtml(tour.name)}" class="tour-image" loading="lazy" 
               onerror="this.src='https://via.placeholder.com/800x600?text=Tour+Image'" />
        </div>
        <div class="tour-body">
          <h3 class="tour-title">${escapeHtml(tour.name)}</h3>
          <p class="tour-summary">${escapeHtml(tour.summary)}</p>
          <div class="tour-footer">
            <p class="tour-price">₹${tour.price.toLocaleString('en-IN')}</p>
            <a class="btn btn-sm" href="${getLinkHref(`details/?id=${tour.id}&type=tour`)}">View Details</a>
          </div>
        </div>
      </article>
    `).join('');
  } else {
    container.innerHTML = items.map(offering => `
      <article class="service-card fade-up">
        <div class="service-icon">${offering.icon}</div>
        <h3>${escapeHtml(offering.title)}</h3>
        <p>${escapeHtml(offering.description)}</p>
        <a class="btn btn-sm" href="${getLinkHref(`details/?id=${offering.id}&type=offering`)}">Learn More</a>
      </article>
    `).join('');
  }
}

/**
 * Update share buttons
 */
function updateShareButtons(item) {
  const shareUrl = encodeURIComponent(location.href);
  const shareText = encodeURIComponent(`Check out ${item.name || item.title} from Guru Nanak Tour & Travels`);

  const fbBtn = document.getElementById('shareBtn-facebook');
  if (fbBtn) {
    fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    fbBtn.target = '_blank';
    fbBtn.rel = 'noopener noreferrer';
  }

  const waBtn = document.getElementById('shareBtn-whatsapp');
  if (waBtn) {
    waBtn.href = `https://wa.me/?text=${shareText}%20${shareUrl}`;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
  }

  const copyBtn = document.getElementById('shareBtn-copy');
  if (copyBtn) {
    // Remove existing listeners to avoid duplicates
    const newCopyBtn = copyBtn.cloneNode(true);
    copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
    
    newCopyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(location.href).then(() => {
        showToast('✅ Link copied to clipboard!', 'success');
      }).catch(() => {
        showToast('❌ Failed to copy link', 'error');
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
      <div class="error-message" style="text-align:center;padding:4rem 1.5rem;min-height:60vh;">
        <div style="font-size:4rem;margin-bottom:1rem;">⚠️</div>
        <h2 style="font-size:1.5rem;margin-bottom:1rem;color:var(--text);">Oops! Something went wrong</h2>
        <p style="font-size:1.1rem;margin-bottom:2rem;color:var(--muted);max-width:600px;margin-left:auto;margin-right:auto;">${escapeHtml(msg)}</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="${getLinkHref('tours/')}" class="btn btn-primary">← Browse Tours</a>
          <a href="${getLinkHref('')}" class="btn btn-outline">Go Home</a>
        </div>
      </div>
    `;
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Details page initializing...');
  console.log('📍 URL:', window.location.href);
  setTimeout(loadDetails, 300);
});

// Debug helper
if (typeof window !== 'undefined') {
  window.detailsDebug = {
    currentDetail: () => currentDetail,
    reloadDetails: loadDetails,
    clearCache: () => {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(DETAILS_CACHE_KEY));
      keys.forEach(k => localStorage.removeItem(k));
      console.log('✅ Details cache cleared');
    }
  };
}
