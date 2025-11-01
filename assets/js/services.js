// =====================================================
// SERVICES.JS - Services listing page
// =====================================================

let allServices = [];
let selectedService = null;

/**
 * Load and render services
 */
async function loadServices() {
  const cmsData = await fetchCMSData();
  if (!cmsData || !cmsData.offerings) {
    showToast('Failed to load services', 'error');
    return;
  }

  allServices = cmsData.offerings;
  renderServicesGrid();

  // Check if there's an ID in URL to show details
  const selectedId = getQueryParam('id');
  if (selectedId) {
    const service = allServices.find(s => s.id === selectedId);
    if (service) {
      selectedService = service;
      showServiceDetail(service);
    }
  }
}

/**
 * Render services grid
 */
function renderServicesGrid() {
  const container = document.getElementById('servicesGrid');
  if (!container) return;

  container.innerHTML = allServices.map(service => `
    <article class="service-card">
      <div class="service-icon-large">${service.icon}</div>
      <h3>${service.title}</h3>
      <p>${service.description}</p>
      <button class="btn btn-sm" onclick="showServiceDetail({id: '${service.id}', title: '${service.title}', description: '${service.description}', icon: '${service.icon}'})">
        Learn More →
      </button>
    </article>
  `).join('');
}

/**
 * Show service detail
 */
function showServiceDetail(service) {
  const detailSection = document.getElementById('serviceDetail');
  if (!detailSection) return;

  document.getElementById('serviceName').textContent = service.title;
  document.getElementById('serviceDescription').textContent = service.description;

  const featuresContainer = document.getElementById('serviceFeatures');
  if (featuresContainer) {
    const features = getServiceFeatures(service.id);
    featuresContainer.innerHTML = features.map(f => `<li>✅ ${f}</li>`).join('');
  }

  detailSection.style.display = 'block';
  detailSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Get features for a service
 */
function getServiceFeatures(serviceId) {
  const features = {
    'flight-bookings': ['Domestic & International flights', 'Best prices guaranteed', '24/7 booking support', 'Instant confirmation'],
    'hotel-stays': ['Premium hotel partners', 'Flexible check-in/out', 'Free cancellation', 'Best room rates'],
    'tour-packages': ['Customized itineraries', 'Expert guides', 'All-inclusive packages', 'Small group tours'],
    'visa-assistance': ['50+ countries covered', 'Expert visa consultants', 'Document guidance', 'Fast processing']
  };
  return features[serviceId] || ['Premium service', 'Professional support', 'Best value', 'Satisfaction guaranteed'];
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadServices, 200);
});
