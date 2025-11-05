// =====================================================
// HEADER.JS - Header functionality with search
// =====================================================

/**
 * All searchable content cache
 */
let searchIndex = [];
const SEARCH_CACHE_KEY = 'gntt_search_index';

/**
 * Build search index from GitHub
 */
async function buildSearchIndex() {
  try {
    console.log('🔍 Building search index...');
    
    // Try cache first
    const cached = localStorage.getItem(SEARCH_CACHE_KEY);
    if (cached) {
      searchIndex = JSON.parse(cached);
      console.log('✅ Search index loaded from cache');
      return;
    }

    // Load tours
    const toursUrl = 'https://api.github.com/repos/dearestwall/GuruNanakToursandTravels/contents/data/tours';
    const toursRes = await fetch(toursUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (toursRes.ok) {
      const tourFiles = await toursRes.json();
      for (const file of tourFiles) {
        if (file.name.endsWith('.json')) {
          const fileRes = await fetch(file.download_url);
          if (fileRes.ok) {
            const tour = await fileRes.json();
            searchIndex.push({
              type: 'tour',
              id: tour.id,
              title: tour.name,
              summary: tour.summary,
              icon: '🗺️',
              keywords: `${tour.name} ${tour.summary}`.toLowerCase()
            });
          }
        }
      }
    }

    // Load offerings
    const offeringsUrl = 'https://api.github.com/repos/dearestwall/GuruNanakToursandTravels/contents/data/offerings';
    const offeringsRes = await fetch(offeringsUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (offeringsRes.ok) {
      const offeringFiles = await offeringsRes.json();
      for (const file of offeringFiles) {
        if (file.name.endsWith('.json')) {
          const fileRes = await fetch(file.download_url);
          if (fileRes.ok) {
            const offering = await fileRes.json();
            searchIndex.push({
              type: 'offering',
              id: offering.id,
              title: offering.title,
              summary: offering.description,
              icon: offering.icon || '⚙️',
              keywords: `${offering.title} ${offering.description}`.toLowerCase()
            });
          }
        }
      }
    }

    // Cache search index
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(searchIndex));
    console.log('✅ Search index built:', searchIndex.length, 'items');
  } catch (e) {
    console.warn('⚠️ Failed to build search index:', e);
  }
}

/**
 * Search function
 */
function performSearch(query) {
  if (!query.trim()) {
    return [];
  }

  const q = query.toLowerCase().trim();
  return searchIndex.filter(item => 
    item.keywords.includes(q) || 
    item.title.toLowerCase().includes(q)
  ).slice(0, 8);
}

/**
 * Render search results
 */
function renderSearchResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (results.length === 0) {
    container.setAttribute('aria-hidden', 'true');
    container.innerHTML = '';
    return;
  }

  container.setAttribute('aria-hidden', 'false');
  container.innerHTML = results.map(item => `
    <a href="../details/?id=${item.id}&type=${item.type}" class="search-result-item" role="option">
      <span class="search-result-icon">${item.icon}</span>
      <div class="search-result-content">
        <div class="search-result-title">${escapeHtml(item.title)}</div>
        <div class="search-result-meta">${escapeHtml(item.summary || '')}</div>
      </div>
    </a>
  `).join('');
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function
 */
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

/**
 * Initialize header
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing header...');

  // Build search index
  buildSearchIndex();

  // Desktop Search
  const headerSearchInput = document.getElementById('header-search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const desktopResults = document.getElementById('desktopSearchResults');
  const mobileResults = document.getElementById('mobileSearchResults');

  const handleSearch = debounce((input, resultsContainer) => {
    const query = input.value.trim();
    const results = performSearch(query);
    renderSearchResults(results, resultsContainer.id);
  }, 300);

  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', () => {
      handleSearch(headerSearchInput, desktopResults);
    });

    headerSearchInput.addEventListener('focus', () => {
      if (headerSearchInput.value.trim()) {
        const results = performSearch(headerSearchInput.value);
        renderSearchResults(results, desktopResults.id);
      }
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', () => {
      handleSearch(mobileSearchInput, mobileResults);
    });

    mobileSearchInput.addEventListener('focus', () => {
      if (mobileSearchInput.value.trim()) {
        const results = performSearch(mobileSearchInput.value);
        renderSearchResults(results, mobileResults.id);
      }
    });
  }

  // Search form submission
  const headerForm = document.getElementById('headerSearchForm');
  const mobileForm = document.getElementById('mobileSearchForm');

  [headerForm, mobileForm].forEach(form => {
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="search"]');
        const query = input?.value.trim();
        if (query) {
          window.location.href = `../tours/?q=${encodeURIComponent(query)}`;
        }
      });
    }
  });

  // Search toggle (mobile)
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
      const isActive = searchBar.classList.toggle('active');
      searchToggle.setAttribute('aria-expanded', isActive);
      if (isActive) {
        mobileSearchInput?.focus();
      }
    });
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

  function closeMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    if (menuToggle) {
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function openMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add('active');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    if (menuToggle) {
      menuToggle.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking links
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(closeMobileMenu, 150);
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      if (searchBar?.classList.contains('active')) {
        searchBar.classList.remove('active');
        searchToggle?.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // Update year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  console.log('✅ Header initialized');
});
