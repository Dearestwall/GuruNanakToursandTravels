/* ============================================
   GNTT Main JavaScript
   Nav, Scroll, Focus Trap, Back-to-Top
   ============================================ */

(function() {
  'use strict';

  // ==========================================
  // Set current year in footer
  // ==========================================
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ==========================================
  // Smooth scroll for same-page anchors
  // ==========================================
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    
    const id = href.slice(1);
    const target = document.getElementById(id);
    
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Update focus for accessibility
      target.setAttribute('tabindex', '-1');
      target.focus();
    }
  });

  // ==========================================
  // Active link highlighting
  // ==========================================
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  
  document.querySelectorAll('.nav a, .desktop-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    const linkPath = href.replace(/\/+$/, '') || '/';
    
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });

  // ==========================================
  // Off-canvas mobile menu
  // ==========================================
  const toggle = document.getElementById('navToggle');
  const panel = document.getElementById('offcanvas');

  if (toggle && panel) {
    let lastFocusedElement = null;
    const focusableSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Focus trap handler
    const trapFocus = (e) => {
      const focusables = Array.from(panel.querySelectorAll(focusableSelector));
      const firstFocusable = focusables[0];
      const lastFocusable = focusables[focusables.length - 1];
      
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      } else if (e.key === 'Escape') {
        closeMenu();
      }
    };

    // Open menu
    const openMenu = () => {
      lastFocusedElement = document.activeElement;
      panel.hidden = false;
      panel.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      
      panel.addEventListener('keydown', trapFocus);
      
      // Focus first focusable element
      setTimeout(() => {
        const firstFocusable = panel.querySelector(focusableSelector);
        if (firstFocusable) firstFocusable.focus();
      }, 50);
    };

    // Close menu
    const closeMenu = () => {
      panel.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      panel.removeEventListener('keydown', trapFocus);
      
      // Return focus
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      }
      
      setTimeout(() => {
        panel.hidden = true;
      }, 300);
    };

    // Toggle button click
    toggle.addEventListener('click', () => {
      if (panel.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close button & overlay clicks
    panel.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]') || e.target === panel) {
        closeMenu();
      }
    });

    // Close on nav link click (mobile)
    panel.querySelectorAll('.nav-list a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // ==========================================
  // Back-to-top button
  // ==========================================
  const toTopBtn = document.getElementById('toTop');
  
  if (toTopBtn) {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        toTopBtn.classList.add('show');
      } else {
        toTopBtn.classList.remove('show');
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility(); // Check on load

    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    });
  }

  // ==========================================
  // External link security
  // ==========================================
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    if (!link.hasAttribute('rel')) {
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

})();
