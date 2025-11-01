 // =====================================================
// PAGES.JS - Generic page handlers
// =====================================================

/**
 * Load gallery images
 */
async function loadGallery() {
  const cmsData = await fetchCMSData();
  if (!cmsData) return;

  // Sample gallery data (add to home.json if needed)
  const galleryImages = [
    { id: 'mountains', title: 'Mountain', category: 'mountains', src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' },
    { id: 'beaches', title: 'Beach', category: 'beaches', src: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop' },
    { id: 'cities', title: 'City', category: 'cities', src: 'https://images.unsplash.com/photo-1514819861854-dbe86a8c0cde?w=400&h=300&fit=crop' },
    { id: 'culture', title: 'Culture', category: 'culture', src: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop' },
  ];

  renderGallery(galleryImages);
}

/**
 * Render gallery grid
 */
function renderGallery(images) {
  const container = document.getElementById('galleryGrid');
  if (!container) return;

  container.innerHTML = images.map(img => `
    <div class="gallery-item" data-category="${img.category}">
      <img src="${img.src}" alt="${img.title}" loading="lazy" onclick="openLightbox('${img.src}', '${img.title}')" />
    </div>
  `).join('');

  setupGalleryFilters(images);
}

/**
 * Setup gallery filters
 */
function setupGalleryFilters(images) {
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
        } else {
          item.style.display = 'none';
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
  }
}

/**
 * Close lightbox
 */
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
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
});

/**
 * Load gallery on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadGallery, 200);
});
