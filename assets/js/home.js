// =====================================================
// HOME.JS - Enhanced home page with Netlify CMS support
// FINAL VERSION - Production Ready
// =====================================================

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function linkHref(href) {
  if (!href) return '#';
  if (/^(https?:)?\/\//i.test(href) || href.startsWith('tel:') || href.startsWith('mailto:')) {
    return href;
  }
  return window.__toAbs ? window.__toAbs(href) : href;
}

function isInternalUrl(url) {
  return url && !/^(https?:)?\/\//i.test(url) && !url.startsWith('tel:') && !url.startsWith('mailto:');
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.textContent = val;
}

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// =====================================================
// DATA LOADING
// =====================================================

async function loadHomeData() {
  const files = [
    { key: 'hero', path: '/data/hero.json' },
    { key: 'offerings', path: '/data/offerings.json' },
    { key: 'tours', path: '/data/tours.json' },
    { key: 'stats', path: '/data/stats.json' },
    { key: 'testimonials', path: '/data/testimonials.json' },
    { key: 'videos', path: '/data/videos.json' },
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
      console.log('[HOME] Loaded:', file.key);
    } catch (e) {
      if (retryCount < maxRetries) {
        await new Promise(r => setTimeout(r, 600));
        return fetchFile(file, retryCount + 1);
      }
      console.warn(`[HOME] Failed to load ${file.path}:`, e);
      allData[file.key] = {};
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
      videos: allData.videos?.videos || [],
      partners: allData.partners?.partners || [],
      faqs: allData.faqs?.faqs || [],
      contact: allData.contact?.contact || {}
    };

    renderHome(mergedData);
    console.log('[HOME] Page rendered');
  } catch (e) {
    console.error('[HOME] Data load error:', e);
    if (typeof showToast === 'function') {
      showToast('Failed to load page content', 'error');
    }
  }
}

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
  renderVideoShowcase(data.videos);
  renderPartners(data.partners);
  renderFAQs(data.faqs);
}

