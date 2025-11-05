// =====================================================
// COMMON.JS - Dynamic CMS discovery from GitHub
// =====================================================

/* ---------------------------
   Base/path helpers
---------------------------- */
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

function detectRootBase() {
  const currentPath = location.pathname;
  if (currentPath.includes('/GuruNanakToursandTravels/')) {
    return `${location.origin}/GuruNanakToursandTravels/`;
  }
  return `${location.origin}/`;
}

const __BASE_ABS = detectBaseFromScript();
const __ROOT_BASE = detectRootBase();
const __BASE_PATH = __BASE_ABS.replace(/^https?:\/\/[^/]+/, '');

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

function __getPartialUrl(filename) {
  return `${__ROOT_BASE}partials/${filename}`;
}

function __getDataUrl(filename) {
  return `${__ROOT_BASE}data/${filename}`;
}

window.__BASE_ABS = __BASE_ABS;
window.__ROOT_BASE = __ROOT_BASE;
window.__BASE_PATH = __BASE_PATH;
window.__toAbs = __toAbs;
window.__getPartialUrl = __getPartialUrl;
window.__getDataUrl = __getDataUrl;

/* ---------------------------
   GitHub API config/helpers
---------------------------- */
function getGitHubRepo() {
  // Allow overriding via globals or meta tags
  const metaOwner = document.querySelector('meta[name="github-owner"]')?.content;
  const metaRepo = document.querySelector('meta[name="github-repo"]')?.content;
  const owner = window.GITHUB_OWNER || metaOwner || 'dearestwall';
  const repo = window.GITHUB_REPO || metaRepo || 'GuruNanakToursandTravels';
  return { owner, repo };
}

function getGitHubToken() {
  // Optional: provide a token to avoid rate limits (e.g., set in env and injected)
  return window.GITHUB_TOKEN || document.querySelector('meta[name="github-token"]')?.content || '';
}

