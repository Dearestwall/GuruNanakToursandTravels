/* ============================================
   GNTT AOS Initialization
   Honors prefers-reduced-motion
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Don't initialize AOS if user prefers reduced motion
  if (prefersReducedMotion) {
    console.log('⚡ AOS disabled: user prefers reduced motion');
    return;
  }
  
  // Initialize AOS with settings
  if (window.AOS) {
    window.AOS.init({
      duration: 600,
      easing: 'ease-out',
      once: true,
      offset: 80,
      delay: 0,
      anchorPlacement: 'top-bottom',
      disable: false,
      startEvent: 'DOMContentLoaded',
      disableMutationObserver: false,
      throttleDelay: 99,
      debounceDelay: 50
    });
    
    console.log('✨ AOS initialized');
  }
});
