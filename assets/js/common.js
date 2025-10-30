/**
 * Common Sitewide JavaScript
 * - Smart Auto-hiding Header
 * - Mobile Menu & Search Modal
 * - Back to Top Button
 * - Footer Scroll Animations
 * - Initialize Sliders
 * @version 2.0
 */

(function() {
  'use strict';

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const searchToggle = document.getElementById('searchToggle');
  const searchClose = document.getElementById('searchClose');
  const searchModal = document.getElementById('searchModal');
  const searchInput = document.getElementById('searchInput');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const backToTopBtn = document.getElementById('backToTop');
  const pageLoader = document.getElementById('pageLoader');

  let lastScrollY = window.scrollY;
  let ticking = false;
  const headerOffset = 100; // Pixels before hiding header

  // ============================================
  // 1. SMART AUTO-HIDING HEADER
  // ============================================
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Hide header on scroll down, show on scroll up
    if (currentScrollY > lastScrollY && currentScrollY > headerOffset) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }

    // Add shadow when scrolled
    if (currentScrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Show/hide back to top button
    if (backToTopBtn) {
      if (currentScrollY > 400) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }

    lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
    ticking = false;
  };

  const requestScrollTick = () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestScrollTick, { passive: true });
  handleScroll(); // Initial check

  // ============================================
  // 2. MOBILE MENU CONTROL
  // ============================================
  let lastFocusedElement = null;

  const openMobileMenu = () => {
    lastFocusedElement = document.activeElement;
    mobileMenu.hidden = false;
    modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      mobileMenu.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      
      // Focus first focusable element
      const firstFocusable = mobileMenu.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
      
      document.addEventListener('keydown', handleMenuKeyboard);
    });
  };

  const closeMobileMenu = () => {
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleMenuKeyboard);
    
    setTimeout(() => {
      mobileMenu.hidden = true;
      modalBackdrop.hidden = true;
      if (lastFocusedElement) lastFocusedElement.focus();
    }, 300);
  };

  // Focus trap for mobile menu
  const handleMenuKeyboard = (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = mobileMenu.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMobileMenu() : openMobileMenu();
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', closeMobileMenu);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', () => {
      closeMobileMenu();
      closeSearchModal();
    });
  }

  // ============================================
  // 3. SEARCH MODAL CONTROL
  // ============================================
  const openSearchModal = () => {
    lastFocusedElement = document.activeElement;
    searchModal.hidden = false;
    
    requestAnimationFrame(() => {
      searchModal.classList.add('open');
      searchToggle.setAttribute('aria-expanded', 'true');
      if (searchInput) searchInput.focus();
    });
  };

  const closeSearchModal = () => {
    searchModal.classList.remove('open');
    searchToggle.setAttribute('aria-expanded', 'false');
    
    setTimeout(() => {
      searchModal.hidden = true;
      if (lastFocusedElement) lastFocusedElement.focus();
    }, 300);
  };

  if (searchToggle) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = searchToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeSearchModal() : openSearchModal();
    });
  }

  if (searchClose) {
    searchClose.addEventListener('click', closeSearchModal);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!mobileMenu.hidden) closeMobileMenu();
      if (!searchModal.hidden) closeSearchModal();
    }
  });

  // Handle search form submission
  const searchForms = document.querySelectorAll('.search-form, .search-modal-form, .mobile-search-form form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const input = form.querySelector('input[type="search"]');
      if (!input || !input.value.trim()) {
        e.preventDefault();
        if (input) input.focus();
      }
    });
  });

  // ============================================
  // 4. BACK TO TOP BUTTON
  // ============================================
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ============================================
  // 5. FOOTER INTERSECTION OBSERVER
  // ============================================
  const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        footerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-in-observe').forEach(el => {
    footerObserver.observe(el);
  });

  // ============================================
  // 6. INITIALIZE SWIPER SLIDERS
  // ============================================
  const initSliders = () => {
    if (typeof Swiper === 'undefined') {
      console.warn('Swiper library not loaded');
      return;
    }

    // Hero Slider (Fast auto-slide: 4 seconds)
    if (document.querySelector('.hero-swiper')) {
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
        speed: 1000,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
          dynamicBullets: true
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        keyboard: {
          enabled: true
        },
        a11y: {
          enabled: true
        }
      });
    }

    // Reviews Slider (Fast auto-scroll: 4.5 seconds)
    if (document.querySelector('.reviews-swiper')) {
      new Swiper('.reviews-swiper', {
        loop: true,
        autoplay: {
          delay: 4500,
          disableOnInteraction: false
        },
        speed: 800,
        slidesPerView: 1,
        spaceBetween: 20,
        pagination: {
          el: '.reviews-swiper .swiper-pagination',
          clickable: true,
          dynamicBullets: true
        },
        keyboard: {
          enabled: true
        },
        breakpoints: {
          640: {
            slidesPerView: 2,
            spaceBetween: 24
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 28
          }
        }
      });
    }
  };

  // ============================================
  // 7. INITIALIZE ON DOM READY
  // ============================================
  const init = () => {
    // Set current year
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Initialize AOS animations
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 50,
        delay: 100
      });
    }

    // Initialize sliders
    initSliders();

    // Hide page loader
    if (pageLoader) {
      setTimeout(() => {
        pageLoader.classList.add('hide');
      }, 500);
    }

    console.log('✅ Common scripts initialized');
  };

  // Wait for DOM and libraries
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Window resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Close mobile menu on resize to desktop
      if (window.innerWidth >= 1024 && !mobileMenu.hidden) {
        closeMobileMenu();
      }
    }, 250);
  });

})();
