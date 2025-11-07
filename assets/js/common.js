// =====================================================
// COMMON.JS - Shared utilities and bootstrap (global)
// - Detect base URLs + helpers
// - Data/partials URL builders
// - Lightweight CMS data loader (merged)
// - Partial injection (header/footer)
// - FAQ Accordion Manager (new!)
// =====================================================

/* ---------- Base URL detection ---------- */

/**
 * Detect site base URL from the script location
 * Works for: /assets/js/common.js or ../assets/js/common.js
 */
function detectBaseFromScript() {
  const scripts = document.getElementsByTagName('script');
  for (const s of scripts) {
    const src = s.src || '';
    const m = src.match(/^(.*\/)assets\/js\/common\.js(?:\?.*)?$/);
    if (m) {
      console.log('[BASE] Detected from script src:', m[1]);
      return m[1];
    }
  }
  
  // Fallback: use current pathname
  const path = location.pathname.endsWith('/')
    ? location.pathname
    : location.pathname.replace(/\/[^\/]*$/, '/');
  
  console.log('[BASE] Fallback from pathname:', path);
  return `${location.origin}${path}`;
}

/**
 * Detect root base URL intelligently
 * Handles: GitHub Pages, local dev, subdirectories
 */
function detectRootBase() {
  const currentPath = location.pathname;
  console.log('[ROOT] Analyzing path:', currentPath);

  // GitHub Pages: /GuruNanakToursandTravels/...
  if (currentPath.includes('/GuruNanakToursandTravels/')) {
    const base = `${location.origin}/GuruNanakToursandTravels/`;
    console.log('[ROOT] GitHub Pages detected:', base);
    return base;
  }

  // Homepage
  if (currentPath.match(/^\/index\.html?$/)) {
    const base = `${location.origin}/`;
    console.log('[ROOT] Homepage detected:', base);
    return base;
  }

  // Sub-directory: /booking/, /tours/, /details/, etc
  if (currentPath.match(/^\/[^\/]+\//) || currentPath.match(/^\/[^\/]+\/index\.html$/)) {
    const parts = currentPath.split('/').filter(Boolean);
    const base = `${location.origin}/${parts[0]}/`;
    console.log('[ROOT] Sub-directory detected:', base);
    return base;
  }

  // Root level
  const base = `${location.origin}/`;
  console.log('[ROOT] Root level fallback:', base);
  return base;
}

const __BASE_ABS = detectBaseFromScript();
const __ROOT_BASE = detectRootBase();
const __BASE_PATH = __BASE_ABS.replace(/^https?:\/\/[^/]+/, '');

console.log('[PATHS]', {
  __BASE_ABS,
  __ROOT_BASE,
  __BASE_PATH,
  origin: location.origin,
  pathname: location.pathname,
  href: location.href
});

/* ---------- URL helpers ---------- */

/**
 * Convert relative/root paths to absolute URLs
 * Handles: /, /path, ../path, ./file, url
 */
function __toAbs(url) {
  if (!url) return '#';
  
  // Already absolute or special
  if (/^(https?:)?\/\//i.test(url)) return url;
  if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('#')) return url;

  // Root-relative path: /services/index.html
  if (url.startsWith('/')) {
    const result = `${location.origin}${__BASE_PATH}${url.replace(/^\//, '')}`;
    console.log('[TOABS] Root path:', { url, result });
    return result;
  }

  // Relative path: ../booking/index.html or ./file.html
  if (url.startsWith('../') || url.startsWith('./')) {
    // Resolve relative to __BASE_ABS
    const parts = __BASE_ABS.split('/').filter(Boolean);
    const urlParts = url.split('/');
    
    for (const part of urlParts) {
      if (part === '..' && parts.length > 0) {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    }
    
    const result = `${location.origin}/${parts.join('/')}`;
    console.log('[TOABS] Relative path:', { url, result });
    return result;
  }

  // Regular relative: partials/header.html
  const result = `${__BASE_ABS}${url}`;
  console.log('[TOABS] Regular relative:', { url, result });
  return result;
}

/**
 * Get absolute path to partials
 */
function __getPartialUrl(filename) {
  const url = `${__ROOT_BASE}partials/${filename}`;
  console.log('[PARTIAL_URL]', { filename, url });
  return url;
}

/**
 * Get absolute path to /data JSON files
 */
function __getDataUrl(filename) {
  const url = `${__ROOT_BASE}data/${filename}`;
  console.log('[DATA_URL]', { filename, url });
  return url;
}

/* Expose globally */
window.__BASE_ABS = __BASE_ABS;
window.__ROOT_BASE = __ROOT_BASE;
window.__BASE_PATH = __BASE_PATH;
window.__toAbs = __toAbs;
window.__getPartialUrl = __getPartialUrl;
window.__getDataUrl = __getDataUrl;

/* ---------- Small utilities ---------- */

/**
 * Show toast notification
 * Types: 'info', 'success', 'error'
 */
function showToast(msg, type = 'info', duration = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      padding: '12px 16px',
      borderRadius: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,.12)',
      zIndex: '99999',
      fontWeight: '700',
      animation: 'slideInUp 0.3s ease'
    });
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.background = type === 'success' 
    ? '#ecfdf5' 
    : type === 'error' 
    ? '#fee2e2' 
    : '#dbeafe';
  toast.style.color = type === 'success' 
    ? '#065f46' 
    : type === 'error' 
    ? '#b91c1c' 
    : '#0c4a6e';
  toast.hidden = false;

  setTimeout(() => { toast.hidden = true; }, duration);
}

