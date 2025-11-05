// =====================================================
// ABOUT.JS - CMS-powered About page with auto-discovery
// Automatically loads all JSON files from GitHub
// =====================================================

const ABOUT_CACHE_KEY = 'gntt_about_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Load about page content from CMS
 */
async function loadAboutContent() {
  try {
    console.log('📄 Loading about page content...');
    
    const cmsData = await fetchCMSData();
    if (!cmsData) {
      console.error('Failed to load CMS data');
      showToast('Failed to load content', 'error');
      return;
    }

    // Load about sections from GitHub (auto-discovers all files)
    await loadAboutSections();
    
    // Load features dynamically
    renderAboutFeatures(cmsData);
    
    // Load stats from CMS
    renderAboutStats(cmsData.stats);
    
    console.log('✅ About content loaded');
  } catch (e) {
    console.error('❌ Error loading about content:', e);
    showToast('Error loading page content', 'error');
    
    // Load fallback content
    loadFallbackAboutContent();
  }
}

/**
 * Load about sections from GitHub automatically
 * Auto-discovers all JSON files in content/pages/about/
 */
async function loadAboutSections() {
  try {
    // Try loading from cache first
    const cachedSections = loadSectionsFromCache();
    if (cachedSections) {
      console.log('✅ Loaded about sections from cache');
      renderAboutSections(cachedSections);
      return;
    }
    
    // GitHub repository info
    const owner = 'dearestwall';
    const repo = 'GuruNanakToursandTravels';
    const path = 'content/pages/about';
    
    // GitHub API URL
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    console.log('📡 Fetching about sections from GitHub API...');
    
    // Fetch directory listing
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      console.warn('GitHub API request failed:', response.status);
      loadFallbackAboutContent();
      return;
    }
    
    const files = await response.json();
    
    if (!Array.isArray(files)) {
      console.warn('Unexpected GitHub API response');
      loadFallbackAboutContent();
      return;
    }
    
    // Filter only .json files
    const jsonFiles = files.filter(file => 
      file.type === 'file' && file.name.endsWith('.json')
    );
    
    console.log(`📂 Found ${jsonFiles.length} about section files`);
    
    if (jsonFiles.length === 0) {
      loadFallbackAboutContent();
      return;
    }
    
    // Fetch each JSON file content in parallel
    const fetchPromises = jsonFiles.map(async (file) => {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          const data = await fileResponse.json();
          console.log(`✅ Loaded: ${file.name}`);
          return data;
        }
      } catch (e) {
        console.warn(`⚠️ Failed to load ${file.name}:`, e);
      }
      return null;
    });
    
    const results = await Promise.all(fetchPromises);
    const sections = results.filter(section => section !== null);
    
    if (sections.length === 0) {
      loadFallbackAboutContent();
      return;
    }
    
    // Sort by order field
    sections.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Save to cache
    saveSectionsToCache(sections);
    
    // Render sections
    renderAboutSections(sections);
    
  } catch (e) {
    console.error('Error loading about sections:', e);
    loadFallbackAboutContent();
  }
}

/**
 * Render about sections to page
 */
function renderAboutSections(sections) {
  const container = document.getElementById('about-sections-container');
  if (!container) return;

  container.innerHTML = sections.map(section => `
    <div class="about-section fade-up" id="${section.id}">
      <h2>${section.title}</h2>
      ${section.content ? section.content.split('\n\n').map(p => `<p>${p}</p>`).join('') : ''}
    </div>
  `).join('');
}

/**
 * Load from localStorage cache
 */