function bindContactInfo(contact) {
  const phoneClean = (contact.phone || '').replace(/\s+/g, '').replace(/^0+/, '');
  const waClean = (contact.whatsapp || contact.phone || '').replace(/[^\d+]/g, '');

  const phoneHref = phoneClean ? `tel:${phoneClean.replace(/^\+?/, '+')}` : null;
  const waHref = waClean ? `https://wa.me/${waClean.replace('+', '')}` : null;

  ['sticky-call', 'cta-call', 'header-call', 'mobile-call'].forEach(id => {
    const el = document.getElementById(id);
    if (el && phoneHref) el.href = phoneHref;
  });

  ['sticky-wa', 'cta-wa', 'header-wa', 'mobile-wa'].forEach(id => {
    const el = document.getElementById(id);
    if (el && waHref) el.href = waHref;
  });

  ['sticky-book', 'cta-book', 'header-book', 'mobile-book'].forEach(id => {
    const el = document.getElementById(id);
    if (el && contact.booking_link) el.href = linkHref(contact.booking_link);
  });

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

// =====================================================
// HERO CAROUSEL
// =====================================================

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

// =====================================================
// OFFERINGS
// =====================================================

function renderOfferings(offerings) {
  const container = document.getElementById('offer-cards');
  if (!container || !Array.isArray(offerings)) return;

  container.innerHTML = offerings.map((o, idx) => {
    const id = o.id || slugify(o.title || `service-${idx + 1}`);
    const detailsUrl = window.__toAbs ? window.__toAbs(`/details/?id=${id}&type=offering`) : `/details/?id=${id}&type=offering`;
    return `
      <article class="card offering-card">
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

// =====================================================
// FEATURED TOURS
// =====================================================

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
      const detailsUrl = window.__toAbs ? window.__toAbs(`/details/?id=${id}&type=tour`) : `/details/?id=${id}&type=tour`;
      return `
        <article class="tour">
          <div class="tour-image-wrapper">
            <img src="${escapeAttr(t.image)}" alt="${escapeAttr(t.name)}" class="tour-image" loading="lazy" />
          </div>
          <div class="tour-body">
            <h3 class="tour-title">${escapeHtml(t.name)}</h3>
            <p class="tour-summary">${escapeHtml(t.summary)}</p>
            ${t.duration ? `<p class="tour-duration">⏱️ ${escapeHtml(t.duration)}</p>` : ''}
            <div class="tour-footer">
              <p class="tour-price">₹${Number(t.price || 0).toLocaleString('en-IN')}</p>
              <a class="btn btn-sm" href="${detailsUrl}">View Details</a>
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

// =====================================================
// STATS WITH ANIMATION
// =====================================================

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

// =====================================================
// TESTIMONIALS CAROUSEL
// =====================================================

function renderTestimonials(testimonials) {
  const container = document.getElementById('testimonial-list');
  if (!container || !Array.isArray(testimonials)) return;

  container.innerHTML = testimonials.map((t, idx) => `
    <figure class="testimonial">
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

// =====================================================
// PARTNERS AUTO-SCROLL
// =====================================================

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

// =====================================================
// FAQs - ENHANCED ACCORDION WITH PROGRESSIVE REVEAL
// =====================================================

let allFaqsData = [];
let faqsLoaded = 0;
const FAQ_INITIAL_SHOW = 4;
const FAQ_REVEAL_STEP = 2;
let faqContainer = null;
let showMoreBtn = null;

function renderInitialFAQs(faqs) {
  const container = document.getElementById('faq-list');
  if (!container || !Array.isArray(faqs)) return;

  faqContainer = container;
  allFaqsData = faqs;
  faqsLoaded = FAQ_INITIAL_SHOW;

  const html = faqs.slice(0, FAQ_INITIAL_SHOW).map((f, i) => `
    <details class="faq" data-faq-index="${i}">
      <summary class="faq-summary">${escapeHtml(f.q)}</summary>
      <div class="faq-answer">${escapeHtml(f.a)}</div>
    </details>
  `).join('');

  container.innerHTML = html;
  setupFAQAccordion();

  if (faqs.length > FAQ_INITIAL_SHOW) {
    setupShowMoreButton();
  }

  console.log('[HOME] Rendered initial FAQs:', FAQ_INITIAL_SHOW);
}

function setupShowMoreButton() {
  const container = faqContainer.parentElement;
  if (!container) return;

  const existingBtn = container.querySelector('#showMoreFaqs');
  if (existingBtn) existingBtn.remove();

  showMoreBtn = document.createElement('button');
  showMoreBtn.id = 'showMoreFaqs';
  showMoreBtn.className = 'btn btn-outline';
  showMoreBtn.type = 'button';
  showMoreBtn.style.marginTop = '2rem';
  
  const remaining = allFaqsData.length - faqsLoaded;
  showMoreBtn.innerHTML = `📖 Show ${Math.min(FAQ_REVEAL_STEP, remaining)} More Questions`;

  showMoreBtn.addEventListener('click', loadMoreFAQs);
  container.appendChild(showMoreBtn);

  console.log('[HOME] Show More button added');
}

function loadMoreFAQs() {
  if (!faqContainer || faqsLoaded >= allFaqsData.length) return;

  const nextBatch = Math.min(FAQ_REVEAL_STEP, allFaqsData.length - faqsLoaded);
  const startIdx = faqsLoaded;
  const endIdx = faqsLoaded + nextBatch;

  const html = allFaqsData.slice(startIdx, endIdx).map((f, i) => `
    <details class="faq fade-in" data-faq-index="${startIdx + i}">
      <summary class="faq-summary">${escapeHtml(f.q)}</summary>
      <div class="faq-answer">${escapeHtml(f.a)}</div>
    </details>
  `).join('');

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  Array.from(tempDiv.children).forEach((el, idx) => {
    el.style.animationDelay = `${idx * 100}ms`;
    faqContainer.appendChild(el);
  });

  faqsLoaded += nextBatch;
  setupFAQAccordion();

  if (faqsLoaded >= allFaqsData.length) {
    if (showMoreBtn) {
      showMoreBtn.innerHTML = '✓ All FAQs Shown';
      showMoreBtn.disabled = true;
      showMoreBtn.style.opacity = '0.6';
    }
  } else {
    const remaining = allFaqsData.length - faqsLoaded;
    if (showMoreBtn) {
      showMoreBtn.innerHTML = `📖 Show ${Math.min(FAQ_REVEAL_STEP, remaining)} More Questions`;
    }
  }

  console.log('[HOME] Loaded more FAQs. Total loaded:', faqsLoaded);
}

function setupFAQAccordion() {
  const faqs = faqContainer.querySelectorAll('.faq');
  let faqOpenCount = 0;

  faqs.forEach((details) => {
    const clone = details.cloneNode(true);
    details.parentNode.replaceChild(clone, details);

    const faqElement = faqContainer.querySelector(`[data-faq-index="${clone.dataset.faqIndex}"]`);
    if (!faqElement) return;

    faqElement.addEventListener('toggle', () => {
      if (faqElement.open) {
        faqContainer.querySelectorAll('.faq').forEach(otherFaq => {
          if (otherFaq !== faqElement && otherFaq.open) {
            otherFaq.open = false;
          }
        });

        faqElement.classList.add('open');

        faqOpenCount++;
        if (faqOpenCount % 2 === 0 && faqsLoaded < allFaqsData.length) {
          console.log('[HOME] Auto-revealing more FAQs on open #', faqOpenCount);
          loadMoreFAQs();
        }

        setTimeout(() => {
          faqElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        console.log('[HOME] FAQ opened:', faqElement.querySelector('.faq-summary').textContent);
      } else {
        faqElement.classList.remove('open');
        console.log('[HOME] FAQ closed');
      }
    });
  });
}

function renderFAQs(faqs) {
  const container = document.getElementById('faq-list');
  if (!container || !Array.isArray(faqs) || faqs.length === 0) {
    console.warn('[HOME] No FAQs to render');
    return;
  }

  console.log('[HOME] Rendering FAQs:', faqs.length);
  renderInitialFAQs(faqs);
}

// =====================================================
// VIDEO REELS - ADVANCED WITH SOUND AUTOPLAY
// COMPLETE FINAL VERSION - PRODUCTION READY v6.1
// =====================================================

let currentVideoData = null;
let currentModalVideoIndex = null;
let autoScrollInterval = null;
let currentReelIndex = 0;
let allVideosData = [];
let videoObserver = null;
let currentPlayingVideo = null;
let currentPlayingCard = null;
let isModalOpen = false;
let hasUserInteracted = false;
let scrollSnapTimeout = null;
let playPromise = null; // Track play promise to avoid AbortError

// A11y helpers
function setFocus(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    try { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: false }); } catch(_) {}
  });
}

/**
 * Extract video ID from YouTube/Vimeo URL
 */
function extractVideoId(url, sourceType) {
  if (!url) return null;
  try {
    if (sourceType === 'youtube') {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/,
        /youtube\.com\/shorts\/([^&?\/]+)/
      ];
      for (const p of patterns) {
        const m = url.match(p);
        if (m && m[1]) return m[1];
      }
    } else if (sourceType === 'vimeo') {
      const m = url.match(/vimeo\.com\/(\d+)/);
      if (m && m[1]) return m[1];
    }
  } catch (e) { console.error('[VIDEO] ID parse error:', e); }
  return null;
}

/**
 * Get video source URL
 */
function getVideoSource(video) {
  if (video.source_type === 'upload' && video.video_file) {
    return { type: 'upload', url: window.__toAbs ? window.__toAbs(video.video_file) : video.video_file };
  }
  if (video.source_type === 'youtube' && video.video_url) {
    const id = extractVideoId(video.video_url, 'youtube');
    if (id) {
      return {
        type: 'youtube',
        videoId: id,
        url: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
      };
    }
  }
  if (video.source_type === 'vimeo' && video.video_url) {
    const id = extractVideoId(video.video_url, 'vimeo');
    if (id) {
      return {
        type: 'vimeo',
        videoId: id,
        url: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&playsinline=1`
      };
    }
  }
  return null;
}

/**
 * Get video thumbnail
 */
function getVideoThumbnail(video) {
  if (video.thumbnail) return window.__toAbs ? window.__toAbs(video.thumbnail) : video.thumbnail;
  if (video.source_type === 'youtube' && video.video_url) {
    const id = extractVideoId(video.video_url, 'youtube');
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  return `https://via.placeholder.com/400x600/0e5aa7/ffffff?text=${encodeURIComponent(video.source_type || 'Video')}`;
}

/**
 * Render reels
 */
function renderVideoShowcase(videos) {
  const container = document.getElementById('reels-container');
  if (!container) return;

  if (!Array.isArray(videos) || videos.length === 0) {
    const section = document.getElementById('video-reels');
    if (section) section.style.display = 'none';
    return;
  }

  const activeVideos = videos
    .filter(v => v.active !== false)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (activeVideos.length === 0) {
    const section = document.getElementById('video-reels');
    if (section) section.style.display = 'none';
    return;
  }

  allVideosData = activeVideos;

  container.innerHTML = activeVideos.map((video, idx) => {
    const videoSource = getVideoSource(video);
    const thumbnail = getVideoThumbnail(video);
    if (!videoSource) return '';

    return `
      <div class="reel-card" data-video-index="${idx}" data-video-id="${escapeAttr(video.id)}" role="group" aria-label="${escapeAttr(video.title)}">
        <div class="reel-thumbnail" onclick="enableSoundAndPlay(${idx})" aria-label="Play ${escapeAttr(video.title)}" role="button" tabindex="0">
          <img src="${escapeAttr(thumbnail)}" alt="${escapeAttr(video.title)}" loading="lazy" class="reel-thumb-img" />

          <button class="reel-mute-btn" onclick="toggleReelMute(${idx}); event.stopPropagation();" style="display:none;" title="Toggle sound" aria-label="Toggle sound">🔊</button>

          <div class="reel-preview-player" style="display:none;">
            ${videoSource.type === 'upload' ? `
              <video class="reel-video-preview" loop playsinline muted preload="metadata" data-video-index="${idx}">
                <source src="${escapeAttr(videoSource.url)}" type="video/mp4">
              </video>
            ` : `
              <iframe 
                class="reel-iframe-preview"
                src=""
                data-src="${escapeAttr(videoSource.url)}&autoplay=1&mute=1&loop=1&controls=0"
                frameborder="0"
                title="${escapeAttr(video.title)}"
                allow="autoplay; picture-in-picture; encrypted-media"
                referrerpolicy="no-referrer-when-downgrade"
                loading="lazy"
                data-video-index="${idx}"
              ></iframe>
            `}
          </div>

          <div class="reel-play-icon" aria-hidden="true">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="28" fill="rgba(255,255,255,0.9)" />
              <polygon points="24,18 24,42 42,30" fill="#0e5aa7" />
            </svg>
          </div>

          <button class="reel-watch-more" onclick="openVideoModal(${idx}); event.stopPropagation();" title="Watch full video with controls & more info" aria-label="Watch full video">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
            </svg>
            Watch Full Video
          </button>

          ${video.duration ? `<span class="reel-duration" aria-label="Duration ${escapeHtml(video.duration)}">${escapeHtml(video.duration)}</span>` : ''}
        </div>

        <div class="reel-info">
          ${video.category ? `<span class="reel-category">${escapeHtml(video.category)}</span>` : ''}
          <h4 class="reel-title">${escapeHtml(video.title)}</h4>
        </div>
      </div>
    `;
  }).join('');

  initReelsCarousel();
  initVideoAutoplay();
  wireKeyboardTrap();
}

/**
 * Enable sound and play (first interaction)
 */
window.enableSoundAndPlay = function(videoIndex) {
  hasUserInteracted = true;
  const card = document.querySelectorAll('.reel-card')[videoIndex];
  if (card) playVideo(card, true);
};

/**
 * Toggle reel video mute
 */
window.toggleReelMute = function(videoIndex) {
  const card = document.querySelectorAll('.reel-card')[videoIndex];
  if (!card) return;
  const videoEl = card.querySelector('.reel-video-preview');
  const muteBtn = card.querySelector('.reel-mute-btn');
  if (videoEl) {
    videoEl.muted = !videoEl.muted;
    if (muteBtn) {
      muteBtn.innerHTML = videoEl.muted ? '🔇' : '🔊';
      muteBtn.title = videoEl.muted ? 'Unmute' : 'Mute';
      muteBtn.setAttribute('aria-label', videoEl.muted ? 'Unmute' : 'Mute');
    }
  }
};

/**
 * Stop all playing videos (with promise handling)
 */
async function stopAllVideos() {
  // Wait for any pending play promise before pausing
  if (playPromise) {
    try {
      await playPromise;
    } catch(e) {
      console.log('[VIDEO] Play promise rejected:', e);
    }
    playPromise = null;
  }

  document.querySelectorAll('.reel-card').forEach(card => card.classList.remove('playing'));
  
  document.querySelectorAll('.reel-video-preview').forEach(v => { 
    if (!v.paused) {
      v.pause(); 
    }
    v.currentTime = 0; 
    v.muted = true; 
  });
  
  document.querySelectorAll('.reel-iframe-preview').forEach(iframe => { iframe.src = ''; });
  document.querySelectorAll('.reel-preview-player').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.reel-thumb-img').forEach(t => t.style.display = 'block');
  document.querySelectorAll('.reel-play-icon').forEach(i => i.style.opacity = '1');
  document.querySelectorAll('.reel-mute-btn').forEach(btn => btn.style.display = 'none');
  
  currentPlayingVideo = null;
  currentPlayingCard = null;
}

/**
 * Play card (optionally with sound) - FIXED VERSION
 */
async function playVideo(cardElement, enableSound = false) {
  const videoIndex = parseInt(cardElement.dataset.videoIndex);
  
  // Prevent playing the same video twice
  if (currentPlayingCard === cardElement && currentPlayingVideo) {
    console.log('[VIDEO] Already playing this card');
    return;
  }

  const previewPlayer = cardElement.querySelector('.reel-preview-player');
  const thumbImg = cardElement.querySelector('.reel-thumb-img');
  const playIcon = cardElement.querySelector('.reel-play-icon');
  const videoEl = cardElement.querySelector('.reel-video-preview');
  const iframeEl = cardElement.querySelector('.reel-iframe-preview');
  const muteBtn = cardElement.querySelector('.reel-mute-btn');

  await stopAllVideos();
  
  cardElement.classList.add('playing');

  if (thumbImg) thumbImg.style.display = 'none';
  if (playIcon) playIcon.style.opacity = '0.5';
  if (previewPlayer) previewPlayer.style.display = 'block';

  if (videoEl) {
    videoEl.muted = !(enableSound || hasUserInteracted);
    
    // Store play promise to prevent AbortError
    playPromise = videoEl.play();
    
    playPromise
      .then(() => {
        console.log('[VIDEO] Playing successfully:', videoIndex);
        currentPlayingVideo = videoEl;
        currentPlayingCard = cardElement;
        currentReelIndex = videoIndex;
      })
      .catch(e => {
        console.log('[VIDEO] Autoplay blocked, trying muted:', e);
        videoEl.muted = true;
        playPromise = videoEl.play();
        playPromise
          .then(() => {
            currentPlayingVideo = videoEl;
            currentPlayingCard = cardElement;
          })
          .catch(e2 => console.log('[VIDEO] Autoplay failed completely:', e2));
      });

    if (muteBtn) {
      muteBtn.style.display = 'flex';
      muteBtn.innerHTML = videoEl.muted ? '🔇' : '🔊';
      muteBtn.title = videoEl.muted ? 'Unmute' : 'Mute';
    }

    videoEl.onended = () => { if (!isModalOpen) advanceToNextVideo(); };
  } else if (iframeEl) {
    const base = iframeEl.dataset.src || '';
    const wantSound = enableSound || hasUserInteracted;
    const url = base.replace(/(&|\?)mute=\d/g, '') + (base.includes('?') ? '&' : '?') + `mute=${wantSound ? '0' : '1'}`;
    iframeEl.src = url;
    currentPlayingVideo = iframeEl;
    currentPlayingCard = cardElement;
    currentReelIndex = videoIndex;
  }
}

/**
 * Advance to next video
 */
function advanceToNextVideo() {
  const container = document.getElementById('reels-container');
  if (!container) return;
  const cards = container.querySelectorAll('.reel-card');
  const nextIndex = (currentReelIndex + 1) % cards.length;
  if (cards[nextIndex]) {
    cards[nextIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setTimeout(() => playVideo(cards[nextIndex], hasUserInteracted), 600);
  }
}

/**
 * IntersectionObserver autoplay
 */
function initVideoAutoplay() {
  if (videoObserver) videoObserver.disconnect();
  const options = { root: null, rootMargin: '0px', threshold: 0.75 };
  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !currentPlayingVideo && !isModalOpen) {
        playVideo(entry.target, hasUserInteracted);
      }
    });
  }, options);
  document.querySelectorAll('.reel-card').forEach(card => videoObserver.observe(card));
}

