// =====================================================
// SERVICES.JS - Services listing page with GitHub API
// Auto-loads from data/offerings/
// =====================================================

let allServices = [];
const SERVICES_CACHE_KEY = 'gntt_services_cache';
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * GitHub Configuration
 */
const GITHUB_CONFIG = {
  owner: 'dearestwall',
  repo: 'GuruNanakToursandTravels'
};

/**
 * Load services from GitHub
 */
async function loadServices() {
  try {
    console.log('💼 Loading services...');
    
    // Try cache first
    const cached = loadFromCache();
    if (cached) {
      console.log('✅ Loaded services from cache');
      allServices = cached;
      renderServicesGrid();
      return;
    }
    
    // Load from GitHub
    const services = await loadServicesFromGitHub();
    
    if (services.length === 0) {
      showToast('No services available', 'info');
      return;
    }
    
    allServices = services.sort((a, b) => (a.order || 0) - (b.order || 0));
    saveToCache(allServices);
    
    renderServicesGrid();
    
    console.log('✅ Loaded', allServices.length, 'services');
  } catch (e) {
    console.error('❌ Services load error:', e);
    showToast('Failed to load services', 'error');
  }
}

/**
 * Load services from GitHub folder
 */
async function loadServicesFromGitHub() {
  try {
    const path = 'data/offerings';
    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`;
    
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    if (!response.ok) {
      console.warn('GitHub API failed:', response.status);
      return [];
    }
    
    const files = await response.json();
    const jsonFiles = files.filter(f => f.type === 'file' && f.name.endsWith('.json'));
    
    console.log(`📂 Found ${jsonFiles.length} service files`);
    
    const fetchPromises = jsonFiles.map(async (file) => {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          const data = await fileResponse.json();
          console.log(`✅ Loaded: ${file.name}`);
          return data;
        }
      } catch (e) {
        console.warn(`⚠️ Failed to load ${file.name}`);
      }
      return null;
    });
    
    const results = await Promise.all(fetchPromises);
    return results.filter(service => service !== null);
    
  } catch (e) {
    console.error('Error loading services from GitHub:', e);
    return [];
  }
}

/**
 * Cache management
 */
function loadFromCache() {
  try {
    const cached = localStorage.getItem(SERVICES_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(SERVICES_CACHE_KEY);
    return null;
  } catch (e) {
    return null;
  }
}

function saveToCache(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

/**
 * Render services grid
 */
function renderServicesGrid() {
  const container = document.getElementById('servicesGrid');
  if (!container) return;

  if (allServices.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:3rem;font-size:1.1rem;color:var(--muted);">No services available at the moment.</p>';
    return;
  }

  container.innerHTML = allServices.map(service => `
    <article class="service-card fade-up">
      <div class="service-icon-large">${service.icon}</div>
      <h3>${service.title}</h3>
      <p>${service.description}</p>
      <a class="btn btn-sm" href="/details/?id=${service.id}&type=offering">
        Learn More →
      </a>
    </article>
  `).join('');
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadServices, 200);
});
