// =====================================================
// ABOUT.JS - CMS-powered About page
// =====================================================

/**
 * Load about page content from CMS
 */
async function loadAboutContent() {
  try {
    const cmsData = await fetchCMSData();
    if (!cmsData) {
      console.error('Failed to load CMS data');
      return;
    }

    // Load about sections from CMS
    await loadAboutSections();
    
    // Load features from offerings
    renderAboutFeatures(cmsData);
    
    // Load stats
    renderAboutStats(cmsData.stats);
    
  } catch (e) {
    console.error('Error loading about content:', e);
  }
}

/**
 * Load about sections from CMS folder
 */
async function loadAboutSections() {
  try {
    // In production, this would load from content/pages/about/*.json
    // For now, use hardcoded content
    const sections = [
      {
        id: 'our-story',
        title: 'Our Story',
        content: `Guru Nanak Tour & Travels started with a simple mission: to make travel accessible, affordable, and unforgettable for everyone. What began as a small local travel agency has grown into a trusted name in the tourism industry, serving thousands of happy travelers from across India and abroad.

Over the years, we've built lasting relationships with hotels, airlines, and tour operators, allowing us to offer the best rates and personalized experiences to our clients.`,
        order: 1
      }
    ];

    const container = document.getElementById('about-sections-container');
    if (!container) return;

    container.innerHTML = sections.map(section => `
      <div class="about-section" id="${section.id}">
        <h2>${section.title}</h2>
        ${section.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      </div>
    `).join('');
  } catch (e) {
    console.error('Error loading about sections:', e);
  }
}

/**
 * Render about features
 */
function renderAboutFeatures(cmsData) {
  const container = document.getElementById('about-features-grid');
  if (!container) return;

  const features = [
    { icon: '🎯', title: 'Expert Planning', description: 'Our experienced team designs trips tailored to your preferences and budget.' },
    { icon: '💰', title: 'Best Prices', description: 'We negotiate with partners to bring you unbeatable rates on tours and packages.' },
    { icon: '🤝', title: '24/7 Support', description: 'Our team is always available to help before, during, and after your journey.' },
    { icon: '✈️', title: 'Wide Network', description: 'Partnerships with 50+ destinations and premium service providers worldwide.' },
    { icon: '📋', title: 'Hassle-Free Documentation', description: 'Complete visa assistance and travel document support for international trips.' },
    { icon: '⭐', title: 'Proven Track Record', description: `${cmsData.stats?.happy_customers || 5000}+ happy customers with an average ${cmsData.stats?.average_rating || 4.8}-star rating.` }
  ];

  container.innerHTML = features.map(f => `
    <div class="feature">
      <div class="feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
  `).join('');
}

/**
 * Render about stats
 */
function renderAboutStats(stats) {
  const container = document.getElementById('about-stats-cards');
  if (!container || !stats) return;

  const cards = [
    { icon: '🎉', title: `${stats.experience_years || 15}+ Years`, description: 'of successful travel experiences and customer satisfaction' },
    { icon: '🌍', title: `${stats.destinations || 50}+ Destinations`, description: 'Across India, Asia, and international destinations' },
    { icon: '👥', title: `${stats.happy_customers || 5000}+ Travelers`, description: 'Trusted by thousands for their dream vacations' },
    { icon: '📞', title: `${stats.support || '24/7'} Available`, description: 'Round-the-clock customer support and assistance' }
  ];

  container.innerHTML = cards.map(c => `
    <div class="info-card">
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