/**
 * Carousel with snap and keyboard shortcuts
 */
function initReelsCarousel() {
  const container = document.getElementById('reels-container');
  const prevBtn = document.getElementById('reels-prev');
  const nextBtn = document.getElementById('reels-next');
  if (!container) return;

  const cardWidth = () => {
    const first = container.querySelector('.reel-card');
    if (!first) return 320;
    const style = getComputedStyle(first);
    return first.getBoundingClientRect().width + parseFloat(style.marginRight || 16);
  };

  function snapToNearest() {
    const w = cardWidth();
    const index = Math.round(container.scrollLeft / w);
    const cards = container.querySelectorAll('.reel-card');
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    currentReelIndex = clamped;
    if (!isModalOpen && cards[clamped]) {
      setTimeout(() => playVideo(cards[clamped], hasUserInteracted), 400);
    }
  }

  function scrollReels(dir) {
    const w = cardWidth();
    container.scrollTo({ left: container.scrollLeft + (dir === 'next' ? w : -w), behavior: 'smooth' });
    clearTimeout(scrollSnapTimeout);
    scrollSnapTimeout = setTimeout(snapToNearest, 400);
  }

  container.addEventListener('scroll', () => {
    clearTimeout(scrollSnapTimeout);
    scrollSnapTimeout = setTimeout(snapToNearest, 400);
  }, { passive: true });

  prevBtn?.addEventListener('click', () => { hasUserInteracted = true; scrollReels('prev'); });
  nextBtn?.addEventListener('click', () => { hasUserInteracted = true; scrollReels('next'); });

  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { hasUserInteracted = true; e.preventDefault(); scrollReels('next'); }
    if (e.key === 'ArrowLeft') { hasUserInteracted = true; e.preventDefault(); scrollReels('prev'); }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const cards = container.querySelectorAll('.reel-card');
      const active = cards[currentReelIndex];
      if (active) playVideo(active, true);
    }
  });
  container.setAttribute('tabindex', '0');
  container.setAttribute('role', 'listbox');
}

