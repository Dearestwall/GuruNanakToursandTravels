// =====================================================
// COMMON.JS - Shared utilities for all pages
// =====================================================

/**
 * Detect site base URL from the script location
 */
function detectBaseFromScript() {
  const scripts = document.getElementsByTagName('script');
  for (const s of scripts) {
    const src = s.src || '';
    const m = src.match(/^(.*\/)assets\/js\/common\.js(?:\?.*)?$/);
    if (m) return m[1];
  }
  const path = location.pathname.endsWith('/') 
    ? location.pathname 
    : location.pathname.replace(/\/[^\/]*$/, '/');
  return `${location.origin}${path}`;
}

/**
 * Detect root base URL
 */
function detectRootBase() {
  const currentPath = location.pathname;
  
  if (currentPath.match(/\/GuruNanakToursandTravels\/?$/)) {
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  
  if (currentPath.match(/\/GuruNanakToursandTravels\/index\.html$/)) {
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  
  if (currentPath.includes('/GuruNanakToursandTravels/')) {
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  
  if (currentPath.match(/^\/[^\/]*\.html$/) || currentPath === '/') {
    return `${location.origin}/`;
  }
  
  if (currentPath.match(/^\/[^\/]+\/index\.html$/)) {
    return `${location.origin}/`;
  }
  
  return `${location.origin}/`;
}

const __BASE_ABS = detectBaseFromScript();
const __ROOT_BASE = detectRootBase();
const __BASE_PATH = __BASE_ABS.replace(/^https?:\/\/[^/]+/, '');

/**
 * Convert relative/root paths to absolute URLs
 */
function __toAbs(url) {
  if (!url) return '#';
  
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('tel:') || url.startsWith('mailto:')) {
    return url;
  }
  
  if (url.startsWith('/')) {
    return `${location.origin}${__BASE_PATH}${url.replace(/^\//, '')}`;
  }
  
  return `${__BASE_ABS}${url}`;
}

/**
 * Get absolute path to partials and data
 */
function __getPartialUrl(filename) {
  return `${__ROOT_BASE}partials/${filename}`;
}

function __getDataUrl(filename) {
  return `${__ROOT_BASE}data/${filename}`;
}

// Export to window
window.__BASE_ABS = __BASE_ABS;
window.__ROOT_BASE = __ROOT_BASE;
window.__BASE_PATH = __BASE_PATH;
window.__toAbs = __toAbs;
window.__getPartialUrl = __getPartialUrl;
window.__getDataUrl = __getDataUrl;

/**
 * Cache for merged CMS data
 */
let cachedCMSData = null;

/**
 * Load all modular JSON files and merge them
 */
async function fetchCMSData() {
  if (cachedCMSData) {
    return cachedCMSData;
  }

  const files = [
    { key: 'hero_slides', path: 'hero.json', fallback: { hero_slides: [] } },
    { key: 'offerings', path: 'offerings.json', fallback: { offerings: [] } },
    { key: 'featured_tours', path: 'tours.json', fallback: { featured_tours: [] } },
    { key: 'stats', path: 'stats.json', fallback: { stats: {} } },
    { key: 'testimonials', path: 'testimonials.json', fallback: { testimonials: [] } },
    { key: 'partners', path: 'partners.json', fallback: { partners: [] } },
    { key: 'faqs', path: 'faqs.json', fallback: { faqs: [] } },
    { key: 'contact', path: 'contact.json', fallback: { contact: {} } }
  ];

  const mergedData = {
    hero_slides: [],
    offerings: [],
    featured_tours: [],
    stats: {},
    testimonials: [],
    partners: [],
    faqs: [],
    contact: {}
  };

  async function fetchFile(file) {
    try {
      const url = __getDataUrl(file.path);
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!res.ok) {
        console.warn(`Failed to load ${file.path}: HTTP ${res.status}`);
        return file.fallback;
      }
      
      return await res.json();
    } catch (e) {
      console.warn(`Failed to load ${file.path}:`, e);
      return file.fallback;
    }
  }

  try {
    // Load all files in parallel
    const results = await Promise.all(files.map(f => fetchFile(f)));
    
    // Merge data
    results.forEach((data, index) => {
      const key = files[index].key;
      if (data[key]) {
        mergedData[key] = data[key];
      }
    });

    // Cache the merged data
    cachedCMSData = mergedData;
    console.log('CMS data loaded successfully', mergedData);
    return mergedData;
  } catch (e) {
    console.error('Error loading CMS data:', e);
    return mergedData; // Return partial data
  }
}

/**
 * Show toast notification
 */
function showToast(msg, type = 'info', duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);
  }
  
  toast.textContent = msg;
  toast.style.background = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fee2e2' : '#dbeafe';
  toast.style.color = type === 'success' ? '#065f46' : type === 'error' ? '#b91c1c' : '#0c4a6e';
  toast.hidden = false;
  
  setTimeout(() => {
    toast.hidden = true;
  }, duration);
}

/**
 * Get URL parameter
 */
function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

/**
 * Prefix all root-relative links with correct base
 */
function prefixInternalLinks(scope = document) {
  scope.querySelectorAll('a[href^="/"]').forEach(a => {
    const raw = a.getAttribute('href');
    a.setAttribute('href', __toAbs(raw));
  });
}

