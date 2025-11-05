// =====================================================
// HOME.JS - Enhanced home page with Netlify CMS support
// =====================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

/**
 * Escape HTML attributes
 */
function escapeAttr(s) {
  return escapeHtml(s);
}

/**
 * Convert href to proper link
 */
function linkHref(href) {
  if (!href) return '#';
  if (/^(https?:)?\/\//i.test(href) || href.startsWith('tel:') || href.startsWith('mailto:')) {
    return href;
  }
  return window.__toAbs ? window.__toAbs(href) : href;
}

/**
 * Check if URL is internal
 */
function isInternalUrl(url) {
  return url && !/^(https?:)?\/\//i.test(url) && !url.startsWith('tel:') && !url.startsWith('mailto:');
}

/**
 * Append ID to URL as query parameter
 */
function appendIdToUrl(url, id) {
  if (!url || !id) return url;
  if (!isInternalUrl(url)) return url;
  const hasQuery = url.includes('?');
  const sep = hasQuery ? '&' : '?';
  return `${url}${sep}id=${encodeURIComponent(id)}`;
}

/**
 * Convert string to URL slug
 */
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format number with + suffix
 */
function fmtPlus(n) {
  if (typeof n !== 'number' || n == null) return undefined;
  return n >= 1000 ? `${n.toLocaleString('en-IN')}+` : `${n}`;
}

/**
 * Set element text content by ID
 */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.textContent = val;
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
 * Load all data from separate JSON files
 * Progressive fallback + metrics
 */
async function loadHomeData() {
  const files = [
    { key: 'hero', path: '/data/hero.json' },
    { key: 'offerings', path: '/data/offerings.json' },
    { key: 'tours', path: '/data/tours.json' },
    { key: 'stats', path: '/data/stats.json' },
    { key: 'testimonials', path: '/data/testimonials.json' },
    { key: 'partners', path: '/data/partners.json' },
    { key: 'faqs', path: '/data/faqs.json' },
    { key: 'contact', path: '/data/contact.json' }
  ];

  const allData = {};
  const maxRetries = 2;

  async function fetchFile(file, retryCount = 0) {
    try {
      const url = window.__toAbs ? window.__toAbs(file.path) : file.path;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allData[file.key] = data;
    } catch (e) {
      if (retryCount < maxRetries) {
        await new Promise(r => setTimeout(r, 600));
        return fetchFile(file, retryCount + 1);
      }
      console.warn(`Failed to load ${file.path}:`, e);
      allData[file.key] = {}; // keep structure
    }
  }

  try {
    await Promise.all(files.map(f => fetchFile(f)));

    const mergedData = {
      site_title: allData.home?.site_title || 'Guru Nanak Tour & Travels',
      tagline: allData.home?.tagline || 'Your journey, our responsibility',
      hero_slides: allData.hero?.hero_slides || [],
      offerings: allData.offerings?.offerings || [],
      featured_tours: allData.tours?.featured_tours || [],
      stats: allData.stats?.stats || {},
      testimonials: allData.testimonials?.testimonials || [],
      partners: allData.partners?.partners || [],
      faqs: allData.faqs?.faqs || [],
      contact: allData.contact?.contact || {}
    };

    renderHome(mergedData);
  } catch (e) {
    console.error('Data load error:', e);
    showToast('Failed to load page content', 'error');
  }
}

/**
 * Main render function
 */
function renderHome(data) {
  if (data.site_title && data.tagline) {
    document.title = `${data.site_title} | ${data.tagline}`;
    setText('brand-title', data.site_title);

    const brandNameEl = document.querySelector('.brand-name');
    if (brandNameEl) brandNameEl.textContent = data.site_title;

    setText('brand-tagline', data.tagline);
  }

  if (data.contact) bindContactInfo(data.contact);

  renderHeroSlides(data.hero_slides);
  renderOfferings(data.offerings);
  renderFeaturedTours(data.featured_tours);
  renderStats(data.stats);
  renderTestimonials(data.testimonials);
  renderPartners(data.partners);
  renderFAQs(data.faqs);
}