/**
 * Suggested videos (modal)
 */
function renderSuggestedVideos(currentIndex) {
  const wrap = document.getElementById('modal-suggested-videos');
  if (!wrap) return;
  const suggested = allVideosData.filter((_, i) => i !== currentIndex).slice(0, 3);
  wrap.innerHTML = suggested.map(v => {
    const idx = allVideosData.findIndex(x => x.id === v.id);
    const thumb = getVideoThumbnail(v);
    return `
      <button class="suggested-video-card" onclick="loadVideoInModal(${idx})" aria-label="Play ${escapeAttr(v.title)}">
        <div class="suggested-video-thumbnail">
          <img src="${escapeAttr(thumb)}" alt="${escapeAttr(v.title)}" />
          <div class="suggested-play-icon">▶</div>
        </div>
        <div class="suggested-video-info">
          <h5>${escapeHtml(v.title)}</h5>
          ${v.category ? `<span class="suggested-category">${escapeHtml(v.category)}</span>` : ''}
          ${v.duration ? `<span class="suggested-duration">⏱️ ${escapeHtml(v.duration)}</span>` : ''}
        </div>
      </button>
    `;
  }).join('');
}

/**
 * Load video in modal
 */
window.loadVideoInModal = function(videoIndex) {
  const video = allVideosData[videoIndex];
  if (!video) return;
  currentModalVideoIndex = videoIndex;
  const src = getVideoSource(video);
  if (!src) return;

  const modalIframe = document.getElementById('modal-iframe');
  const modalVideo = document.getElementById('modal-video');
  const pipBtn = document.getElementById('pip-btn');
  const muteBtn = document.getElementById('mute-btn');

  document.getElementById('modal-category').textContent = video.category || '';
  document.getElementById('modal-title').textContent = video.title || '';
  document.getElementById('modal-description').textContent = video.description || '';

  if (src.type === 'upload') {
    modalIframe.style.display = 'none';
    modalVideo.style.display = 'block';
    modalVideo.src = src.url;
    modalVideo.controls = true;
    modalVideo.muted = false;
    modalVideo.play().catch(()=>{});
    pipBtn.style.display = 'flex';
    muteBtn.style.display = 'flex';
    modalVideo.onended = () => playNextVideoInModal();
    setFocus(modalVideo);
  } else {
    modalVideo.style.display = 'none';
    modalIframe.style.display = 'block';
    modalIframe.src = src.url + (src.url.includes('?') ? '&' : '?') + 'autoplay=1';
    pipBtn.style.display = 'none';
    muteBtn.style.display = 'none';
    setFocus(modalIframe);
  }

  renderSuggestedVideos(videoIndex);
  updateMuteButtonState();
};