/**
 * Load and inject header/footer partials
 */
async function loadPartials() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');

  try {
    // Load header
    if (headerPh) {
      const headerUrl = __getPartialUrl('header.html');
      console.log('Loading header from:', headerUrl);
      const headerRes = await fetch(headerUrl);
      if (!headerRes.ok) throw new Error(`Header HTTP ${headerRes.status}`);
      const headerHtml = await headerRes.text();
      headerPh.innerHTML = headerHtml;
    }
    
    // Load footer
    if (footerPh) {
      const footerUrl = __getPartialUrl('footer.html');
      console.log('Loading footer from:', footerUrl);
      const footerRes = await fetch(footerUrl);
      if (!footerRes.ok) throw new Error(`Footer HTTP ${footerRes.status}`);
      const footerHtml = await footerRes.text();
      footerPh.innerHTML = footerHtml;
    }

    // Initialize header/footer after loading
    setTimeout(() => {
      initializeHeader();
      updateContactButtons();
    }, 200);

  } catch (e) {
    console.error('Error loading partials:', e);
    showToast('⚠️ Failed to load header/footer', 'error');
  }
}

/**
 * Initialize header functionality
 */
function initializeHeader() {
  // Update year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Search toggle
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('header-search-input') || document.getElementById('mobile-search-input');

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
      searchBar.classList.toggle('active');
      searchToggle.setAttribute('aria-expanded', searchBar.classList.contains('active'));
      if (searchBar.classList.contains('active')) {
        searchInput?.focus();
      }
    });
  }

  // Search form submission
  const headerSearchForm = document.getElementById('headerSearchForm');
  const mobileSearchForm = document.getElementById('mobileSearchForm');

  [headerSearchForm, mobileSearchForm].forEach(form => {
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="search"]');
        const query = input?.value.trim();
        if (query) {
          location.href = __toAbs(`/tours/?q=${encodeURIComponent(query)}`);
        }
      });
    }
  });

  // Search suggestions
  const suggestions = document.querySelectorAll('.suggestion-item');
  suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.search;
      const form = btn.closest('.search-container')?.querySelector('form');
      if (form) {
        const input = form.querySelector('input[type="search"]');
        input.value = query;
        form.submit();
      }
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

  function closeMobileMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
      mobileMenu.setAttribute('aria-hidden', 'true');
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

  // Close menu handlers
  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  if (mobileMenuOverlay && mobileMenu) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking links
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Prefix all links after header is loaded
  prefixInternalLinks(document);

  // Header show/hide on scroll
  initHeaderScroll();
}

/**
 * Header show/hide on scroll
 */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  let lastScrollTop = 0;
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > 100) {
      if (currentScroll > lastScrollTop) {
        // Scrolling down - hide header
        header.classList.add('hide');
      } else {
        // Scrolling up - show header
        header.classList.remove('hide');
      }
    } else {
      // Near top - always show
      header.classList.remove('hide');
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }, { passive: true });
}

/**
 * Update contact buttons with CMS data
 */
async function updateContactButtons() {
  const data = await fetchCMSData();
  if (!data || !data.contact) return;

  const contact = data.contact;
  const phoneClean = (contact.phone || '').replace(/\s+/g, '').replace(/^0+/, '');
  const waClean = (contact.whatsapp || '').replace(/\s+/g, '').replace(/^0+/, '');

  const phoneHref = phoneClean ? `tel:${phoneClean.replace(/^\+?/, '+')}` : null;
  const waHref = waClean ? `https://wa.me/${waClean.replace('+', '')}?text=Hello%20GNTT` : null;

  // Update all call buttons
  ['sticky-call', 'cta-call', 'header-call', 'mobile-call'].forEach(id => {
    const el = document.getElementById(id);
    if (el && phoneHref) el.href = phoneHref;
  });

  // Update all WhatsApp buttons
  ['sticky-wa', 'cta-wa', 'header-wa', 'mobile-wa'].forEach(id => {
    const el = document.getElementById(id);
    if (el && waHref) el.href = waHref;
  });

  // Update book buttons
  ['sticky-book', 'cta-book', 'header-book', 'mobile-book'].forEach(id => {
    const el = document.getElementById(id);
    if (el && contact.booking_link) {
      el.href = __toAbs(contact.booking_link);
    }
  });

  // Update footer contact info
  const footerPhone = document.getElementById('footer-phone');
  if (footerPhone && contact.phone) {
    footerPhone.textContent = contact.phone;
    if (phoneHref) footerPhone.href = phoneHref;
  }

  const footerEmail = document.getElementById('footer-email');
  if (footerEmail && contact.email) {
    footerEmail.textContent = contact.email;
    footerEmail.href = `mailto:${contact.email}`;
  }

  const footerAddress = document.getElementById('footer-address');
  if (footerAddress && contact.address) {
    footerAddress.textContent = contact.address;
  }

  const footerMap = document.getElementById('footer-map');
  if (footerMap && contact.map_link) {
    footerMap.href = contact.map_link;
  }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Common.js initializing...');
  console.log('Current path:', location.pathname);
  console.log('Root base:', __ROOT_BASE);
  console.log('Base abs:', __BASE_ABS);
  
  loadPartials();
});

// Mobile menu close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('menuToggle');
    if (mobileMenu?.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      menuToggle?.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  }
});
