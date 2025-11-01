// =====================================================
// TOURS.JS - Tours & packages listing page
// =====================================================

let allTours = [];
let filteredTours = [];
const itemsPerPage = 6;
let currentPage = 1;

/**
 * Load and render tours
 */
async function loadTours() {
  const cmsData = await fetchCMSData();
  if (!cmsData || !cmsData.featured_tours) {
    showToast('Failed to load tours', 'error');
    return;
  }

  allTours = cmsData.featured_tours.sort((a, b) => b.price - a.price);
  filteredTours = [...allTours];
  renderToursGrid();
  setupFilters();
  setupPagination();
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
    document.getElementById('noResults').style.display = 'block';
    return;
  }

  document.getElementById('noResults').style.display = 'none';

  container.innerHTML = pageTours.map(tour => `
    <article class="tour">
      <div class="tour-image-wrapper">
        <img src="${tour.image}" alt="${tour.name}" class="tour-image" loading="lazy" />
      </div>
      <div class="tour-body">
        <h3 class="tour-title">${tour.name}</h3>
        <p class="tour-summary">${tour.summary}</p>
        ${tour.duration ? `<p class="tour-duration">⏱️ ${tour.duration}</p>` : ''}
        <div class="tour-footer">
          <p class="tour-price">₹${tour.price.toLocaleString('en-IN')}</p>
          <a class="btn btn-sm" href="${__toAbs(`/details/?id=${tour.id}&type=tour`)}">View Details</a>
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
    const query = searchInput?.value.toLowerCase() || '';
    const duration = durationFilter?.value || '';
    const priceRange = priceFilter?.value || '';

    filteredTours = allTours.filter(tour => {
      // Search filter
      if (query && !tour.name.toLowerCase().includes(query) && !tour.summary.toLowerCase().includes(query)) {
        return false;
      }

      // Duration filter
      if (duration) {
        const days = parseInt(tour.duration) || 0;
        if (duration === '3' && days !== 3) return false;
        if (duration === '4' && days !== 4) return false;
        if (duration === '5' && days !== 5) return false;
        if (duration === '6' && days < 6) return false;
      }

      // Price filter
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        const price = tour.price;
        if (max && (price < parseInt(min) || price > parseInt(max))) return false;
        if (!max && price < parseInt(min)) return false;
      }

      return true;
    });

    renderToursGrid();
    setupPagination();
  };

  searchInput?.addEventListener('input', applyFilters);
  durationFilter?.addEventListener('change', applyFilters);
  priceFilter?.addEventListener('change', applyFilters);
}

/**
 * Setup pagination
 */
function setupPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredTours.length / itemsPerPage);

  let html = '';
  if (currentPage > 1) {
    html += `<button onclick="goToPage(${currentPage - 1})" class="pagination-btn prev">← Previous</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<button class="pagination-btn active">${i}</button>`;
    } else {
      html += `<button onclick="goToPage(${i})" class="pagination-btn">${i}</button>`;
    }
  }

  if (currentPage < totalPages) {
    html += `<button onclick="goToPage(${currentPage + 1})" class="pagination-btn next">Next →</button>`;
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
  document.querySelector('.tours-grid-section').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadTours, 200);
});
