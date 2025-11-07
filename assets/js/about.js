// =====================================================
// ABOUT.JS - About page functionality
// =====================================================

/**
 * Load and display company information
 */
async function loadAboutInfo() {
  try {
    console.log('[ABOUT] Loading company information...');
    
    // Load contact info for stats
    const contactUrl = __getDataUrl('contact.json');
    const settingsUrl = __getDataUrl('settings.json');
    
    const [contactRes, settingsRes] = await Promise.all([
      fetch(contactUrl, { cache: 'no-store' }),
      fetch(settingsUrl, { cache: 'no-store' })
    ]);

    let contactData = null;
    let settingsData = null;

    if (contactRes.ok) {
      contactData = await contactRes.json();
      console.log('[ABOUT] Contact data loaded');
    }

    if (settingsRes.ok) {
      settingsData = await settingsRes.json();
      console.log('[ABOUT] Settings data loaded');
    }

    // Update page meta
    updatePageMeta(settingsData);

    // Render animations
    setupAnimations();

  } catch (e) {
    console.error('[ABOUT] Load error:', e);
  }
}

/**
 * Update page meta information
 */
function updatePageMeta(settings) {
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');

  if (pageTitle) {
    pageTitle.textContent = 'About Us — GNTT';
  }

  if (pageDesc) {
    pageDesc.setAttribute(
      'content',
      'Learn about Guru Nanak Tour & Travels - your trusted travel partner with 15+ years of experience serving 5000+ happy travelers'
    );
  }

  console.log('[ABOUT] Meta updated');
}

/**
 * Animate elements on scroll
 */
function setupAnimations() {
  // Animate stat cards on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  // Observe elements
  document.querySelectorAll('.feature-card, .stat-card, .value-item, .team-member, .timeline-item').forEach(el => {
    observer.observe(el);
  });

  console.log('[ABOUT] Animations setup');
}

/**
 * Animate counter numbers
 */
function animateCounters() {
  const counters = [
    { id: 'stat-years', target: 15, suffix: '+' },
    { id: 'stat-destinations', target: 50, suffix: '+' },
    { id: 'stat-travelers', target: 5000, suffix: '+' }
  ];

  counters.forEach(counter => {
    const el = document.getElementById(counter.id);
    if (!el) return;

    let current = 0;
    const increment = Math.ceil(counter.target / 30);
    const interval = setInterval(() => {
      current += increment;
      if (current >= counter.target) {
        current = counter.target;
        clearInterval(interval);
      }
      el.textContent = current.toLocaleString() + counter.suffix;
    }, 30);
  });

  console.log('[ABOUT] Counters animated');
}

/**
 * Scroll to section
 */
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    console.log('[ABOUT] Scrolled to:', sectionId);
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ABOUT] Page initialized');
  
  loadAboutInfo();

  // Trigger counter animation when stats become visible
  const statsSection = document.querySelector('.company-stats');
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
          entry.target.classList.add('animated');
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    });

    observer.observe(statsSection);
  }

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      scrollToSection(id);
    });
  });
});

console.log('[ABOUT] Script loaded');
