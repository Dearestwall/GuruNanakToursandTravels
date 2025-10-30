/* ============================================
   GNTT Swiper Configurations
   Hero, Reviews, Gallery, Tours
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  if (!window.Swiper) {
    console.warn('⚠️ Swiper not loaded');
    return;
  }

  // ==========================================
  // Hero Slider
  // ==========================================
  const heroEl = document.querySelector('.hero-swiper');
  
  if (heroEl) {
    new Swiper(heroEl, {
      loop: true,
      lazy: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      speed: 800,
      effect: 'fade',
      fadeEffect: {
        crossFade: true
      },
      pagination: {
        el: '.hero .swiper-pagination',
        clickable: true,
        dynamicBullets: true
      },
      navigation: {
        nextEl: '.hero .swiper-button-next',
        prevEl: '.hero .swiper-button-prev'
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true
      },
      a11y: {
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        paginationBulletMessage: 'Go to slide {{index}}'
      }
    });
    
    console.log('🎠 Hero slider initialized');
  }

  // ==========================================
  // Reviews Slider
  // ==========================================
  const reviewsEl = document.querySelector('.reviews-swiper');
  
  if (reviewsEl) {
    new Swiper(reviewsEl, {
      loop: true,
      autoHeight: true,
      spaceBetween: 16,
      pagination: {
        el: '.reviews .swiper-pagination',
        clickable: true
      },
      keyboard: {
        enabled: true
      },
      slidesPerView: 1,
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 20
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 24
        }
      },
      a11y: {
        enabled: true
      }
    });
    
    console.log('💬 Reviews slider initialized');
  }

  // ==========================================
  // Tour Gallery Slider (if on tours page)
  // ==========================================
  const tourGalleryEl = document.querySelector('.tour-gallery');
  
  if (tourGalleryEl) {
    window.tourGallerySwiper = new Swiper(tourGalleryEl, {
      loop: true,
      lazy: true,
      keyboard: {
        enabled: true
      },
      pagination: {
        el: '.tour-gallery .swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.tour-gallery .swiper-button-next',
        prevEl: '.tour-gallery .swiper-button-prev'
      },
      slidesPerView: 1,
      spaceBetween: 8,
      breakpoints: {
        768: {
          slidesPerView: 2,
          spaceBetween: 12
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 16
        }
      }
    });
    
    console.log('🖼️ Tour gallery slider initialized');
  }

  // ==========================================
  // Lightbox Slider (if on gallery page)
  // ==========================================
  const lightboxEl = document.querySelector('.lightbox-swiper');
  
  if (lightboxEl) {
    window.lightboxSwiper = new Swiper(lightboxEl, {
      loop: true,
      lazy: true,
      keyboard: {
        enabled: true
      },
      pagination: {
        el: '.lightbox-swiper .swiper-pagination',
        clickable: true,
        type: 'fraction'
      },
      navigation: {
        nextEl: '.lightbox-swiper .swiper-button-next',
        prevEl: '.lightbox-swiper .swiper-button-prev'
      },
      slidesPerView: 1,
      spaceBetween: 0,
      zoom: {
        maxRatio: 3,
        minRatio: 1
      }
    });
    
    console.log('🔍 Lightbox slider initialized');
  }

});
