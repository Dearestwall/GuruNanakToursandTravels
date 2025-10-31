/**
 * HOME.JS - Homepage Specific Functionality
 * Hero Slider, Stats Counter, Reviews Slider, Animations
 * Guru Nanak Tour & Travels
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
      const increment = target / (duration / 16); // 60 FPS
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current >= target) {
          element.textContent = target === 24 ? '24/7' : target.toLocaleString('en-IN') + '+';
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

    console.log('✅ Stats counter initialized');
  };

  // ============================================
  // 2. HERO SWIPER (Super Fast: 2.5s)
  // ============================================
  const initHeroSwiper = () => {
    if (typeof Swiper === 'undefined') {
      console.warn('⚠️ Swiper library not loaded');
      return;
    }

    const heroSwiper = document.querySelector('.hero-swiper');
    if (!heroSwiper) return;

    // Store swiper instance globally
    window.heroSwiperInstance = new Swiper('.hero-swiper', {
      loop: true,
      effect: 'fade',
      fadeEffect: {
        crossFade: true
      },
      autoplay: {
        delay: 2500, // 2.5 seconds
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      speed: 900,
      pagination: {
        el: '.hero-swiper .swiper-pagination',
        clickable: true,
        dynamicBullets: true
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
        nextSlideMessage: 'Next slide'
      },
      on: {
        init: function() {
          console.log('✅ Hero swiper initialized - 2.5s autoplay');
        }
      }
    });
  };

  // ============================================
  // 3. REVIEWS SWIPER (Moderate: 4.5s)
  // ============================================
  const initReviewsSwiper = () => {
    if (typeof Swiper === 'undefined') return;

    const reviewsSwiper = document.querySelector('.reviews-swiper');
    if (!reviewsSwiper) return;

    // Store swiper instance globally
    window.reviewsSwiperInstance = new Swiper('.reviews-swiper', {
      loop: true,
      autoplay: {
        delay: 4500, // 4.5 seconds
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
          slidesPerView: 1.5,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 2.5,
          spaceBetween: 28
        },
        1440: {
          slidesPerView: 3,
          spaceBetween: 32
        }
      },
      on: {
        init: function() {
          console.log('✅ Reviews swiper initialized - 4.5s autoplay');
        }
      }
    });
  };

  // ============================================
  // 4. PARALLAX EFFECT ON HERO
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
          const parallaxSpeed = 0.3;
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

    console.log('✅ Parallax effects initialized');
  };

  // ============================================
  // 5. SCROLL REVEAL ANIMATIONS
  // ============================================
  const initScrollReveals = () => {
    const elements = document.querySelectorAll('.fade-in-observe');
    if (!elements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    elements.forEach(el => observer.observe(el));

    console.log('✅ Scroll reveals initialized');
  };

  // ============================================
  // 6. INITIALIZE HOME PAGE
  // ============================================
  const init = () => {
    console.log('🏠 Initializing home.js...');

    initStatsCounter();
    initHeroSwiper();
    initReviewsSwiper();
    initParallaxEffects();
    initScrollReveals();

    console.log('✅ Home.js initialized');
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  // Re-initialize swipers on window load
  window.addEventListener('load', () => {
    if (typeof Swiper !== 'undefined') {
      document.querySelectorAll('.swiper').forEach(swiperEl => {
        if (swiperEl.swiper) {
          swiperEl.swiper.update();
        }
      });
    }
  });

  // Export for global access
  window.homeModule = {
    initStatsCounter,
    initHeroSwiper,
    initReviewsSwiper,
    initParallaxEffects
  };

})();
