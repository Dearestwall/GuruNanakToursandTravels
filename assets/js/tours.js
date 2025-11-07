// =====================================================
// TOURS.JS - Tours & packages listing page
// =====================================================

let allTours = [];
let filteredTours = [];
let currentFilters = {
  search: '',
  duration: '',
  price: ''
};

const itemsPerPage = 6;
let currentPage = 1;

/**
 * Load and render tours
 */
async function loadTours() {
  try {
    console.log('[TOURS] Loading...');
    const cmsData = await fetchCMSData();
    
    if (!cmsData || !cmsData.featured_tours || cmsData.featured_tours.length === 0) {
      showToast('Failed to load tours', 'error');
      showNoResults();
      return;
    }

    // Sort by price (highest first)
    allTours = cmsData.featured_tours.sort((a, b) => b.price - a.price);
    filteredTours = [...allTours];
    
    console.log('[TOURS] Loaded:', allTours.length, 'tours');
    
    renderToursGrid();
    setupFilters();
    setupPagination();
    updatePageTitle();
  } catch (e) {
    console.error('Tours load error:', e);
    showToast('Failed to load tours', 'error');
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

  // Show/hide no results
  const noRes = document.getElementById('noResults');
  if (pageTours.length === 0) {
    container.innerHTML = '';
    if (noRes) noRes.style.display = 'block';
    return;
  }

  if (noRes) noRes.style.display = 'none';

  // Render tours with staggered animation
  container.innerHTML = pageTours.map((tour, idx) => `
    <article class="tour" style="animation-delay: ${idx * 0.1}s;">
      <!-- Image -->
      <div class="tour-image-wrapper">
        <img 
          src="${tour.image || '/assets/images/placeholder.jpg'}" 
          alt="${tour.name}" 
          class="tour-image" 
          loading="lazy"
        />
        <div class="tour-overlay">
          <span class="tour-badge">${tour.duration || 'Tour'}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="tour-body">
        <!-- Title & Destination -->
        <div class="tour-header">
          <h3 class="tour-title">${tour.name || 'Tour Package'}</h3>
          ${tour.destination ? `<span class="tour-destination">📍 ${tour.destination}</span>` : ''}
        </div>

        <!-- Summary -->
        <p class="tour-summary">${tour.summary || 'Amazing tour experience'}</p>

        <!-- Duration -->
        ${tour.duration ? `
          <div class="tour-meta">
            <span class="meta-item">
              <span class="meta-icon">⏱️</span>
              <span>${tour.duration}</span>
            </span>
          </div>
        ` : ''}

        <!-- Highlights (if available) -->
        ${tour.highlights && tour.highlights.length > 0 ? `
          <div class="tour-highlights">
            ${tour.highlights.slice(0, 2).map(h => `
              <span class="highlight-tag">✓ ${h}</span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="tour-footer">
          <div class="tour-price">
            <span class="price-label">From</span>
            <span class="price-amount">₹${tour.price.toLocaleString('en-IN')}</span>
          </div>
          <a 
            class="btn btn-sm" 
            href="${__toAbs(`/details/?id=${tour.id}&type=tour`)}"
            data-tour-id="${tour.id}"
          >View Details →</a>
        </div>
      </div>
    </article>
  `).join('');

  console.log('[TOURS] Rendered:', pageTours.length, 'tours');
}

/**
 * Setup filters with event listeners
 */
function setupFilters() {
  const searchInput = document.getElementById('searchTours');
  const durationFilter = document.getElementById('filterDuration');
  const priceFilter = document.getElementById('filterPrice');
  const clearBtn = document.getElementById('clearFilters');
  const resetBtn = document.getElementById('resetFilters');

  // Create debounced filter function
  const applyFilters = () => {
    currentPage = 1;
    currentFilters.search = (searchInput?.value || '').toLowerCase();
    currentFilters.duration = durationFilter?.value || '';
    currentFilters.price = priceFilter?.value || '';

    console.log('[FILTERS] Applied:', currentFilters);

    filteredTours = allTours.filter(tour => {
      // Search filter
      if (currentFilters.search) {
        const searchText = [
          tour.name,
          tour.summary,
          tour.destination,
          ...(tour.highlights || [])
        ].join(' ').toLowerCase();

        if (!searchText.includes(currentFilters.search)) {
          return false;
        }
      }

      // Duration filter
      if (currentFilters.duration) {
        const daysMatch = String(tour.duration || '').match(/^(\d+)/);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
        
        if (currentFilters.duration === '3' && days !== 3) return false;
        if (currentFilters.duration === '4' && days !== 4) return false;
        if (currentFilters.duration === '5' && days !== 5) return false;
        if (currentFilters.duration === '6' && days < 6) return false;
      }

      // Price filter
      if (currentFilters.price) {
        const [min, max] = currentFilters.price.split('-').map(v => parseInt(v, 10));
        const price = tour.price;
        
        if (!isNaN(min) && isNaN(max) && price < min) return false;
        if (!isNaN(min) && !isNaN(max) && (price < min || price > max)) return false;
      }

      return true;
    });

    console.log('[FILTERS] Results:', filteredTours.length);

    renderToursGrid();
    setupPagination();
    updateFilterTags();
  };

  // Event listeners
  searchInput?.addEventListener('input', debounce(applyFilters, 300));
  durationFilter?.addEventListener('change', applyFilters);
  priceFilter?.addEventListener('change', applyFilters);

  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    durationFilter.value = '';
    priceFilter.value = '';
    applyFilters();
  });

  resetBtn?.addEventListener('click', () => {
    searchInput.value = '';
    durationFilter.value = '';
    priceFilter.value = '';
    applyFilters();
  });
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
    html += `
      <button 
        onclick="goToPage(${currentPage - 1})" 
        class="pagination-btn prev"
        aria-label="Previous page"
      >
        ← Previous
      </button>
    `;
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `
        <button 
          onclick="goToPage(${i})" 
          class="pagination-btn ${i === currentPage ? 'active' : ''}"
          ${i === currentPage ? 'aria-current="page"' : ''}
          aria-label="Page ${i}"
        >
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  // Next button
  if (currentPage < totalPages) {
    html += `
      <button 
        onclick="goToPage(${currentPage + 1})" 
        class="pagination-btn next"
        aria-label="Next page"
      >
        Next →
      </button>
    `;
  }

  container.innerHTML = html;
}

/**
 * Go to page
 */
function goToPage(page) {
  currentPage = Math.max(1, page);
  renderToursGrid();
  setupPagination();
  
  const anchor = document.querySelector('.tours-grid-section') || document.body;
  anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  console.log('[PAGINATION] Page:', page);
}

/**
 * Show no results message
 */
function showNoResults() {
  const noRes = document.getElementById('noResults');
  if (noRes) {
    noRes.style.display = 'block';
  }
}

/**
 * Update filter tags display
 */
function updateFilterTags() {
  const tagsContainer = document.getElementById('filterTags');
  if (!tagsContainer) return;

  const tags = [];

  if (currentFilters.search) {
    tags.push({
      label: `Search: "${currentFilters.search}"`,
      field: 'search'
    });
  }

  if (currentFilters.duration) {
    const durationMap = { '3': '3 Days', '4': '4 Days', '5': '5 Days', '6': '6+ Days' };
    tags.push({
      label: durationMap[currentFilters.duration] || currentFilters.duration,
      field: 'duration'
    });
  }

  if (currentFilters.price) {
    const priceMap = {
      '0-10000': 'Under ₹10K',
      '10000-20000': '₹10K-₹20K',
      '20000-50000': '₹20K-₹50K',
      '50000': '₹50K+'
    };
    tags.push({
      label: priceMap[currentFilters.price] || currentFilters.price,
      field: 'price'
    });
  }

  if (tags.length === 0) {
    tagsContainer.innerHTML = '';
    return;
  }

  tagsContainer.innerHTML = tags.map(tag => `
    <span class="filter-tag">
      ${tag.label}
      <button 
        class="tag-remove" 
        onclick="removeFilter('${tag.field}')"
        aria-label="Remove ${tag.label} filter"
      >×</button>
    </span>
  `).join('');
}

/**
 * Remove single filter
 */
function removeFilter(field) {
  const inputs = {
    search: document.getElementById('searchTours'),
    duration: document.getElementById('filterDuration'),
    price: document.getElementById('filterPrice')
  };

  if (inputs[field]) {
    inputs[field].value = '';
    currentFilters[field] = '';
    currentPage = 1;
    
    filteredTours = allTours.filter(tour => {
      // Re-apply remaining filters
      let pass = true;

      if (currentFilters.search) {
        const searchText = [
          tour.name,
          tour.summary,
          tour.destination,
          ...(tour.highlights || [])
        ].join(' ').toLowerCase();
        pass = pass && searchText.includes(currentFilters.search);
      }

      if (currentFilters.duration) {
        const daysMatch = String(tour.duration || '').match(/^(\d+)/);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
        pass = pass && (
          (currentFilters.duration === '3' && days === 3) ||
          (currentFilters.duration === '4' && days === 4) ||
          (currentFilters.duration === '5' && days === 5) ||
          (currentFilters.duration === '6' && days >= 6)
        );
      }

      if (currentFilters.price) {
        const [min, max] = currentFilters.price.split('-').map(v => parseInt(v, 10));
        const price = tour.price;
        pass = pass && (
          (!isNaN(min) && isNaN(max) && price >= min) ||
          (!isNaN(min) && !isNaN(max) && price >= min && price <= max)
        );
      }

      return pass;
    });

    renderToursGrid();
    setupPagination();
    updateFilterTags();
  }
}

/**
 * Update page title with count
 */
function updatePageTitle() {
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.textContent = `Tours & Packages (${allTours.length}) — GNTT`;
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[TOURS] Page initialized');
  setTimeout(loadTours, 200);
});
