// =====================================================
// GALLERY.JS - Gallery with filters, lightbox & CMS
// Enhanced with related image navigation
// =====================================================

let allImages = [];
let filteredImages = [];
let currentFilteredCategory = 'all';
let lightboxIndex = 0;
let lightboxRelatedImages = []; // Images in current lightbox view

/**
 * Load gallery images from data/gallery.json
 */
async function loadGalleryFromCMS() {
  try {
    console.log('[GALLERY] Loading gallery images...');
    
    // Try to load from data/gallery.json
    const url = __getDataUrl('gallery.json');
    console.log('[GALLERY] Fetching from:', url);
    
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.warn('[GALLERY] Gallery.json not found, using sample images');
      loadSampleGallery();
      return;
    }

    const data = await response.json();
    allImages = (data.gallery || data.images || []);

    if (allImages.length === 0) {
      console.warn('[GALLERY] No images in gallery.json, using samples');
      loadSampleGallery();
      return;
    }

    console.log('[GALLERY] ✅ Loaded', allImages.length, 'images from CMS');
    renderGallery();
  } catch (e) {
    console.error('[GALLERY] Load error:', e);
    loadSampleGallery();
  }
}

/**
 * Load sample gallery images (fallback)
 */
function loadSampleGallery() {
  const sampleGalleryImages = [
    { 
      id: 'goa-1', 
      title: 'Goa Beach Paradise', 
      category: 'beaches', 
      destination: 'Goa', 
      src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'goa-2', 
      title: 'Sunset at Goa', 
      category: 'beaches', 
      destination: 'Goa', 
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'goa-3', 
      title: 'Goa Night Life', 
      category: 'beaches', 
      destination: 'Goa', 
      src: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'himalaya-1', 
      title: 'Himalayan Trek', 
      category: 'mountains', 
      destination: 'Himalayas', 
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'himalaya-2', 
      title: 'Mountain Peak View', 
      category: 'mountains', 
      destination: 'Himalayas', 
      src: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'himalaya-3', 
      title: 'Alpine Meadows', 
      category: 'mountains', 
      destination: 'Himalayas', 
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'delhi-1', 
      title: 'Delhi City Lights', 
      category: 'cities', 
      destination: 'Delhi', 
      src: 'https://images.unsplash.com/photo-1514819861854-dbe86a8c0cde?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'delhi-2', 
      title: 'City Skyline', 
      category: 'cities', 
      destination: 'Delhi', 
      src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'jaipur-1', 
      title: 'Hawa Mahal Palace', 
      category: 'culture', 
      destination: 'Jaipur', 
      src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'jaipur-2', 
      title: 'Royal Palace', 
      category: 'culture', 
      destination: 'Jaipur', 
      src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'jaipur-3', 
      title: 'Traditional Architecture', 
      category: 'culture', 
      destination: 'Jaipur', 
      src: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'kerala-1', 
      title: 'Kerala Backwaters', 
      category: 'beaches', 
      destination: 'Kerala', 
      src: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop' 
    },
    { 
      id: 'varanasi-1', 
      title: 'Ganges Ghat', 
      category: 'culture', 
      destination: 'Varanasi', 
      src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=800&fit=crop' 
    }
  ];

  allImages = sampleGalleryImages;
  console.log('[GALLERY] 📷 Using sample gallery:', allImages.length, 'images');
  renderGallery();
}

/**
 * Render gallery and setup filters
 */
function renderGallery() {
  filteredImages = [...allImages];
  
  renderGalleryGrid(filteredImages);
  setupGalleryFilters();
  updateGalleryStats();
  updatePageMeta();

  console.log('[GALLERY] Gallery rendered');
}

/**
 * Render gallery grid
 */
