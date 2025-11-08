// =====================================================
// FOOTER.JS - 3D Animated Footer
// =====================================================

console.log('[FOOTER] 3D Script loaded');

function updateYear() {
  const yearEls = document.querySelectorAll('#year, .year');
  const currentYear = new Date().getFullYear();
  yearEls.forEach(el => el.textContent = currentYear);
  console.log('[FOOTER] Year updated:', currentYear);
}

function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }

    lastScroll = currentScroll;
  });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    console.log('[FOOTER] Scrolled to top');
  });

  console.log('[FOOTER] Back to top setup');
}

function setupNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = form.querySelector('input[type="email"]');
    const email = input.value.trim();

    if (!email) {
      showToast('Please enter a valid email', 'error');
      return;
    }

    console.log('[FOOTER] Newsletter subscription:', email);
    showToast('✓ Thank you for subscribing!', 'success');
    input.value = '';
  });

  console.log('[FOOTER] Newsletter setup');
}

function setup3DEffects() {
  const logo = document.querySelector('.footer-logo');
  const socialLinks = document.querySelectorAll('.social-link');
  const thrillyverseLink = document.getElementById('thrillyverseLink');

  // Logo tilt effect
  if (logo) {
    logo.addEventListener('mousemove', (e) => {
      const rect = logo.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const rotateX = (y / rect.height) * 20;
      const rotateY = (x / rect.width) * -20;
      
      logo.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    logo.addEventListener('mouseleave', () => {
      logo.style.transform = '';
    });
  }

  // Social links 3D effect
  socialLinks.forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const rotateX = (y / rect.height) * 15;
      const rotateY = (x / rect.width) * -15;
      
      link.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
    });

    link.addEventListener('mouseleave', () => {
      link.style.transform = '';
    });
  });

  // Thrillyverse link special effect
  if (thrillyverseLink) {
    thrillyverseLink.addEventListener('mouseenter', () => {
      console.log('[FOOTER] Thrillyverse link hovered - @thrillyverse');
    });
  }

  console.log('[FOOTER] 3D effects setup');
}

function initFooter() {
  console.log('[FOOTER] Initializing...');
  
  updateYear();
  setupBackToTop();
  setupNewsletter();
  setup3DEffects();

  console.log('[FOOTER] ✅ Initialized with 3D effects');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooter);
} else {
  initFooter();
}

console.log('[FOOTER] ✅ Ready');