/**
 * Read query parameter from URL
 * Usage: getQueryParam('id') from ?id=123
 */
function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  const value = params.get(name);
  console.log('[PARAM]', { name, value });
  return value;
}

/**
 * Get all query parameters as object
 */
function getAllQueryParams() {
  const params = new URLSearchParams(location.search);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  console.log('[ALL_PARAMS]', obj);
  return obj;
}

/**
 * Prefix all root-relative anchors with the correct base
 */
function prefixInternalLinks(scope = document) {
  scope.querySelectorAll('a[href^="/"]').forEach(a => {
    const raw = a.getAttribute('href');
    const absolute = __toAbs(raw);
    a.setAttribute('href', absolute);
    console.log('[PREFIX_LINK]', { raw, absolute });
  });
}

/**
 * Simple debounce function
 */
function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

/**
 * Simple throttle function
 */
function throttle(fn, ms) {
  let last = 0;
  return (...a) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...a);
    }
  };
}

/**
 * Get URL hash
 */
function getHash() {
  return location.hash.slice(1);
}

/**
 * Set URL hash
 */
function setHash(hash) {
  location.hash = hash;
}

/**
 * Scroll to element by ID
 */
function scrollToId(id, smooth = true) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }
}

/* ---------- CMS data loader (merged view) ---------- */

let cachedCMSData = null;

/**
 * Load modular JSON from /data and merge into one object
 */
async function fetchCMSData() {
  if (cachedCMSData) {
    console.log('[CMS] Using cached data');
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
      console.log('[CMS] Fetching:', url);
      const res = await fetch(url, { 
        cache: 'no-store', 
        headers: { 'Accept': 'application/json' } 
      });
      
      if (!res.ok) {
        console.warn(`[CMS] Failed to load ${file.path}: HTTP ${res.status}`);
        return file.fallback;
      }
      
      const data = await res.json();
      console.log(`[CMS] Loaded ${file.path}:`, data);
      return data;
    } catch (e) {
      console.warn(`[CMS] Failed to load ${file.path}:`, e);
      return file.fallback;
    }
  }

  try {
    const results = await Promise.all(files.map(f => fetchFile(f)));
    
    results.forEach((data, i) => {
      const key = files[i].key;
      if (data && data[key]) {
        mergedData[key] = data[key];
      }
    });

    cachedCMSData = mergedData;
    console.log('[CMS] Merged data ready:', mergedData);
    return mergedData;
  } catch (e) {
    console.error('[CMS] Load error:', e);
    return mergedData;
  }
}

/**
 * Clear CMS cache (useful for development)
 */
function clearCMSCache() {
  cachedCMSData = null;
  console.log('[CMS] Cache cleared');
}

/* =====================================================
   FAQ ACCORDION MANAGER (NEW!)
   ===================================================== */

/**
 * Setup FAQ accordion behavior
 * - Only one FAQ open at a time
 * - FAQs start closed (not open initially)
 * - Opening one closes all others
 * - Progressive reveal with "Show More" button
 */
class FAQAccordion {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    this.options = {
      initialShow: options.initialShow || 3, // Show first 3 FAQs initially
      expandedClass: 'open',
      hiddenDataAttr: 'data-hidden',
      ...options
    };
    
    if (!this.container) {
      console.warn('[FAQ] Container not found:', containerSelector);
      return;
    }

