// =====================================================
// COMMON.JS - Shared utilities for all pages
// =====================================================

/**
 * Detect site base URL from the script location
 * Works on both local dev and GitHub Pages project sites
 * Handles both root pages and nested directories
 */
function detectBaseFromScript() {
  const scripts = document.getElementsByTagName('script');
  for (const s of scripts) {
    const src = s.src || '';
    const m = src.match(/^(.*\/)assets\/js\/common\.js(?:\?.*)?$/);
    if (m) return m[1]; // absolute base ending with slash
  }
  // Fallback: compute from current page path
  const path = location.pathname.endsWith('/') 
    ? location.pathname 
    : location.pathname.replace(/\/[^\/]*$/, '/');
  return `${location.origin}${path}`;
}

/**
 * Detect root base URL (for partials and assets)
 * Finds the project root, not the current directory
 */
function detectRootBase() {
  const currentPath = location.pathname;
  
  // If we're at /GuruNanakToursandTravels/ (root)
  if (currentPath.match(/\/GuruNanakToursandTravels\/?$/)) {
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  
  // If we're at /GuruNanakToursandTravels/index.html
  if (currentPath.match(/\/GuruNanakToursandTravels\/index\.html$/)) {
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  
  // If we're at /GuruNanakToursandTravels/details/index.html or similar
  if (currentPath.includes('/GuruNanakToursandTravels/')) {
    const parts = currentPath.split('/GuruNanakToursandTravels/')[0];
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  
  // For local dev at /
  if (currentPath.match(/^\/[^\/]*\.html$/) || currentPath === '/') {
    return `${location.origin}/`;
  }
  
  // For local dev in subdirectories like /details/index.html
  if (currentPath.match(/^\/[^\/]+\/index\.html$/)) {
    return `${location.origin}/`;
  }
  
  // Fallback
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
  
  // Absolute URLs, protocols, tel:, mailto: pass through
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('tel:') || url.startsWith('mailto:')) {
    return url;
  }
  
  // Root-relative paths
  if (url.startsWith('/')) {
    return `${location.origin}${__BASE_PATH}${url.replace(/^\//, '')}`;
  }
  
  // Relative paths
  return `${__BASE_ABS}${url}`;
}

/**
 * Get absolute path to partials and data
 * Always relative to project root
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
 * Fetch CMS data with proper base URL
 */
async function fetchCMSData() {
  try {
    const url = __getDataUrl('home.json');
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('CMS data load error:', e, 'URL:', __getDataUrl('home.json'));
    return null;
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
  const searchInput = document.getElementById('header-search-input');

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
  if (headerSearchForm) {
    headerSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput?.value.trim();
      if (query) {
        location.href = __toAbs(`/tours/?q=${encodeURIComponent(query)}`);
      }
    });
  }

  // Search suggestions
  const suggestions = document.querySelectorAll('.suggestion-item');
  suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.search;
      if (searchInput && headerSearchForm) {
        searchInput.value = query;
        headerSearchForm.submit();
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
  document.querySelectorAll('[id*="call"]').forEach(el => {
    if (phoneHref && el.tagName === 'A') el.href = phoneHref;
  });

  // Update all WhatsApp buttons
  document.querySelectorAll('[id*="wa"]').forEach(el => {
    if (waHref && el.tagName === 'A') el.href = waHref;
  });

  // Update book buttons
  document.querySelectorAll('[id*="book"]').forEach(el => {
    if (el.tagName === 'A' && contact.booking_link) {
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
