/**
 * COMMON.JS - Global Site Functionality
 * Header, Menu, Search, Scroll, Accessibility, Animations
 */

(function() {
  'use strict';

  // ============================================
  // 1. AUTO-HIDE HEADER ON SCROLL
  // ============================================
  const initAutoHideHeader = () => {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateHeaderState = () => {
      const currentScrollY = window.pageYOffset;

      // Add shadow when scrolled
      if (currentScrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
  };

  // ============================================
  // 2. MOBILE MENU TOGGLE
  // ============================================
  const initMobileMenu = () => {
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const mobileMenu = document.getElementById('mobileMenu');
    const backdrop = document.getElementById('modalBackdrop');
    const body = document.body;

    if (!menuToggle || !mobileMenu) return;

    const openMenu = () => {
      mobileMenu.removeAttribute('hidden');
      mobileMenu.classList.add('open');
      backdrop.removeAttribute('hidden');
      body.classList.add('no-scroll');
      menuToggle.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
      mobileMenu.classList.remove('open');
      setTimeout(() => {
        mobileMenu.setAttribute('hidden', '');
        backdrop.setAttribute('hidden', '');
      }, 300);
      body.classList.remove('no-scroll');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', openMenu);
    menuClose?.addEventListener('click', closeMenu);
    backdrop?.addEventListener('click', closeMenu);

    // Close on navigation item click
    const navItems = mobileMenu.querySelectorAll('.mobile-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileMenu.hasAttribute('hidden')) {
        closeMenu();
      }
    });
  };

  // ============================================
  // 3. SEARCH MODAL
  // ============================================
  const initSearchModal = () => {
    const searchToggle = document.getElementById('searchToggle');
    const searchClose = document.getElementById('searchClose');
    const searchModal = document.getElementById('searchModal');
    const backdrop = document.getElementById('modalBackdrop');
    const searchInput = document.getElementById('searchInput');
    const body = document.body;

    if (!searchToggle || !searchModal) return;

    const openSearch = () => {
      searchModal.removeAttribute('hidden');
      searchModal.classList.add('open');
      backdrop.removeAttribute('hidden');
      body.classList.add('no-scroll');
      searchToggle.setAttribute('aria-expanded', 'true');
      setTimeout(() => searchInput?.focus(), 100);
    };

    const closeSearch = () => {
      searchModal.classList.remove('open');
      setTimeout(() => {
        searchModal.setAttribute('hidden', '');
        backdrop.setAttribute('hidden', '');
      }, 300);
      body.classList.remove('no-scroll');
      searchToggle.setAttribute('aria-expanded', 'false');
    };

    searchToggle.addEventListener('click', openSearch);
    searchClose?.addEventListener('click', closeSearch);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !searchModal.hasAttribute('hidden')) {
        closeSearch();
      }
    });

    // Handle search form submission
    const searchForm = document.querySelector('.search-modal-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput?.value.trim();
        if (query) {
          window.location.href = `tours.html?q=${encodeURIComponent(query)}`;
        }
      });
    }
  };

  // ============================================
  // 4. PAGE LOADER
  // ============================================
  const initPageLoader = () => {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;

    const hideLoader = () => {
      loader.classList.add('hide');
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500);
    };

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
    }

    // Fallback: force hide after 3 seconds
    setTimeout(hideLoader, 3000);
  };

  // ============================================
  // 5. SMOOTH SCROLL TO ANCHOR
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
          const headerHeight = document.querySelector('.site-header')?.offsetHeight || 76;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update focus for accessibility
          target.tabIndex = -1;
          target.focus();
        }
      });
    });
  };

  // ============================================
  // 6. BACK TO TOP BUTTON
  // ============================================
  const initBackToTop = () => {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  };

  // ============================================
  // 7. INTERSECTION OBSERVER (FADE-IN)
  // ============================================
  const initIntersectionObserver = () => {
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

    document.querySelectorAll('.fade-in-observe').forEach(el => {
      observer.observe(el);
    });
  };

  // ============================================
  // 8. SET CURRENT YEAR IN FOOTER
  // ============================================
  const setCurrentYear = () => {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }
  };

  // ============================================
  // 9. INITIALIZE AOS (ANIMATE ON SCROLL)
  // ============================================
  const initAOS = () => {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 120,
        disable: 'mobile' // Disable on mobile for performance
      });
    }
  };

  // ============================================
  // 10. INITIALIZE ALL
  // ============================================
  const init = () => {
    console.log('🚀 Initializing common.js...');

    initPageLoader();
    initAutoHideHeader();
    initMobileMenu();
    initSearchModal();
    initSmoothScroll();
    initBackToTop();
    initIntersectionObserver();
    setCurrentYear();

    // Initialize AOS after a brief delay
    setTimeout(initAOS, 100);

    console.log('✅ Common.js initialized');
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
