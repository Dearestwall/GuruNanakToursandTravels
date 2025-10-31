/**
 * index.js — Single JS for index.html
 * Guru Nanak Tour & Travels
 * Features: Header/menu/search, loader, smooth scroll, back-to-top, AOS/Swiper, stats counter, parallax,
 * Netlify CMS dynamic content (Featured Tours + Reviews) with IDs/tags and deep links.
 */

(function () {
  'use strict';

  // =========================
  // CONFIG
  // =========================
  const CONFIG = {
    paths: {
      tours: '/_data/tours.json',
      reviews: '/_data/reviews.json',
      site: '/_data/site-config.json'
    },
    selectors: {
      header: '#siteHeader',
      menuToggle: '#menuToggle',
      menuClose: '#menuClose',
      mobileMenu: '#mobileMenu',
      backdrop: '#modalBackdrop',
      searchToggle: '#searchToggle',
      searchClose: '#searchClose',
      searchModal: '#searchModal',
      searchInput: '#searchInput',
      pageLoader: '#pageLoader',
      backToTop: '#backToTop',
      featuredTours: '#featuredToursContainer',
      reviewsSwiper: '.reviews-swiper',
      heroSwiper: '.hero-swiper'
    },
    flags: {
      debug: false
    }
  };
  const log = (...args) => CONFIG.flags.debug && console.log('[GNTT]', ...args);

  // =========================
  // UTIL
  // =========================
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const trapFocus = (container, firstFocus) => {
    if (!container) return () => {};
    const focusable = container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const list = Array.from(focusable);
    const first = list[0];
    const last = list[list.length - 1];
    if (firstFocus) first.focus();
    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', handler);
    return () => container.removeEventListener('keydown', handler);
  };
  const smoothScrollTo = (y) => window.scrollTo({ top: y, behavior: 'smooth' });

  // =========================
  // 1) PAGE LOADER
  // =========================
  const initPageLoader = () => {
    const loader = qs(CONFIG.selectors.pageLoader);
    if (!loader) return;
    const hide = () => {
      loader.classList.add('hide');
      setTimeout(() => (loader.style.display = 'none'), 500);
    };
    if (document.readyState === 'complete') hide();
    else on(window, 'load', hide, { once: true });
    setTimeout(hide, 3000);
    log('Page loader ready');
  };

  // =========================
  // 2) HEADER AUTO-HIDE
  // =========================
  const initHeader = () => {
    const header = qs(CONFIG.selectors.header);
    if (!header) return;
    let lastY = window.pageYOffset;
    let ticking = false;
    const update = () => {
      const y = window.pageYOffset;
      if (y > 50) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      if (y > lastY && y > 200) header.classList.add('hidden');
      else header.classList.remove('hidden');
      lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    on(window, 'scroll', onScroll, { passive: true });
    log('Header auto-hide ready');
  };

  // =========================
  // 3) MOBILE MENU
  // =========================
  const initMobileMenu = () => {
    const toggle = qs(CONFIG.selectors.menuToggle);
    const closeBtn = qs(CONFIG.selectors.menuClose);
    const menu = qs(CONFIG.selectors.mobileMenu);
    const backdrop = qs(CONFIG.selectors.backdrop);
    const body = document.body;
    if (!toggle || !menu || !backdrop) return;

    let untrap = null;
    const open = () => {
      menu.removeAttribute('hidden');
      menu.classList.add('open');
      backdrop.removeAttribute('hidden');
      body.classList.add('no-scroll');
      toggle.setAttribute('aria-expanded', 'true');
      untrap = trapFocus(menu, menu.querySelector('.mobile-nav-item'));
    };
    const close = () => {
      menu.classList.remove('open');
      setTimeout(() => {
        menu.setAttribute('hidden', '');
        backdrop.setAttribute('hidden', '');
      }, 300);
      body.classList.remove('no-scroll');
      toggle.setAttribute('aria-expanded', 'false');
      if (untrap) untrap();
      toggle.focus();
    };

    on(toggle, 'click', open);
    on(closeBtn, 'click', close);
    on(backdrop, 'click', close);
    qsa('.mobile-nav-item', menu).forEach((a) => on(a, 'click', close));
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && !menu.hasAttribute('hidden')) close();
    });
    log('Mobile menu ready');
  };

  // =========================
  // 4) SEARCH MODAL
  // =========================
  const initSearchModal = () => {
    const btn = qs(CONFIG.selectors.searchToggle);
    const closeBtn = qs(CONFIG.selectors.searchClose);
    const modal = qs(CONFIG.selectors.searchModal);
    const input = qs(CONFIG.selectors.searchInput);
    const backdrop = qs(CONFIG.selectors.backdrop);
    const body = document.body;
    if (!btn || !modal || !backdrop) return;

    let untrap = null;
    const open = () => {
      modal.removeAttribute('hidden');
      modal.classList.add('open');
      backdrop.removeAttribute('hidden');
      body.classList.add('no-scroll');
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => input && input.focus(), 80);
      untrap = trapFocus(modal, input);
    };
    const close = () => {
      modal.classList.remove('open');
      setTimeout(() => {
        modal.setAttribute('hidden', '');
        backdrop.setAttribute('hidden', '');
      }, 300);
      body.classList.remove('no-scroll');
      btn.setAttribute('aria-expanded', 'false');
      if (untrap) untrap();
      btn.focus();
    };
    on(btn, 'click', open);
    on(closeBtn, 'click', close);
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close();
    });
    const form = modal.querySelector('.search-modal-form');
    if (form) {
      on(form, 'submit', (e) => {
        e.preventDefault();
        const q = (input?.value || '').trim();
        if (q) window.location.href = `tours/index.html?q=${encodeURIComponent(q)}`;
      });
    }
    log('Search modal ready');
  };

  // =========================
  // 5) SMOOTH SCROLL + BACK TO TOP
  // =========================
  const initSmoothScroll = () => {
    qsa('a[href^="#"]').forEach((link) => {
      on(link, 'click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '#main') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerH = qs('.site-header')?.offsetHeight || 76;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
        smoothScrollTo(top);
        target.tabIndex = -1;
        target.focus();
      });
    });
    const backToTop = qs(CONFIG.selectors.backToTop);
    if (backToTop) {
      const toggle = () => {
        if (window.pageYOffset > 300) backToTop.classList.add('show');
        else backToTop.classList.remove('show');
      };
      on(window, 'scroll', toggle, { passive: true });
      on(backToTop, 'click', () => smoothScrollTo(0));
    }
    log('Smooth scroll + back-to-top ready');
  };

  // =========================
  // 6) INTERSECTION FADE-IN + YEAR
  // =========================
  const initObserversAndYear = () => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            obs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    qsa('.fade-in-observe').forEach((el) => observer.observe(el));
    const year = qs('#currentYear');
    if (year) year.textContent = new Date().getFullYear();
    log('Fade-in observer + current year ready');
  };

  // =========================
  // 7) AOS (if present)
  // =========================
  const initAOS = () => {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 120, disable: window.innerWidth < 640 });
      log('AOS initialized');
    }
  };

  // =========================
  // 8) SWIPER: HERO + REVIEWS
  // =========================
  const initSwipers = () => {
    if (typeof Swiper === 'undefined') return;
    const heroSel = CONFIG.selectors.heroSwiper;
    const revSel = CONFIG.selectors.reviewsSwiper;

    if (qs(heroSel)) {
      window.heroSwiper = new Swiper(heroSel, {
        loop: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: { delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true },
        speed: 900,
        pagination: { el: `${heroSel} .swiper-pagination`, clickable: true, dynamicBullets: true },
        navigation: { nextEl: `${heroSel} .swiper-button-next`, prevEl: `${heroSel} .swiper-button-prev` },
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { enabled: true, prevSlideMessage: 'Previous slide', nextSlideMessage: 'Next slide' }
      });
      log('Hero swiper ready');
    }

    if (qs(revSel)) {
      window.reviewsSwiper = new Swiper(revSel, {
        loop: true,
        autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
        speed: 800,
        slidesPerView: 1,
        spaceBetween: 24,
        pagination: { el: `${revSel} .swiper-pagination`, clickable: true, dynamicBullets: true },
        keyboard: { enabled: true, onlyInViewport: true },
        breakpoints: { 640: { slidesPerView: 1.5, spaceBetween: 20 }, 1024: { slidesPerView: 2.5, spaceBetween: 28 }, 1440: { slidesPerView: 3, spaceBetween: 32 } }
      });
      log('Reviews swiper ready');
    }
  };

  // =========================
  // 9) STATS COUNTER
  // =========================
  const initStatsCounter = () => {
    const stats = qsa('.stat-number');
    if (!stats.length) return;
    const animate = (el) => {
      const target = parseInt(el.dataset.count);
      const is247 = target === 24;
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;
      const tick = () => {
        current += increment;
        if (current >= target) {
          el.textContent = is247 ? '24/7' : target.toLocaleString('en-IN') + '+';
        } else {
          el.textContent = Math.floor(current).toLocaleString('en-IN');
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting && !en.target.dataset.animated) {
            en.target.dataset.animated = 'true';
            animate(en.target);
            obs.unobserve(en.target);
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -50px 0px' }
    );
    stats.forEach((s) => io.observe(s));
    log('Stats counter ready');
  };

  // =========================
  // 10) PARALLAX (Hero)
  // =========================
  const initParallax = () => {
    const hero = qs('.hero-section');
    if (!hero) return;
    let ticking = false;
    const update = () => {
      const scrolled = window.pageYOffset;
      const max = hero.offsetHeight;
      if (scrolled < max) {
        const img = qs('.hero-slide.swiper-slide-active img');
        if (img) img.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
      }
      ticking = false;
    };
    const req = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    on(window, 'scroll', req, { passive: true });
    log('Parallax ready');
  };

  // =========================
  // 11) CMS DATA LOADER (Featured Tours + Reviews)
  // =========================
  const cms = {
    cache: { tours: null, reviews: null },
    async getJSON(url) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        log('Fetch failed:', url, e);
        return null;
      }
    },
    async loadTours() {
      if (this.cache.tours) return this.cache.tours;
      const data = await this.getJSON(CONFIG.paths.tours);
      this.cache.tours = Array.isArray(data) ? data : [];
      return this.cache.tours;
    },
    async loadReviews() {
      if (this.cache.reviews) return this.cache.reviews;
      const data = await this.getJSON(CONFIG.paths.reviews);
      this.cache.reviews = Array.isArray(data) ? data : [];
      return this.cache.reviews;
    },
    tourBadge(type = '') {
      const map = { Popular: 'tour-badge-popular', Luxury: 'tour-badge-luxury', Adventure: 'tour-badge-featured', Beach: 'tour-badge-popular', City: 'tour-badge-luxury' };
      return map[type] || 'tour-badge-featured';
    },
    tourCard(t, idx = 0) {
      const id = t.tour_id || t.title?.toLowerCase().replace(/\s+/g, '-') || `tour-${idx}`;
      const type = t.type || 'Package';
      const badgeCls = this.tourBadge(type);
      const days = t.duration?.days ?? '-';
      const nights = t.duration?.nights ?? '-';
      const price = typeof t.price === 'number' ? t.price.toLocaleString('en-IN') : (t.price || '');
      const highlights = Array.isArray(t.highlights) ? t.highlights.slice(0, 3) : [];
      return `
        <article class="tour-card fade-in-observe" data-aos="fade-up" data-aos-delay="${idx * 100}" data-tour-id="${id}" id="tour-card-${id}">
          <div class="tour-image-wrapper">
            <img src="${t.image || ''}" alt="${t.title || 'Tour'} - ${type} tour" loading="lazy" class="tour-image" width="400" height="300" decoding="async"/>
            <span class="tour-badge ${badgeCls}">${type}</span>
          </div>
          <div class="tour-content">
            <div class="tour-meta">
              <span class="tour-duration">⏱️ ${days}D/${nights}N</span>
              <span class="tour-type">${type}</span>
            </div>
            <h3 class="tour-title" id="tour-title-${id}">${t.title || 'Tour Package'}</h3>
            <p class="tour-description">${t.excerpt || ''}</p>
            ${highlights.length ? `<div class="tour-highlights"><ul>${highlights.map(h => `<li>${h}</li>`).join('')}</ul></div>` : ''}
            <div class="tour-footer">
              <div class="tour-price">
                <span class="price-label">From</span>
                <span class="price-amount">₹${price}</span>
              </div>
              <a href="tour-detail.html?id=${encodeURIComponent(id)}" class="tour-btn" aria-label="View details for ${t.title || 'tour'}">
                View Details
              </a>
            </div>
          </div>
        </article>
      `;
    },
    reviewSlide(r, idx = 0) {
      const id = (r.title || `review-${idx}`).toLowerCase().replace(/\s+/g, '-');
      const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
      return `
        <blockquote class="swiper-slide review-card" data-review-id="${id}" id="review-${id}">
          <div class="review-avatar">
            <img src="${r.avatar || 'https://i.ibb.co/YFNFZjyf/image.png'}" alt="${r.title || 'Customer'}" loading="lazy" width="60" height="60" decoding="async"/>
          </div>
          <div class="review-stars" aria-label="${rating} star rating">${'⭐'.repeat(rating)}</div>
          <p class="review-text">"${r.text || ''}"</p>
          <cite class="review-author">— ${r.title || 'Customer'}${r.location ? `, ${r.location}` : ''}</cite>
        </blockquote>
      `;
    },
    async renderFeaturedTours(limit = 3) {
      const container = qs(CONFIG.selectors.featuredTours);
      if (!container) return;
      const tours = await this.loadTours();
      const featured = tours.filter(t => t.featured || true).slice(0, limit);
      if (featured.length) container.innerHTML = featured.map((t, i) => this.tourCard(t, i)).join('');
      // AOS refresh if available
      if (typeof AOS !== 'undefined') AOS.refresh();
    },
    async renderReviewsSwiper() {
      const wrap = qs(`${CONFIG.selectors.reviewsSwiper} .swiper-wrapper`);
      if (!wrap) return;
      const reviews = await this.loadReviews();
      const published = reviews.filter(r => r.published !== false);
      if (published.length) wrap.innerHTML = published.map((r, i) => this.reviewSlide(r, i)).join('');
      // Update swiper if ready
      if (window.reviewsSwiper && typeof window.reviewsSwiper.update === 'function') {
        window.reviewsSwiper.update();
      }
    }
  };

  // =========================
  // 12) DEEP LINKS BY ID/TAG
  // =========================
  const initDeepLinks = () => {
    const scrollToHash = () => {
      if (!location.hash) return;
      const id = decodeURIComponent(location.hash.substring(1));
      const el = document.getElementById(id) || qs(`[data-tour-id="${id}"]`);
      if (el) {
        const headerH = qs('.site-header')?.offsetHeight || 76;
        const top = el.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
        setTimeout(() => smoothScrollTo(top), 50);
        el.classList.add('focus-ring');
        setTimeout(() => el.classList.remove('focus-ring'), 1200);
      }
    };
    on(window, 'hashchange', scrollToHash);
    // run once after content paints
    setTimeout(scrollToHash, 400);
    log('Deep links ready');
  };

  // =========================
  // 13) KEYBOARD SHORTCUTS
  // =========================
  const initHotkeys = () => {
    on(document, 'keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        qs(CONFIG.selectors.searchToggle)?.click();
      }
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        qs(CONFIG.selectors.menuToggle)?.click();
      }
    });
    log('Hotkeys ready');
  };

  // =========================
  // 14) BOOT
  // =========================
  const boot = async () => {
    initPageLoader();
    initHeader();
    initMobileMenu();
    initSearchModal();
    initSmoothScroll();
    initObserversAndYear();
    initAOS();
    initStatsCounter();
    initParallax();
    initHotkeys();

    // Swipers first to mount containers
    initSwipers();

    // CMS dynamic content
    await cms.renderFeaturedTours(3);
    await cms.renderReviewsSwiper();

    // Update sliders after dynamic content
    setTimeout(() => {
      if (window.heroSwiper?.update) window.heroSwiper.update();
      if (window.reviewsSwiper?.update) window.reviewsSwiper.update();
      if (typeof AOS !== 'undefined') AOS.refresh();
    }, 200);

    // Deep links
    initDeepLinks();

    // Final update on full load
    on(window, 'load', () => {
      if (window.heroSwiper?.update) window.heroSwiper.update();
      if (window.reviewsSwiper?.update) window.reviewsSwiper.update();
    });

    log('Index.js initialized');
  };

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
/**
 * index.js — Dynamic CMS + UI for index.html
 * - Loads tours from Netlify CMS JSON
 * - Sorts latest first (by date/published_at/createdAt)
 * - Renders Featured Tours
 * - Injects latest tour as the 5th hero slide (keeps 3–4 defaults)
 * - Reviews swiper hydration
 * - Header/menu/search/scroll/parallax/counters
 */

