// =====================================================
// GALLERY.JS - Gallery with filters and lightbox
// =====================================================

const sampleGalleryImages = [
  { id: 'goa-1', title: 'Goa Beach', category: 'beaches', src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=400&fit=crop' },
  { id: 'goa-2', title: 'Sunset at Goa', category: 'beaches', src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=400&fit=crop' },
  { id: 'himalaya-1', title: 'Himalaya Trek', category: 'mountains', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop' },
  { id: 'himalaya-2', title: 'Mountain Peak', category: 'mountains', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop' },
  { id: 'delhi-1', title: 'Delhi City', category: 'cities', src: 'https://images.unsplash.com/photo-1514819861854-dbe86a8c0cde?w=500&h=400&fit=crop' },
  { id: 'delhi-2', title: 'City Lights', category: 'cities', src: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=500&h=400&fit=crop' },
  { id: 'jaipur-1', title: 'Hawa Mahal', category: 'culture', src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500&h=400&fit=crop' },
  { id: 'jaipur-2', title: 'Palace Architecture', category: 'culture', src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&h=400&fit=crop' }
];

/**
 * Load and render gallery
 */
function loadGallery() {
  renderGalleryGrid(sampleGalleryImages);
  setupGalleryFilters();
}

/**
 * Render gallery grid
 */
function renderGalleryGrid(images) {
  const container = document.getElementById('galleryGrid');
  if (!container) return;

  container.innerHTML = images.map(img => `
    <div class="gallery-item" data-category="${img.category}">
      <div class="gallery-item-wrapper">
        <img 
          src="${img.src}" 
          alt="${img.title}" 
          class="gallery-image"
          loading="lazy"
          onclick="openLightbox('${img.src}', '${img.title}')"
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
          item.style.opacity = '0';
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
          }, 10);
        } else {
          item.style.opacity = '0';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/**
 * Open lightbox
 */
function openLightbox(src, title) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');

  if (lightbox && lightboxImage) {
    lightboxImage.src = src;
    lightboxImage.alt = title;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
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

  const lightboxClose = document.querySelector('.lightbox-close');
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});