function renderGalleryGrid(images) {
  const container = document.getElementById('galleryGrid');
  const noImages = document.getElementById('noImages');
  
  if (!container) return;

  if (images.length === 0) {
    container.innerHTML = '';
    if (noImages) noImages.style.display = 'block';
    return;
  }

  if (noImages) noImages.style.display = 'none';

  container.innerHTML = images.map((img, idx) => `
    <div class="gallery-item" 
         data-category="${img.category}" 
         data-destination="${img.destination || ''}"
         data-index="${idx}"
         data-image-id="${img.id}"
         style="animation-delay: ${idx * 0.05}s;">
      <div class="gallery-item-wrapper">
        <img 
          src="${img.src}" 
          alt="${img.title}" 
          class="gallery-image"
          loading="lazy"
        />
        <div class="gallery-overlay">
          <div class="overlay-content">
            <h3>${img.title}</h3>
            ${img.destination ? `<p class="destination">📍 ${img.destination}</p>` : ''}
          </div>
          <button class="overlay-btn" onclick="openLightbox(${idx})" aria-label="View ${img.title}">
            📸 View Photo
          </button>
        </div>
      </div>
    </div>
  `).join('');

  console.log('[GALLERY] Rendered', images.length, 'images');
}

/**
 * Setup gallery filters
 */
function setupGalleryFilters() {
  // Get unique categories
  const categories = [...new Set(allImages.map(img => img.category))].sort();
  
  // Rebuild filter buttons
  const filterContainer = document.getElementById('filterButtons');
  if (filterContainer) {
    filterContainer.innerHTML = `
      <button class="filter-btn active" data-filter="all" aria-pressed="true">
        ✓ All (${allImages.length})
      </button>
    ` + categories.map(cat => {
      const count = allImages.filter(img => img.category === cat).length;
      return `
        <button class="filter-btn" data-filter="${cat}" aria-pressed="false">
          ${getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${count})
        </button>
      `;
    }).join('');
  }

  // Add event listeners
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterGallery(btn.dataset.filter);
      
      // Update aria states
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.setAttribute('aria-pressed', 'false');
        b.classList.remove('active');
      });
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('active');
    });
  });

  console.log('[GALLERY] Filters setup:', categories);
}

/**
 * Filter gallery by category
 */
function filterGallery(category) {
  currentFilteredCategory = category;
  
  if (category === 'all') {
    filteredImages = [...allImages];
  } else {
    filteredImages = allImages.filter(img => img.category === category);
  }

  renderGalleryGrid(filteredImages);
  console.log('[GALLERY] Filtered by', category, ':', filteredImages.length, 'images');
}

/**
 * Reset filters
 */
function resetFilters() {
  currentFilteredCategory = 'all';
  filteredImages = [...allImages];
  renderGalleryGrid(filteredImages);
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.filter === 'all') {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  console.log('[GALLERY] Filters reset');
}

/**
 * Get category icon
 */
function getCategoryIcon(category) {
  const icons = {
    'mountains': '🏔️',
    'beaches': '🏖️',
    'cities': '🏙️',
    'culture': '🕉️',
    'nature': '🌲',
    'wildlife': '🦁',
    'food': '🍜',
    'adventure': '⛺'
  };
  return icons[category] || '📸';
}

/**
 * Open lightbox with related images
 * Shows current image and allows navigation through related images
 */
