// assets/js/header.js - PRODUCTION READY
// Advanced Search • Proper URL Linking • Smart Error Handling
(function () {
  'use strict';

  const SEL = {
    banner: '#notificationBanner',
    bannerContent: '#bannerContent',
    header: '#siteHeader',
    searchToggle: '#searchToggle',
    mobileSearchSection: '#mobileSearchSection',
    menuToggle: '#menuToggle',
    menuClose: '#mobileMenuClose',
    mobileMenu: '#mobileMenu',
    menuOverlay: '#menuOverlay',
    desktopInput: '#desktop-search-input',
    desktopDrop: '#desktopSearchResults',
    mobileInput: '#mobile-search-input',
    mobileDrop: '#mobileSearchResults'
  };

  const PATH = {
    notifications: () => __getDataUrl('notifications.json'),
    contact: () => __getDataUrl('contact.json'),
    tours: () => __getDataUrl('tours.json'),
    offerings: () => __getDataUrl('offerings.json'),
    faqs: () => __getDataUrl('faqs.json'),
    testimonials: () => __getDataUrl('testimonials.json'),
    partners: () => __getDataUrl('partners.json')
  };

  const CONFIG = { 
    debounceMs: 250, 
    minChars: 2, 
    maxResults: 8, 
    maxNearest: 3,
    scrollDelay: 300,
    scrollDuration: 800
  };

  const cache = { index: null, lastSearch: null };

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const debounce = (fn, ms) => { 
    let t; 
    return (...a) => { 
      clearTimeout(t); 
      t = setTimeout(() => fn(...a), ms); 
    }; 
  };
  const escapeHtml = (str = '') => { 
    const d = document.createElement('div'); 
    d.textContent = str; 
    return d.innerHTML; 
  };
  
  // URL slug generator - CLEAN AND READABLE
  const slugify = (str) => {
    return str.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Duration formatter - converts various formats to "7d6n"
  const formatDuration = (duration) => {
    if (!duration) return '';
    
    if (/^\d+d\d+n$/i.test(duration)) {
      return duration.toLowerCase();
    }

    const match = duration.match(/(\d+)\s*days?\s*\/?\s*(\d+)\s*nights?/i);
    if (match) {
      return `${match[1]}d${match[2]}n`;
    }

    const match2 = duration.match(/(\d+)\s*d[a-z]*\s*(\d+)\s*n[a-z]*/i);
    if (match2) {
      return `${match2[1]}d${match2[2]}n`;
    }

    return '';
  };

  // Generate tour ID - matches details.js expectation
  const generateTourId = (tour) => {
    // Use CMS id if available (IMPORTANT!)
    if (tour.id && tour.id !== 'tour') {
      return tour.id;
    }
    
    // Generate from name + duration if id is missing
    const nameSlug = slugify(tour.name);
    const durationFormatted = formatDuration(tour.duration);
    
    if (durationFormatted) {
      return `${nameSlug}-${durationFormatted}`;
    }
    return nameSlug;
  };

  // Generate service ID
  const generateServiceId = (service) => {
    // Use CMS id if available (IMPORTANT!)
    if (service.id && service.id !== 'offering') {
      return service.id;
    }
    return slugify(service.title);
  };

  // Smooth scroll to element
  const smoothScroll = (target, offset = 106) => {
    const element = typeof target === 'string' ? qs(target) : target;
    if (!element) return;
    
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let start = null;

    const easeInOutQuad = (t) => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / CONFIG.scrollDuration, 1);

      window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));

      if (elapsed < CONFIG.scrollDuration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  async function getJSON(url) {
    try {
      const u = new URL(url, document.baseURI);
      u.searchParams.set('v', Date.now());
      const r = await fetch(u.toString(), { cache: 'no-store' });
      return r.ok ? await r.json() : null;
    } catch (e) {
      console.error('Fetch error:', e);
      return null;
    }
  }

  function enforceZIndexHierarchy() {
    const banner = qs('.notification-banner');
    const header = qs('.site-header');
    const menu = qs('.mobile-menu');
    
    if (banner) banner.style.removeProperty('z-index');
    if (header) header.style.removeProperty('z-index');
    if (menu) menu.style.removeProperty('z-index');

    const mainElements = qsa('main, #main, #content, .main-content, .page-content, .content-wrapper, section:first-of-type, article:first-of-type, .hero, .hero-section, .home-hero, [role="main"]');
    mainElements.forEach(el => {
      el.style.marginTop = '106px';
    });
  }

  // Banner
  async function renderBanner() {
    const wrap = qs(SEL.banner), content = qs(SEL.bannerContent);
    if (!wrap || !content) return;
    const data = await getJSON(PATH.notifications());
    const items = Array.isArray(data?.messages) ? data.messages.filter(m => m && m.active !== false) : [];
    if (!items.length) return;
    const html = items.map(m => {
      const t = m.text || '';
      return m.link
        ? `<a href="${__toAbs(m.link)}" class="banner-text" style="color:inherit;text-decoration:none;">${escapeHtml(t)}</a>`
        : `<span class="banner-text">${escapeHtml(t)}</span>`;
    }).join(' • ');
    content.innerHTML = html + ' • ' + html;
  }

  // Build search index - uses CMS IDs directly
  async function buildSearchIndex() {
    if (cache.index) return cache.index;

    const [tours, offerings, faqs, testimonials, partners] = await Promise.all([
      getJSON(PATH.tours()), 
      getJSON(PATH.offerings()), 
      getJSON(PATH.faqs()), 
      getJSON(PATH.testimonials()), 
      getJSON(PATH.partners())
    ]);

    const docs = [];

    // MAIN PAGES
    docs.push({ 
      title: 'Home', 
      type: 'page', 
      url: __toAbs('/index.html'), 
      excerpt: 'Guru Nanak Tour & Travels - Your journey, our responsibility',
      icon: '🏠',
      keywords: ['home', 'main', 'start', 'welcome']
    });

    docs.push({ 
      title: 'About Us', 
      type: 'page', 
      url: __toAbs('/about/index.html'), 
      excerpt: 'Learn about our story, mission, and team',
      icon: 'ℹ️',
      keywords: ['about', 'story', 'mission', 'team']
    });

    docs.push({ 
      title: 'Our Services', 
      type: 'page', 
      url: __toAbs('/services/index.html'), 
      excerpt: 'Flight booking, hotels, visa assistance & tour packages',
      icon: '⚙️',
      keywords: ['services', 'booking', 'flight', 'hotel', 'visa']
    });

    docs.push({ 
      title: 'Tour Packages', 
      type: 'page', 
      url: __toAbs('/tours/index.html'), 
      excerpt: 'Browse our curated tour packages and destinations',
      icon: '🗺️',
      keywords: ['tours', 'packages', 'destinations', 'travel']
    });

    docs.push({ 
      title: 'Gallery', 
      type: 'page', 
      url: __toAbs('/gallery/index.html'), 
      excerpt: 'Memories & moments from our past tours',
      icon: '📷',
      keywords: ['gallery', 'photos', 'memories', 'pictures']
    });

    docs.push({ 
      title: 'Book Now', 
      type: 'page', 
      url: __toAbs('/booking/index.html'), 
      excerpt: 'Reserve your dream trip with us today',
      icon: '📝',
      keywords: ['booking', 'reserve', 'book', 'reservation']
    });

    docs.push({ 
      title: 'Contact Us', 
      type: 'page', 
      url: __toAbs('/contact/index.html'), 
      excerpt: 'Get in touch with our team for any queries',
      icon: '📞',
      keywords: ['contact', 'email', 'phone', 'support', 'help']
    });

    // INDIVIDUAL TOUR PACKAGES - Use CMS id directly!
    const tlist = tours?.featured_tours || [];
    tlist.forEach(t => {
      const tourId = generateTourId(t);
      
      docs.push({
        title: t.name,
        type: 'tour',
        url: __toAbs(`/details/?id=${tourId}&type=tour`),
        excerpt: t.summary || t.description || '',
        icon: '🗺️',
        keywords: [...(t.highlights || []), 'tour', t.name.toLowerCase(), t.destination?.toLowerCase() || ''],
        duration: t.duration || '2d1n',
        price: t.price || null,
        destination: t.destination || '',
        cmsId: t.id  // Store CMS ID for verification
      });
    });

    // SERVICES/OFFERINGS - Use CMS id directly!
    (offerings?.offerings || []).forEach(o => {
      const serviceId = generateServiceId(o);
      docs.push({
        title: o.title,
        type: 'service',
        url: __toAbs(`/details/?id=${serviceId}&type=offering`),
        excerpt: o.description || '',
        icon: o.icon || '⚙️',
        keywords: [...(o.features || []), o.title.toLowerCase(), 'service'],
        cmsId: o.id
      });
    });

    // FAQs with anchor links
    (faqs?.faqs || []).forEach((f, idx) => {
      const faqSlug = slugify(f.q);
      docs.push({
        title: f.q,
        type: 'faq',
        url: __toAbs(`/contact/index.html#faq-${idx}`),
        excerpt: f.a,
        icon: '❓',
        keywords: ['faq', 'question', 'answer', f.q.toLowerCase()],
        anchor: `faq-${idx}`
      });
    });

    // TESTIMONIALS
    (testimonials?.testimonials || []).forEach((r, idx) => docs.push({
      title: r.name || 'Guest Review',
      type: 'review',
      url: __toAbs(`/index.html#reviews`),
      excerpt: r.comment || '',
      icon: '⭐',
      keywords: ['review', 'testimonial', 'feedback', r.name ? r.name.toLowerCase() : ''],
      anchor: 'reviews'
    }));

    // PARTNERS
    (partners?.partners || []).forEach((p, idx) => docs.push({
      title: p.name || 'Partner',
      type: 'partner',
      url: p.link || __toAbs(`/index.html#partners`),
      excerpt: p.description || '',
      icon: '🤝',
      keywords: ['partner', 'affiliate', p.name ? p.name.toLowerCase() : ''],
      anchor: 'partners'
    }));

    cache.index = docs.map(d => ({
      ...d,
      searchText: [
        d.title || '', 
        d.excerpt || '', 
        (d.keywords || []).join(' ')
      ].join(' ').toLowerCase()
    }));

    return cache.index;
  }

  // Levenshtein distance for fuzzy matching
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] 
          ? dp[i - 1][j - 1] 
          : Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
    return dp[m][n];
  }

  // Advanced search with fuzzy matching
  async function search(query) {
    if (!query || query.length < CONFIG.minChars) return { exact: [], nearest: [] };
    const idx = await buildSearchIndex();
    const q = query.toLowerCase();

    const scored = idx.map(it => {
      let s = 0;
      const title = (it.title || '').toLowerCase();
      const excerpt = (it.excerpt || '').toLowerCase();
      const keywords = ((it.keywords || []).join(' ')).toLowerCase();
      const destination = (it.destination || '').toLowerCase();
      
      if (title.includes(q)) s += 100;
      if (destination.includes(q)) s += 90;
      if (keywords.includes(q)) s += 80;
      if (excerpt.includes(q)) s += 40;
      if (title.startsWith(q)) s += 50;
      
      const dist = levenshtein(q, title.slice(0, q.length));
      if (dist <= 2) s += (30 - dist * 10);
      
      if (it.type === 'tour') s += 15;
      if (it.type === 'page') s += 10;
      if (it.type === 'service') s += 8;
      
      return { ...it, _score: s };
    });

    const exact = scored.filter(x => x._score >= 30).sort((a, b) => b._score - a._score).slice(0, CONFIG.maxResults);
    
    if (!exact.length) {
      const nearest = idx.map(it => {
        const title = (it.title || '').toLowerCase();
        const dist = levenshtein(q, title);
        return { ...it, _dist: dist };
      }).sort((a, b) => a._dist - b._dist).slice(0, CONFIG.maxNearest);
      return { exact: [], nearest };
    }

    return { exact, nearest: [] };
  }

  function hi(text, q) {
    if (!q) return escapeHtml(text);
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return escapeHtml(text).replace(re, '<span class="search-result-highlight">$1</span>');
  }

  // Render search results - NO AUTO REDIRECT!
  function renderResults(results, drop, q) {
    if (!drop) return;
    const content = drop.querySelector('.search-results-content');
    if (!content) return;

    const { exact, nearest } = results;

    // NO RESULTS - Show friendly error message
    if (!exact.length && !nearest.length) {
      content.innerHTML = `
        <div class="search-no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-title">No Results Found</div>
          <div class="no-results-message">
            We couldn't find anything for "<strong>${escapeHtml(q)}</strong>"
          </div>
          <div class="no-results-suggestions">
            <p>💡 Try:</p>
            <ul>
              <li>Checking your spelling</li>
              <li>Using different keywords</li>
              <li>Browsing our destinations</li>
            </ul>
            <p class="no-results-contact">
              Can't find what you're looking for? 
              <a href="${__toAbs('/contact/index.html')}" class="link-primary">Contact us</a>
            </p>
          </div>
        </div>
      `;
      drop.classList.add('show');
      drop.removeAttribute('hidden');
      return;
    }

    let html = '';

    if (exact.length) {
      html = exact.map((it, idx) => {
        const ex = (it.excerpt || '').slice(0, 140);
        const priceTag = it.price ? `<span class="search-result-price">₹${it.price.toLocaleString('en-IN')}</span>` : '';
        const durationTag = it.duration ? `<span class="search-result-duration">${it.duration}</span>` : '';
        const destinationTag = it.destination ? `<span class="search-result-destination">${it.destination}</span>` : '';
        
        return `
          <a href="${it.url || '#'}" class="search-result-item" role="option" tabindex="${idx}">
            <span class="search-result-icon">${it.icon || '📄'}</span>
            <div class="search-result-details">
              <div class="search-result-type">${it.type.toUpperCase()}</div>
              <div class="search-result-title">${hi(it.title || '', q)}</div>
              ${destinationTag}${durationTag}${priceTag}
              ${ex ? `<div class="search-result-excerpt">${hi(ex, q)}...</div>` : ''}
            </div>
          </a>
        `;
      }).join('');
    }

    if (!exact.length && nearest.length) {
      html = `<div class="search-nearest-title">Did you mean...</div>` + 
        nearest.map((it, idx) => {
          const ex = (it.excerpt || '').slice(0, 140);
          return `
            <a href="${it.url || '#'}" class="search-result-item" role="option" tabindex="${idx}">
              <span class="search-result-icon">${it.icon || '📄'}</span>
              <div class="search-result-details">
                <div class="search-result-type">${it.type.toUpperCase()}</div>
                <div class="search-result-title">${escapeHtml(it.title || '')}</div>
                ${ex ? `<div class="search-result-excerpt">${escapeHtml(ex)}...</div>` : ''}
              </div>
            </a>
          `;
        }).join('');
    }

    content.innerHTML = html;
    drop.classList.add('show');
    drop.removeAttribute('hidden');

    // Click handlers with smooth scrolling
    qsa('.search-result-item', drop).forEach(item => {
      on(item, 'click', (e) => {
        const url = item.getAttribute('href');
        if (!url || url === '#') return;

        e.preventDefault();

        if (url.includes('#')) {
          const [page, anchor] = url.split('#');
          
          if (page === location.pathname || page === '' || page === 'index.html') {
            setTimeout(() => {
              const element = qs(`#${anchor}`);
              if (element) {
                smoothScroll(element);
              }
            }, CONFIG.scrollDelay);
          } else {
            window.location.href = url;
          }
        } else {
          window.location.href = url;
        }
      });

      on(item, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });
    });
  }

  function clearResults(drop) {
    if (!drop) return;
    const c = drop.querySelector('.search-results-content');
    if (c) c.innerHTML = '';
    drop.classList.remove('show');
    drop.setAttribute('hidden', '');
  }

  // Search UI
  function bindSearchUI() {
    const dIn = qs(SEL.desktopInput), dDrop = qs(SEL.desktopDrop);
    const mIn = qs(SEL.mobileInput), mDrop = qs(SEL.mobileDrop);

    const handler = debounce(async (input, drop) => {
      const q = input.value.trim();
      if (q.length < CONFIG.minChars) { clearResults(drop); return; }
      cache.lastSearch = q;
      const results = await search(q);
      renderResults(results, drop, q);
    }, CONFIG.debounceMs);

    if (dIn && dDrop) {
      on(dIn, 'input', () => handler(dIn, dDrop));
      on(dIn, 'focus', () => handler(dIn, dDrop));
      on(dIn, 'keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const first = dDrop.querySelector('.search-result-item');
          if (first) first.focus();
        }
        if (e.key === 'Escape') {
          clearResults(dDrop);
          dIn.blur();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const first = dDrop.querySelector('.search-result-item');
          if (first) first.click();
        }
      });
    }

    if (mIn && mDrop) {
      on(mIn, 'input', () => handler(mIn, mDrop));
      on(mIn, 'focus', () => handler(mIn, mDrop));
      on(mIn, 'keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const first = mDrop.querySelector('.search-result-item');
          if (first) first.focus();
        }
        if (e.key === 'Escape') {
          clearResults(mDrop);
          mIn.blur();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const first = mDrop.querySelector('.search-result-item');
          if (first) first.click();
        }
      });
    }

    // Close on click outside
    on(document, 'click', (e) => {
      if (dDrop && !dDrop.contains(e.target) && dIn && !dIn.contains(e.target)) {
        clearResults(dDrop);
      }
      if (mDrop && !mDrop.contains(e.target) && mIn && !mIn.contains(e.target)) {
        clearResults(mDrop);
      }
    });

    // Suggestion buttons
    qsa('.suggestion-item').forEach(b => {
      on(b, 'click', async () => {
        const q = b.dataset.search || b.textContent.trim();
        if (dIn) {
          dIn.value = q;
          dIn.focus();
          const r = await search(q);
          renderResults(r, dDrop, q);
        } else if (mIn) {
          mIn.value = q;
          mIn.focus();
          const r = await search(q);
          renderResults(r, mDrop, q);
        }
      });
    });
  }

  // Header scroll behavior
  function bindScroll() {
    const header = qs(SEL.header), banner = qs(SEL.banner);
    if (!header) return;
    
    let last = window.pageYOffset, ticking = false;
    
    const update = () => {
      const y = window.pageYOffset;
      
      if (y > 100) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      
      if (y > last && y > 160) header.classList.add('hide');
      else header.classList.remove('hide');
      
      if (banner) {
        if (y > 80) {
          banner.classList.add('hide');
          document.body.classList.add('banner-hidden');
        } else {
          banner.classList.remove('hide');
          document.body.classList.remove('banner-hidden');
        }
      }
      
      last = y;
      ticking = false;
    };
    
    on(window, 'scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // Mobile search toggle
  function bindSearchToggle() {
    const toggle = qs(SEL.searchToggle), section = qs(SEL.mobileSearchSection);
    if (!toggle || !section) return;
    
    on(toggle, 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = section.hasAttribute('hidden');
      if (isHidden) {
        section.removeAttribute('hidden');
        section.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        setTimeout(() => qs(SEL.mobileInput)?.focus(), 100);
      } else {
        section.setAttribute('hidden', '');
        section.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    
    on(document, 'click', (e) => {
      if (!section.hasAttribute('hidden') && !section.contains(e.target) && !toggle.contains(e.target)) {
        section.setAttribute('hidden', '');
        section.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Mobile menu
  function bindMobileMenu() {
    const btn = qs(SEL.menuToggle), menu = qs(SEL.mobileMenu), 
          ovl = qs(SEL.menuOverlay), cls = qs(SEL.menuClose);
    if (!btn || !menu) return;
    
    const open = () => {
      menu.removeAttribute('hidden');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };
    
    const close = () => {
      menu.setAttribute('hidden', '');
      menu.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    
    on(btn, 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (menu.hasAttribute('hidden')) open();
      else close();
    });
    
    on(ovl, 'click', (e) => {
      e.stopPropagation();
      close();
    });
    
    on(cls, 'click', (e) => {
      e.stopPropagation();
      close();
    });
    
    qsa('.mobile-menu-link', menu).forEach(a => {
      on(a, 'click', close);
    });
    
    on(document, 'keydown', e => {
      if (e.key === 'Escape' && !menu.hasAttribute('hidden')) close();
    });
  }

  // Active nav highlighting
  function activateNav() {
    const path = location.pathname;
    
    qsa('.nav-item, .mobile-menu-link').forEach(a => {
      const href = (a.getAttribute('href') || '').replace(/index\.html$/, '');
      const currentPath = path.replace(/index\.html$/, '');
      
      if (href === currentPath || (href === '/' && (currentPath === '/' || currentPath === '/index.html'))) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  }

  // Update contact buttons
  async function updateContact() {
    const c = await getJSON(PATH.contact());
    if (!c || !c.contact) return;
    const contact = c.contact;
    const phone = (contact.phone || '').replace(/\s+/g, '').replace(/^0+/, '');
    const wa = (contact.whatsapp || '').replace(/\s+/g, '').replace(/^0+/, '');
    const tel = phone ? `tel:${phone.startsWith('+') ? phone : '+' + phone}` : null;
    const waLink = wa ? `https://wa.me/${wa.replace('+', '')}?text=Hello%20GNTT` : null;
    
    ['header-call', 'mobile-call'].forEach(id => {
      const el = document.getElementById(id);
      if (el && tel) el.href = tel;
    });
    
    ['header-wa', 'mobile-wa'].forEach(id => {
      const el = document.getElementById(id);
      if (el && waLink) el.href = waLink;
    });
    
    const bookBtn = document.getElementById('mobile-book');
    if (bookBtn) bookBtn.href = __toAbs('/booking/index.html');
  }

  async function init() {
    enforceZIndexHierarchy();
    
    await renderBanner();
    bindScroll();
    bindSearchToggle();
    bindMobileMenu();
    bindSearchUI();
    activateNav();
    updateContact();
    
    buildSearchIndex();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Header = { init, smoothScroll, search, generateTourId, generateServiceId };
})();