/**
 * Bind contact info to all buttons
 */
function bindContactInfo(contact) {
  const phoneClean = (contact.phone || '').replace(/\s+/g, '').replace(/^0+/, '');
  const waClean = (contact.whatsapp || '').replace(/\s+/g, '').replace(/^0+/, '');

  const phoneHref = phoneClean ? `tel:${phoneClean.replace(/^\+?/, '+')}` : null;
  const waHref = waClean ? `https://wa.me/${waClean.replace('+', '')}?text=Hello%20GNTT` : null;

  // Call buttons
  ['sticky-call', 'cta-call', 'header-call', 'mobile-call'].forEach(id => {
    const el = document.getElementById(id);
    if (el && phoneHref) el.href = phoneHref;
  });

  // WhatsApp buttons
  ['sticky-wa', 'cta-wa', 'header-wa', 'mobile-wa'].forEach(id => {
    const el = document.getElementById(id);
    if (el && waHref) el.href = waHref;
  });

  // Booking buttons
  ['sticky-book', 'cta-book', 'header-book', 'mobile-book'].forEach(id => {
    const el = document.getElementById(id);
    if (el && contact.booking_link) el.href = linkHref(contact.booking_link);
  });

  // Footer contact
  const fPhone = document.getElementById('footer-phone');
  if (fPhone && contact.phone) {
    fPhone.textContent = contact.phone;
    if (phoneHref) fPhone.href = phoneHref;
  }

  const fEmail = document.getElementById('footer-email');
  if (fEmail && contact.email) {
    fEmail.textContent = contact.email;
    fEmail.href = `mailto:${contact.email}`;
  }

  setText('footer-address', contact.address);

  const fMap = document.getElementById('footer-map');
  if (fMap && contact.map_link) fMap.href = contact.map_link;
}

/* =====================================================
   HERO CAROUSEL - AUTO-ROTATE WITH MANUAL CONTROLS
   ===================================================== */

function renderHeroSlides(slides) {
  const container = document.getElementById('hero-slider');
  if (!container || !Array.isArray(slides) || slides.length === 0) return;

  container.innerHTML = slides.map((s, i) => `
    <div class="slide${i === 0 ? ' active' : ''}" style="background-image: url('${escapeAttr(s.image)}')">
      <div class="slide-content">
        <h2 class="slide-title">${escapeHtml(s.title)}</h2>
        <p class="slide-subtitle">${escapeHtml(s.subtitle)}</p>
        <div class="slide-ctas">
          ${(s.ctas || []).map(c => `
            <a class="btn ${c.style || 'btn-primary'}" href="${linkHref(c.href)}" target="${c.target || '_self'}">
              ${escapeHtml(c.label)}
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  const dotsContainer = document.getElementById('hero-dots');
  if (dotsContainer) {
    dotsContainer.innerHTML = slides.map((_, i) => `
      <button class="dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>
    `).join('');
  }

  initHeroCarousel(container, slides.length);
}

function initHeroCarousel(container, totalSlides) {
  let currentSlide = 0;
  let autoRotateInterval;

  const slides = container.querySelectorAll('.slide');
  const dots = document.querySelectorAll('#hero-dots .dot');
  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');

  function showSlide(n) {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    slides[n].classList.add('active');
    if (dots[n]) dots[n].classList.add('active');
    currentSlide = n;

    clearInterval(autoRotateInterval);
    autoRotateInterval = setInterval(() => {
      showSlide((currentSlide + 1) % totalSlides);
    }, 5000);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => showSlide((currentSlide - 1 + totalSlides) % totalSlides));
  if (nextBtn) nextBtn.addEventListener('click', () => showSlide((currentSlide + 1) % totalSlides));
  dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));

  autoRotateInterval = setInterval(() => {
    showSlide((currentSlide + 1) % totalSlides);
  }, 5000);
}

/* =====================================================
   OFFERINGS
   ===================================================== */

