/**
 * Load and display data from Netlify CMS JSON files
 * This dynamically populates pages with CMS content
 */

class CMSDataLoader {
  constructor() {
    this.toursCache = null;
    this.reviewsCache = null;
    this.servicesCache = null;
  }

  // Load tours from CMS
  async loadTours() {
    if (this.toursCache) return this.toursCache;
    
    try {
      const response = await fetch('_data/tours.json');
      this.toursCache = await response.json();
      return this.toursCache;
    } catch (error) {
      console.error('Error loading tours:', error);
      return [];
    }
  }

  // Load reviews from CMS
  async loadReviews() {
    if (this.reviewsCache) return this.reviewsCache;
    
    try {
      const response = await fetch('_data/reviews.json');
      this.reviewsCache = await response.json();
      return this.reviewsCache;
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  }

  // Load services from CMS
  async loadServices() {
    if (this.servicesCache) return this.servicesCache;
    
    try {
      const response = await fetch('_data/services.json');
      this.servicesCache = await response.json();
      return this.servicesCache;
    } catch (error) {
      console.error('Error loading services:', error);
      return [];
    }
  }

  // Render tours to container
  async renderTours(containerId, limit = 3) {
    const tours = await this.loadTours();
    const container = document.getElementById(containerId);
    
    if (!container) return;

    const featuredTours = tours
      .filter(tour => tour.featured || true)
      .slice(0, limit);

    container.innerHTML = featuredTours.map((tour, index) => `
      <article class="tour-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-tour-id="${tour.tour_id}">
        <div class="tour-image-wrapper">
          <img 
            src="${tour.image}" 
            alt="${tour.title} - ${tour.type} tour package" 
            loading="lazy" 
            class="tour-image"
            width="400"
            height="300"
            decoding="async"
          />
          <span class="tour-badge tour-badge-${tour.type.toLowerCase()}">${tour.type}</span>
        </div>
        <div class="tour-content">
          <div class="tour-meta">
            <span class="tour-duration">${tour.duration.days} Days / ${tour.duration.nights} Nights</span>
            <span class="tour-type">${tour.type}</span>
          </div>
          <h3 class="tour-title">${tour.title}</h3>
          <p class="tour-description">${tour.excerpt}</p>
          <div class="tour-highlights">
            <ul>
              ${tour.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>
          <div class="tour-footer">
            <div class="tour-price">
              <span class="price-label">From</span>
              <span class="price-amount">₹${tour.price.toLocaleString('en-IN')}</span>
            </div>
            <a href="tours/detail.html?id=${tour.tour_id}" class="tour-btn" aria-label="View details for ${tour.title}">View Details</a>
          </div>
        </div>
      </article>
    `).join('');

    // Trigger AOS if available
    if (window.AOS) {
      AOS.refresh();
    }
  }

  // Render reviews to container
  async renderReviews(containerId) {
    const reviews = await this.loadReviews();
    const container = document.querySelector(`${containerId} .swiper-wrapper`);
    
    if (!container) return;

    container.innerHTML = reviews
      .filter(r => r.published)
      .map(review => `
        <blockquote class="swiper-slide review-card">
          <div class="review-avatar">
            <img 
              src="${review.avatar || 'https://i.ibb.co/YFNFZjyf/image.png'}" 
              alt="${review.title} review"
              loading="lazy"
              width="60"
              height="60"
              decoding="async"
            />
          </div>
          <div class="review-stars" aria-label="${review.rating} star rating">${'⭐'.repeat(review.rating)}</div>
          <p class="review-text">"${review.text}"</p>
          <cite class="review-author">— ${review.title}, ${review.location}</cite>
        </blockquote>
      `).join('');

    // Reinitialize Swiper if it exists
    if (window.reviewsSwiper) {
      window.reviewsSwiper.update();
    }
  }

  // Get site config
  async loadSiteConfig() {
    try {
      const response = await fetch('_data/site-config.json');
      return await response.json();
    } catch (error) {
      console.error('Error loading site config:', error);
      return {};
    }
  }
}

// Initialize on document ready
const cmsLoader = new CMSDataLoader();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    cmsLoader.renderTours('featuredToursContainer', 3);
    cmsLoader.renderReviews('.reviews-swiper');
  });
} else {
  cmsLoader.renderTours('featuredToursContainer', 3);
  cmsLoader.renderReviews('.reviews-swiper');
}
