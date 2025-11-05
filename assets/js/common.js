// =====================================================
// COMMON.JS - Shared utilities with CMS integration
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
    console.log('✅ CMS data loaded successfully', mergedData);
    return mergedData;
  } catch (e) {
    console.error('❌ Error loading CMS data:', e);
    return mergedData;
  }
}

// Export for global use
window.fetchCMSData = fetchCMSData;

/**
 * Show toast notification with animations
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

// Export for global use
window.showToast = showToast;

/**
 * Get URL parameter
 */
function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

// Export for global use
window.getQueryParam = getQueryParam;

/**
 * Prefix all root-relative links with correct base
 */
function prefixInternalLinks(scope = document) {
  scope.querySelectorAll('a[href^="/"]').forEach(a => {
    const raw = a.getAttribute('href');
    if (!raw.startsWith('//')) {
      a.setAttribute('href', __toAbs(raw));
    }
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
      console.log('📄 Loading header from:', headerUrl);
      const headerRes = await fetch(headerUrl);
      if (!headerRes.ok) throw new Error(`Header HTTP ${headerRes.status}`);
      const headerHtml = await headerRes.text();
      headerPh.innerHTML = headerHtml;
    }
    
    // Load footer
    if (footerPh) {
      const footerUrl = __getPartialUrl('footer.html');
      console.log('📄 Loading footer from:', footerUrl);
      const footerRes = await fetch(footerUrl);
      if (!footerRes.ok) throw new Error(`Footer HTTP ${footerRes.status}`);
      const footerHtml = await footerRes.text();
      footerPh.innerHTML = footerHtml;
    }

    // Initialize after loading
    setTimeout(() => {
      initializeHeader();
      updateContactButtons();
      prefixInternalLinks();
    }, 100);

  } catch (e) {
    console.error('❌ Error loading partials:', e);
    showToast('⚠️ Failed to load header/footer', 'error');
  }
}

/**
 * Initialize header functionality
 */
function initializeHeader() {
  console.log('🎯 Initializing header...');
  
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
      const isActive = searchBar.classList.toggle('active');
      searchToggle.setAttribute('aria-expanded', isActive);
      if (isActive && searchInput) {
        searchInput.focus();
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
      location.href = __toAbs(`/tours/?q=${encodeURIComponent(query)}`);
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
      setTimeout(closeMobileMenu, 200);
    });
  });

  // Header show/hide on scroll
  initHeaderScroll();
  
  console.log('✅ Header initialized');
}

/**
 * Header show/hide on scroll with smooth animation
 */
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
            // Scrolling down - hide header
            header.classList.add('header-hidden');
          } else {
            // Scrolling up - show header
            header.classList.remove('header-hidden');
            header.classList.add('header-scrolled');
          }
        } else {
          // Near top - always show, remove scrolled class
          header.classList.remove('header-hidden', 'header-scrolled');
        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Update contact buttons with CMS data
 */
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

  // Update all call buttons
  ['sticky-call', 'cta-call', 'header-call', 'mobile-call'].forEach(id => {
    const el = document.getElementById(id);
    if (el && phoneHref) {
      el.href = phoneHref;
      el.setAttribute('aria-label', `Call ${contact.phone}`);
    }
  });

  // Update all WhatsApp buttons
  ['sticky-wa', 'cta-wa', 'header-wa', 'mobile-wa'].forEach(id => {
    const el = document.getElementById(id);
    if (el && waHref) {
      el.href = waHref;
      el.setAttribute('aria-label', `WhatsApp ${contact.whatsapp}`);
    }
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
  
  console.log('✅ Contact buttons updated');
}

/**
 * Initialize back to top button
 */
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  // Show/hide on scroll with throttle
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

  // Smooth scroll to top
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Add ripple effect to buttons
 */
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

/**
 * Initialize page animations
 */
function initPageAnimations() {
  // Fade in elements on scroll
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

  // Observe elements with fade-up class
  document.querySelectorAll('.fade-up, section, .card, .feature, .tour').forEach(el => {
    observer.observe(el);
  });
}

/**
 * Initialize on page load
 */
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
      document.body.style.overflow = '';
    }
    
    // Close search bar
    const searchBar = document.getElementById('searchBar');
    const searchToggle = document.getElementById('searchToggle');
    if (searchBar?.classList.contains('active')) {
      searchBar.classList.remove('active');
      searchToggle?.setAttribute('aria-expanded', 'false');
    }
  }
});

// Prevent scroll restoration on navigation
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

console.log('✅ Common.js loaded');