/**
 * Modal next
 */
function playNextVideoInModal() {
  const next = (currentModalVideoIndex + 1) % allVideosData.length;
  loadVideoInModal(next);
}

/**
 * Open modal
 */
window.openVideoModal = function(videoIndex) {
  stopAllVideos();
  isModalOpen = true;
  hasUserInteracted = true;
  currentModalVideoIndex = videoIndex;

  const modal = document.getElementById('video-modal');
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
  loadVideoInModal(videoIndex);
  wireKeyboardTrap(true);
};

/**
 * Close modal
 */
window.closeVideoModal = function() {
  const modal = document.getElementById('video-modal');
  const modalIframe = document.getElementById('modal-iframe');
  const modalVideo = document.getElementById('modal-video');

  modalIframe.src = '';
  modalVideo.pause();
  modalVideo.src = '';

  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
  isModalOpen = false;
  currentModalVideoIndex = null;
  wireKeyboardTrap(false);

  setFocus(document.getElementById('reels-container'));
};

/**
 * Toggle modal mute
 */
window.toggleMute = function() {
  const modalVideo = document.getElementById('modal-video');
  if (modalVideo && modalVideo.style.display === 'block') {
    modalVideo.muted = !modalVideo.muted;
    updateMuteButtonState();
  }
};

