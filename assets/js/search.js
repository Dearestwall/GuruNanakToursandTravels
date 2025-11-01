// =====================================================
// SEARCH.JS - Global site search across all collections
// =====================================================

let searchIndex = [];
let searchCache = {};

/**
 * Build search index from all collections
 */
async function buildSearchIndex() {
  const cmsData = await fetchCMSData();
  const aggregated = [];

  // Index tours
  if (cmsData.featured_tours) {
    cmsData.featured_tours.forEach(tour => {
      aggregated.push({
        id: tour.id,
        type: 'tour',
        title: tour.name,
        description: tour.summary,
        keywords: [
          tour.name.toLowerCase(),
          ...(tour.highlights || []).map(h => h.toLowerCase()),
          tour.best_season?.toLowerCase() || ''
        ].filter(Boolean),
        content: tour.description,
        url: __toAbs(`/details/?id=${tour.id}&type=tour`),
        price: tour.price
      });
    });
  }

  // Index services
  if (cmsData.offerings) {
    cmsData.offerings.forEach(offering => {
      aggregated.push({
        id: offering.id,
        type: 'service',
        title: offering.title,
        description: offering.description,
        keywords: [
          offering.title.toLowerCase(),
          offering.icon,
          ...(offering.features || []).map(f => f.toLowerCase())
        ].filter(Boolean),
        content: offering.long_description || offering.description,
        url: __toAbs(`/details/?id=${offering.id}&type=offering`)
      });
    });
  }

  // Index FAQs
  if (cmsData.faqs) {
    cmsData.faqs.forEach((faq, i) => {
      aggregated.push({
        id: faq.id || `faq-${i}`,
        type: 'faq',
        title: faq.q,
        description: faq.a.substring(0, 100) + '...',
        keywords: faq.q.toLowerCase().split(' ').filter(w => w.length > 3),
        content: faq.a,
        category: faq.category || 'general',
        url: __toAbs('/#faqs')
      });
    });
  }

  // Index testimonials for name/location
  if (cmsData.testimonials) {
    cmsData.testimonials.forEach(review => {
      aggregated.push({
        id: review.id,
        type: 'review',
        title: `${review.name} - ${review.tour_package || 'GNTT'}`,
        description: review.comment,
        keywords: [
          review.name.toLowerCase(),
          review.location?.toLowerCase() || '',
          review.tour_package?.toLowerCase() || ''
        ].filter(Boolean),
        content: review.comment,
        url: __toAbs('/#testimonials'),
        rating: review.rating
      });
    });
  }

  searchIndex = aggregated;
  return aggregated;
}

/**
 * Smart search with filters and scoring
 */
function search(query, filters = {}) {
  if (!query || query.length < 2) return [];

  const key = `${query}-${JSON.stringify(filters)}`;
  if (searchCache[key]) return searchCache[key];

  const q = query.toLowerCase();
  const results = searchIndex
    .filter(item => {
      // Type filter
      if (filters.type && item.type !== filters.type) return false;

      // Price filter
      if (filters.maxPrice && item.price && item.price > filters.maxPrice) return false;
      if (filters.minPrice && item.price && item.price < filters.minPrice) return false;

      // Category filter
      if (filters.category && item.category !== filters.category) return false;

      // Text search
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some(k => k.includes(q));
      const matchContent = item.content.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchKeywords || matchContent;
    })
    .map(item => {
      let score = 0;
      const q_lower = q.toLowerCase();

      // Title matches score highest
      if (item.title.toLowerCase() === q_lower) score += 100;
      else if (item.title.toLowerCase().startsWith(q_lower)) score += 50;
      else if (item.title.toLowerCase().includes(q_lower)) score += 25;

      // Keyword matches
      if (item.keywords.some(k => k === q_lower)) score += 30;
      if (item.keywords.some(k => k.includes(q_lower))) score += 10;

      // Type boost
      if (item.type === 'tour') score += 5;
      if (item.type === 'service') score += 3;

      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  searchCache[key] = results;
  return results;
}

/**
 * Initialize search UI
 */
function initSearchUI() {
  const searchInput = document.getElementById('globalSearchInput');
  const searchResults = document.getElementById('globalSearchResults');
  const searchFilters = document.getElementById('searchFilters');

  if (!searchInput || !searchResults) return;

  searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value;
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }

    const filters = getSearchFilters(searchFilters);
    const results = search(query, filters);
    renderSearchResults(results, searchResults);
  }, 300));

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchResults.style.display = 'none';
    }
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });
}

/**
 * Get active search filters
 */
function getSearchFilters(filterContainer) {
  const filters = {};
  if (!filterContainer) return filters;

  const typeSelect = filterContainer.querySelector('[name="search-type"]');
  if (typeSelect?.value) filters.type = typeSelect.value;

  const categorySelect = filterContainer.querySelector('[name="search-category"]');
  if (categorySelect?.value) filters.category = categorySelect.value;

  return filters;
}

/**
 * Render search results with grouping
 */
function renderSearchResults(results, container) {
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = '<div class="search-no-results">🔍 No results found. Try different keywords.</div>';
    container.style.display = 'block';
    return;
  }

  // Group by type
  const grouped = {};
  results.forEach(result => {
    if (!grouped[result.type]) grouped[result.type] = [];
    grouped[result.type].push(result);
  });

  const typeLabels = {
    tour: '✈️ Tours',
    service: '💼 Services',
    faq: '❓ FAQs',
    review: '⭐ Reviews'
  };

  const html = Object.entries(grouped)
    .map(([type, items]) => `
      <div class="search-group">
        <div class="search-group-title">${typeLabels[type] || type}</div>
        ${items.map(result => `
          <a href="${result.url}" class="search-result-item">
            <div class="result-meta">
              <span class="result-type">${type}</span>
              ${result.price ? `<span class="result-price">₹${result.price.toLocaleString('en-IN')}</span>` : ''}
              ${result.rating ? `<span class="result-rating">${result.rating}⭐</span>` : ''}
            </div>
            <div class="result-content">
              <h4 class="result-title">${result.title}</h4>
              <p class="result-desc">${result.description}</p>
            </div>
          </a>
        `).join('')}
      </div>
    `).join('');

  container.innerHTML = html;
  container.style.display = 'block';
}

/**
 * Initialize on load
 */
document.addEventListener('DOMContentLoaded', async () => {
  await buildSearchIndex();
  initSearchUI();
});
