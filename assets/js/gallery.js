// =====================================================
// GALLERY.JS - CMS-powered gallery with auto-discovery
// Automatically fetches all JSON files from GitHub
// =====================================================

let allGalleryImages = [];
let currentLightboxIndex = 0;
const CACHE_KEY = 'gntt_gallery_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Load gallery from CMS
 */
async function loadGallery() {
  try {
    console.log('🖼️ Loading gallery...');
    
    // Try loading from cache first
    const cachedData = loadFromCache();
    if (cachedData) {
      console.log('✅ Loaded from cache');
      allGalleryImages = cachedData;
      renderGalleryFilters();
      renderGalleryGrid(allGalleryImages);
      setupLightbox();
      return;
    }
    
    // Try loading from GitHub API (auto-discovers all files)
    const galleryImages = await loadGalleryFromGitHub();
    
    if (galleryImages.length === 0) {
      console.warn('⚠️ No CMS gallery found, using sample data');
      allGalleryImages = getSampleGalleryImages();
    } else {
      allGalleryImages = galleryImages;
      saveToCache(galleryImages);
    }

    renderGalleryFilters();
    renderGalleryGrid(allGalleryImages);
    setupLightbox();
    
    console.log('✅ Gallery loaded with', allGalleryImages.length, 'images');
  } catch (e) {
    console.error('❌ Error loading gallery:', e);
    allGalleryImages = getSampleGalleryImages();
    renderGalleryFilters();
    renderGalleryGrid(allGalleryImages);
    setupLightbox();
    showToast('Using default gallery', 'info');
  }
}

/**
 * Load from localStorage cache
 */
function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      return data;
    }
    
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (e) {
    console.warn('Cache load failed:', e);
    return null;
  }
}

/**
 * Save to localStorage cache
 */
function saveToCache(data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
}

/**
 * Load all gallery JSON files from GitHub automatically
 * Uses GitHub API to discover all files in the folder
 */
async function loadGalleryFromGitHub() {
  const images = [];
  
  try {
    // GitHub repository info
    const owner = 'dearestwall'; // Your GitHub username
    const repo = 'GuruNanakToursandTravels'; // Your repository name
    const path = 'content/pages/gallery'; // Gallery folder path
    
    // GitHub API URL to list files in directory
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    console.log('📡 Fetching gallery files from GitHub API...');
    
    // Fetch directory listing
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      console.warn('GitHub API request failed:', response.status);
      
      // Fallback: try loading from raw.githubusercontent.com
      return await loadGalleryFromRawGitHub();
    }
    
    const files = await response.json();
    
    // Check if response is an array (directory listing)
    if (!Array.isArray(files)) {
      console.warn('Unexpected GitHub API response format');
      return await loadGalleryFromRawGitHub();
    }
    
    // Filter only .json files
    const jsonFiles = files.filter(file => 
      file.type === 'file' && 
      file.name.endsWith('.json') && 
      file.name !== 'index.json' // Skip index if exists
    );
    
    console.log(`📂 Found ${jsonFiles.length} gallery JSON files`);
    
    if (jsonFiles.length === 0) {
      return await loadGalleryFromRawGitHub();
    }
    
    // Fetch each JSON file content
    const fetchPromises = jsonFiles.map(async (file) => {
      try {
        const fileResponse = await fetch(file.download_url);
        if (fileResponse.ok) {
          const data = await fileResponse.json();
          
          // Validate required fields
          if (data.id && data.image && data.category) {
            console.log(`✅ Loaded: ${file.name}`);
            return data;
          }
        }
      } catch (e) {
        console.warn(`⚠️ Failed to load ${file.name}:`, e);
      }
      return null;
    });
    
    const results = await Promise.all(fetchPromises);
    const validImages = results.filter(img => img !== null);
    
    // Sort by category and title
    validImages.sort((a, b) => {
      if (a.category === b.category) {
        return (a.title || '').localeCompare(b.title || '');
      }
      return (a.category || '').localeCompare(b.category || '');
    });
    
    return validImages;
    
  } catch (e) {
    console.error('Error fetching from GitHub API:', e);
    return await loadGalleryFromRawGitHub();
  }
}

/**
 * Fallback: Load from raw GitHub files (works for public repos)
 */