function renderOfferings(offerings) {
  const container = document.getElementById('offer-cards');
  if (!container || !Array.isArray(offerings)) return;

  container.innerHTML = offerings.map((o, idx) => {
    const id = o.id || slugify(o.title || `service-${idx + 1}`);
    const detailsUrl = __toAbs ? __toAbs(`/details/?id=${id}&type=offering`) : `/details/?id=${id}&type=offering`;
    return `
      <article class="card offering-card" id="offer-${id}">
        <div class="card-icon">${escapeHtml(o.icon || '✨')}</div>
        <h3 class="card-title">${escapeHtml(o.title)}</h3>
        <p class="card-description">${escapeHtml(o.description)}</p>
        <a class="card-link" href="${detailsUrl}">
          ${escapeHtml(o.link_label || 'Learn More →')}
        </a>
      </article>
    `;
  }).join('');
}

/* =====================================================
   FEATURED TOURS - WITH LOAD MORE & DEEP LINKS
   ===================================================== */

function renderFeaturedTours(tours) {
  const container = document.getElementById('tour-grid');
  const loadMoreBtn = document.getElementById('load-more-tours');

  if (!container || !Array.isArray(tours) || tours.length === 0) return;

  const sortedTours = [...tours].reverse();
  const initialCount = window.innerWidth < 768 ? 2 : 3;
  let currentShown = initialCount;

  function renderTours(count) {
    container.innerHTML = sortedTours.slice(0, count).map((t, idx) => {
      const id = t.id || slugify(t.name || `tour-${idx + 1}`);
      const detailsUrl = __toAbs ? __toAbs(`/details/?id=${id}&type=tour`) : `/details/?id=${id}&type=tour`;
      return `
        <article class="tour" id="tour-${id}">
          <div class="tour-image-wrapper">
            <img src="${escapeAttr(t.image)}" alt="${escapeAttr(t.name)}" class="tour-image" loading="lazy" />
          </div>
          <div class="tour-body">
            <h3 class="tour-title">${escapeHtml(t.name)}</h3>
            <p class="tour-summary">${escapeHtml(t.summary)}</p>
            ${t.duration ? `<p class="tour-duration">⏱️ ${escapeHtml(t.duration)}</p>` : ''}
            <div class="tour-footer">
              <p class="tour-price">₹${Number(t.price || 0).toLocaleString('en-IN')}</p>
              <a class="btn btn-sm" href="${detailsUrl}" target="_self">View Details</a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (loadMoreBtn) {
      loadMoreBtn.style.display = count >= sortedTours.length ? 'none' : 'block';
    }
  }

  renderTours(currentShown);

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentShown += 3;
      renderTours(currentShown);
    });
  }

  const onResize = debounce(() => {
    const newInitial = window.innerWidth < 768 ? 2 : 3;
    if (newInitial !== initialCount && currentShown < newInitial) {
      currentShown = newInitial;
      renderTours(currentShown);
    }
  }, 300);
  
  window.addEventListener('resize', onResize);
}

/* =====================================================
   STATS - WITH ANIMATED COUNTERS
   ===================================================== */

function animateCounter(element, target) {
  const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersNoMotion) {
    element.textContent = target.toLocaleString('en-IN');
    return;
  }

  const duration = 2000;
  const increment = target / (duration / 16);
  let current = 0;

  function updateCounter() {
    current += increment;
    if (current < target) {
      element.textContent = Math.floor(current).toLocaleString('en-IN');
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target.toLocaleString('en-IN');
    }
  }
  
  updateCounter();
}

function renderStats(stats) {
  if (!stats) return;

  setText('stat-support', stats.support || '24/7');

  const customersEl = document.getElementById('stat-customers');
  const packagesEl = document.getElementById('stat-packages');
  const destinationsEl = document.getElementById('stat-destinations');

  if (customersEl) customersEl.textContent = (stats.happy_customers || 0).toLocaleString('en-IN');
  if (packagesEl) packagesEl.textContent = (stats.tour_packages || 0).toLocaleString('en-IN');
  if (destinationsEl) destinationsEl.textContent = (stats.destinations || 0).toLocaleString('en-IN');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.animated === 'true') return;
      el.dataset.animated = 'true';

      if (customersEl) animateCounter(customersEl, stats.happy_customers || 0);
      if (packagesEl) animateCounter(packagesEl, stats.tour_packages || 0);
      if (destinationsEl) animateCounter(destinationsEl, stats.destinations || 0);

      obs.unobserve(el);
    });
  }, { threshold: 0.45 });

  const statsSection = document.getElementById('stats');
  if (statsSection) observer.observe(statsSection);
}

/* =====================================================
   TESTIMONIALS - RESPONSIVE CAROUSEL
   ===================================================== */

function renderTestimonials(testimonials) {
  const container = document.getElementById('testimonial-list');
  if (!container || !Array.isArray(testimonials)) return;

  container.innerHTML = testimonials.map((t, idx) => `
    <figure class="testimonial" id="review-${slugify(t.name || `review-${idx + 1}`)}">
      ${t.photo ? `<img class="testimonial-avatar" src="${escapeAttr(t.photo)}" alt="${escapeAttr(t.name)}" loading="lazy" />` : ''}
      <figcaption class="testimonial-content">
        <div class="testimonial-stars">${'⭐'.repeat(Math.max(0, Math.min(5, t.rating || 5)))}</div>
        <blockquote class="testimonial-quote">"${escapeHtml(t.comment)}"</blockquote>
        <div class="testimonial-author">— ${escapeHtml(t.name)}${t.location ? `, ${escapeHtml(t.location)}` : ''}</div>
      </figcaption>
    </figure>
  `).join('');

  initTestimonialsCarousel(container, testimonials.length);
}

function initTestimonialsCarousel(listEl, total) {
  const carousel = listEl.parentElement;
  if (!carousel) return;

  let currentIndex = 0;
  let itemsPerView = getItemsPerView();
  let autoScrollInterval;

  const prevBtn = document.getElementById('testimonials-prev');
  const nextBtn = document.getElementById('testimonials-next');
  const dotsContainer = document.getElementById('testimonials-dots');

  function getItemsPerView() {
    return window.innerWidth < 768 ? 1 : (window.innerWidth < 1024 ? 2 : 3);
  }

  function getGapPx() {
    const gap = getComputedStyle(listEl).gap || '0px';
    const val = parseFloat(gap);
    return Number.isFinite(val) ? val : 0;
  }

  function renderDots() {
    if (!dotsContainer) return;
    const pages = Math.max(1, Math.ceil(total / itemsPerView));
    dotsContainer.innerHTML = Array.from({ length: pages }, (_, i) => `
      <button class="dot${i === 0 ? ' active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>
    `).join('');
    dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
      dot.addEventListener('click', () => goToSlide(i * itemsPerView));
    });
  }

  function goToSlide(n) {
    const items = listEl.querySelectorAll('.testimonial');
    if (!items.length) return;
    currentIndex = Math.max(0, Math.min(n, Math.max(0, total - itemsPerView)));
    const itemWidth = items[0].getBoundingClientRect().width;
    const offset = currentIndex * (itemWidth + getGapPx());
    carousel.scrollLeft = Math.round(offset);
    const dots = dotsContainer?.querySelectorAll('.dot') || [];
    dots.forEach(d => d.classList.remove('active'));
    const page = Math.floor(currentIndex / itemsPerView);
    if (dots[page]) dots[page].classList.add('active');
  }

  function startAutoScroll() {
    const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersNoMotion) return;
    autoScrollInterval = setInterval(() => {
      const nextIndex = currentIndex + 1;
      goToSlide(nextIndex >= total - itemsPerView + 1 ? 0 : nextIndex);
    }, 6000);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

  carousel.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
  carousel.addEventListener('mouseleave', () => {
    clearInterval(autoScrollInterval);
    startAutoScroll();
  });

  renderDots();
  startAutoScroll();

  window.addEventListener('resize', debounce(() => {
    const newItemsPerView = getItemsPerView();
    if (newItemsPerView !== itemsPerView) {
      itemsPerView = newItemsPerView;
      renderDots();
      goToSlide(0);
    }
  }, 200));
}

/* =====================================================
   PARTNERS - AUTO-SCROLL CAROUSEL
   ===================================================== */

function renderPartners(partners) {
  const container = document.getElementById('partner-logos');
  if (!container || !Array.isArray(partners)) return;

  container.innerHTML = partners.map(p => `
    <div class="partner">
      <img src="${escapeAttr(p.logo)}" alt="${escapeAttr(p.name)}" class="partner-logo" loading="lazy" />
    </div>
  `).join('');

  initPartnersAutoScroll(container);
}

function initPartnersAutoScroll(container) {
  const carousel = container.parentElement;
  if (!carousel) return;

  const prefersNoMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersNoMotion) return;

  const scrollSpeed = 0.6;
  let autoScrollInterval;

  function autoScroll() {
    carousel.scrollLeft += scrollSpeed;
    if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 2) {
      carousel.scrollLeft = 0;
    }
  }

  function start() {
    clearInterval(autoScrollInterval);
    autoScrollInterval = setInterval(autoScroll, 16);
  }

  carousel.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
  carousel.addEventListener('mouseleave', start);
  start();
}

/* =====================================================
   FAQs - ACCORDION WITH AUTO-CLOSE + Progressive Reveal
   ===================================================== */

let faqOpenCount = 0;
const FAQ_REVEAL_STEP = 2;

function renderFAQs(faqs) {
  const container = document.getElementById('faq-list');
  if (!container || !Array.isArray(faqs)) return;

  // Initial render: show first 4, rest hidden with data-hidden
  const initial = Math.min(4, faqs.length);
  container.innerHTML = faqs.map((f, i) => `
    <details class="faq"${i === 0 ? ' open' : ''} ${i >= initial ? 'data-hidden="true" style="display:none;"' : ''}>
      <summary class="faq-summary">${escapeHtml(f.q)}</summary>
      <div class="faq-answer">${escapeHtml(f.a)}</div>
    </details>
  `).join('');

  // Add "Show more FAQs" control if there are more
  const moreNeeded = faqs.length > initial;
  if (moreNeeded) {
    const btn = document.createElement('button');
    btn.id = 'showMoreFaqs';
    btn.className = 'btn btn-outline';
    btn.type = 'button';
    btn.textContent = 'Show more FAQs';
    btn.style.marginTop = '1rem';
    container.parentElement?.appendChild(btn);

    btn.addEventListener('click', () => {
      revealMoreFaqs(container, FAQ_REVEAL_STEP);
      // Hide button if none left hidden
      if (!container.querySelector('[data-hidden="true"]')) {
        btn.style.display = 'none';
      }
    });
  }

  setupFAQAccordion(container);
}

function revealMoreFaqs(container, count) {
  const hidden = Array.from(container.querySelectorAll('.faq[data-hidden="true"]'));
  hidden.slice(0, count).forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-hidden');
  });
}

function setupFAQAccordion(container) {
  const faqs = container.querySelectorAll('.faq');

  faqs.forEach(faq => {
    faq.addEventListener('click', (e) => {
      if (e.target.closest('.faq-summary')) {
        const isOpening = !faq.open;
        // Auto close others (accordion)
        if (isOpening) {
          faqs.forEach(otherFaq => {
            if (otherFaq !== faq) otherFaq.open = false;
          });

          // Count opens and progressively reveal more
          faqOpenCount++;
          if (faqOpenCount % 2 === 0) {
            revealMoreFaqs(container, FAQ_REVEAL_STEP);
          }
        }
      }
    });
  });
}

/* =====================================================
   INITIALIZATION
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Prevent unwanted scroll on reload
  try {
    const navEntries = performance.getEntriesByType('navigation');
    const type = navEntries && navEntries[0] ? navEntries[0].type : 'navigate';
    if ((type === 'reload' || type === 'back_forward') && !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  } catch (_) {}

  setTimeout(loadHomeData, 100);
});

// Reload content when user returns to tab
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(loadHomeData, 500);
  }
});
