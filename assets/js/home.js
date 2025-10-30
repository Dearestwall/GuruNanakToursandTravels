/**
 * Home Page Specific JavaScript
 * - Stats Counter Animation
 * - Enhanced Swiper Initialization
 * - Parallax Effects
 * - Dynamic Content Loading
 * @version 2.0
 */

(function() {
  'use strict';

  // ============================================
  // 1. STATS COUNTER ANIMATION
  // ============================================
  const initStatsCounter = () => {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (!statNumbers.length) return;

    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px 0px -50px 0px'
    };

    const animateCounter = (element) => {
      const target = parseInt(element.dataset.count);
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // 60fps
      let current = 0;

      const updateCounter = () => {
        current += increment;
        
        if (current >= target) {
          // Format final number
          if (target === 24) {
            element.textContent = '24/7';
          } else {
            element.textContent = target.toLocaleString('en-IN') + '+';
          }
        } else {
          element.textContent = Math.floor(current).toLocaleString('en-IN');
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    statNumbers.forEach(stat => observer.observe(stat));
  };

  // ============================================
  // 2. ENHANCED SWIPER INITIALIZATION
  // ============================================
  const initHomeSliders = () => {
    if (typeof Swiper === 'undefined') {
      console.warn('Swiper library not loaded');
      return;
    }

    // Hero Slider - Fast auto-slide (4 seconds)
    const heroSwiper = document.querySelector('.hero-swiper');
    if (heroSwiper) {
      new Swiper('.hero-swiper', {
        loop: true,
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        },
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        speed: 1200,
        pagination: {
          el: '.hero-swiper .swiper-pagination',
          clickable: true,
          dynamicBullets: true,
          renderBullet: function (index, className) {
            return '<span class="' + className + '" aria-label="Go to slide ' + (index + 1) + '"></span>';
          }
        },
        navigation: {
          nextEl: '.hero-swiper .swiper-button-next',
          prevEl: '.hero-swiper .swiper-button-prev'
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true
        },
        a11y: {
          enabled: true,
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide'
        },
        on: {
          init: function() {
            console.log('✅ Hero slider initialized');
          },
          slideChange: function() {
            // Optional: Track slide changes for analytics
            const activeIndex = this.realIndex + 1;
            console.log('Hero slide changed to:', activeIndex);
          }
        }
      });
    }

    // Reviews Slider - Fast auto-scroll (4.5 seconds)
    const reviewsSwiper = document.querySelector('.reviews-swiper');
    if (reviewsSwiper) {
      new Swiper('.reviews-swiper', {
        loop: true,
        autoplay: {
          delay: 4500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        speed: 800,
        slidesPerView: 1,
        spaceBetween: 24,
        pagination: {
          el: '.reviews-swiper .swiper-pagination',
          clickable: true,
          dynamicBullets: true
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true
        },
        breakpoints: {
          640: {
            slidesPerView: 2,
            spaceBetween: 28
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 32
          },
          1440: {
            slidesPerView: 3,
            spaceBetween: 40
          }
        },
        on: {
          init: function() {
            console.log('✅ Reviews slider initialized');
          }
        }
      });
    }
  };

  // ============================================
  // 3. PARALLAX SCROLL EFFECTS
  // ============================================
  const initParallaxEffects = () => {
    const heroSection = document.querySelector('.hero-section');
    
    if (!heroSection) return;

    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const heroHeight = heroSection.offsetHeight;
      
      if (scrolled < heroHeight) {
        const activeSlide = document.querySelector('.hero-slide.swiper-slide-active img');
        if (activeSlide) {
          // Subtle parallax effect
          const parallaxSpeed = 0.5;
          activeSlide.style.transform = `translateY(${scrolled * parallaxSpeed}px) scale(1.1)`;
        }
      }
      
      ticking = false;
    };

    const requestParallaxTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestParallaxTick, { passive: true });
  };

  // ============================================
  // 4. LAZY LOAD IMAGES
  // ============================================
  const initLazyLoading = () => {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      return;
    }

    // Fallback for older browsers
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  };

  // ============================================
  // 5. SEARCH FUNCTIONALITY (HOME PAGE)
  // ============================================
  const initHomeSearch = () => {
    const searchForms = document.querySelectorAll('.search-form, .search-modal-form, .mobile-search-form form');
    
    searchForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const input = form.querySelector('input[type="search"]');
        const query = input ? input.value.trim() : '';
        
        if (!query) {
          if (input) input.focus();
          return;
        }

        // Redirect to search results or tours page with query
        const searchUrl = `tours.html?q=${encodeURIComponent(query)}`;
        window.location.href = searchUrl;
      });
    });

    // Suggestion tags
    const suggestionTags = document.querySelectorAll('.suggestion-tag');
    suggestionTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const href = tag.getAttribute('href');
        
        // Add smooth transition
        document.body.style.opacity = '0.7';
        setTimeout(() => {
          window.location.href = href;
        }, 150);
      });
    });
  };

  // ============================================
  // 6. SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  const initSmoothScroll = () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        if (href === '#' || href === '#main') return;
        
        const target = document.querySelector(href);
        
        if (target) {
          e.preventDefault();
          
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  };

  // ============================================
  // 7. DYNAMIC CONTENT LOADING (OPTIONAL)
  // ============================================
  const loadDynamicContent = () => {
    // This function can be used to load content from CMS or API
    // Example: Fetch latest tour packages, reviews, etc.
    
    try {
      // Check if there's a data attribute for dynamic loading
      const dynamicSections = document.querySelectorAll('[data-load-content]');
      
      dynamicSections.forEach(section => {
        const contentUrl = section.dataset.loadContent;
        if (contentUrl) {
          // Fetch and inject content
          console.log('Would load content from:', contentUrl);
        }
      });
    } catch (error) {
      console.warn('Dynamic content loading error:', error);
    }
  };

  // ============================================
  // 8. INITIALIZE ALL HOME PAGE FEATURES
  // ============================================
  const initHomePage = () => {
    console.log('🏠 Initializing home page...');

    // Initialize stats counter
    initStatsCounter();

    // Initialize sliders
    initHomeSliders();

    // Initialize parallax effects
    initParallaxEffects();

    // Initialize lazy loading fallback
    initLazyLoading();

    // Initialize search functionality
    initHomeSearch();

    // Initialize smooth scroll
    initSmoothScroll();

    // Load dynamic content (if needed)
    loadDynamicContent();

    console.log('✅ Home page fully initialized');
  };

  // ============================================
  // WAIT FOR DOM AND LIBRARIES
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
  } else {
    // DOM already loaded, wait a bit for libraries
    setTimeout(initHomePage, 100);
  }

  // Re-initialize on window load to ensure all resources are ready
  window.addEventListener('load', () => {
    // Ensure sliders are properly sized
    if (window.Swiper) {
      const allSwipers = document.querySelectorAll('.swiper');
      allSwipers.forEach(swiperEl => {
        if (swiperEl.swiper) {
          swiperEl.swiper.update();
        }
      });
    }
  });

})();