async function loadGalleryFromRawGitHub() {
  console.log('🔄 Trying raw GitHub fallback...');
  
  const owner = 'dearestwall';
  const repo = 'GuruNanakToursandTravels';
  const branch = 'main';
  
  try {
    // Try to fetch index.json if it exists
    const indexUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/content/pages/gallery/index.json`;
    const indexRes = await fetch(indexUrl);
    
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      if (indexData.images && Array.isArray(indexData.images)) {
        console.log('✅ Loaded from index.json');
        return indexData.images;
      }
    }
  } catch (e) {
    console.warn('No index.json found');
  }
  
  return [];
}

/**
 * Get sample gallery images (fallback)
 */
function getSampleGalleryImages() {
  return [
    { 
      id: 'goa-1', 
      title: 'Goa Beach Sunset', 
      category: 'beaches', 
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop', 
      description: 'Beautiful sunset at Goa beach with golden hour lighting',
      published: true
    },
    { 
      id: 'goa-2', 
      title: 'Beach Paradise', 
      category: 'beaches', 
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', 
      description: 'Pristine beaches of Goa with crystal clear water',
      published: true
    },
    { 
      id: 'himalaya-1', 
      title: 'Mountain Trek', 
      category: 'mountains', 
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', 
      description: 'Himalayan mountain range with stunning peaks',
      published: true
    },
    { 
      id: 'himalaya-2', 
      title: 'Snow Peaks', 
      category: 'mountains', 
      image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop', 
      description: 'Majestic snow-capped peaks',
      published: true
    },
    { 
      id: 'delhi-1', 
      title: 'Delhi Monuments', 
      category: 'cities', 
      image: 'https://images.unsplash.com/photo-1514819861854-dbe86a8c0cde?w=800&h=600&fit=crop', 
      description: 'Historic monuments and architecture of Delhi',
      published: true
    },
    { 
      id: 'jaipur-1', 
      title: 'Hawa Mahal', 
      category: 'culture', 
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop', 
      description: 'Palace of Winds, Jaipur - iconic pink sandstone',
      published: true
    },
    { 
      id: 'agra-1', 
      title: 'Taj Mahal', 
      category: 'culture', 
      image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop', 
      description: 'Iconic Taj Mahal at sunrise',
      published: true
    },
    { 
      id: 'wildlife-1', 
      title: 'Tiger Safari', 
      category: 'wildlife', 
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop', 
      description: 'Exciting wildlife safari in Indian reserves',
      published: true
    },
    { 
      id: 'adventure-1', 
      title: 'River Rafting', 
      category: 'adventure', 
      image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop', 
      description: 'Thrilling white water rafting adventure',
      published: true
    },
    { 
      id: 'kerala-1', 
      title: 'Kerala Backwaters', 
      category: 'beaches', 
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop', 
      description: 'Serene backwaters of Kerala with houseboats',
      published: true
    }
  ];
}

/**
 * Render gallery filters
 */
function renderGalleryFilters() {
  const container = document.getElementById('gallery-filters');
  if (!container) return;

  // Get unique categories from images
  const publishedImages = allGalleryImages.filter(img => img.published !== false);
  const categories = ['all', ...new Set(publishedImages.map(img => img.category).filter(Boolean))];
  
  const categoryIcons = {
    all: '🌍',
    mountains: '🏔️',
    beaches: '🏖️',
    cities: '🏙️',
    culture: '🕉️',
    wildlife: '🦁',
    adventure: '🎿'
  };

  container.innerHTML = categories.map((cat, i) => `
    <button 
      class="filter-btn ${i === 0 ? 'active' : ''}" 
      data-filter="${cat}"
      aria-label="Filter by ${cat}"
      title="Show ${cat} images"
    >
      ${categoryIcons[cat] || '📷'} ${cat.charAt(0).toUpperCase() + cat.slice(1)}
    </button>
  `).join('');

  setupGalleryFilters();
}

/**
 * Render gallery grid
 */
function renderGalleryGrid(images) {
  const container = document.getElementById('galleryGrid');
  if (!container) return;

  // Filter only published images
  const publishedImages = images.filter(img => img.published !== false);

  if (publishedImages.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;width:100%;grid-column:1/-1;">
        <p style="font-size:1.2rem;color:var(--muted);">No gallery images available at the moment.</p>
        <p style="margin-top:1rem;"><a href="/contact/" class="btn btn-primary">Contact us for more info</a></p>
      </div>
    `;
    return;
  }

  container.innerHTML = publishedImages.map((img, idx) => `
    <div class="gallery-item fade-up" data-category="${img.category}" data-index="${idx}">
      <div class="gallery-item-wrapper">
        <img 
          src="${img.image}" 
          alt="${img.title}" 
          class="gallery-image"
          loading="lazy"
          onclick="openLightbox(${idx})"
          onerror="this.src='https://via.placeholder.com/800x600?text=Image+Not+Found'"
        />
        <div class="gallery-overlay">
          <p>${img.title}</p>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Setup gallery filters
 */
function setupGalleryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const items = document.querySelectorAll('.gallery-item');

      // Filter items with smooth animation
      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 10);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.9)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/**
 * Setup lightbox
 */
function setupLightbox() {
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');
  const lightbox = document.getElementById('lightbox');

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });
  }
  
  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
  }
  
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleLightboxKeyboard);
}

/**
 * Handle keyboard events for lightbox
 */
function handleLightboxKeyboard(e) {
  const lightbox = document.getElementById('lightbox');
  if (lightbox?.style.display === 'flex') {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  }
}

/**
 * Open lightbox
 */
function openLightbox(index) {
  currentLightboxIndex = index;
  const publishedImages = allGalleryImages.filter(img => img.published !== false);
  const img = publishedImages[index];
  
  if (!img) {
    console.warn('Image not found at index:', index);
    return;
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (lightbox && lightboxImage) {
    lightboxImage.src = img.image;
    lightboxImage.alt = img.title;
    lightboxImage.onerror = () => {
      lightboxImage.src = 'https://via.placeholder.com/1200x800?text=Image+Not+Found';
    };
    
    if (lightboxCaption) {
      lightboxCaption.innerHTML = `
        <strong>${img.title}</strong>
        ${img.description ? `<br><span style="font-size:0.9rem;opacity:0.9;">${img.description}</span>` : ''}
      `;
    }
    
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Navigate lightbox
 */
function navigateLightbox(direction) {
  const publishedImages = allGalleryImages.filter(img => img.published !== false);
  currentLightboxIndex = (currentLightboxIndex + direction + publishedImages.length) % publishedImages.length;
  openLightbox(currentLightboxIndex);
}

/**
 * Close lightbox
 */
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadGallery, 200);
});

// Make functions globally available for onclick handlers
window.openLightbox = openLightbox;
window.navigateLightbox = navigateLightbox;
window.closeLightbox = closeLightbox;
