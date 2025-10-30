/**
 * Header Script - Manages all header interactions
 * - Scroll behavior and elevation
 * - Mobile menu open/close with focus trap
 * - Search toggle
 * - Keyboard navigation
 */

(function() {
  'use strict';

  // ============================================
  // DOM Elements
  // ============================================
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const searchToggle = document.getElementById('searchToggle');
  const searchDropdown = document.getElementById('searchDropdown');
  const searchClose = document.querySelector('.search-close');
  const searchInput = document.getElementById('searchInput');

  let lastScrollY = window.scrollY;
  let lastFocusedElement = null;

  // ============================================
  // Header Scroll Behavior
  // ============================================
  function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Add/remove scrolled class for elevation
    if (currentScrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
  }

  // Throttle scroll events for performance
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(() => {
      handleScroll();
    });
  }, { passive: true });

  // Initial check
  handleScroll();

  // ============================================
  // Mobile Menu Management
  // ============================================
  function openMobileMenu() {
    lastFocusedElement = document.activeElement;
    mobileMenu.hidden = false;
    menuBackdrop.hidden = false;
    
    // Force reflow for animation
    requestAnimationFrame(() => {
      mobileMenu.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      
      // Focus first focusable element
      const firstFocusable = mobileMenu.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
      
      // Attach keyboard listener
      document.addEventListener('keydown', handleMenuKeyboard);
    });
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    
    // Remove keyboard listener
    document.removeEventListener('keydown', handleMenuKeyboard);
    
    // Wait for animation to complete
    setTimeout(() => {
      mobileMenu.hidden = true;
      menuBackdrop.hidden = true;
      
      // Restore focus
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
    }, 300);
  }

  // Focus trap for mobile menu
  function handleMenuKeyboard(e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      return;
    }

    if (e.key === 'Tab') {
      const focusableElements = mobileMenu.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
  }

  // Event listeners for mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (menuClose) {
    menuClose.addEventListener('click', closeMobileMenu);
  }

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMobileMenu);
  }

  // ============================================
  // Search Dropdown Management
  // ============================================
  function openSearch() {
    if (searchDropdown) {
      searchDropdown.hidden = false;
      searchToggle.setAttribute('aria-expanded', 'true');
      
      if (searchInput) {
        searchInput.focus();
      }
      
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', handleSearchOutsideClick);
      }, 100);
    }
  }

  function closeSearch() {
    if (searchDropdown) {
      searchDropdown.hidden = true;
      searchToggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', handleSearchOutsideClick);
    }
  }

  function handleSearchOutsideClick(e) {
    if (searchDropdown && !searchDropdown.contains(e.target) && !searchToggle.contains(e.target)) {
      closeSearch();
    }
  }

  if (searchToggle) {
    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = searchToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeSearch();
      } else {
        openSearch();
      }
    });
  }

  if (searchClose) {
    searchClose.addEventListener('click', (e) => {
      e.preventDefault();
      closeSearch();
    });
  }

  // Handle search form submissions
  const searchForms = document.querySelectorAll('.search-form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const input = form.querySelector('input[type="search"]');
      if (!input || !input.value.trim()) {
        e.preventDefault();
        if (input) input.focus();
      }
      // Form will submit normally if input has value
    });
  });

  // ============================================
  // Keyboard Navigation
  // ============================================
  document.addEventListener('keydown', (e) => {
    // Escape key closes mobile menu or search
    if (e.key === 'Escape') {
      if (mobileMenu && !mobileMenu.hidden) {
        closeMobileMenu();
      } else if (searchDropdown && !searchDropdown.hidden) {
        closeSearch();
      }
    }
  });

  // ============================================
  // Window Resize Handler
  // ============================================
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Close mobile menu if window is resized to desktop size
      if (window.innerWidth >= 1024 && !mobileMenu.hidden) {
        closeMobileMenu();
      }
    }, 250);
  });

  // ============================================
  // Initialize
  // ============================================
  console.log('✅ Header initialized');
})();