function loadSectionsFromCache() {
  try {
    const cached = localStorage.getItem(ABOUT_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(ABOUT_CACHE_KEY);
    return null;
  } catch (e) {
    console.warn('Cache load failed:', e);
    return null;
  }
}

/**
 * Save to localStorage cache
 */
function saveSectionsToCache(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

/**
 * Load fallback about content
 */
function loadFallbackAboutContent() {
  console.log('📋 Loading fallback about content...');
  
  const sections = [
    {
      id: 'our-story',
      title: 'Our Story',
      content: `Guru Nanak Tour & Travels started with a simple mission: to make travel accessible, affordable, and unforgettable for everyone. What began as a small local travel agency has grown into a trusted name in the tourism industry, serving thousands of happy travelers from across India and abroad.\n\nOver the years, we've built lasting relationships with hotels, airlines, and tour operators, allowing us to offer the best rates and personalized experiences to our clients.`,
      order: 1
    },
    {
      id: 'our-mission',
      title: 'Our Mission',
      content: `To provide exceptional travel experiences that exceed our customers' expectations while maintaining the highest standards of service, safety, and value. We believe in creating memories that last a lifetime.\n\nWe are committed to sustainable tourism practices and supporting local communities wherever we operate.`,
      order: 2
    },
    {
      id: 'why-choose-us',
      title: 'Why Choose Us',
      content: `With over 15 years of experience in the travel industry, we understand what makes a trip truly memorable. Our dedicated team works tirelessly to ensure every aspect of your journey is perfectly planned and executed.\n\nFrom budget-friendly packages to luxury experiences, we cater to all types of travelers with personalized service and attention to detail.`,
      order: 3
    },
    {
      id: 'our-team',
      title: 'Our Expert Team',
      content: `Our team consists of experienced travel professionals who are passionate about creating unforgettable journeys. With extensive knowledge of destinations across India and abroad, we provide expert guidance at every step.\n\nWe pride ourselves on our customer-first approach and 24/7 support throughout your travels.`,
      order: 4
    }
  ];
  
  renderAboutSections(sections);
}

/**
 * Render about features from CMS data
 */
function renderAboutFeatures(cmsData) {
  const container = document.getElementById('about-features-grid');
  if (!container) return;

  const features = [
    { 
      icon: '🎯', 
      title: 'Expert Planning', 
      description: 'Our experienced team designs trips tailored to your preferences and budget.'
    },
    { 
      icon: '💰', 
      title: 'Best Prices', 
      description: 'We negotiate with partners to bring you unbeatable rates on tours and packages.'
    },
    { 
      icon: '🤝', 
      title: '24/7 Support', 
      description: 'Our team is always available to help before, during, and after your journey.'
    },
    { 
      icon: '✈️', 
      title: 'Wide Network', 
      description: `Partnerships with ${cmsData.stats?.destinations || 50}+ destinations and premium service providers worldwide.`
    },
    { 
      icon: '📋', 
      title: 'Hassle-Free Documentation', 
      description: 'Complete visa assistance and travel document support for international trips.'
    },
    { 
      icon: '⭐', 
      title: 'Proven Track Record', 
      description: `${(cmsData.stats?.happy_customers || 5000).toLocaleString('en-IN')}+ happy customers with an average ${cmsData.stats?.average_rating || 4.8}-star rating.`
    }
  ];

  container.innerHTML = features.map(f => `
    <div class="feature fade-up">
      <div class="feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
  `).join('');
}

/**
 * Render about stats from CMS
 */
function renderAboutStats(stats) {
  const container = document.getElementById('about-stats-cards');
  if (!container) return;

  if (!stats) {
    stats = {
      experience_years: 15,
      destinations: 50,
      happy_customers: 5000,
      support: '24/7'
    };
  }

  const cards = [
    { 
      icon: '🎉', 
      title: `${stats.experience_years}+ Years`, 
      description: 'of successful travel experiences and customer satisfaction'
    },
    { 
      icon: '🌍', 
      title: `${stats.destinations}+ Destinations`, 
      description: 'Across India, Asia, and international destinations'
    },
    { 
      icon: '👥', 
      title: `${(stats.happy_customers || 5000).toLocaleString('en-IN')}+ Travelers`, 
      description: 'Trusted by thousands for their dream vacations'
    },
    { 
      icon: '📞', 
      title: `${stats.support} Available`, 
      description: 'Round-the-clock customer support and assistance'
    }
  ];

  container.innerHTML = cards.map(c => `
    <div class="info-card fade-up">
      <h3>${c.icon} ${c.title}</h3>
      <p>${c.description}</p>
    </div>
  `).join('');
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadAboutContent, 200);
});