function openLightbox(index) {
  lightboxIndex = 0;
  const selectedImage = filteredImages[index];
  
  if (!selectedImage) return;

  console.log('[LIGHTBOX] Opening:', selectedImage.title);

  // Get all images from same destination or category
  lightboxRelatedImages = allImages.filter(img => 
    img.destination === selectedImage.destination || 
    img.category === selectedImage.category
  );

  // Find the index of the selected image in related images
  lightboxIndex = lightboxRelatedImages.findIndex(img => img.id === selectedImage.id);

  console.log('[LIGHTBOX] Related images:', lightboxRelatedImages.length);
  console.log('[LIGHTBOX] Current index:', lightboxIndex);

  displayLightboxImage(lightboxIndex);

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Display image in lightbox
 */
function displayLightboxImage(index) {
  const img = lightboxRelatedImages[index];
  
  if (!img) return;

  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxRelated = document.getElementById('lightboxRelated');

  if (lightboxImage) {
    lightboxImage.src = img.src;
    lightboxImage.alt = img.title;
    lightboxImage.style.animation = 'fadeIn 0.4s ease';
  }

  if (lightboxCaption) {
    lightboxCaption.innerHTML = `
      <h3>${img.title}</h3>
      ${img.destination ? `<p>📍 ${img.destination}</p>` : ''}
      ${img.description ? `<p class="description">${img.description}</p>` : ''}
    `;
  }

  if (lightboxCounter) {
    lightboxCounter.textContent = `${index + 1} / ${lightboxRelatedImages.length}`;
  }

  // Show related image thumbnails
  if (lightboxRelated) {
    lightboxRelated.innerHTML = lightboxRelatedImages.map((relImg, idx) => `
      <button 
        class="related-thumb ${idx === index ? 'active' : ''}"
        onclick="displayLightboxImage(${idx})"
        title="${relImg.title}"
        aria-label="View ${relImg.title}"
      >
        <img 
          src="${relImg.src}" 
          alt="${relImg.title}"
          loading="lazy"
        />
      </button>
    `).join('');
  }

  console.log('[LIGHTBOX] Displaying image', index + 1, 'of', lightboxRelatedImages.length);
}

/**
 * Close lightbox
 */
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    console.log('[LIGHTBOX] Closed');
  }
}

/**
 * Navigate lightbox images
 */
function navigateLightbox(direction) {
  let newIndex = lightboxIndex + direction;
  
  // Loop around
  if (newIndex < 0) newIndex = lightboxRelatedImages.length - 1;
  if (newIndex >= lightboxRelatedImages.length) newIndex = 0;
  
  lightboxIndex = newIndex;
  displayLightboxImage(newIndex);

  console.log('[LIGHTBOX] Navigated to', newIndex + 1);
}

/**
 * Update gallery stats
 */
function updateGalleryStats() {
  const imageCount = document.getElementById('imageCount');
  const totalPhotos = document.getElementById('totalPhotos');
  const totalCategories = document.getElementById('totalCategories');
  const totalDestinations = document.getElementById('totalDestinations');

  const uniqueDestinations = [...new Set(allImages.map(img => img.destination).filter(Boolean))].length;
  const uniqueCategories = [...new Set(allImages.map(img => img.category))].length;

  if (imageCount) imageCount.textContent = allImages.length;
  if (totalPhotos) totalPhotos.textContent = allImages.length;
  if (totalCategories) totalCategories.textContent = uniqueCategories;
  if (totalDestinations) totalDestinations.textContent = uniqueDestinations;

  console.log('[GALLERY] Stats updated');
}

/**
 * Update page meta
 */
function updatePageMeta() {
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-desc');

  if (pageTitle) {
    pageTitle.textContent = `Gallery (${allImages.length} photos) — GNTT`;
  }

  if (pageDesc) {
    pageDesc.setAttribute('content', `Browse ${allImages.length} beautiful travel photos from our past tours and journeys across India`);
  }
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[GALLERY] 🎬 Page initialized');
  
  // Show loading
  const loading = document.getElementById('galleryLoading');
  if (loading) loading.style.display = 'block';

  setTimeout(() => {
    loadGalleryFromCMS();
    
    if (loading) loading.style.display = 'none';

    // Setup lightbox close button
    const lightboxClose = document.querySelector('.lightbox-close');
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    // Setup lightbox navigation
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => navigateLightbox(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => navigateLightbox(1));
    }

    // Lightbox background click
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
          closeLightbox();
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const lightbox = document.getElementById('lightbox');
      if (lightbox && lightbox.style.display === 'flex') {
        if (e.key === 'Escape') {
          closeLightbox();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateLightbox(-1);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateLightbox(1);
        }
      }
    });

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', resetFilters);
    }

  }, 200);
});

console.log('[GALLERY] ✅ Script loaded');
