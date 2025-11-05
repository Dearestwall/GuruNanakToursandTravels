// =====================================================
// TOURS.JS - Tours listing page with GitHub API
// Auto-loads from data/tours/
// =====================================================

let allTours = [];
let filteredTours = [];
const itemsPerPage = 6;
let currentPage = 1;
const TOURS_CACHE_KEY = 'gntt_tours_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * GitHub Configuration
 */
const GITHUB_CONFIG = {
  owner: 'dearestwall',
  repo: 'GuruNanakToursandTravels'
};

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    loadTours();
    setupUIHandlers();
  }, 200);
});

/**
 * Setup UI event handlers
 */
function setupUIHandlers() {
  // Clear filters button
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }

  // Reset filters button in no results
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', clearAllFilters);
  }
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  const searchInput = document.getElementById('searchTours');
  const durationFilter = document.getElementById('filterDuration');
  const priceFilter = document.getElementById('filterPrice');

  if (searchInput) searchInput.value = '';
  if (durationFilter) durationFilter.value = '';
  if (priceFilter) priceFilter.value = '';

  currentPage = 1;
  filteredTours = [...allTours];
  renderToursGrid();
  setupPagination();
  updateFilterResults();
}

/**
 * Load tours from GitHub
 */
async function loadTours() {
  try {
    console.log('🚌 Loading tours from GitHub...');
    showLoadingSpinner(true);
    
    // Try cache first
    const cached = loadFromCache();
    if (cached) {
      console.log('✅ Loaded tours from cache');
      allTours = cached;
      filteredTours = [...allTours];
      showLoadingSpinner(false);
      renderToursGrid();
      setupFilters();
      setupPagination();
      updateFilterResults();
      return;
    }
    
    // Load from GitHub
    const tours = await loadToursFromGitHub();
    
    if (tours.length === 0) {
      console.warn('⚠️ No tours found');
      showLoadingSpinner(false);
      showNoResults(true);
      showToast('No tours available at the moment', 'info');
      return;
    }
    
    allTours = tours.sort((a, b) => (b.price || 0) - (a.price || 0));
    filteredTours = [...allTours];
    saveToCache(allTours);
    
    showLoadingSpinner(false);
    renderToursGrid();
    setupFilters();
    setupPagination();
    updateFilterResults();
    
    console.log(`✅ Loaded ${allTours.length} tours successfully`);
  } catch (e) {
    console.error('❌ Tours load error:', e);
    showLoadingSpinner(false);
    showToast('Failed to load tours. Please try again later.', 'error');
  }
}

/**
 * Load tours from GitHub folder
 */
async function loadToursFromGitHub() {
  try {
    const path = 'data/tours';
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    
    console.log('📡 Fetching from GitHub API...');
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!response.ok) {
      console.warn('GitHub API failed:', response.status);
      return [];
    }
    
    const files = await response.json();
    
    if (!Array.isArray(files)) {
      console.warn('Unexpected response format');
      return [];
    }
    
    const jsonFiles = files.filter(f => f.type === 'file' && f.name.endsWith('.json'));
    
    console.log(`📂 Found ${jsonFiles.length} tour files`);
    
    if (jsonFiles.length === 0) {
      return [];
    }
    
    // Fetch all files in parallel
    const fetchPromises = jsonFiles.map(async (file) => {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          const data = await fileResponse.json();
          console.log(`✅ Loaded: ${file.name}`);
          return data;
        }
      } catch (e) {
        console.warn(`⚠️ Failed to load ${file.name}:`, e);
      }
      return null;
    });
    
    const results = await Promise.all(fetchPromises);
    
    // Filter out null values and unpublished tours
    return results.filter(tour => tour !== null && tour.published !== false);
    
  } catch (e) {
    console.error('Error loading tours from GitHub:', e);
    return [];
  }
}

/**
 * Cache management
 */