(function () {
  'use strict';

  const CONFIG = {
    paths: {
      tours: '/_data/tours.json',
      reviews: '/_data/reviews.json'
    },
    selectors: {
      header: '#siteHeader',
      searchToggle: '#searchToggle',
      searchClose: '#searchClose',
      searchModal: '#searchModal',
      searchInput: '#searchInput',
      menuToggle: '#menuToggle',
      menuClose: '#menuClose',
      mobileMenu: '#mobileMenu',
      backdrop: '#modalBackdrop',
      backToTop: '#backToTop',
      featuredTours: '#featuredToursContainer',
      heroWrapper: '#heroSlidesWrapper',
      heroSwiper: '.hero-swiper',
      reviewsSwiper: '.reviews-swiper'
    }
  };

  // ------------- Utilities -------------
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
  const cacheBust = (url) => `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;

  const parseDate = (obj) => {
    const d = obj?.date || obj?.published_at || obj?.publishedAt || obj?.created_at || obj?.createdAt;
    const t = d ? Date.parse(d) : NaN;
    return Number.isNaN(t) ? 0 : t;
  };

  // ------------- Header + UI -------------
  const initHeader = () => {
    const header = qs(CONFIG.selectors.header);
    if (!header) return;
    let last = window.pageYOffset;
    let ticking = false;
    const update = () => {
      const y = window.pageYOffset;
      if (y > 50) header.classList.add('scrolled'); else header.classList.remove('scrolled');
      if (y > last && y > 200) header.classList.add('hidden'); else header.classList.remove('hidden');
      last = y; ticking = false;
    };
    on(window, 'scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  };

  const initMobileMenu = () => {
    const toggle = qs(CONFIG.selectors.menuToggle);
    const closeBtn = qs(CONFIG.selectors.menuClose);
    const menu = qs(CONFIG.selectors.mobileMenu);
    const backdrop = qs(CONFIG.selectors.backdrop);
    const body = document.body;
    if (!toggle || !menu || !backdrop) return;

    const open = () => {
      menu.removeAttribute('hidden');
      menu.classList.add('open');
      backdrop.removeAttribute('hidden');
      body.classList.add('no-scroll');
      toggle.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      menu.classList.remove('open');
      setTimeout(() => { menu.setAttribute('hidden', ''); backdrop.setAttribute('hidden', ''); }, 300);
      body.classList.remove('no-scroll');
      toggle.setAttribute('aria-expanded', 'false');
    };
    on(toggle, 'click', open);
    on(closeBtn, 'click', close);
    on(backdrop, 'click', close);
    qsa('.mobile-nav-item', menu).forEach((a) => on(a, 'click', close));
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && !menu.hasAttribute('hidden')) close(); });
  };

  const initSearchModal = () => {
    const btn = qs(CONFIG.selectors.searchToggle);
    const closeBtn = qs(CONFIG.selectors.searchClose);
    const modal = qs(CONFIG.selectors.searchModal);
    const input = qs(CONFIG.selectors.searchInput);
    const backdrop = qs(CONFIG.selectors.backdrop);
    const body = document.body;
    if (!btn || !modal || !backdrop) return;

    const open = () => {
      modal.removeAttribute('hidden');
      modal.classList.add('open');
      backdrop.removeAttribute('hidden');
      body.classList.add('no-scroll');
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => input?.focus(), 80);
    };
    const close = () => {
      modal.classList.remove('open');
      setTimeout(() => { modal.setAttribute('hidden', ''); backdrop.setAttribute('hidden', ''); }, 300);
      body.classList.remove('no-scroll');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    };
    on(btn, 'click', open);
    on(closeBtn, 'click', close);
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && !modal.hasAttribute('hidden')) close(); });
    const form = modal.querySelector('.search-modal-form');
    form && on(form, 'submit', (e) => {
      e.preventDefault();
      const q = (input?.value || '').trim();
      if (q) window.location.href = `tours/index.html?q=${encodeURIComponent(q)}`;
    });
  };

  const initBackToTop = () => {
    const btn = qs(CONFIG.selectors.backToTop);
    if (!btn) return;
    const toggle = () => btn.classList.toggle('show', window.pageYOffset > 300);
    on(window, 'scroll', toggle, { passive: true });
    on(btn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const initAOS = () => { if (typeof AOS !== 'undefined') AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 120, disable: window.innerWidth < 640 }); };

  // ------------- Swipers -------------
  const initSwipers = () => {
    if (typeof Swiper === 'undefined') return;
    const heroSel = CONFIG.selectors.heroSwiper;
    const revSel = CONFIG.selectors.reviewsSwiper;
    if (qs(heroSel)) {
      window.heroSwiper = new Swiper(heroSel, {
        loop: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: { delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true },
        speed: 900,
        pagination: { el: `${heroSel} .swiper-pagination`, clickable: true, dynamicBullets: true },
        navigation: { nextEl: `${heroSel} .swiper-button-next`, prevEl: `${heroSel} .swiper-button-prev` },
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { enabled: true }
      });
    }
    if (qs(revSel)) {
      window.reviewsSwiper = new Swiper(revSel, {
        loop: true,
        autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
        speed: 800,
        slidesPerView: 1,
        spaceBetween: 24,
        pagination: { el: `${revSel} .swiper-pagination`, clickable: true, dynamicBullets: true },
        keyboard: { enabled: true, onlyInViewport: true },
        breakpoints: { 640: { slidesPerView: 1.5, spaceBetween: 20 }, 1024: { slidesPerView: 2.5, spaceBetween: 28 }, 1440: { slidesPerView: 3, spaceBetween: 32 } }
      });
    }
  };

  // ------------- Stats + Parallax -------------
  const initStatsCounter = () => {
    const nums = qsa('.stat-number');
    if (!nums.length) return;
    const animate = (el) => {
      const target = parseInt(el.dataset.count);
      const is247 = target === 24;
      const duration = 2000;
      const inc = target / (duration / 16);
      let cur = 0;
      const tick = () => {
        cur += inc;
        if (cur >= target) el.textContent = is247 ? '24/7' : target.toLocaleString('en-IN') + '+';
        else { el.textContent = Math.floor(cur).toLocaleString('en-IN'); requestAnimationFrame(tick); }
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !e.target.dataset.animated) {
          e.target.dataset.animated = 'true';
          animate(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5, rootMargin: '0px 0px -50px 0px' });
    nums.forEach((n) => io.observe(n));
  };

  const initParallax = () => {
    const hero = qs('.hero-section');
    if (!hero) return;
    let ticking = false;
    const update = () => {
      const y = window.pageYOffset;
      const max = hero.offsetHeight;
      if (y < max) {
        const img = qs('.hero-slide.swiper-slide-active img');
        if (img) img.style.transform = `translateY(${y * 0.3}px) scale(1.1)`;
      }
      ticking = false;
    };
    on(window, 'scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  };

  // ------------- CMS Loader -------------
  const getJSON = async (url) => {
    try {
      const res = await fetch(cacheBust(url), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('Fetch error:', url, e);
      return null;
    }
  };

  const heroSlideFromTour = (t) => {
    const id = t.tour_id || (t.title || '').toLowerCase().replace(/\s+/g, '-');
    const title = t.title || 'Featured Tour';
    const subtitle = t.excerpt || (t.destinations?.length ? `Explore ${t.destinations.join(', ')}` : 'Unforgettable experience awaits');
    const img = t.image || '';
    return `
      <div class="swiper-slide hero-slide" id="hero-cms-${id}" data-tour-id="${id}">
        <img src="${img}" alt="${title}" loading="lazy" decoding="async" width="1920" height="600" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h2 class="hero-title">${title}</h2>
          <p class="hero-subtitle">${subtitle}</p>
          <div class="hero-cta-group">
            <a href="tour-detail.html?id=${encodeURIComponent(id)}" class="hero-btn hero-btn-primary" aria-label="View ${title} details">🗺️ View Details</a>
            <a href="booking/index.html?tour=${encodeURIComponent(id)}" class="hero-btn hero-btn-outline" aria-label="Book ${title}">📝 Book Now</a>
          </div>
        </div>
      </div>
    `;
  };

  const tourCard = (t, idx = 0) => {
    const id = t.tour_id || (t.title || `tour-${idx}`).toLowerCase().replace(/\s+/g, '-');
    const type = t.type || 'Package';
    const days = t.duration?.days ?? '-';
    const nights = t.duration?.nights ?? '-';
    const price = typeof t.price === 'number' ? t.price.toLocaleString('en-IN') : (t.price || '');
    const hl = Array.isArray(t.highlights) ? t.highlights.slice(0, 3) : [];
    return `
      <article class="tour-card fade-in-observe" data-aos="fade-up" data-aos-delay="${idx * 100}" data-tour-id="${id}" id="tour-card-${id}">
        <div class="tour-image-wrapper">
          <img src="${t.image || ''}" alt="${t.title || 'Tour'} - ${type}" loading="lazy" class="tour-image" width="400" height="300" decoding="async"/>
          <span class="tour-badge tour-badge-featured">${type}</span>
        </div>
        <div class="tour-content">
          <div class="tour-meta">
            <span class="tour-duration">⏱️ ${days}D/${nights}N</span>
            <span class="tour-type">${type}</span>
          </div>
          <h3 class="tour-title" id="tour-title-${id}">${t.title || 'Tour Package'}</h3>
          <p class="tour-description">${t.excerpt || ''}</p>
          ${hl.length ? `<div class="tour-highlights"><ul>${hl.map(h => `<li>${h}</li>`).join('')}</ul></div>` : ''}
          <div class="tour-footer">
            <div class="tour-price">
              <span class="price-label">From</span>
              <span class="price-amount">₹${price}</span>
            </div>
            <a href="tour-detail.html?id=${encodeURIComponent(id)}" class="tour-btn" aria-label="View details for ${t.title || 'tour'}">View Details</a>
          </div>
        </div>
      </article>
    `;
  };

  const hydrateReviewsSwiper = async () => {
    const wrap = qs(`${CONFIG.selectors.reviewsSwiper} .swiper-wrapper`);
    if (!wrap) return;
    const reviews = await getJSON(CONFIG.paths.reviews);
    if (!Array.isArray(reviews)) return;
    const published = reviews.filter((r) => r.published !== false);
    if (!published.length) return;
    wrap.innerHTML = published.map((r, i) => {
      const id = (r.title || `review-${i}`).toLowerCase().replace(/\s+/g, '-');
      const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
      return `
        <blockquote class="swiper-slide review-card" data-review-id="${id}" id="review-${id}">
          <div class="review-avatar">
            <img src="${r.avatar || 'https://i.ibb.co/YFNFZjyf/image.png'}" alt="${r.title || 'Customer'}" loading="lazy" width="60" height="60" decoding="async"/>
          </div>
          <div class="review-stars" aria-label="${rating} star rating">${'⭐'.repeat(rating)}</div>
          <p class="review-text">"${r.text || ''}"</p>
          <cite class="review-author">— ${r.title || 'Customer'}${r.location ? `, ${r.location}` : ''}</cite>
        </blockquote>
      `;
    }).join('');
    if (window.reviewsSwiper?.update) window.reviewsSwiper.update();
  };

  // ------------- Main boot -------------
  const boot = async () => {
    initHeader();
    initMobileMenu();
    initSearchModal();
    initBackToTop();
    initAOS();
    initSwipers();
    initStatsCounter();
    initParallax();

    // Load tours (latest first)
    const tours = await getJSON(CONFIG.paths.tours) || [];
    const sorted = tours
      .map((t) => ({ ...t, __ts: parseDate(t) }))
      .sort((a, b) => b.__ts - a.__ts);

    // Render Featured Tours (latest first)
    const featuredWrap = qs(CONFIG.selectors.featuredTours);
    if (featuredWrap) {
      const list = sorted.filter((t) => t.featured || true).slice(0, 6);
      featuredWrap.innerHTML = list.map((t, i) => tourCard(t, i)).join('');
      if (typeof AOS !== 'undefined') AOS.refresh();
    }

    // Inject latest CMS hero as 5th banner (keep 3–4 defaults)
    const heroWrap = qs(CONFIG.selectors.heroWrapper);
    if (heroWrap && sorted.length) {
      const latest = sorted[0];
      const cmsSlide = heroSlideFromTour(latest);
      // Ensure total slides = 5: keep first 4 defaults + 1 CMS
      const existing = qsa('.hero-slide', heroWrap);
      if (existing.length >= 4) {
        // If more than 4 defaults, trim to first 4 then append CMS
        const extra = existing.slice(4);
        extra.forEach((n) => n.remove());
      }
      heroWrap.insertAdjacentHTML('beforeend', cmsSlide);
      // Update hero swiper
      if (window.heroSwiper?.update) window.heroSwiper.update();
    }

    // Reviews
    await hydrateReviewsSwiper();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
