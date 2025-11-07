// =====================================================
// LEGAL.JS - Privacy, Terms, Disclaimer pages
// =====================================================

console.log('[LEGAL] Script loaded');

/**
 * Update dates dynamically
 */
function updateDates() {
  const year = new Date().getFullYear();
  
  // Update year in footer
  const yearEls = document.querySelectorAll('#year, .year');
  yearEls.forEach(el => {
    el.textContent = year;
  });

  // Update last modified date
  const dateEls = document.querySelectorAll('#updated-date, .updated-date');
  dateEls.forEach(el => {
    const date = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    el.textContent = date;
  });

  console.log('[LEGAL] Dates updated');
}

/**
 * Smooth scroll for TOC links
 */
function setupSmoothScroll() {
  const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
  
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Add highlight
        target.classList.add('highlight');
        setTimeout(() => {
          target.classList.remove('highlight');
        }, 2000);
        
        console.log('[LEGAL] Scrolled to:', targetId);
      }
    });
  });
}

/**
 * Add print styles
 */
function setupPrintStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      .breadcrumb, .toc, #header-placeholder, #footer-placeholder {
        display: none;
      }
      
      body {
        background: white;
      }
      
      section {
        page-break-inside: avoid;
      }
      
      a {
        text-decoration: underline;
      }
    }
  `;
  document.head.appendChild(style);
  console.log('[LEGAL] Print styles added');
}

/**
 * Add highlight animation styles
 */
function addHighlightStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes highlight {
      0% {
        background-color: rgba(243, 156, 18, 0.2);
      }
      100% {
        background-color: transparent;
      }
    }
    
    section.highlight {
      animation: highlight 2s ease-out;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Setup search functionality (optional)
 */
function setupSearch() {
  const searchInput = document.querySelector('input[type="search"]');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const sections = document.querySelectorAll('main section');
    
    sections.forEach(section => {
      const text = section.textContent.toLowerCase();
      section.style.display = text.includes(query) ? '' : 'none';
    });
    
    console.log('[LEGAL] Search filter applied');
  });
}

/**
 * Copy link function (for sharing sections)
 */
function setupCopyLinks() {
  const sections = document.querySelectorAll('section[id]');
  
  sections.forEach(section => {
    section.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      
      const sectionUrl = `${window.location.href}#${section.id}`;
      navigator.clipboard.writeText(sectionUrl);
      
      showToast(`Section link copied: ${sectionUrl}`, 'success');
      console.log('[LEGAL] Link copied:', sectionUrl);
    });
  });
}

/**
 * Track TOC sections in view
 */
function setupActiveSection() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const tocLink = document.querySelector(`.toc a[href="#${id}"]`);
        
        if (tocLink) {
          // Remove active class from all links
          document.querySelectorAll('.toc a').forEach(link => {
            link.style.color = '';
            link.style.fontWeight = '';
          });
          
          // Add active class to current link
          tocLink.style.color = '#f39c12';
          tocLink.style.fontWeight = '900';
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('section[id]').forEach(section => {
    observer.observe(section);
  });

  console.log('[LEGAL] Active section tracking enabled');
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[LEGAL] Page initialized');

  updateDates();
  setupSmoothScroll();
  addHighlightStyles();
  setupPrintStyles();
  setupSearch();
  setupCopyLinks();
  setupActiveSection();

  console.log('[LEGAL] All features initialized');
});

console.log('[LEGAL] ✅ Legal script ready');