function loadFromCache() {
  try {
    const cached = localStorage.getItem(TOURS_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(TOURS_CACHE_KEY);
    return null;
  } catch (e) {
    console.warn('Cache load failed:', e);
    return null;
  }
}

function saveToCache(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(TOURS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

/**
 * Show/hide loading spinner
 */
function showLoadingSpinner(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    spinner.style.display = show ? 'block' : 'none';
  }
}

/**
 * Show/hide no results message
 */
function showNoResults(show) {
  const noResults = document.getElementById('noResults');
  if (noResults) {
    noResults.style.display = show ? 'block' : 'none';
  }
}

/**
 * Render tours grid
 */
function renderToursGrid() {
  const container = document.getElementById('toursGrid');
  if (!container) return;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageTours = filteredTours.slice(start, end);

  if (pageTours.length === 0) {
    container.innerHTML = '';
    showNoResults(true);
    return;
  }

  showNoResults(false);

  container.innerHTML = pageTours.map((tour, index) => `
    <article class="tour fade-up" style="animation-delay: ${index * 0.1}s">
      <div class="tour-image-wrapper">
        <img 
          src="${escapeHtml(tour.image)}" 
          alt="${escapeHtml(tour.name)}" 
          class="tour-image" 
          loading="lazy" 
          onerror="this.src='https://via.placeholder.com/800x600?text=Tour+Image'"
        />
      </div>
      <div class="tour-body">
        <h3 class="tour-title">${escapeHtml(tour.name)}</h3>
        <p class="tour-summary">${escapeHtml(tour.summary)}</p>
        ${tour.duration ? `<p class="tour-duration">⏱️ ${escapeHtml(tour.duration)}</p>` : ''}
        <div class="tour-footer">
          <p class="tour-price">₹${(tour.price || 0).toLocaleString('en-IN')}</p>
          <a class="btn btn-sm" href="${getLinkHref(`/details/?id=${tour.id}&type=tour`)}">View Details</a>
        </div>
      </div>
    </article>
  `).join('');
}

/**
 * Setup filters
 */
function setupFilters() {
  const searchInput = document.getElementById('searchTours');
  const durationFilter = document.getElementById('filterDuration');
  const priceFilter = document.getElementById('filterPrice');

  const applyFilters = () => {
    currentPage = 1;
    const query = (searchInput?.value || '').toLowerCase().trim();
    const duration = durationFilter?.value || '';
    const priceRange = priceFilter?.value || '';

    filteredTours = allTours.filter(tour => {
      // Search filter
      if (query) {
        const searchableText = `${tour.name} ${tour.summary} ${tour.description || ''}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Duration filter
      if (duration) {
        const daysMatch = String(tour.duration || '').match(/^(\d+)/);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
        
        if (duration === '3' && days !== 3) return false;
        if (duration === '4-5' && (days < 4 || days > 5)) return false;
        if (duration === '6+' && days < 6) return false;
      }

      // Price filter
      if (priceRange) {
        const price = tour.price || 0;
        
        if (priceRange === '0-10000' && price >= 10000) return false;
        if (priceRange === '10000-20000' && (price < 10000 || price > 20000)) return false;
        if (priceRange === '20000-50000' && (price < 20000 || price > 50000)) return false;
        if (priceRange === '50000' && price < 50000) return false;
      }

      return true;
    });

    renderToursGrid();
    setupPagination();
    updateFilterResults();
  };

  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 300));
  }
  
  if (durationFilter) {
    durationFilter.addEventListener('change', applyFilters);
  }
  
  if (priceFilter) {
    priceFilter.addEventListener('change', applyFilters);
  }
}

/**
 * Update filter results text
 */
function updateFilterResults() {
  const resultsEl = document.getElementById('filterResults');
  if (!resultsEl) return;

  if (filteredTours.length === allTours.length) {
    resultsEl.textContent = `Showing all ${allTours.length} tours`;
  } else {
    resultsEl.textContent = `Showing ${filteredTours.length} of ${allTours.length} tours`;
  }
}

/**
 * Setup pagination
 */
function setupPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredTours.length / itemsPerPage);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  
  // Previous button
  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})" class="pagination-btn prev" aria-label="Previous page">← Previous</button>`;
  }

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += `<button onclick="goToPage(1)" class="pagination-btn">1</button>`;
    if (startPage > 2) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button onclick="goToPage(${i})" class="pagination-btn ${i === currentPage ? 'active' : ''}" aria-label="Page ${i}" ${i === currentPage ? 'aria-current="page"' : ''}>${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
    html += `<button onclick="goToPage(${totalPages})" class="pagination-btn">${totalPages}</button>`;
  }

  // Next button
  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})" class="pagination-btn next" aria-label="Next page">Next →</button>`;
  }

  container.innerHTML = html;
}

/**
 * Go to page
 */
function goToPage(page) {
  currentPage = page;
  renderToursGrid();
  setupPagination();
  
  // Scroll to top of tours grid
  const toursSection = document.querySelector('.tours-grid-section');
  if (toursSection) {
    const offset = 100; // Account for sticky header
    const elementPosition = toursSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

/**
 * Debounce helper
 */
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get proper link href
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
  // Use global toast function if available
  if (window.showToast) {
    window.showToast(message, type);
    return;
  }
  
  // Fallback to console
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Make goToPage globally available for onclick handlers
window.goToPage = goToPage;

// Expose for debugging
if (typeof window !== 'undefined') {
  window.toursDebug = {
    allTours: () => allTours,
    filteredTours: () => filteredTours,
    currentPage: () => currentPage,
    reloadTours: loadTours,
    clearCache: () => {
      localStorage.removeItem(TOURS_CACHE_KEY);
      console.log('✅ Cache cleared');
    }
  };
}
