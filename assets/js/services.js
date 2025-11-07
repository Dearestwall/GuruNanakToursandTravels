// =====================================================
// SERVICES.JS - Services listing and detail page
// =====================================================

let allServices = [];
let selectedService = null;

/**
 * Load and render services
 */
async function loadServices() {
  try {
    console.log('[SERVICES] Loading services...');
    
    const cmsData = await fetchCMSData();
    if (!cmsData || !cmsData.offerings || cmsData.offerings.length === 0) {
      showToast('Failed to load services', 'error');
      console.error('[SERVICES] No offerings found in CMS data');
      return;
    }

    allServices = cmsData.offerings;
    console.log('[SERVICES] Loaded:', allServices.length, 'services');
    
    renderServicesGrid();
    updatePageTitle();

    // Deep link detail if ?id= present
    const selectedId = getQueryParam('id');
    if (selectedId) {
      const service = allServices.find(s => s.id === selectedId);
      if (service) {
        console.log('[SERVICES] Deep link found:', selectedId);
        selectedService = service;
        showServiceDetail(service);
      } else {
        console.warn('[SERVICES] Service not found:', selectedId);
      }
    }
  } catch (e) {
    console.error('[SERVICES] Load error:', e);
    showToast('Failed to load services', 'error');
  }
}

/**
 * Render services grid
 */
function renderServicesGrid() {
  const container = document.getElementById('servicesGrid');
  if (!container) return;

  console.log('[SERVICES] Rendering', allServices.length, 'services');

  container.innerHTML = allServices.map((service, idx) => `
    <article class="service-card" style="animation-delay: ${idx * 0.1}s;">
      <!-- Icon -->
      <div class="service-icon-large" title="${service.title}">
        ${service.icon || '⚙️'}
      </div>

      <!-- Title & Description -->
      <div class="service-content">
        <h3 class="service-title">${service.title}</h3>
        <p class="service-description">${service.description || ''}</p>

        <!-- Features Preview (if available) -->
        ${service.features && service.features.length > 0 ? `
          <ul class="service-features-preview">
            ${service.features.slice(0, 2).map(f => `
              <li><span class="feature-checkmark">✓</span> ${f}</li>
            `).join('')}
          </ul>
        ` : ''}
      </div>

      <!-- CTA Buttons -->
      <div class="service-actions">
        <a 
          class="btn btn-sm" 
          href="${__toAbs(`/details/?id=${service.id}&type=offering`)}"
          data-service-id="${service.id}"
          aria-label="Learn more about ${service.title}"
        >
          Explore →
        </a>
        <a 
          class="btn btn-sm btn-secondary" 
          href="https://wa.me/916283315156?text=I%20am%20interested%20in%20${encodeURIComponent(service.title)}"
          target="_blank"
          rel="noopener"
          title="Ask about ${service.title}"
        >
          Inquire
        </a>
      </div>
    </article>
  `).join('');

  // Add event listeners for analytics
  container.querySelectorAll('[data-service-id]').forEach(link => {
    link.addEventListener('click', (e) => {
      const serviceId = link.getAttribute('data-service-id');
      console.log('[SERVICES] Clicked:', serviceId);
    });
  });
}

/**
 * Show service detail (inline view)
 */
function showServiceDetail(service) {
  const detailSection = document.getElementById('serviceDetail');
  if (!detailSection) {
    console.warn('[SERVICES] Detail section not found');
    return;
  }

  console.log('[SERVICES] Showing detail for:', service.title);

  // Set title
  const nameEl = document.getElementById('serviceName');
  if (nameEl) nameEl.textContent = service.title;

  // Set description
  const descEl = document.getElementById('serviceDescription');
  if (descEl) {
    descEl.innerHTML = (service.long_description || service.description || '')
      .replace(/\n/g, '<br>');
  }

  // Set features
  const featuresContainer = document.getElementById('serviceFeatures');
  if (featuresContainer) {
    const features = service.features && service.features.length > 0
      ? service.features
      : getServiceFeatures(service.id);
    
    featuresContainer.innerHTML = features.map(f => `
      <li class="feature-item">
        <span class="feature-icon">✅</span>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // Show section
  detailSection.style.display = 'block';
  detailSection.classList.add('show');
  
  // Smooth scroll
  setTimeout(() => {
    detailSection.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100);
}

/**
 * Fallback features for known services
 */
function getServiceFeatures(serviceId) {
  const features = {
    'flight-bookings': [
      'Domestic & International flights',
      'Best prices guaranteed',
      'Instant booking confirmation',
      '24/7 booking support',
      'Flexible date changes',
      'Travel insurance options'
    ],
    'hotel-stays': [
      'Premium hotel partners',
      'Flexible check-in/out',
      'Free room cancellation',
      'Best room rates',
      'Hotel combo packages',
      'Loyalty rewards'
    ],
    'tour-packages': [
      'Customized itineraries',
      'Expert local guides',
      'All-inclusive packages',
      'Small group tours',
      'Private tour options',
      'Photography tours'
    ],
    'visa-assistance': [
      '50+ countries covered',
      'Expert visa consultants',
      'Document guidance & preparation',
      'Fast processing',
      'Interview coaching',
      'Emergency visa support'
    ]
  };
  
  return features[serviceId] || [
    'Premium service experience',
    'Professional support team',
    'Best value for money',
    'Customer satisfaction guarantee',
    'Flexible payment options',
    'Easy booking & cancellation'
  ];
}

/**
 * Update page title with service count
 */
function updatePageTitle() {
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) {
    pageTitle.textContent = `Our Services (${allServices.length}) — GNTT`;
  }

  const pageDesc = document.getElementById('page-desc');
  if (pageDesc) {
    const serviceNames = allServices.map(s => s.title).join(', ');
    pageDesc.setAttribute(
      'content',
      `Explore our comprehensive travel services: ${serviceNames}. Book flights, hotels, tours, visas and more.`
    );
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[SERVICES] Page initialized');
  setTimeout(loadServices, 200);
});

console.log('[SERVICES] Script loaded');