    this.setup();
    this.setupShowMore();
  }

  /**
   * Setup accordion behavior
   */
  setup() {
    const faqs = this.container.querySelectorAll('.faq');
    console.log('[FAQ] Setting up', faqs.length, 'FAQs');

    faqs.forEach((faq, index) => {
      // All FAQs start CLOSED
      faq.open = false;

      // Hide FAQs beyond initialShow
      if (index >= this.options.initialShow) {
        faq.setAttribute(this.options.hiddenDataAttr, 'true');
        faq.style.display = 'none';
      }

      // Add toggle listener
      const summary = faq.querySelector('.faq-summary');
      if (summary) {
        summary.addEventListener('click', (e) => {
          // Prevent default browser behavior
          e.preventDefault();

          // Toggle current FAQ
          const willOpen = !faq.open;
          
          // Close all other FAQs
          this.container.querySelectorAll('.faq').forEach(other => {
            if (other !== faq) {
              other.open = false;
              other.classList.remove(this.options.expandedClass);
            }
          });

          // Open/close current
          if (willOpen) {
            faq.open = true;
            faq.classList.add(this.options.expandedClass);
            console.log('[FAQ] Opened:', summary.textContent.slice(0, 50) + '...');
          } else {
            faq.open = false;
            faq.classList.remove(this.options.expandedClass);
            console.log('[FAQ] Closed:', summary.textContent.slice(0, 50) + '...');
          }
        });
      }
    });
  }

  /**
   * Setup "Show More FAQs" button
   */
  setupShowMore() {
    const faqs = this.container.querySelectorAll('.faq');
    const hiddenCount = Array.from(faqs).filter((f, i) => i >= this.options.initialShow).length;

    if (hiddenCount === 0) {
      console.log('[FAQ] All FAQs visible, no show more needed');
      return;
    }

    // Find or create show more button
    let moreBtn = this.container.nextElementSibling;
    if (!moreBtn || !moreBtn.classList.contains('faq-show-more')) {
      moreBtn = document.createElement('button');
      moreBtn.className = 'btn btn-outline faq-show-more';
      moreBtn.textContent = `📌 Show ${hiddenCount} More FAQs`;
      moreBtn.style.marginTop = '1.5rem';
      moreBtn.style.width = '100%';
      this.container.parentElement?.appendChild(moreBtn);
    }

    moreBtn.addEventListener('click', () => {
      const hidden = Array.from(faqs).filter(f => f.hasAttribute(this.options.hiddenDataAttr));
      
      hidden.forEach(faq => {
        faq.removeAttribute(this.options.hiddenDataAttr);
        faq.style.display = '';
        faq.style.animation = 'slideInUp 0.4s ease';
      });

      moreBtn.style.display = 'none';
      console.log('[FAQ] Revealed', hidden.length, 'more FAQs');
    });

    console.log('[FAQ] Show more button created');
  }

  /**
   * Open specific FAQ by index
   */
  open(index) {
    const faq = this.container.querySelectorAll('.faq')[index];
    if (faq) {
      // Close all others
      this.container.querySelectorAll('.faq').forEach(f => {
        f.open = false;
        f.classList.remove(this.options.expandedClass);
      });

      // Open this one
      faq.open = true;
      faq.classList.add(this.options.expandedClass);
      faq.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Close all FAQs
   */
  closeAll() {
    this.container.querySelectorAll('.faq').forEach(f => {
      f.open = false;
      f.classList.remove(this.options.expandedClass);
    });
  }
}

// Expose globally
window.FAQAccordion = FAQAccordion;

/* ---------- Partials loader with delegation ---------- */

/**
 * Inject header.html and footer.html into placeholders
 * Then let header.js and footer.js initialize their logic
 */
async function loadPartials() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');

  if (!headerPh && !footerPh) {
    console.warn('[PARTIALS] No placeholders found');
    return;
  }

  const fetchText = async (url) => {
    try {
      const u = new URL(url, document.baseURI);
      u.searchParams.set('v', Date.now().toString());
      console.log('[PARTIALS] Fetching:', u.toString());
      
      const res = await fetch(u.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const text = await res.text();
      console.log('[PARTIALS] Loaded successfully');
      return text;
    } catch (e) {
      console.error('[PARTIALS] Fetch error:', e);
      return null;
    }
  };

  try {
    if (headerPh) {
      const headerUrl = __getPartialUrl('header.html');
      const headerHtml = await fetchText(headerUrl);
      if (!headerHtml) {
        console.error('[PARTIALS] Header failed to load');
        headerPh.innerHTML = '<div class="error">Header failed to load</div>';
      } else {
        headerPh.innerHTML = headerHtml;
        console.log('[PARTIALS] Header injected');
      }
    }

    if (footerPh) {
      const footerUrl = __getPartialUrl('footer.html');
      const footerHtml = await fetchText(footerUrl);
      if (!footerHtml) {
        console.error('[PARTIALS] Footer failed to load');
        footerPh.innerHTML = '<div class="error">Footer failed to load</div>';
      } else {
        footerPh.innerHTML = footerHtml;
        console.log('[PARTIALS] Footer injected');
      }
    }

    // Prefix any root-relative links inside loaded partials
    prefixInternalLinks(headerPh || document);
    prefixInternalLinks(footerPh || document);

    // Initialize header and footer modules
    setTimeout(() => {
      if (window.Header && typeof window.Header.init === 'function') {
        console.log('[INIT] Header.init()');
        window.Header.init();
      } else {
        console.warn('[INIT] Header module not found');
      }

      if (window.Footer && typeof window.Footer.init === 'function') {
        console.log('[INIT] Footer.init()');
        window.Footer.init();
      } else {
        // Fallback: update year if footer not loaded
        const y = document.getElementById('year');
        if (y) {
          y.textContent = new Date().getFullYear();
          console.log('[INIT] Updated year to', new Date().getFullYear());
        }
      }
    }, 150);

  } catch (e) {
    console.error('[PARTIALS] Load error:', e);
    showToast('⚠️ Failed to load header/footer', 'error');
  }
}

/* ---------- Bootstrap ---------- */

document.addEventListener('DOMContentLoaded', () => {
  console.log('='.repeat(50));
  console.log('[COMMON] Initialization started');
  console.log('='.repeat(50));
  console.log({
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    __ROOT_BASE,
    __BASE_ABS,
    __BASE_PATH
  });
  console.log('='.repeat(50));

  loadPartials();

  // Auto-setup FAQs if container exists
  if (document.querySelector('.faq-list, .details-faq, [data-faq-container]')) {
    console.log('[FAQ] Auto-setting up FAQ accordions');
    
    // Details page FAQs
    if (document.querySelector('#details-faq-list')) {
      new FAQAccordion('#details-faq-list', { initialShow: 3 });
    }

    // Home page FAQs
    if (document.querySelector('#home-faq-list')) {
      new FAQAccordion('#home-faq-list', { initialShow: 3 });
    }

    // Contact page FAQs
    if (document.querySelector('#contact-faq-list')) {
      new FAQAccordion('#contact-faq-list', { initialShow: 3 });
    }
  }
});

/* ---------- Global keyboard handlers ---------- */

document.addEventListener('keydown', (e) => {
  // ESC: Close mobile menu
  if (e.key === 'Escape') {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('menuToggle');
    if (mobileMenu && !mobileMenu.hasAttribute('hidden')) {
      mobileMenu.setAttribute('hidden', '');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }
  }
});

/* ---------- Console helpers for development ---------- */

window.__debug = {
  paths: () => {
    console.table({
      __BASE_ABS,
      __ROOT_BASE,
      __BASE_PATH,
      origin: location.origin,
      pathname: location.pathname
    });
  },
  
  params: () => {
    console.table(getAllQueryParams());
  },
  
  clearCache: () => {
    clearCMSCache();
  },
  
  testUrl: (url) => {
    console.log('Testing URL:', url);
    console.log('Result:', __toAbs(url));
  },

  setupFAQ: (selector = '#details-faq-list', initialShow = 3) => {
    new FAQAccordion(selector, { initialShow });
    console.log('FAQ accordion setup for:', selector);
  },

  closeFAQs: (selector = '#details-faq-list') => {
    const container = document.querySelector(selector);
    if (container) {
      container.querySelectorAll('.faq').forEach(f => f.open = false);
    }
  },
  
  help: () => {
    console.log(`
  __debug.paths()                    - Show all detected paths
  __debug.params()                   - Show all query params
  __debug.clearCache()               - Clear CMS cache
  __debug.testUrl(url)               - Test URL conversion
  __debug.setupFAQ(selector, count)  - Setup FAQ accordion
  __debug.closeFAQs(selector)        - Close all FAQs
  __debug.help()                     - Show this help
    `);
  }
};

// Show debug helper on console
console.log('%c✨ Debug helpers available: type __debug.help()', 'color: #0ea5e9; font-weight: bold;');

/* ---------- Expose helpers globally ---------- */

window.showToast = showToast;
window.getQueryParam = getQueryParam;
window.getAllQueryParams = getAllQueryParams;
window.prefixInternalLinks = prefixInternalLinks;
window.fetchCMSData = fetchCMSData;
window.loadPartials = loadPartials;
window.clearCMSCache = clearCMSCache;
window.debounce = debounce;
window.throttle = throttle;
window.getHash = getHash;
window.setHash = setHash;
window.scrollToId = scrollToId;

console.log('[COMMON] All helpers exposed to window');