async function ghListDir(path, abortMs = 6000) {
  const { owner, repo } = getGitHubRepo();
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path.replace(/^\/+/, '')}`;
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), abortMs);

  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  const token = getGitHubToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
    clearTimeout(to);
    if (res.status === 403) {
      console.warn(`⚠️ GitHub rate limited for ${path}`);
      return { ok: false, items: [] };
    }
    if (!res.ok) {
      console.warn(`⚠️ GitHub list error ${res.status} for ${path}`);
      return { ok: false, items: [] };
    }
    const items = await res.json();
    if (!Array.isArray(items)) return { ok: true, items: [] };
    return { ok: true, items };
  } catch (e) {
    clearTimeout(to);
    console.warn(`⚠️ GitHub list failed for ${path}: ${e.message}`);
    return { ok: false, items: [] };
  }
}

async function ghFetchDownload(download_url, abortMs = 6000) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), abortMs);
  try {
    const res = await fetch(download_url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(to);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(to);
    return null;
  }
}

/* ---------------------------
   CMS discovery/load
---------------------------- */
let cachedCMSData = null;
let discoveredFolders = {};

// Load all JSONs immediately inside a folder
async function discoverJsonFilesFlat(path) {
  const out = [];
  const { ok, items } = await ghListDir(path);
  if (!ok) return out;
  const jsonFiles = items.filter(i => i.type === 'file' && /\.json$/i.test(i.name));
  // Cap concurrency to avoid bursts
  const concurrency = 5;
  for (let i = 0; i < jsonFiles.length; i += concurrency) {
    const batch = jsonFiles.slice(i, i + concurrency);
    const loaded = await Promise.all(batch.map(f => ghFetchDownload(f.download_url)));
    loaded.forEach(d => { if (d) out.push(d); });
  }
  return out;
}

// Load root data: files directly under data/, and subfolders (e.g., tours, offerings, partners, testimonials, etc.)
async function discoverDataRoot() {
  const data = {
    rootFiles: {},   // { filename(without .json): json }
    folders: {}      // { folderName: [json, ...] }
  };

  const { ok, items } = await ghListDir('data');
  if (!ok) return data;

  const files = items.filter(i => i.type === 'file' && /\.json$/i.test(i.name));
  const dirs = items.filter(i => i.type === 'dir');

  // Root files
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const json = await ghFetchDownload(f.download_url);
    if (json) {
      const key = f.name.replace(/\.json$/i, '');
      data.rootFiles[key] = json;
    }
  }

  // Folder files (one level)
  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    const arr = await discoverJsonFilesFlat(`data/${dir.name}`);
    data.folders[dir.name] = arr;
  }

  return data;
}

// Load content/blogs -> array of blog posts
async function discoverContentBlogs() {
  const { ok } = await ghListDir('content');
  if (!ok) return [];
  return await discoverJsonFilesFlat('content/blogs');
}

// Load pages/*.json -> map keyed by filename, plus gallery list
async function discoverPages() {
  const pages = {};
  const gallery = [];

  const { ok, items } = await ghListDir('pages');
  if (!ok) return { pages, gallery };

  const files = items.filter(i => i.type === 'file' && /\.json$/i.test(i.name));
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const json = await ghFetchDownload(f.download_url);
    if (json) {
      const key = f.name.replace(/\.json$/i, '');
      pages[key] = json;
      if (/^gallery/i.test(key)) gallery.push(json);
    }
  }
  return { pages, gallery };
}

/**
 * Load CMS data with dynamic discovery
 * - data root files
 * - data subfolders (tours, offerings, partners, testimonials, etc.)
 * - content/blogs
 * - pages (about, booking, contact, gallery*.json)
 */
async function fetchCMSData() {
  if (cachedCMSData) {
    console.log('✅ Using cached CMS data');
    return cachedCMSData;
  }

  console.log('📦 Loading CMS data with dynamic discovery...');

  // Base structure expected by UI
  const mergedData = {
    // Homepage expectations
    hero_slides: [],
    offerings: [],
    featured_tours: [],
    stats: {},
    testimonials: [],
    partners: [],
    faqs: [],
    contact: {},
    // Extra content
    blogs: [],
    pages: {},
    gallery: [],
    // Keep whole data tree for other pages if needed
    __raw: {}
  };

  try {
    // Parallel discovery
    const [dataTree, blogsArr, pagesTree] = await Promise.all([
      discoverDataRoot(),
      discoverContentBlogs(),
      discoverPages()
    ]);

    // Root "data/*.json" mapping into known keys when recognizable
    // If files contain same keys inside wrapper, unwrap gracefully.
    const unwrap = (obj, key) => (obj && obj[key]) ? obj[key] : obj;

    // stats.json => stats
    if (dataTree.rootFiles.stats) mergedData.stats = unwrap(dataTree.rootFiles.stats, 'stats') || {};
    // contact.json => contact (fallback to pages.contact if present below)
    if (dataTree.rootFiles.contact) mergedData.contact = unwrap(dataTree.rootFiles.contact, 'contact') || mergedData.contact;
    // faqs.json => faqs
    if (dataTree.rootFiles.faqs) mergedData.faqs = unwrap(dataTree.rootFiles.faqs, 'faqs') || [];
    // hero.json => hero_slides
    if (dataTree.rootFiles.hero) {
      const hero = unwrap(dataTree.rootFiles.hero, 'hero') || {};
      mergedData.hero_slides = hero.hero_slides || hero.slides || [];
    }

    // Subfolders
    // tours -> featured_tours
    if (Array.isArray(dataTree.folders.tours)) mergedData.featured_tours = dataTree.folders.tours;
    // offerings -> offerings
    if (Array.isArray(dataTree.folders.offerings)) mergedData.offerings = dataTree.folders.offerings;
    // partners -> partners
    if (Array.isArray(dataTree.folders.partners)) mergedData.partners = dataTree.folders.partners;
    // testimonials -> testimonials
    if (Array.isArray(dataTree.folders.testimonials)) mergedData.testimonials = dataTree.folders.testimonials;

    // blogs
    mergedData.blogs = blogsArr || [];

    // pages
    mergedData.pages = pagesTree.pages || {};
    mergedData.gallery = pagesTree.gallery || [];

    // If pages provide contact/about overrides, respect them
    if (mergedData.pages.contact && typeof mergedData.pages.contact === 'object') {
      mergedData.contact = { ...mergedData.contact, ...unwrap(mergedData.pages.contact, 'contact') };
    }
    if (mergedData.pages.faqs && Array.isArray(unwrap(mergedData.pages.faqs, 'faqs'))) {
      mergedData.faqs = unwrap(mergedData.pages.faqs, 'faqs');
    }
    // Allow pages.hero to override hero_slides if present
    if (mergedData.pages.hero) {
      const ph = unwrap(mergedData.pages.hero, 'hero') || {};
      if (Array.isArray(ph.hero_slides) || Array.isArray(ph.slides)) {
        mergedData.hero_slides = ph.hero_slides || ph.slides || mergedData.hero_slides;
      }
    }

    // Keep raw tree for advanced pages
    mergedData.__raw.data = dataTree;
    mergedData.__raw.content = { blogs: blogsArr };
    mergedData.__raw.pages = pagesTree;

    // Cache and notify
    cachedCMSData = mergedData;
    console.log('✅ CMS data loaded successfully', mergedData);
    window.dispatchEvent(new CustomEvent('cms-ready', { detail: mergedData }));
    return mergedData;

  } catch (e) {
    console.error('❌ Error loading CMS data:', e);
    return mergedData;
  }
}

window.fetchCMSData = fetchCMSData;
window.cachedCMSData = cachedCMSData;
window.discoveredFolders = discoveredFolders;

/* ---------------------------
   UI utilities
---------------------------- */
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
  toast.className = 'toast';
  
  if (type === 'success') {
    toast.classList.add('toast-success');
  } else if (type === 'error') {
    toast.classList.add('toast-error');
  } else {
    toast.classList.add('toast-info');
  }
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
window.showToast = showToast;

function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}
window.getQueryParam = getQueryParam;

function prefixInternalLinks(scope = document) {
  scope.querySelectorAll('a[href^="/"]').forEach(a => {
    const raw = a.getAttribute('href');
    if (!raw.startsWith('//')) {
      a.setAttribute('href', __toAbs(raw));
    }
  });
}

/* ---------------------------
   Partials (header/footer)
---------------------------- */
async function loadPartials() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');

  try {
    if (headerPh) {
      const headerUrl = __getPartialUrl('header.html');
      const headerRes = await fetch(headerUrl);
      if (headerRes.ok) {
        headerPh.innerHTML = await headerRes.text();
        console.log('✅ Header loaded');
      }
    }
    
    if (footerPh) {
      const footerUrl = __getPartialUrl('footer.html');
      const footerRes = await fetch(footerUrl);
      if (footerRes.ok) {
        footerPh.innerHTML = await footerRes.text();
        console.log('✅ Footer loaded');
      }
    }

    setTimeout(() => {
      initializeHeader();
      updateContactButtons();
      prefixInternalLinks();
    }, 100);

  } catch (e) {
    console.error('Error loading partials:', e);
  }
}

/* ---------------------------
   Header behavior
---------------------------- */
function initializeHeader() {
  console.log('🎯 Initializing header...');
  
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('header-search-input') || document.getElementById('mobile-search-input');

  if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
      const isActive = searchBar.classList.toggle('active');
      searchToggle.setAttribute('aria-expanded', isActive);
      if (isActive && searchInput) {
        searchInput.focus();
      }
    });
  }

  [document.getElementById('headerSearchForm'), document.getElementById('mobileSearchForm')].forEach(form => {
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="search"]');
        const query = input?.value.trim();
        if (query) {
          location.href = __toAbs(`tours/?q=${encodeURIComponent(query)}`);
        }
      });
    }
  });

  const suggestions = document.querySelectorAll('.suggestion-item');
  suggestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.search;
      location.href = __toAbs(`tours/?q=${encodeURIComponent(query)}`);
    });
  });

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

  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(closeMobileMenu, 200);
    });
  });

  initHeaderScroll();
  
  console.log('✅ Header initialized');
}

function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  let lastScrollTop = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > 150) {
          if (currentScroll > lastScrollTop && currentScroll > 200) {
            header.classList.add('header-hidden');
          } else {
            header.classList.remove('header-hidden');
            header.classList.add('header-scrolled');
          }
        } else {
          header.classList.remove('header-hidden', 'header-scrolled');
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ---------------------------
   Contact buttons
---------------------------- */
async function updateContactButtons() {
  console.log('📞 Updating contact buttons...');
  
  const data = await fetchCMSData();
  if (!data || !data.contact) {
    console.warn('⚠️ No contact data available');
    return;
  }

  const contact = data.contact;
  const phoneClean = (contact.phone || '').replace(/\s+/g, '').replace(/^0+/, '');
  const waClean = (contact.whatsapp || '').replace(/\s+/g, '').replace(/^0+/, '');

  const phoneHref = phoneClean ? `tel:${phoneClean.startsWith('+') ? phoneClean : '+' + phoneClean}` : null;
  const waHref = waClean ? `https://wa.me/${waClean.replace(/^\+/, '')}?text=Hello%20GNTT` : null;

  ['sticky-call', 'cta-call', 'header-call', 'mobile-call'].forEach(id => {
    const el = document.getElementById(id);
    if (el && phoneHref) {
      el.href = phoneHref;
      el.setAttribute('aria-label', `Call ${contact.phone}`);
    }
  });

  ['sticky-wa', 'cta-wa', 'header-wa', 'mobile-wa'].forEach(id => {
    const el = document.getElementById(id);
    if (el && waHref) {
      el.href = waHref;
      el.setAttribute('aria-label', `WhatsApp ${contact.whatsapp}`);
    }
  });

  ['sticky-book', 'cta-book', 'header-book', 'mobile-book'].forEach(id => {
    const el = document.getElementById(id);
    if (el && contact.booking_link) {
      el.href = __toAbs(contact.booking_link);
    }
  });

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
  
  console.log('✅ Contact buttons updated');
}

/* ---------------------------
   Back to top & effects
---------------------------- */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.pageYOffset > 300) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

function addRippleEffect() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn, .action-btn, .btn-icon');
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    btn.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
}

function initPageAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-up, section, .card, .feature, .tour').forEach(el => {
    observer.observe(el);
  });
}

/* ---------------------------
   Init
---------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Common.js initializing...');
  console.log('📍 Current path:', location.pathname);
  console.log('🏠 Root base:', __ROOT_BASE);
  console.log('🔗 Base abs:', __BASE_ABS);
  
  loadPartials();
  initBackToTop();
  addRippleEffect();
  
  setTimeout(() => {
    initPageAnimations();
  }, 500);
});

// Mobile menu close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('menuToggle');
    if (mobileMenu?.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      menuToggle?.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      menuToggle?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    
    const searchBar = document.getElementById('searchBar');
    const searchToggle = document.getElementById('searchToggle');
    if (searchBar?.classList.contains('active')) {
      searchBar.classList.remove('active');
      searchToggle?.setAttribute('aria-expanded', 'false');
    }
  }
});

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

console.log('✅ Common.js loaded');
