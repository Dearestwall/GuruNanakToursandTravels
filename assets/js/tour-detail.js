/**
 * tour-detail.js — Dynamic tour details page
 * - Loads tours.json, finds by ?id=
 * - Renders hero, overview, itinerary, inclusions, gallery
 * - Pricing/quick info + booking/WhatsApp
 * - Suggested tours (same type/destination)
 * - Share (Web Share API) + Copy Link
 */

(function () {
  'use strict';

  const PATH = '/_data/tours.json';
  const cacheBust = (u) => `${u}${u.includes('?') ? '&' : '?'}v=${Date.now()}`;
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const getParam = (k) => new URLSearchParams(window.location.search).get(k);
  const toId = (s, fallback = 'item') => (s || fallback).toLowerCase().replace(/\s+/g, '-');

  const parseDate = (obj) => {
    const d = obj?.date || obj?.published_at || obj?.publishedAt || obj?.created_at || obj?.createdAt;
    const t = d ? Date.parse(d) : NaN;
    return Number.isNaN(t) ? 0 : t;
  };

  const money = (v) => typeof v === 'number' ? `₹${v.toLocaleString('en-IN')}` : (v || '');

  const renderHero = (tour) => {
    const imgEl = qs('#tourImage');
    const titleEl = qs('#tourTitle');
    if (imgEl) {
      imgEl.src = tour.image || '';
      imgEl.alt = tour.title || 'Tour image';
    }
    if (titleEl) titleEl.textContent = tour.title || 'Tour';
    // Meta
    document.title = `${tour.title || 'Tour Details'} - Guru Nanak Tour & Travels`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = tour.meta_description || tour.excerpt || 'Tour details';
  };

  const renderOverview = (tour) => {
    const desc = qs('#fullDescription');
    if (desc) desc.innerHTML = tour.description || tour.excerpt || 'Details coming soon.';
  };

  const renderItinerary = (tour) => {
    const wrap = qs('#itinerary');
    if (!wrap) return;
    const list = Array.isArray(tour.itinerary) ? tour.itinerary : [];
    if (!list.length) { wrap.innerHTML = '<p>No itinerary provided.</p>'; return; }
    wrap.innerHTML = list.map((d, i) => `
      <div class="itinerary-day" id="day-${i + 1}">
        <h4>Day ${d.day || (i + 1)}: ${d.title || ''}</h4>
        <p>${d.description || ''}</p>
        <div class="day-meta">
          ${d.meals ? `<span>🍽️ ${d.meals}</span>` : ''}
          ${d.accommodation ? `<span>🏨 ${d.accommodation}</span>` : ''}
        </div>
      </div>
    `).join('');
  };

  const renderIncludes = (tour) => {
    const ul = qs('#includedServices');
    if (!ul) return;
    const inc = Array.isArray(tour.inclusions) ? tour.inclusions : [];
    if (!inc.length) { ul.innerHTML = '<li>No inclusions listed.</li>'; return; }
    ul.innerHTML = inc.map((i) => `<li>✓ ${i}</li>`).join('');
  };

  const initGallerySwiper = () => {
    if (typeof Swiper === 'undefined') return;
    const sel = '.gallery-swiper';
    if (!qs(sel)) return;
    new Swiper(sel, {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 12,
      breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
    });
  };

  const renderGallery = (tour) => {
    const wrap = qs('#galleryWrapper');
    if (!wrap) return;
    const gallery = Array.isArray(tour.gallery) ? tour.gallery : [];
    if (!gallery.length && tour.image) {
      wrap.innerHTML = `
        <div class="swiper-slide"><img src="${tour.image}" alt="${tour.title}" loading="lazy" decoding="async"/></div>
      `;
    } else {
      wrap.innerHTML = gallery.map((g, i) => `
        <div class="swiper-slide"><img src="${g.image || g}" alt="${tour.title} photo ${i + 1}" loading="lazy" decoding="async"/></div>
      `).join('');
    }
    initGallerySwiper();
  };

  const renderHighlights = (tour) => {
    const box = qs('#highlights');
    if (!box) return;
    const dest = Array.isArray(tour.destinations) ? tour.destinations : [];
    const hl = Array.isArray(tour.highlights) ? tour.highlights : [];
    const tags = [...dest, ...hl].filter(Boolean);
    if (!tags.length) { box.innerHTML = '<p>No highlights available.</p>'; return; }
    box.innerHTML = `
      <div class="destinations-list">
        ${tags.map((t, i) => `<span class="destination-tag" id="dest-${toId(t)}">📍 ${t}</span>`).join('')}
      </div>
    `;
  };

  const renderPricing = (tour) => {
    const p = qs('#priceFrom');
    const o = qs('#priceOriginal');
    const dur = qs('#durationInfo');
    const grp = qs('#groupInfo');
    const diff = qs('#difficultyInfo');
    const season = qs('#seasonInfo');
    const book = qs('#bookingLink');
    if (p) p.textContent = money(tour.price);
    if (o) o.textContent = '';
    if (dur) dur.textContent = `${tour.duration?.days ?? '-'} Days / ${tour.duration?.nights ?? '-'} Nights`;
    if (grp) grp.textContent = tour.group_size || '—';
    if (diff) diff.textContent = tour.difficulty || '—';
    if (season) season.textContent = tour.best_season || '—';
    if (book) book.href = `booking/index.html?tour=${encodeURIComponent(tour.tour_id || toId(tour.title))}`;
  };

  const renderQuickInfo = (tour) => {
    const withEl = qs('#popupWith');
    const rating = qs('#ratingInfo');
    if (withEl) withEl.textContent = `Perfect for ${tour.type || 'travelers'}`;
    if (rating) rating.textContent = `Rated ★★★★★ by travelers`;
  };

  const renderRecommended = (current, all) => {
    const wrap = qs('#recommendedToursContainer');
    if (!wrap) return;
    const curId = current.tour_id || toId(current.title);
    const sameType = all.filter(t => (t.tour_id || toId(t.title)) !== curId && (t.type && t.type === current.type));
    const sameDest = all.filter(t => (t.tour_id || toId(t.title)) !== curId && t.destinations?.some(d => current.destinations?.includes(d)));
    const picks = [...new Set([...sameType, ...sameDest])]
      .slice(0, 3);
    if (!picks.length) { wrap.innerHTML = '<p>No recommendations available.</p>'; return; }
    wrap.innerHTML = picks.map((t, i) => {
      const id = t.tour_id || toId(t.title);
      return `
        <article class="tour-card" data-tour-id="${id}">
          <div class="tour-image-wrapper">
            <img src="${t.image || ''}" alt="${t.title}" loading="lazy" decoding="async"/>
            <span class="tour-badge tour-badge-featured">${t.type || 'Tour'}</span>
          </div>
          <div class="tour-content">
            <div class="tour-meta">
              <span class="tour-duration">⏱️ ${t.duration?.days ?? '-'}D/${t.duration?.nights ?? '-'}N</span>
              <span class="tour-type">${t.type || ''}</span>
            </div>
            <h3 class="tour-title">${t.title || ''}</h3>
            <p class="tour-description">${t.excerpt || ''}</p>
            <div class="tour-footer">
              <div class="tour-price">
                <span class="price-label">From</span>
                <span class="price-amount">${money(t.price)}</span>
              </div>
              <a href="tour-detail.html?id=${encodeURIComponent(id)}" class="tour-btn" aria-label="View ${t.title}">View Details</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  };

  const initShareCopy = (tour) => {
    const shareBtn = qs('#shareBtn');
    const copyBtn = qs('#copyBtn');
    const url = window.location.href;
    const title = tour.title || 'Tour';
    on(shareBtn, 'click', async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title, text: `${title} — Guru Nanak Tour & Travels`, url });
        } else {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        }
      } catch {}
    });
    on(copyBtn, 'click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch {
        prompt('Copy this link:', url);
      }
    });
  };

  const boot = async () => {
    const id = getParam('id');
    if (!id) {
      qs('#tourTitle')?.append('Tour');
      return;
    }
    const data = await fetch(cacheBust(PATH), { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []);
    const withTs = Array.isArray(data) ? data.map(d => ({ ...d, __ts: parseDate(d) })) : [];
    const tour = withTs.find(t => (t.tour_id || toId(t.title)) === id) || withTs.find(t => toId(t.title).includes(id.toLowerCase())) || withTs[0];
    if (!tour) {
      qs('#tourTitle')?.append('Tour not found');
      return;
    }

    renderHero(tour);
    renderOverview(tour);
    renderItinerary(tour);
    renderIncludes(tour);
    renderGallery(tour);
    renderHighlights(tour);
    renderPricing(tour);
    renderQuickInfo(tour);
    renderRecommended(tour, withTs.filter(t => (t.tour_id || toId(t.title)) !== (tour.tour_id || toId(tour.title))));
    initShareCopy(tour);

    if (typeof AOS !== 'undefined') AOS.refresh();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
