// =====================================================
// COMMON.JS - Shared utilities and bootstrap (global)
// - Detect base URLs + helpers
// - Data/partials URL builders
// - Lightweight CMS data loader (merged)
// - Partial injection (header/footer)
// - Delegates header/footer logic to header.js/footer.js
// =====================================================

/* ---------- Base URL detection ---------- */

/** Detect site base URL from the script location */
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

/** Detect root base URL (GitHub Pages safe) */
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

/* ---------- URL helpers ---------- */

/** Convert relative/root paths to absolute URLs */
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

/** Get absolute path to partials */
function __getPartialUrl(filename) {
  return `${__ROOT_BASE}partials/${filename}`;
}

/** Get absolute path to /data JSON files */
function __getDataUrl(filename) {
  return `${__ROOT_BASE}data/${filename}`;
}

/* Expose globally */
window.__BASE_ABS = __BASE_ABS;
window.__ROOT_BASE = __ROOT_BASE;
window.__BASE_PATH = __BASE_PATH;
window.__toAbs = __toAbs;
window.__getPartialUrl = __getPartialUrl;
window.__getDataUrl = __getDataUrl;

/* ---------- Small utilities ---------- */

/** Show toast notification */
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
      fontWeight: '700'
    });
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.background = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fee2e2' : '#dbeafe';
  toast.style.color = type === 'success' ? '#065f46' : type === 'error' ? '#b91c1c' : '#0c4a6e';
  toast.hidden = false;

  setTimeout(() => { toast.hidden = true; }, duration);
}

/** Read query parameter */
function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

/** Prefix all root-relative anchors with the correct base */
function prefixInternalLinks(scope = document) {
  scope.querySelectorAll('a[href^="/"]').forEach(a => {
    const raw = a.getAttribute('href');
    a.setAttribute('href', __toAbs(raw));
  });
}

/* ---------- CMS data loader (merged view) ---------- */

let cachedCMSData = null;

/** Load modular JSON from /data and merge into one object */
async function fetchCMSData() {
  if (cachedCMSData) return cachedCMSData;

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
      const res = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
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
    const results = await Promise.all(files.map(f => fetchFile(f)));
    results.forEach((data, i) => {
      const key = files[i].key;
      if (data && data[key]) mergedData[key] = data[key];
    });

    cachedCMSData = mergedData;
    console.log('[CMS] merged data ready:', mergedData);
    return mergedData;
  } catch (e) {
    console.error('[CMS] load error:', e);
    return mergedData;
  }
}

/* ---------- Partials loader with delegation ---------- */

/**
 * Inject header.html and footer.html into placeholders,
 * then let header.js and footer.js initialize their logic.
 */
async function loadPartials() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');

  const fetchText = async (url) => {
    try {
      const u = new URL(url, document.baseURI);
      u.searchParams.set('v', Date.now().toString());
      const res = await fetch(u.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      console.error('[Partials] fetch error:', e);
      return null;
    }
  };

  try {
    if (headerPh) {
      const headerUrl = __getPartialUrl('header.html');
      const headerHtml = await fetchText(headerUrl);
      if (!headerHtml) throw new Error(`Header failed: ${headerUrl}`);
      headerPh.innerHTML = headerHtml;
    }

    if (footerPh) {
      const footerUrl = __getPartialUrl('footer.html');
      const footerHtml = await fetchText(footerUrl);
      if (!footerHtml) throw new Error(`Footer failed: ${footerUrl}`);
      footerPh.innerHTML = footerHtml;
    }

    // Prefix any root-relative links inside the loaded partials
    prefixInternalLinks(headerPh || document);
    prefixInternalLinks(footerPh || document);

    // Initialize header and footer modules (provided by header.js/footer.js)
    setTimeout(() => {
      if (window.Header && typeof window.Header.init === 'function') {
        window.Header.init();
      }
      if (window.Footer && typeof window.Footer.init === 'function') {
        window.Footer.init();
      } else {
        // Update dynamic footer year even if footer.js isn't present
        const y = document.getElementById('year');
        if (y) y.textContent = new Date().getFullYear();
      }
    }, 150);

  } catch (e) {
    console.error('[Partials] load error:', e);
    showToast('⚠️ Failed to load header/footer', 'error');
  }
}

/* ---------- Bootstrap ---------- */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Common] init');
  console.log('Path:', location.pathname);
  console.log('Root base:', __ROOT_BASE);
  console.log('Base abs:', __BASE_ABS);

  loadPartials();
});

/* ---------- Optional: global ESC to close mobile menu if header.js not yet bound ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.getElementById('menuToggle');
  if (mobileMenu && !mobileMenu.hasAttribute('hidden')) {
    mobileMenu.setAttribute('hidden', '');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
  }
});

/* ---------- Expose helpers globally ---------- */
window.showToast = showToast;
window.getQueryParam = getQueryParam;
window.prefixInternalLinks = prefixInternalLinks;
window.fetchCMSData = fetchCMSData;
window.loadPartials = loadPartials;
