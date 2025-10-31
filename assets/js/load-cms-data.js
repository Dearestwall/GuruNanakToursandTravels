/**
 * COMPLETE CMS DATA LOADER - Guru Nanak Tour & Travels
 * Dynamically loads and renders all Netlify CMS content
 * Each item has unique ID/slug for linking and navigation
 */

class GNTTCMSLoader {
  constructor() {
    // Cache all data
    this.cache = {
      tours: null,
      reviews: null,
      services: null,
      destinations: null,
      blog: null,
      team: null,
      siteConfig: null
    };
    
    // Configuration
    this.config = {
      baseUrl: window.location.origin,
      cmsDataPath: '/_data',
      contentPath: '/content',
      uploadPath: '/uploads',
      cacheDuration: 3600000, // 1 hour
      debug: false
    };
    
    this.init();
  }

  /**
   * Initialize loader
   */
  init() {
    this.log('🚀 GNTT CMS Loader initialized');
    
    // Auto-load on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.autoLoad());
    } else {
      this.autoLoad();
    }
    
    // Handle page navigation
    window.addEventListener('popstate', () => this.handleNavigation());
  }

  /**
   * Auto-load content based on current page
   */
  async autoLoad() {
    const currentPage = this.getCurrentPage();
    this.log(`📄 Current page: ${currentPage}`);
    
    switch (currentPage) {
      case 'home':
        await this.loadHomePage();
        break;
      case 'tours':
        await this.loadToursPage();
        break;
      case 'tour-detail':
        await this.loadTourDetail();
        break;
      case 'services':
        await this.loadServicesPage();
        break;
      case 'reviews':
        await this.loadReviewsPage();
        break;
      case 'blog':
        await this.loadBlogPage();
        break;
      case 'destinations':
        await this.loadDestinationsPage();
        break;
      case 'about':
        await this.loadAboutPage();
        break;
      case 'team':
        await this.loadTeamPage();
        break;
      default:
        await this.loadHomePage();
    }
  }

  /**
   * Get current page from URL or body class
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const bodyClass = document.body.className;
    
    if (path.includes('tour-detail') || bodyClass.includes('tour-detail')) return 'tour-detail';
    if (path.includes('tours')) return 'tours';
    if (path.includes('services')) return 'services';
    if (path.includes('reviews')) return 'reviews';
    if (path.includes('blog')) return 'blog';
    if (path.includes('destinations')) return 'destinations';
    if (path.includes('about')) return 'about';
    if (path.includes('team')) return 'team';
    if (path === '/' || path === '/index.html') return 'home';
    
    return 'home';
  }

  /**
   * LOAD HOME PAGE CONTENT
   */
  async loadHomePage() {
    try {
      this.log('📍 Loading home page content...');
      
      // Load featured tours
      await this.renderFeaturedTours('featuredToursContainer', 3);
      
      // Load reviews carousel
      await this.renderReviewsCarousel('.reviews-swiper');
      
      // Load site settings/config
      await this.loadAndDisplaySiteConfig();
      
      // Load services cards dynamically
      await this.renderServicesCards('.services-grid');
      
      this.log('✅ Home page loaded successfully');
      
      // Refresh animations
      if (window.AOS) AOS.refresh();
      if (window.Swiper) this.refreshSwipers();
      
    } catch (error) {
      this.error('Home page load failed:', error);
    }
  }

  /**
   * LOAD ALL TOURS PAGE
   */
  async loadToursPage() {
    try {
      this.log('🗺️ Loading tours page...');
      
      const tours = await this.loadTours();
      const container = document.getElementById('allToursContainer') || 
                       document.querySelector('.tours-grid-all');
      
      if (!container) {
        this.log('⚠️ Tours container not found');
        return;
      }
      
      // Render all tours with filtering
      this.renderAllTours(tours, container);
      
      // Add filter controls
      this.addTourFilters(tours);
      
      this.log('✅ Tours page loaded successfully');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Tours page load failed:', error);
    }
  }

  /**
   * LOAD INDIVIDUAL TOUR DETAIL PAGE
   */
  async loadTourDetail() {
    try {
      this.log('🔍 Loading tour detail...');
      
      // Get tour ID from URL parameter
      const params = new URLSearchParams(window.location.search);
      const tourId = params.get('id');
      
      if (!tourId) {
        this.error('No tour ID provided');
        return;
      }
      
      const tours = await this.loadTours();
      const tour = tours.find(t => t.tour_id === tourId || t.title.toLowerCase().includes(tourId.toLowerCase()));
      
      if (!tour) {
        this.error(`Tour not found: ${tourId}`);
        document.querySelector('.tour-detail-content').innerHTML = 
          `<div class="error-message">Tour not found</div>`;
        return;
      }
      
      // Render tour detail
      this.renderTourDetail(tour);
      
      // Render related tours
      const relatedTours = tours.filter(t => 
        t.tour_id !== tour.tour_id && 
        t.type === tour.type
      ).slice(0, 3);
      
      const relatedContainer = document.querySelector('.related-tours-grid');
      if (relatedContainer) {
        relatedContainer.innerHTML = relatedTours.map(t => 
          this.createTourCard(t)
        ).join('');
      }
      
      // Update page meta
      document.title = `${tour.title} - Guru Nanak Tour & Travels`;
      this.updateMetaTags(tour);
      
      this.log('✅ Tour detail loaded successfully');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Tour detail load failed:', error);
    }
  }

  /**
   * LOAD SERVICES PAGE
   */
  async loadServicesPage() {
    try {
      this.log('⚙️ Loading services page...');
      
      const services = await this.loadServices();
      const container = document.getElementById('allServicesContainer') || 
                       document.querySelector('.services-grid-all');
      
      if (!container) return;
      
      container.innerHTML = services.map((service, index) => 
        this.createServiceCard(service, index)
      ).join('');
      
      this.log('✅ Services page loaded');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Services page load failed:', error);
    }
  }

  /**
   * LOAD REVIEWS PAGE
   */
  async loadReviewsPage() {
    try {
      this.log('⭐ Loading reviews page...');
      
      const reviews = await this.loadReviews();
      const container = document.getElementById('allReviewsContainer') || 
                       document.querySelector('.reviews-grid-all');
      
      if (!container) return;
      
      container.innerHTML = reviews
        .filter(r => r.published)
        .map((review, index) => 
          this.createReviewCard(review, index)
        ).join('');
      
      this.log('✅ Reviews page loaded');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Reviews page load failed:', error);
    }
  }

  /**
   * LOAD BLOG PAGE
   */
  async loadBlogPage() {
    try {
      this.log('📰 Loading blog page...');
      
      const blog = await this.loadBlog();
      const container = document.getElementById('blogPostsContainer') || 
                       document.querySelector('.blog-grid');
      
      if (!container) return;
      
      container.innerHTML = blog.map((post, index) => 
        this.createBlogCard(post, index)
      ).join('');
      
      this.log('✅ Blog page loaded');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Blog page load failed:', error);
    }
  }

  /**
   * LOAD DESTINATIONS PAGE
   */
  async loadDestinationsPage() {
    try {
      this.log('🌍 Loading destinations page...');
      
      const destinations = await this.loadDestinations();
      const container = document.getElementById('destinationsContainer') || 
                       document.querySelector('.destinations-grid');
      
      if (!container) return;
      
      container.innerHTML = destinations.map((dest, index) => 
        this.createDestinationCard(dest, index)
      ).join('');
      
      this.log('✅ Destinations page loaded');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Destinations page load failed:', error);
    }
  }

  /**
   * LOAD TEAM PAGE
   */
  async loadTeamPage() {
    try {
      this.log('👥 Loading team page...');
      
      const team = await this.loadTeam();
      const container = document.getElementById('teamContainer') || 
                       document.querySelector('.team-grid');
      
      if (!container) return;
      
      container.innerHTML = team.map((member, index) => 
        this.createTeamCard(member, index)
      ).join('');
      
      this.log('✅ Team page loaded');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('Team page load failed:', error);
    }
  }

  /**
   * LOAD ABOUT PAGE
   */
  async loadAboutPage() {
    try {
      this.log('ℹ️ Loading about page...');
      
      // Load site config for company info
      const config = await this.loadSiteConfig();
      
      // Load team members
      const team = await this.loadTeam();
      const teamContainer = document.getElementById('aboutTeamContainer');
      if (teamContainer) {
        teamContainer.innerHTML = team.map((member, index) => 
          this.createTeamCard(member, index)
        ).join('');
      }
      
      this.log('✅ About page loaded');
      if (window.AOS) AOS.refresh();
      
    } catch (error) {
      this.error('About page load failed:', error);
    }
  }

  /**
   * FETCH: Load Tours
   */
  async loadTours() {
    if (this.cache.tours) return this.cache.tours;
    
    try {
      const response = await fetch(`${this.config.cmsDataPath}/tours.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.tours = await response.json();
      this.log(`✓ Loaded ${this.cache.tours.length} tours`);
      
      return this.cache.tours;
    } catch (error) {
      this.error('Failed to load tours:', error);
      return [];
    }
  }

  /**
   * FETCH: Load Reviews
   */
  async loadReviews() {
    if (this.cache.reviews) return this.cache.reviews;
    
    try {
      const response = await fetch(`${this.config.cmsDataPath}/reviews.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.reviews = await response.json();
      this.log(`✓ Loaded ${this.cache.reviews.length} reviews`);
      
      return this.cache.reviews;
    } catch (error) {
      this.error('Failed to load reviews:', error);
      return [];
    }
  }

  /**
   * FETCH: Load Services
   */
  async loadServices() {
    if (this.cache.services) return this.cache.services;
    
    try {
      const response = await fetch(`${this.config.cmsDataPath}/services.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.services = await response.json();
      this.log(`✓ Loaded ${this.cache.services.length} services`);
      
      return this.cache.services;
    } catch (error) {
      this.error('Failed to load services:', error);
      return [];
    }
  }

  /**
   * FETCH: Load Destinations
   */
  async loadDestinations() {
    if (this.cache.destinations) return this.cache.destinations;
    
    try {
      const response = await fetch(`${this.config.cmsDataPath}/destinations.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.destinations = await response.json();
      this.log(`✓ Loaded ${this.cache.destinations.length} destinations`);
      
      return this.cache.destinations;
    } catch (error) {
      this.error('Failed to load destinations:', error);
      return [];
    }
  }

  /**
   * FETCH: Load Blog
   */
  async loadBlog() {
    if (this.cache.blog) return this.cache.blog;
    
    try {
      const response = await fetch(`${this.config.contentPath}/blog/index.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.blog = await response.json();
      this.log(`✓ Loaded ${this.cache.blog.length} blog posts`);
      
      return this.cache.blog;
    } catch (error) {
      this.error('Failed to load blog:', error);
      return [];
    }
  }

  /**
   * FETCH: Load Team
   */
  async loadTeam() {
    if (this.cache.team) return this.cache.team;
    
    try {
      const response = await fetch(`${this.config.cmsDataPath}/team.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.team = await response.json();
      this.log(`✓ Loaded ${this.cache.team.length} team members`);
      
      return this.cache.team;
    } catch (error) {
      this.error('Failed to load team:', error);
      return [];
    }
  }

  /**
   * FETCH: Load Site Configuration
   */
  async loadSiteConfig() {
    if (this.cache.siteConfig) return this.cache.siteConfig;
    
    try {
      const response = await fetch(`${this.config.cmsDataPath}/site-config.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.cache.siteConfig = await response.json();
      this.log('✓ Loaded site configuration');
      
      return this.cache.siteConfig;
    } catch (error) {
      this.error('Failed to load site config:', error);
      return {};
    }
  }

  /**
   * RENDER: Featured Tours (Home Page)
   */
  async renderFeaturedTours(containerId, limit = 3) {
    const tours = await this.loadTours();
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const featured = tours
      .filter(t => t.featured || true)
      .slice(0, limit);
    
    container.innerHTML = featured.map((tour, idx) => 
      this.createTourCard(tour, idx)
    ).join('');
    
    this.log(`✓ Rendered ${featured.length} featured tours`);
  }

  /**
   * RENDER: All Tours Page
   */
  renderAllTours(tours, container) {
    container.innerHTML = tours.map((tour, idx) => 
      this.createTourCard(tour, idx)
    ).join('');
    
    this.log(`✓ Rendered ${tours.length} tours`);
  }

  /**
   * RENDER: Reviews Carousel
   */
  async renderReviewsCarousel(swiperSelector) {
    const reviews = await this.loadReviews();
    const wrapper = document.querySelector(`${swiperSelector} .swiper-wrapper`);
    
    if (!wrapper) return;
    
    wrapper.innerHTML = reviews
      .filter(r => r.published)
      .map(review => this.createReviewSlide(review))
      .join('');
    
    // Reinitialize Swiper if exists
    if (window.Swiper && document.querySelector(swiperSelector).swiper) {
      document.querySelector(swiperSelector).swiper.update();
    }
    
    this.log(`✓ Rendered ${reviews.length} reviews`);
  }

  /**
   * RENDER: Services Grid
   */
  async renderServicesCards(selector) {
    const services = await this.loadServices();
    const container = document.querySelector(selector);
    
    if (!container) return;
    
    container.innerHTML = services.map((service, idx) => 
      this.createServiceCard(service, idx)
    ).join('');
    
    this.log(`✓ Rendered ${services.length} services`);
  }

  /**
   * RENDER: Tour Detail Page
   */
  renderTourDetail(tour) {
    const container = document.querySelector('.tour-detail-content');
    if (!container) return;
    
    const itineraryHtml = tour.itinerary?.map((day, idx) => `
      <div class="itinerary-day" id="day-${idx + 1}" data-day-id="day-${tour.tour_id}-${idx + 1}">
        <h4 class="day-title">Day ${day.day}: ${day.title}</h4>
        <p class="day-description">${day.description}</p>
        <div class="day-meta">
          <span class="day-meals">🍽️ ${day.meals}</span>
          <span class="day-accommodation">🏨 ${day.accommodation}</span>
        </div>
      </div>
    `).join('') || '';
    
    const highlightsHtml = tour.highlights?.map(h => 
      `<li class="highlight-item">${h}</li>`
    ).join('') || '';
    
    const inclusionsHtml = tour.inclusions?.map(i => 
      `<li class="inclusion-item">✓ ${i}</li>`
    ).join('') || '';
    
    const exclusionsHtml = tour.exclusions?.map(e => 
      `<li class="exclusion-item">✗ ${e}</li>`
    ).join('') || '';
    
    container.innerHTML = `
      <article class="tour-detail" id="tour-${tour.tour_id}" data-tour-id="${tour.tour_id}">
        
        <!-- Hero Image -->
        <div class="tour-detail-hero">
          <img src="${tour.image}" alt="${tour.title}" loading="eager" />
          <div class="tour-badge tour-badge-${tour.type.toLowerCase()}">${tour.type}</div>
        </div>
        
        <!-- Header Info -->
        <div class="tour-detail-header">
          <div class="tour-detail-meta">
            <span class="meta-duration">⏱️ ${tour.duration.days} Days / ${tour.duration.nights} Nights</span>
            <span class="meta-difficulty">📊 ${tour.difficulty || 'Not specified'}</span>
            <span class="meta-season">🌡️ Best: ${tour.best_season}</span>
          </div>
          <h1 class="tour-detail-title">${tour.title}</h1>
          <p class="tour-detail-excerpt">${tour.excerpt}</p>
        </div>
        
        <!-- Main Content -->
        <div class="tour-detail-grid">
          <div class="tour-detail-main">
            
            <!-- Description -->
            <section class="tour-section" id="description-section">
              <h2>About This Tour</h2>
              <div class="tour-description-text">${tour.description}</div>
            </section>
            
            <!-- Itinerary -->
            ${tour.itinerary?.length > 0 ? `
              <section class="tour-section" id="itinerary-section">
                <h2>Detailed Itinerary</h2>
                <div class="itinerary-container">
                  ${itineraryHtml}
                </div>
              </section>
            ` : ''}
            
            <!-- Destinations -->
            ${tour.destinations?.length > 0 ? `
              <section class="tour-section" id="destinations-section">
                <h2>Destinations Covered</h2>
                <div class="destinations-list">
                  ${tour.destinations.map((dest, idx) => `
                    <span class="destination-tag" id="dest-${tour.tour_id}-${idx}" data-destination-id="${dest.toLowerCase().replace(/\s+/g, '-')}">
                      📍 ${dest}
                    </span>
                  `).join('')}
                </div>
              </section>
            ` : ''}
            
            <!-- Gallery -->
            ${tour.gallery?.length > 0 ? `
              <section class="tour-section" id="gallery-section">
                <h2>Tour Gallery</h2>
                <div class="gallery-grid">
                  ${tour.gallery.map((img, idx) => `
                    <img src="${img.image}" alt="Gallery image ${idx + 1}" loading="lazy" id="gallery-img-${idx}" />
                  `).join('')}
                </div>
              </section>
            ` : ''}
          </div>
          
          <!-- Sidebar -->
          <aside class="tour-detail-sidebar">
            
            <!-- Pricing -->
            <div class="tour-card-pricing" id="pricing-box">
              <div class="price-display">
                <span class="price-label">Starting From</span>
                <span class="price-amount">₹${tour.price.toLocaleString('en-IN')}</span>
              </div>
              <button class="booking-btn-primary" onclick="window.location.href='/booking/index.html?tour=${tour.tour_id}'">
                Book This Tour
              </button>
              <a href="tel:+916283315156" class="booking-btn-secondary">
                Call for Details
              </a>
              <a href="https://wa.me/916283315156?text=Interested%20in%20${tour.title}" class="booking-btn-whatsapp" target="_blank">
                WhatsApp Inquiry
              </a>
            </div>
            
            <!-- Key Info Box -->
            <div class="tour-info-box">
              <h3>Quick Info</h3>
              <ul class="info-list">
                <li><strong>Duration:</strong> ${tour.duration.days}D/${tour.duration.nights}N</li>
                <li><strong>Group Size:</strong> ${tour.group_size}</li>
                <li><strong>Difficulty:</strong> ${tour.difficulty}</li>
                <li><strong>Best Season:</strong> ${tour.best_season}</li>
              </ul>
            </div>
            
            <!-- Inclusions -->
            <div class="tour-info-box">
              <h3>What's Included</h3>
              <ul class="inclusions-list">
                ${inclusionsHtml}
              </ul>
            </div>
            
            <!-- Exclusions -->
            <div class="tour-info-box">
              <h3>What's Not Included</h3>
              <ul class="exclusions-list">
                ${exclusionsHtml}
              </ul>
            </div>
            
            <!-- Share -->
            <div class="tour-share">
              <h3>Share This Tour</h3>
              <a href="https://facebook.com/sharer.php?u=${window.location.href}" class="share-btn" target="_blank">📘 Facebook</a>
              <a href="https://wa.me/?text=${window.location.href}" class="share-btn" target="_blank">💬 WhatsApp</a>
              <a href="https://twitter.com/intent/tweet?url=${window.location.href}" class="share-btn" target="_blank">𝕏 Twitter</a>
            </div>
          </aside>
        </div>
      </article>
    `;
  }

  /**
   * CREATE: Tour Card HTML
   */
  createTourCard(tour, index = 0) {
    return `
      <article class="tour-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-tour-id="${tour.tour_id}" id="tour-card-${tour.tour_id}">
        <div class="tour-image-wrapper">
          <img 
            src="${tour.image}" 
            alt="${tour.title} - ${tour.type} tour" 
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
            <span class="tour-duration">⏱️ ${tour.duration.days}D/${tour.duration.nights}N</span>
            <span class="tour-type">${tour.type}</span>
          </div>
          <h3 class="tour-title" id="tour-title-${tour.tour_id}">${tour.title}</h3>
          <p class="tour-description">${tour.excerpt}</p>
          ${tour.highlights?.length > 0 ? `
            <div class="tour-highlights">
              <ul>
                ${tour.highlights.slice(0, 3).map(h => `<li>${h}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="tour-footer">
            <div class="tour-price">
              <span class="price-label">From</span>
              <span class="price-amount">₹${tour.price.toLocaleString('en-IN')}</span>
            </div>
            <a href="tour-detail.html?id=${tour.tour_id}" class="tour-btn" aria-label="View details for ${tour.title}">
              View Details
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * CREATE: Service Card HTML
   */
  createServiceCard(service, index = 0) {
    return `
      <article class="service-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-service-id="${service.title.toLowerCase().replace(/\s+/g, '-')}" id="service-${index}">
        <div class="service-icon" aria-hidden="true">${service.icon || '⚙️'}</div>
        ${service.image ? `
          <img 
            src="${service.image}" 
            alt="${service.title}" 
            loading="lazy" 
            class="service-image"
            width="300"
            height="200"
            decoding="async"
          />
        ` : ''}
        <h3 class="service-title" id="service-title-${index}">${service.title}</h3>
        <p class="service-description">${service.excerpt || service.description}</p>
        ${service.features?.length > 0 ? `
          <ul class="service-features">
            ${service.features.slice(0, 3).map(f => `<li>✓ ${f}</li>`).join('')}
          </ul>
        ` : ''}
        <div class="service-footer">
          ${service.price ? `<span class="service-price">${service.price}</span>` : ''}
          <a href="${service.cta_link || '#contact'}" class="service-link">${service.cta_text || 'Learn More'} →</a>
        </div>
      </article>
    `;
  }

  /**
   * CREATE: Review Card HTML
   */
  createReviewCard(review, index = 0) {
    return `
      <article class="review-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-review-id="review-${index}" id="review-${index}">
        <div class="review-avatar">
          <img 
            src="${review.avatar || 'https://via.placeholder.com/60x60?text=Avatar'}" 
            alt="${review.title}"
            loading="lazy"
            width="60"
            height="60"
            decoding="async"
          />
        </div>
        <div class="review-header">
          <h4 class="review-author">${review.title}</h4>
          <p class="review-location">${review.location || 'India'}</p>
          <div class="review-stars" aria-label="${review.rating} star rating">
            ${'⭐'.repeat(review.rating)}
          </div>
        </div>
        <p class="review-text">"${review.text}"</p>
        ${review.tour ? `<span class="review-tour-tag">Tour: ${review.tour}</span>` : ''}
      </article>
    `;
  }

  /**
   * CREATE: Review Slide (for carousel)
   */
  createReviewSlide(review) {
    return `
      <blockquote class="swiper-slide review-card" data-review-id="review-${review.title.toLowerCase().replace(/\s+/g, '-')}">
        <div class="review-avatar">
          <img 
            src="${review.avatar || 'https://via.placeholder.com/60x60?text=Avatar'}" 
            alt="${review.title}"
            loading="lazy"
            width="60"
            height="60"
            decoding="async"
          />
        </div>
        <div class="review-stars" aria-label="${review.rating} star rating">${'⭐'.repeat(review.rating)}</div>
        <p class="review-text">"${review.text}"</p>
        <cite class="review-author">— ${review.title}, ${review.location || 'India'}</cite>
      </blockquote>
    `;
  }

  /**
   * CREATE: Blog Card HTML
   */
  createBlogCard(post, index = 0) {
    const postSlug = post.title.toLowerCase().replace(/\s+/g, '-');
    
    return `
      <article class="blog-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-blog-id="${postSlug}" id="blog-post-${index}">
        ${post.image ? `
          <img 
            src="${post.image}" 
            alt="${post.title}" 
            loading="lazy" 
            class="blog-image"
            width="400"
            height="250"
            decoding="async"
          />
        ` : ''}
        <div class="blog-content">
          <div class="blog-meta">
            <span class="blog-date">${new Date(post.date).toLocaleDateString('en-IN')}</span>
            ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
          </div>
          <h3 class="blog-title">${post.title}</h3>
          <p class="blog-excerpt">${post.excerpt || post.body?.substring(0, 150)}</p>
          <a href="blog-post.html?id=${postSlug}" class="blog-link">Read More →</a>
        </div>
      </article>
    `;
  }

  /**
   * CREATE: Destination Card HTML
   */
  createDestinationCard(destination, index = 0) {
    const destSlug = destination.title.toLowerCase().replace(/\s+/g, '-');
    
    return `
      <article class="destination-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-destination-id="${destSlug}" id="destination-${index}">
        <div class="destination-image">
          <img 
            src="${destination.image}" 
            alt="${destination.title}" 
            loading="lazy"
            width="400"
            height="300"
            decoding="async"
          />
        </div>
        <div class="destination-content">
          <h3 class="destination-title">${destination.title}</h3>
          <p class="destination-description">${destination.description}</p>
          ${destination.highlights?.length > 0 ? `
            <ul class="destination-highlights">
              ${destination.highlights.slice(0, 3).map(h => `<li>📍 ${h}</li>`).join('')}
            </ul>
          ` : ''}
          <a href="tours/index.html?destination=${destSlug}" class="destination-link">Explore Tours →</a>
        </div>
      </article>
    `;
  }

  /**
   * CREATE: Team Card HTML
   */
  createTeamCard(member, index = 0) {
    const memberId = member.title.toLowerCase().replace(/\s+/g, '-');
    
    return `
      <article class="team-card" data-aos="fade-up" data-aos-delay="${index * 100}" data-team-id="${memberId}" id="team-member-${index}">
        <div class="team-photo">
          <img 
            src="${member.photo || 'https://via.placeholder.com/300x350?text=${member.title}'}" 
            alt="${member.title}" 
            loading="lazy"
            width="300"
            height="350"
            decoding="async"
          />
        </div>
        <div class="team-content">
          <h3 class="team-name">${member.title}</h3>
          <p class="team-position">${member.position || ''}</p>
          <p class="team-bio">${member.bio || ''}</p>
          <div class="team-contact">
            ${member.phone ? `<a href="tel:${member.phone}" class="contact-btn">📞</a>` : ''}
            ${member.email ? `<a href="mailto:${member.email}" class="contact-btn">📧</a>` : ''}
            ${member.social?.whatsapp ? `<a href="${member.social.whatsapp}" class="contact-btn" target="_blank">💬</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Add Tour Filter Controls
   */
  addTourFilters(tours) {
    const filterContainer = document.querySelector('.tour-filters');
    if (!filterContainer) return;
    
    const types = [...new Set(tours.map(t => t.type))];
    const priceRanges = ['0-20000', '20000-50000', '50000-100000', '100000+'];
    
    filterContainer.innerHTML = `
      <div class="filter-group">
        <label for="tour-type-filter">Tour Type:</label>
        <select id="tour-type-filter" onchange="cmsLoader.filterTours()">
          <option value="">All Types</option>
          ${types.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      
      <div class="filter-group">
        <label for="tour-price-filter">Price Range:</label>
        <select id="tour-price-filter" onchange="cmsLoader.filterTours()">
          <option value="">All Prices</option>
          ${priceRanges.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
      
      <button class="filter-reset-btn" onclick="cmsLoader.resetFilters()">Reset Filters</button>
    `;
  }

  /**
   * Filter Tours based on criteria
   */
  filterTours() {
    const typeFilter = document.getElementById('tour-type-filter')?.value || '';
    const priceFilter = document.getElementById('tour-price-filter')?.value || '';
    
    const cards = document.querySelectorAll('.tour-card');
    
    cards.forEach(card => {
      const tour = card.dataset;
      const type = tour.tourType || '';
      const price = parseInt(tour.tourPrice) || 0;
      
      let show = true;
      
      if (typeFilter && type !== typeFilter) show = false;
      
      if (priceFilter) {
        const [min, max] = priceFilter === '100000+' 
          ? [100000, Infinity]
          : priceFilter.split('-').map(Number);
        
        if (price < min || price > max) show = false;
      }
      
      card.style.display = show ? 'block' : 'none';
    });
  }

  /**
   * Reset all filters
   */
  resetFilters() {
    document.getElementById('tour-type-filter').value = '';
    document.getElementById('tour-price-filter').value = '';
    this.filterTours();
  }

  /**
   * Load and Display Site Configuration
   */
  async loadAndDisplaySiteConfig() {
    const config = await this.loadSiteConfig();
    
    // Update dynamic header elements
    const contactPhone = document.querySelector('.contact-phone');
    if (contactPhone) contactPhone.textContent = config.contact_phone;
    
    const contactEmail = document.querySelector('.contact-email');
    if (contactEmail) contactEmail.textContent = config.contact_email;
    
    // Update footer
    const footerConfig = document.querySelector('.footer-config');
    if (footerConfig) {
      footerConfig.innerHTML = `
        <p><strong>Business Hours:</strong> ${config.office_hours}</p>
        <p><strong>Address:</strong> ${config.office_address}</p>
      `;
    }
  }

  /**
   * Handle page navigation
   */
  handleNavigation() {
    this.log('🔄 Navigation detected, reloading content...');
    this.cache = {}; // Clear cache on navigation
    this.autoLoad();
  }

  /**
   * Update Meta Tags for SEO
   */
  updateMetaTags(item) {
    // Update title
    document.title = `${item.title} | Guru Nanak Tour & Travels`;
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = item.meta_description || item.excerpt || '';
    }
    
    // Update keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && item.seo_keywords) {
      metaKeywords.content = Array.isArray(item.seo_keywords) 
        ? item.seo_keywords.join(', ')
        : item.seo_keywords;
    }
    
    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = item.title;
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = item.excerpt || '';
    
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && item.image) ogImage.content = item.image;
  }

  /**
   * Refresh Swiper instances
   */
  refreshSwipers() {
    document.querySelectorAll('.swiper').forEach(swiperEl => {
      if (swiperEl.swiper) {
        swiperEl.swiper.update();
      }
    });
  }

  /**
   * Logging functions
   */
  log(message) {
    if (this.config.debug) {
      console.log(`%c${message}`, 'color: #0a3d62; font-weight: bold;');
    }
  }

  error(message, error) {
    console.error(`%c❌ ${message}`, 'color: #d63031; font-weight: bold;', error);
  }
}

// Initialize globally
const cmsLoader = new GNTTCMSLoader();

// Expose for debugging
window.cmsLoader = cmsLoader;
window.GNTTCMSLoader = GNTTCMSLoader;
