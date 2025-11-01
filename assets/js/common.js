// =====================================================
// COMMON.JS - Shared utilities for all pages
// =====================================================

/**
 * Detect site base URL from the script location
 * Works on both local dev and GitHub Pages project sites
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

const __BASE_ABS = detectBaseFromScript(); // e.g. https://host/GuruNanakToursandTravels/
const __BASE_PATH = __BASE_ABS.replace(/^https?:\/\/[^/]+/, ''); // /GuruNanakToursandTravels/ or /

/**
 * Convert relative/root paths to absolute URLs respecting project subpath
 */
function __toAbs(url) {
  if (!url) return '#';
  // Absolute URLs, protocols, tel:, mailto: pass through
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('tel:') || url.startsWith('mailto:')) {
    return url;
  }
  // Root-relative: prefix with origin + BASE_PATH
  if (url.startsWith('/')) {
    return `${location.origin}${__BASE_PATH}${url.replace(/^\//,'')}`;
  }
  // Relative: append to BASE_ABS
  return `${__BASE_ABS}${url}`;
}

// Export to window for use in other scripts
window.__BASE_ABS = __BASE_ABS;
window.__BASE_PATH = __BASE_PATH;
window.__toAbs = __toAbs;

/**
 * Prefix all root-relative links so they work under GitHub Pages project subpath
 */
function prefixInternalLinks(scope = document) {
  scope.querySelectorAll('a[href^="/"]').forEach(a => {
    const raw = a.getAttribute('href');
    a.setAttribute('href', __toAbs(raw));
  });
}

/**
 * Mobile hamburger menu toggle
 */
function bindNavToggle(root = document) {
  const btn = root.getElementById ? root.getElementById('nav-toggle') : document.getElementById('nav-toggle');
  const nav = root.getElementById ? root.getElementById('primary-nav') : document.getElementById('primary-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const isOpen = nav.style.display === 'block';
    nav.style.display = isOpen ? 'none' : 'block';
    btn.setAttribute('aria-expanded', !isOpen);
  });

  // Close menu when a link is clicked
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * Search form handler
 */
function bindSearch(root = document) {
  const form = root.querySelector ? root.querySelector('.site-search form') : document.querySelector('.site-search form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    const input = form.querySelector('input[type="search"]');
    const q = input ? input.value.trim() : '';
    if (!q) {
      e.preventDefault();
      return;
    }
    const action = form.getAttribute('action') || '/tours/';
    e.preventDefault();
    location.href = __toAbs(`${action}?q=${encodeURIComponent(q)}`);
  });
}

/**
 * Language switcher with i18n support
 */
const LANGS = ['en', 'pa', 'hi'];

function initLang(root = document) {
  const select = root.getElementById ? root.getElementById('lang-select') : document.getElementById('lang-select');
  if (!select) return;

  const saved = localStorage.getItem('lang') || 'en';
  if (LANGS.includes(saved)) select.value = saved;

  async function applyLang(lang) {
    try {
      const url = __toAbs(`/assets/i18n/${lang}.json`);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const dict = await res.json();

      // Apply text translations
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });

      // Apply placeholder translations
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.setAttribute('placeholder', dict[key]);
      });

      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn(`Failed to load language: ${lang}`, e);
    }
  }

  select.addEventListener('change', (e) => {
    applyLang(e.target.value);
  });

  applyLang(select.value);
}

/**
 * Inject header and footer partials, then bind all behaviors
 */
async function injectPartials() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');

  // Inject header
  if (headerPh) {
    try {
      const url = __toAbs('/partials/header.html');
      const h = await fetch(url).then(r => r.text());
      headerPh.innerHTML = h;
    } catch (e) {
      console.warn('Failed to load header.html', e);
    }
  }

  // Inject footer
  if (footerPh) {
    try {
      const url = __toAbs('/partials/footer.html');
      const f = await fetch(url).then(r => r.text());
      footerPh.innerHTML = f;
    } catch (e) {
      console.warn('Failed to load footer.html', e);
    }
  }

  // Bind all behaviors on the newly injected content
  setTimeout(() => {
    prefixInternalLinks(document);
    bindNavToggle(document);
    bindSearch(document);
    initLang(document);

    // Update year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }, 100);
}

/**
 * Initialize common page on DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  injectPartials().then(() => {
    // Ensure all links are prefixed in case partials already contained them
    prefixInternalLinks(document);
  });
});
// Enhanced header functionality
function initializeHeader() {
  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('header-search-input');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const headerSearchForm = document.getElementById('headerSearchForm');
  const suggestions = document.querySelectorAll('.suggestion-item');

  // Search toggle
  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
      searchBar.classList.toggle('active');
      searchToggle.setAttribute('aria-expanded', searchBar.classList.contains('active'));
      if (searchBar.classList.contains('active')) {
        searchInput.focus();
      }
    });
  }

  // Search suggestions
  suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.search;
      searchInput.value = query;
      if (headerSearchForm) {
        headerSearchForm.submit();
      }
    });
  });

  // Mobile menu toggle
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      menuToggle.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', mobileMenu.classList.contains('active'));
      mobileMenu.setAttribute('aria-hidden', !mobileMenu.classList.contains('active'));
    });
  }

  // Close mobile menu
  if (mobileMenuClose && mobileMenu) {
    mobileMenuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  }

  // Mobile menu overlay
  if (mobileMenuOverlay && mobileMenu) {
    mobileMenuOverlay.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  }

  // Mobile menu links close menu on click
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });

  // Update year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// Call on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeHeader, 100);
});