function updateMuteButtonState() {
  const modalVideo = document.getElementById('modal-video');
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn && modalVideo) {
    const muted = !!modalVideo.muted;
    muteBtn.innerHTML = muted ? '🔇' : '🔊';
    muteBtn.title = muted ? 'Unmute' : 'Mute';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }
}

/**
 * Picture-in-Picture
 */
window.togglePiP = async function() {
  const modalVideo = document.getElementById('modal-video');
  if (!document.pictureInPictureEnabled || !modalVideo || modalVideo.style.display !== 'block') {
    alert('Picture-in-Picture not supported here');
    return;
  }
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await modalVideo.requestPictureInPicture();
  } catch (e) { console.error('[VIDEO] PiP error:', e); }
};

// Global keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (isModalOpen) closeVideoModal();
    else stopAllVideos();
  }
  if (!isModalOpen) {
    if (e.key === 'ArrowRight') { hasUserInteracted = true; document.getElementById('reels-next')?.click(); }
    if (e.key === 'ArrowLeft') { hasUserInteracted = true; document.getElementById('reels-prev')?.click(); }
  }
});

// Modal media keys & shortcuts
document.addEventListener('keydown', (e) => {
  if (!isModalOpen) return;
  const video = document.getElementById('modal-video');
  if ((e.code === 'Space' || e.key.toLowerCase() === 'k') && video && video.style.display === 'block') {
    e.preventDefault();
    if (video.paused) video.play();
    else video.pause();
  }
  if ((e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'l') && video && video.style.display === 'block') {
    e.preventDefault();
    const delta = e.key.toLowerCase() === 'j' ? -10 : 10;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
  }
  if (e.key.toLowerCase() === 'f') {
    e.preventDefault();
    const wrapper = document.querySelector('.video-modal-player-wrapper');
    if (!document.fullscreenElement) wrapper?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  if (e.key.toLowerCase() === 'm') {
    e.preventDefault();
    toggleMute();
  }
});

/**
 * Focus trap within modal
 */
function wireKeyboardTrap(enable = false) {
  const modal = document.getElementById('video-modal');
  if (!enable) {
    modal.removeAttribute('aria-modal');
    modal.removeAttribute('role');
    return;
  }
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('role', 'dialog');

  const focusable = () => Array.from(modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

  function trap(e) {
    if (e.key !== 'Tab') return;
    const nodes = focusable();
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  modal.addEventListener('keydown', trap);
}

// Interaction flags
document.addEventListener('click', () => { hasUserInteracted = true; }, { once: true });
document.addEventListener('touchstart', () => { hasUserInteracted = true; }, { once: true });

// Cleanup
window.addEventListener('beforeunload', () => {
  clearInterval(autoScrollInterval);
  if (videoObserver) videoObserver.disconnect();
  stopAllVideos();
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('[VIDEO] Page initialized');
  try {
    const navEntries = performance.getEntriesByType('navigation');
    const type = navEntries && navEntries[0] ? navEntries[0].type : 'navigate';
    if ((type === 'reload' || type === 'back_forward') && !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  } catch (_) {}
  setTimeout(loadHomeData, 100);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(loadHomeData, 500);
  } else {
    if (!isModalOpen) stopAllVideos();
  }
});

console.log('[VIDEO] ✅ Advanced player v6.1 - AbortError fixed');
