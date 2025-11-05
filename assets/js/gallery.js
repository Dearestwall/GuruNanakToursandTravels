// =====================================================
// GALLERY.JS - CMS-powered gallery with lightbox
// =====================================================

let allGalleryImages = [];
let currentLightboxIndex = 0;

/**
 * Load gallery from CMS
 */
async function loadGallery() {
  try {
    // In production, load from content/pages/gallery/*.json
    // For now, use sample data
    allGalleryImages = [
      { id: 'goa-1', title: 'Goa Beach Sunset', category: 'beaches', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=450&fit=crop', description: 'Beautiful sunset at Goa beach' },
      { id: 'goa-2', title: 'Beach Paradise', category: 'beaches', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=450&fit=crop', description: 'Pristine beaches of Goa' },
      { id: 'himalaya-1', title: 'Mountain Trek', category: 'mountains', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=450&fit=crop', description: 'Himalayan mountain range' },
      { id: 'himalaya-2', title: 'Snow Peaks', category: 'mountains', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=450&fit=crop', description: 'Snow-capped peaks' },
      { id: 'delhi-1', title: 'Delhi Monuments', category: 'cities', image: 'https://images.unsplash.com/photo-1514819861854-dbe86a8c0cde?w=600&h=450&fit=crop', description: 'Historic monuments' },
      { id: 'jaipur-1', title: 'Hawa Mahal', category: 'culture', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=450&fit=crop', description: 'Palace of Winds' },
      { id: 'wildlife-1', title: 'Tiger Safari', category: 'wildlife', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=450&fit=crop', description: 'Wildlife safari experience' },
      { id: 'adventure-1', title: 'River Rafting', category: 'adventure', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=450&fit=crop', description: 'Thrilling adventure sports' }
    ];

    renderGalleryFilters();
    renderGalleryGrid(allGalleryImages);
    setupLightbox();
  } catch (e) {
    console.error('Error loading gallery:', e);
  }
}

/**
 * Render gallery filters
 */
function renderGalleryFilters() {
  const container = document.getElementById('gallery-filters');
  if (!container) return;

  const categories = ['all', ...new Set(allGalleryImages.map(img => img.category))];
  
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

  container.innerHTML = images.map((img, idx) => `
    <div class="gallery-item" data-category="${img.category}" data-index="${idx}">
      <div class="gallery-item-wrapper">
        <img 
          src="${img.image}" 
          alt="${img.title}" 
          class="gallery-image"
          loading="lazy"
          onclick="openLightbox(${idx})"
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
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const items = document.querySelectorAll('.gallery-item');

      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = 'block';
          setTimeout(() => item.style.opacity = '1', 10);
        } else {
          item.style.opacity = '0';
          setTimeout(() => item.style.display = 'none', 300);
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

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));
  
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox?.style.display === 'flex') {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    }
  });
}

/**
 * Open lightbox
 */
function openLightbox(index) {
  currentLightboxIndex = index;
  const img = allGalleryImages[index];
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (lightbox && lightboxImage) {
    lightboxImage.src = img.image;
    lightboxImage.alt = img.title;
    if (lightboxCaption) {
      lightboxCaption.innerHTML = `<strong>${img.title}</strong><br>${img.description || ''}`;
    }
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Navigate lightbox
 */
function navigateLightbox(direction) {
  currentLightboxIndex = (currentLightboxIndex + direction + allGalleryImages.length) % allGalleryImages.length;
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
