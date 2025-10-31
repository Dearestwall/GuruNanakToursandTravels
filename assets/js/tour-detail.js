/**
 * Tour Detail Page JavaScript
 * - Load tour data from CMS
 * - Render details
 * - Handle sharing and booking
 */

(function() {
  'use strict';

  const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  const loadTourData = async () => {
    const tourId = getQueryParam('id');
    if (!tourId) {
      window.location.href = 'tours.html';
      return null;
    }

    try {
      const response = await fetch('/data/tours.json');
      const tours = await response.json();
      return tours.find(t => t.slug === tourId);
    } catch (error) {
      console.error('Error loading tour:', error);
      return null;
    }
  };

  const renderTourDetail = (tour) => {
    if (!tour) {
      document.getElementById('main').innerHTML = '<p style="text-align: center; padding: 3rem;">Tour not found. <a href="tours.html">View all tours</a></p>';
      return;
    }

    // Hero
    document.getElementById('tourImage').src = tour.image;
    document.getElementById('tourTitle').textContent = tour.title;
    document.title = `${tour.title} - Guru Nanak Tour & Travels`;

    // Content
    document.getElementById('fullDescription').innerHTML = tour.fullDescription;
    document.getElementById('priceFrom').textContent = `₹${tour.priceFrom.toLocaleString('en-IN')}`;
    document.getElementById('durationInfo').textContent = tour.duration;
    document.getElementById('groupInfo').textContent = tour.groupSize;
    document.getElementById('difficultyInfo').textContent = tour.difficulty;
    document.getElementById('seasonInfo').textContent = tour.bestSeason;
    document.getElementById('ratingInfo').innerHTML = `${tour.rating} ⭐ (${tour.reviewsCount} reviews)`;
    document.getElementById('popupWith').textContent = `Popular with: ${tour.popularWith.join(', ')}`;

    // Itinerary
    document.getElementById('itinerary').innerHTML = tour.itinerary.map(day => `
      <div class="itinerary-day">
        <h4>Day ${day.day}: ${day.title}</h4>
        <p>${day.description}</p>
      </div>
    `).join('');

    // Included
    document.getElementById('includedServices').innerHTML = tour.included.map(service => `<li>✓ ${service}</li>`).join('');

    // Gallery
    document.getElementById('galleryWrapper').innerHTML = tour.gallery.map((img, i) => `
      <div class="swiper-slide">
        <img src="${img}" alt="${tour.title} - Photo ${i + 1}" loading="lazy" />
      </div>
    `).join('');

    // Highlights
    document.getElementById('highlights').innerHTML = tour.highlights.map(h => `
      <div class="highlight-item">
        <span class="highlight-icon">📍</span>
        <span>${h}</span>
      </div>
    `).join('');

    // Booking
    document.getElementById('bookingLink').href = tour.bookingLink || 'booking.html?tour=' + tour.slug;

    // Share & Copy buttons
    setupShareButtons(tour);

    // Recommended tours
    loadRecommendedTours(tour);
  };

  const setupShareButtons = (tour) => {
    const shareBtn = document.getElementById('shareBtn');
    const copyBtn = document.getElementById('copyBtn');
    const shareUrl = window.location.href;
    const shareText = `Check out this amazing tour: ${tour.title} with Guru Nanak Tour & Travels!`;

    if (navigator.share) {
      shareBtn.addEventListener('click', () => {
        navigator.share({
          title: tour.title,
          text: shareText,
          url: shareUrl
        });
      });
    }

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(shareUrl);
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'; }, 2000);
    });
  };

  const loadRecommendedTours = async (currentTour) => {
    try {
      const response = await fetch('/data/tours.json');
      const tours = await response.json();
      const recommended = tours.filter(t => t.type === currentTour.type && t.slug !== currentTour.slug).slice(0, 3);
      
      const container = document.getElementById('recommendedToursContainer');
      container.innerHTML = recommended.map(tour => `
        <article class="tour-card" data-aos="fade-up">
          <img src="${tour.image}" alt="${tour.title}" loading="lazy" />
          <h3>${tour.title}</h3>
          <p>₹${tour.priceFrom.toLocaleString('en-IN')}</p>
          <a href="tour-detail.html?id=${tour.slug}" class="btn btn-primary">View Details</a>
        </article>
      `).join('');
    } catch (error) {
      console.error('Error loading recommended tours:', error);
    }
  };

  const init = async () => {
    const tour = await loadTourData();
    if (tour) {
      renderTourDetail(tour);
      if (window.AOS) AOS.refresh();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
