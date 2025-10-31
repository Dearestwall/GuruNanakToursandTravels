/**
 * CMS-INTEGRATION.JS - Dynamic Content from Netlify CMS
 * Loads tours, hero slides, and reviews from Netlify CMS with fallback
 */

(function() {
  'use strict';

  const CMS_ENABLED = true; // Set to false to always use fallback

  // ============================================
  // 1. FETCH TOURS FROM NETLIFY CMS
  // ============================================
  const fetchToursFromCMS = async () => {
    if (!CMS_ENABLED) return [];

    try {
      // Try to fetch from Netlify CMS generated JSON
      const response = await fetch('/admin/data/tours.json');
      if (!response.ok) throw new Error('CMS fetch failed');
      return await response.json();
    } catch (error) {
      console.warn('⚠️ CMS not available, using fallback data');
      return [];
    }
  };

  // ============================================
  // 2. FETCH REVIEWS FROM NETLIFY CMS
  // ============================================
  const fetchReviewsFromCMS = async () => {
    if (!CMS_ENABLED) return [];

    try {
      const response = await fetch('/admin/data/reviews.json');
      if (!response.ok) throw new Error('CMS fetch failed');
      return await response.json();
    } catch (error) {
      console.warn('⚠️ CMS reviews not available, using fallback');
      return [];
    }
  };

  // ============================================
  // 3. RENDER HERO SLIDES
  // ============================================
  const renderHeroSlides = (tours) => {
    const wrapper = document.getElementById('heroWrapper');
    if (!wrapper) return;

    // If CMS data exists, use it; otherwise keep fallback HTML
    if (!tours || tours.length === 0) {
      console.log('✅ Using fallback hero slides from HTML');
      return;
    }

    // Get tours marked for hero
    let heroTours = tours
      .filter(tour => tour.showInHero && tour.active)
      .sort((a, b) => {
        if (a.isLatestPackage && !b.isLatestPackage) return -1;
        if (!a.isLatestPackage && b.isLatestPackage) return 1;
        if (a.heroOrder && b.heroOrder) return a.heroOrder - b.heroOrder;
        return new Date(b.date) - new Date(a.date);
      })
      .slice(0, 5);

    if (heroTours.length < 5) {
      heroTours = tours.filter(t => t.active).slice(0, 5);
    }

    if (heroTours.length === 0) return;

    wrapper.innerHTML = heroTours.map((tour, index) => `
      <div class="swiper-slide hero-slide" data-tour-id="${tour.slug}">
        <img src="${tour.image}" alt="${tour.title}" loading="${index === 0 ? 'eager' : 'lazy'}" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h${index === 0 ? '1' : '2'} class="hero-title">${tour.title}</h${index === 0 ? '1' : '2'}>
          <p class="hero-subtitle">${tour.description}</p>
          ${tour.isLatestPackage ? '<span class="hero-badge">🆕 Latest Package</span>' : ''}
          <div class="hero-cta-group">
            <a href="tours.html#${tour.slug}" class="hero-btn hero-btn-primary">View Details</a>
            <a href="booking.html?tour=${tour.slug}" class="hero-btn hero-btn-secondary">📝 Book Now</a>
          </div>
        </div>
      </div>
    `).join('');

    console.log('✅ Hero slides rendered from CMS:', heroTours.length);

    // Reinitialize Swiper if needed
    if (typeof Swiper !== 'undefined' && window.heroSwiper) {
      window.heroSwiper.update();
    }
  };

  // ============================================
  // 4. RENDER FEATURED TOURS
  // ============================================
  const renderFeaturedTours = (tours) => {
    const container = document.getElementById('featuredToursContainer');
    if (!container) return;

    if (!tours || tours.length === 0) {
      console.log('✅ Using fallback featured tours from HTML');
      return;
    }

    let featured = tours
      .filter(tour => tour.isLatestPackage && tour.active)
      .slice(0, 3);

    if (featured.length < 3) {
      featured = tours
        .filter(tour => (tour.featured || tour.isLatestPackage) && tour.active)
        .slice(0, 3);
    }

    if (featured.length === 0) {
      featured = tours.filter(t => t.active).slice(0, 3);
    }

    if (featured.length === 0) return;

    container.innerHTML = featured.map((tour, idx) => `
      <article class="tour-card" data-aos="fade-up" data-aos-delay="${idx * 100}">
        <div class="tour-image-wrapper">
          <img src="${tour.image}" alt="${tour.title}" loading="lazy" class="tour-image" />
          <span class="tour-badge tour-badge-${tour.badge}">
            ${tour.isLatestPackage ? '🆕 NEW' : tour.badge.toUpperCase()}
          </span>
        </div>
        <div class="tour-content">
          <div class="tour-meta">
            <span class="tour-duration">⏱️ ${tour.duration}</span>
            <span class="tour-type">🏷️ ${tour.type}</span>
          </div>
          <h3 class="tour-title">${tour.title}</h3>
          <p class="tour-description">${tour.description}</p>
          <div class="tour-footer">
            <div class="tour-price">
              <span class="price-label">From</span>
              <span class="price-amount">₹${tour.priceFrom.toLocaleString('en-IN')}</span>
              ${tour.discount ? `<span class="price-discount">${tour.discount}% OFF</span>` : ''}
            </div>
            <a href="tours.html#${tour.slug}" class="tour-btn">View Details</a>
          </div>
        </div>
      </article>
    `).join('');

    console.log('✅ Featured tours rendered from CMS:', featured.length);

    // Refresh AOS
    if (window.AOS) {
      AOS.refresh();
    }
  };

  // ============================================
  // 5. RENDER REVIEWS
  // ============================================
  const renderReviews = (reviews) => {
    const wrapper = document.getElementById('reviewsWrapper');
    if (!wrapper) return;

    if (!reviews || reviews.length === 0) {
      console.log('✅ Using fallback reviews from HTML');
      return;
    }

    const activeReviews = reviews.filter(r => r.active).slice(0, 10);

    if (activeReviews.length === 0) return;

    wrapper.innerHTML = activeReviews.map(review => `
      <blockquote class="swiper-slide review-card">
        <div class="review-avatar">
          <img src="${review.avatar || 'https://i.ibb.co/YFNFZjyf/image.png'}" alt="${review.customerName}" loading="lazy" />
        </div>
        <div class="review-stars">${'⭐'.repeat(Math.floor(review.rating))}</div>
        <p class="review-text">"${review.reviewText}"</p>
        <cite class="review-author">— ${review.customerName}, ${review.location}</cite>
      </blockquote>
    `).join('');

    console.log('✅ Reviews rendered from CMS:', activeReviews.length);

    // Reinitialize Swiper if needed
    if (typeof Swiper !== 'undefined' && window.reviewsSwiper) {
      window.reviewsSwiper.update();
    }
  };

  // ============================================
  // 6. INITIALIZE CMS INTEGRATION
  // ============================================
  const init = async () => {
    console.log('🔄 Loading CMS content...');

    try {
      const [tours, reviews] = await Promise.all([
        fetchToursFromCMS(),
        fetchReviewsFromCMS()
      ]);

      if (tours.length > 0) {
        renderHeroSlides(tours);
        renderFeaturedTours(tours);
      }

      if (reviews.length > 0) {
        renderReviews(reviews);
      }

      console.log('✅ CMS integration complete');
    } catch (error) {
      console.error('❌ CMS integration error:', error);
      console.log('✅ Using fallback content from HTML');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500);
  }

})();
