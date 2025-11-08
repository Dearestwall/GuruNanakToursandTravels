// =====================================================
// DETAILS.JS - Universal Details Page (Tours, Offerings, Videos)
// COMPLETE FINAL VERSION - PRODUCTION READY
// Enhanced with full video support, sharing & copy functionality
// =====================================================

let cmsData = null;
let currentDetail = null;
let detailType = 'tour'; // 'tour', 'offering', or 'video'

// =====================================================
// VIDEO HELPER FUNCTIONS
// =====================================================

/**
 * Extract video ID from YouTube/Vimeo URL
 */
function extractVideoId(url, sourceType) {
  if (!url) return null;
  
  try {
    if (sourceType === 'youtube') {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/,
        /youtube\.com\/shorts\/([^&?\/]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
      }
    } else if (sourceType === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) return match[1];
    }
  } catch (e) {
    console.error('[VIDEO] Error extracting video ID:', e);
  }
  
  return null;
}

/**
 * Get video source URL or embed URL
 */
function getVideoSource(video) {
  if (video.source_type === 'upload' && video.video_file) {
    return {
      type: 'upload',
      url: window.__toAbs ? window.__toAbs(video.video_file) : video.video_file
    };
  }
  
  if (video.source_type === 'youtube' && video.video_url) {
    const videoId = extractVideoId(video.video_url, 'youtube');
    if (videoId) {
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
        videoId: videoId
      };
    }
  }
  
  if (video.source_type === 'vimeo' && video.video_url) {
    const videoId = extractVideoId(video.video_url, 'vimeo');
    if (videoId) {
      return {
        type: 'vimeo',
        url: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
        videoId: videoId
      };
    }
  }
  
  return null;
}

/**
 * Get video thumbnail
 */
function getVideoThumbnail(video) {
  if (video.thumbnail) {
    return window.__toAbs ? window.__toAbs(video.thumbnail) : video.thumbnail;
  }
  
  if (video.source_type === 'youtube' && video.video_url) {
    const videoId = extractVideoId(video.video_url, 'youtube');
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }
  
  if (video.source_type === 'vimeo') {
    return `https://via.placeholder.com/800x450/0e5aa7/ffffff?text=Vimeo+Video`;
  }
  
  if (video.source_type === 'upload') {
    return `https://via.placeholder.com/800x450/0e5aa7/ffffff?text=Video`;
  }
  
  return `https://via.placeholder.com/800x450/0e5aa7/ffffff?text=Video`;
}

// =====================================================
// MAIN DETAILS LOADING
// =====================================================

/**
 * Load details based on URL parameters
 */
async function loadDetails() {
  const id = getQueryParam('id');
  const type = getQueryParam('type') || 'tour';

  console.log('[DETAILS] Loading:', { id, type });

  if (!id) {
    showError('No item ID provided. Redirecting to homepage...');
    setTimeout(() => {
      window.location.href = __toAbs('/index.html');
    }, 2000);
    return;
  }

  detailType = type;

  // Load CMS data
  cmsData = await fetchCMSData();
  if (!cmsData) {
    showError('Failed to load data. Redirecting to homepage...');
    setTimeout(() => {
      window.location.href = __toAbs('/index.html');
    }, 2000);
    return;
  }

  console.log('[DETAILS] CMS Data loaded:', cmsData);

  let item = null;

  // Find item based on type
  if (type === 'tour') {
    item = cmsData.featured_tours?.find(t => t.id === id);
    console.log('[DETAILS] Looking for tour with ID:', id, 'Found:', !!item);
  } else if (type === 'offering' || type === 'service') {
    item = cmsData.offerings?.find(o => o.id === id);
    console.log('[DETAILS] Looking for offering with ID:', id, 'Found:', !!item);
  } else if (type === 'video') {
    // Try different paths for video data
    const videos = cmsData.videos?.videos || cmsData.videos || [];
    item = videos.find(v => v.id === id);
    console.log('[DETAILS] Looking for video with ID:', id);
    console.log('[DETAILS] Available videos:', videos.map(v => v.id));
    console.log('[DETAILS] Found video:', !!item);
  }

  if (!item) {
    console.error('[DETAILS] Item not found:', { id, type });
    showError(`${type.charAt(0).toUpperCase() + type.slice(1)} not found. Please check the link.`);
    setTimeout(() => {
      window.location.href = __toAbs('/index.html');
    }, 3000);
    return;
  }

  console.log('[DETAILS] Item found:', item);

  currentDetail = item;
  renderDetails(item, type);
  renderSuggested(type);
  renderRelated(type);
  
  if (type !== 'video') {
    renderDetailFAQs();
  }
}

// =====================================================
// RENDER DETAILS (MAIN FUNCTION)
// =====================================================

/**
 * Render main details based on type
 */
function renderDetails(item, type) {
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = `${item.name || item.title} — GNTT`;

  const pageDesc = document.getElementById('page-desc');
  if (pageDesc) pageDesc.setAttribute('content', item.summary || item.description || '');

  // Hero
  const heroTitle = document.getElementById('details-title');
  if (heroTitle) heroTitle.textContent = item.name || item.title;

  const heroSubtitle = document.getElementById('details-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = item.summary || item.description || '';

  // Breadcrumb
  const breadcrumbType = document.getElementById('breadcrumb-type');
  if (breadcrumbType) {
    if (type === 'tour') {
      breadcrumbType.textContent = 'Tours';
      breadcrumbType.href = __toAbs('/index.html#featured-tours');
    } else if (type === 'video') {
      breadcrumbType.textContent = 'Videos';
      breadcrumbType.href = __toAbs('/index.html#video-reels');
    } else {
      breadcrumbType.textContent = 'Services';
      breadcrumbType.href = __toAbs('/index.html#offerings');
    }
  }

  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = item.name || item.title;

  // Render based on type
  if (type === 'video') {
    renderVideoDetails(item);
  } else if (type === 'tour') {
    renderTourDetails(item);
  } else {
    renderOfferingDetails(item);
  }

  updateShareButtons(item);
}

// =====================================================
// VIDEO DETAILS RENDERING
// =====================================================

/**
 * Render video details page
 */
function renderVideoDetails(video) {
  console.log('[DETAILS] Rendering video:', video.id);
  
  const videoSource = getVideoSource(video);
  
  if (!videoSource) {
    showError('Invalid video source');
    return;
  }

  console.log('[DETAILS] Video source:', videoSource);

  // Hide image gallery, show video player
  const gallery = document.getElementById('detailsGallery');
  const videoSection = document.getElementById('videoPlayerSection');
  
  if (gallery) gallery.style.display = 'none';
  if (videoSection) {
    videoSection.style.display = 'block';
    
    const wrapper = document.getElementById('videoPlayerWrapper');
    if (videoSource.type === 'upload') {
      wrapper.innerHTML = `
        <video id="main-video" controls autoplay controlsList="nodownload" style="width: 100%; height: 100%; object-fit: contain;">
          <source src="${videoSource.url}" type="video/mp4">
          <source src="${videoSource.url}" type="video/webm">
          Your browser does not support HTML5 video.
        </video>
      `;
      
      // Show PiP button for uploaded videos
      const pipBtn = document.getElementById('pipBtn');
      if (pipBtn && document.pictureInPictureEnabled) {
        pipBtn.style.display = 'inline-flex';
        pipBtn.addEventListener('click', togglePiP);
      }
    } else {
      // YouTube/Vimeo embed
      wrapper.innerHTML = `
        <iframe 
          id="main-video"
          src="${videoSource.url}&autoplay=1" 
          frameborder="0" 
          allowfullscreen 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="${video.title}"
          style="width: 100%; height: 100%; border: none;"
        ></iframe>
      `;
    }
  }

  // Sidebar info
  const sidebarTitle = document.getElementById('sidebar-card-title');
  if (sidebarTitle) sidebarTitle.textContent = 'Video Information';

  const priceItem = document.getElementById('sidebar-price-item');
  if (priceItem) priceItem.style.display = 'none';

  const categoryItem = document.getElementById('sidebar-category');
  if (categoryItem && video.category) {
    categoryItem.style.display = 'flex';
    const categoryValue = document.getElementById('category-value');
    if (categoryValue) categoryValue.textContent = video.category;
  }

  const durationItem = document.getElementById('sidebar-duration');
  if (durationItem && video.duration) {
    durationItem.style.display = 'flex';
    const durationValue = document.getElementById('duration-value');
    if (durationValue) durationValue.textContent = video.duration;
  }

  const dateItem = document.getElementById('sidebar-date');
  if (dateItem && video.date) {
    dateItem.style.display = 'flex';
    const dateValue = document.getElementById('date-value');
    if (dateValue) dateValue.textContent = new Date(video.date).toLocaleDateString('en-IN');
  }

  // Description
  const descText = document.getElementById('details-description-text');
  if (descText) {
    descText.innerHTML = (video.description || '').replace(/\n/g, '<br>');
  }

  // Hide sections for videos
  const sections = document.getElementById('detailsSections');
  if (sections) sections.style.display = 'none';

  // Hide booking buttons
  const bookBtn = document.getElementById('book-package-btn');
  if (bookBtn) bookBtn.style.display = 'none';
  
  const bookBtnSidebar = document.getElementById('book-package-btn-sidebar');
  if (bookBtnSidebar) bookBtnSidebar.style.display = 'none';

  const contactCTA = document.getElementById('contact-cta');
  if (contactCTA) contactCTA.style.display = 'none';

  // Hide FAQ section for videos
  const faqSection = document.querySelector('.details-faq');
  if (faqSection) faqSection.style.display = 'none';

  // Update titles
  const suggestedTitle = document.getElementById('suggested-title');
  if (suggestedTitle) suggestedTitle.textContent = 'More Videos';

  const relatedTitle = document.getElementById('related-title');
  if (relatedTitle) relatedTitle.textContent = 'Related Videos';

  console.log('[DETAILS] Video rendered successfully');
}

// =====================================================
// TOUR DETAILS RENDERING
// =====================================================

/**
 * Render tour details
 */
function renderTourDetails(tour) {
  // Show gallery, hide video section
  const gallery = document.getElementById('detailsGallery');
  const videoSection = document.getElementById('videoPlayerSection');
  if (gallery) gallery.style.display = 'block';
  if (videoSection) videoSection.style.display = 'none';

  // Image
  const mainImage = document.getElementById('details-main-image');
  if (mainImage && tour.image) {
    mainImage.src = tour.image;
    mainImage.alt = tour.name;
  }

  // Description
  const descText = document.getElementById('details-description-text');
  if (descText) {
    descText.innerHTML = (tour.description || tour.summary || '').replace(/\n/g, '<br>');
  }

  // Sections
  renderTourSections(tour);

  // Sidebar
  if (tour.price) {
    const sidebarPrice = document.getElementById('sidebar-price');
    if (sidebarPrice) sidebarPrice.textContent = `₹${tour.price.toLocaleString('en-IN')}`;
    
    const priceItem = document.getElementById('sidebar-price-item');
    if (priceItem) priceItem.style.display = 'flex';
  }

  if (tour.duration) {
    const durationCard = document.getElementById('sidebar-duration');
    if (durationCard) {
      durationCard.style.display = 'flex';
      const durationValue = document.getElementById('duration-value');
      if (durationValue) durationValue.textContent = tour.duration;
    }
  }

  // Show booking buttons
  const bookBtn = document.getElementById('book-package-btn');
  if (bookBtn) {
    bookBtn.style.display = 'inline-flex';
    bookBtn.href = __toAbs(`/booking/index.html?id=${tour.id}&type=tour`);
    bookBtn.addEventListener('click', () => {
      sessionStorage.setItem('lastBookingData', JSON.stringify({ id: tour.id, type: 'tour' }));
    });
  }

  const bookBtnSidebar = document.getElementById('book-package-btn-sidebar');
  if (bookBtnSidebar) {
    bookBtnSidebar.style.display = 'block';
    bookBtnSidebar.href = __toAbs(`/booking/index.html?id=${tour.id}&type=tour`);
  }
}

/**
 * Render tour-specific sections
 */
function renderTourSections(tour) {
  const container = document.getElementById('detailsSections');
  if (!container) return;

  let html = '';

  if (tour.includes && tour.includes.length > 0) {
    html += `
      <div class="details-section">
        <h3>✅ What's Included</h3>
        <ul class="section-list">
          ${tour.includes.map(inc => `<li>${inc}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (tour.excludes && tour.excludes.length > 0) {
    html += `
      <div class="details-section">
        <h3>❌ What's Not Included</h3>
        <ul class="section-list">
          ${tour.excludes.map(exc => `<li>${exc}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (tour.highlights && tour.highlights.length > 0) {
    html += `
      <div class="details-section">
        <h3>🌟 Highlights</h3>
        <ul class="section-list">
          ${tour.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
  container.style.display = 'block';
}

// =====================================================
// OFFERING DETAILS RENDERING
// =====================================================

/**
 * Render offering details
 */
function renderOfferingDetails(offering) {
  // Show gallery, hide video section
  const gallery = document.getElementById('detailsGallery');
  const videoSection = document.getElementById('videoPlayerSection');
  if (gallery) gallery.style.display = 'block';
  if (videoSection) videoSection.style.display = 'none';

  // Image/Icon
  const mainImage = document.getElementById('details-main-image');
  if (mainImage) {
    if (offering.image) {
      mainImage.src = offering.image;
      mainImage.alt = offering.title;
    } else {
      mainImage.style.display = 'none';
    }
  }

  // Description
  const descText = document.getElementById('details-description-text');
  if (descText) {
    descText.innerHTML = (offering.long_description || offering.description || '').replace(/\n/g, '<br>');
  }

  // Sections
  renderOfferingSections(offering);

  // Hide price, show contact CTA
  const priceItem = document.getElementById('sidebar-price-item');
  if (priceItem) priceItem.style.display = 'none';

  const bookBtn = document.getElementById('book-package-btn');
  if (bookBtn) bookBtn.style.display = 'none';

  const bookBtnSidebar = document.getElementById('book-package-btn-sidebar');
  if (bookBtnSidebar) bookBtnSidebar.style.display = 'none';

  const contactCTA = document.getElementById('contact-cta');
  if (contactCTA) {
    contactCTA.style.display = 'block';
    contactCTA.innerHTML = `
      <div class="cta-section">
        <h3>Interested in this service?</h3>
        <p>Contact our team to customize this service for your needs.</p>
        <a href="${__toAbs('/contact/index.html')}" class="btn btn-primary">Get in Touch</a>
      </div>
    `;
  }
}

/**
 * Render offering-specific sections
 */
function renderOfferingSections(offering) {
  const container = document.getElementById('detailsSections');
  if (!container) return;

  let html = '';

  if (offering.features && offering.features.length > 0) {
    html += `
      <div class="details-section">
        <h3>✨ Key Features</h3>
        <ul class="section-list">
          ${offering.features.map(feat => `<li>${feat}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (offering.benefits && offering.benefits.length > 0) {
    html += `
      <div class="details-section">
        <h3>🎯 Benefits</h3>
        <ul class="section-list">
          ${offering.benefits.map(ben => `<li>${ben}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
  container.style.display = html ? 'block' : 'none';
}

// =====================================================
// SUGGESTED & RELATED ITEMS
// =====================================================

/**
 * Render suggested items
 */
function renderSuggested(currentType) {
  const container = document.getElementById('suggestedPackages');
  if (!container) return;

  let items = [];
  
  if (currentType === 'tour' && cmsData.featured_tours) {
    items = cmsData.featured_tours
      .filter(t => t.id !== currentDetail.id)
      .slice(0, 3);
  } else if (currentType === 'video') {
    const videos = cmsData.videos?.videos || cmsData.videos || [];
    items = videos
      .filter(v => v.id !== currentDetail.id && v.active !== false)
      .slice(0, 3);
  } else if ((currentType === 'offering' || currentType === 'service') && cmsData.offerings) {
    items = cmsData.offerings
      .filter(o => o.id !== currentDetail.id)
      .slice(0, 3);
  }

  if (items.length === 0) {
    container.innerHTML = '<p>No suggestions available.</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const url = __toAbs(`/details/?id=${encodeURIComponent(item.id)}&type=${currentType}`);
    return `
      <a href="${url}" class="suggested-item">
        <div class="suggested-icon">${item.icon || item.name?.charAt(0) || item.title?.charAt(0) || '➜'}</div>
        <h4>${item.name || item.title}</h4>
        ${item.price ? `<p class="price">₹${item.price.toLocaleString('en-IN')}</p>` : ''}
        ${item.category ? `<p class="category">${item.category}</p>` : ''}
        ${item.duration ? `<p class="duration">${item.duration}</p>` : ''}
      </a>
    `;
  }).join('');
}

/**
 * Render related items
 */
function renderRelated(currentType) {
  const container = document.getElementById('relatedTours');
  if (!container) return;

  let items = [];

  if (currentType === 'tour' && cmsData.featured_tours) {
    items = cmsData.featured_tours
      .filter(t => t.id !== currentDetail.id)
      .slice(0, 3);
  } else if (currentType === 'video') {
    const videos = cmsData.videos?.videos || cmsData.videos || [];
    items = videos
      .filter(v => v.id !== currentDetail.id && v.active !== false)
      .slice(0, 3);
  } else if ((currentType === 'offering' || currentType === 'service') && cmsData.offerings) {
    items = cmsData.offerings
      .filter(o => o.id !== currentDetail.id)
      .slice(0, 3);
  }

  if (items.length === 0) {
    container.innerHTML = '';
    const section = container.closest('section');
    if (section) section.style.display = 'none';
    return;
  }

  if (currentType === 'video') {
    container.innerHTML = items.map(video => {
      const thumbnail = getVideoThumbnail(video);
      const url = __toAbs(`/details/?id=${encodeURIComponent(video.id)}&type=video`);
      return `
        <article class="video-card" onclick="window.location.href='${url}'" style="cursor: pointer;">
          <div class="video-thumbnail">
            <img src="${thumbnail}" alt="${video.title}" loading="lazy" />
            <div class="play-overlay">▶</div>
          </div>
          <div class="video-info">
            ${video.category ? `<span class="video-category">${video.category}</span>` : ''}
            <h3>${video.title}</h3>
            ${video.duration ? `<p class="duration">⏱️ ${video.duration}</p>` : ''}
          </div>
        </article>
      `;
    }).join('');
  } else if (currentType === 'tour') {
    container.innerHTML = items.map(tour => `
      <article class="tour">
        <div class="tour-image-wrapper">
          <img src="${tour.image}" alt="${tour.name}" class="tour-image" loading="lazy" />
        </div>
        <div class="tour-body">
          <h3 class="tour-title">${tour.name}</h3>
          <p class="tour-summary">${tour.summary}</p>
          <div class="tour-footer">
            <p class="tour-price">₹${tour.price.toLocaleString('en-IN')}</p>
            <a class="btn btn-sm" href="${__toAbs(`/details/?id=${tour.id}&type=tour`)}">View Details</a>
          </div>
        </div>
      </article>
    `).join('');
  } else {
    container.innerHTML = items.map(offering => `
      <article class="service-card">
        <div class="service-icon">${offering.icon}</div>
        <h3>${offering.title}</h3>
        <p>${offering.description}</p>
        <a class="btn btn-sm" href="${__toAbs(`/details/?id=${offering.id}&type=offering`)}">Learn More</a>
      </article>
    `).join('');
  }
}

// =====================================================
// FAQs
// =====================================================

/**
 * Render detail page FAQs
 */
function renderDetailFAQs() {
  const container = document.getElementById('details-faq-list');
  if (!container) return;

  const faqs = currentDetail.faqs || [];
  if (faqs.length === 0) {
    const faqSection = document.querySelector('.details-faq');
    if (faqSection) faqSection.style.display = 'none';
    return;
  }

  container.innerHTML = faqs.map((faq, i) => `
    <details class="faq" data-faq-index="${i}">
      <summary class="faq-summary">${faq.q}</summary>
      <div class="faq-answer">${faq.a}</div>
    </details>
  `).join('');

  setupDetailFAQAccordion(container);
}

/**
 * Setup FAQ accordion
 */
function setupDetailFAQAccordion(container) {
  const faqs = container.querySelectorAll('.faq');
  
  faqs.forEach(faq => {
    faq.addEventListener('toggle', () => {
      if (faq.open) {
        faqs.forEach(other => {
          if (other !== faq) other.open = false;
        });
      }
    });
  });
}

// =====================================================
// PICTURE-IN-PICTURE
// =====================================================

/**
 * Toggle Picture-in-Picture mode
 */
function togglePiP() {
  const video = document.getElementById('main-video');
  
  if (!video || video.tagName !== 'VIDEO') {
    if (typeof showToast === 'function') {
      showToast('Picture-in-Picture not available for this video', 'error');
    }
    return;
  }

  if (!document.pictureInPictureEnabled) {
    if (typeof showToast === 'function') {
      showToast('Picture-in-Picture not supported in your browser', 'error');
    }
    return;
  }

  try {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
      if (typeof showToast === 'function') {
        showToast('Exited Picture-in-Picture', 'info');
      }
    } else {
      video.requestPictureInPicture();
      if (typeof showToast === 'function') {
        showToast('Entered Picture-in-Picture mode', 'success');
      }
    }
  } catch (error) {
    console.error('[PIP] Error:', error);
    if (typeof showToast === 'function') {
      showToast('Failed to toggle Picture-in-Picture', 'error');
    }
  }
}

// =====================================================
// SHARING & COPY FUNCTIONALITY
// =====================================================

/**
 * Update share buttons with proper URLs and handlers
 */
function updateShareButtons(item) {
  const pageUrl = location.href;
  const pageTitle = item.name || item.title;
  
  console.log('[SHARE] Setting up share buttons for:', pageTitle);
  console.log('[SHARE] URL:', pageUrl);

  // Facebook Share
  const fbBtn = document.getElementById('shareBtn-facebook');
  if (fbBtn) {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    fbBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(fbUrl, 'facebook-share', 'width=600,height=400');
      if (typeof showToast === 'function') {
        showToast('📘 Opening Facebook...', 'info');
      }
      console.log('[SHARE] Facebook clicked');
    });
  }

  // WhatsApp Share
  const waBtn = document.getElementById('shareBtn-whatsapp');
  if (waBtn) {
    const waText = `Check out "${pageTitle}" on Guru Nanak Tours & Travels`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText + ' ' + pageUrl)}`;
    waBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(waUrl, 'whatsapp-share', 'width=600,height=400');
      if (typeof showToast === 'function') {
        showToast('💬 Opening WhatsApp...', 'info');
      }
      console.log('[SHARE] WhatsApp clicked');
    });
  }

  // Copy Link
  const copyBtn = document.getElementById('shareBtn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        console.log('[SHARE] Copying URL to clipboard:', pageUrl);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(pageUrl);
          if (typeof showToast === 'function') {
            showToast('✅ Link copied to clipboard!', 'success');
          }
          console.log('[SHARE] Copied via Clipboard API');
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = pageUrl;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          if (typeof showToast === 'function') {
            showToast('✅ Link copied to clipboard!', 'success');
          }
          console.log('[SHARE] Copied via execCommand');
        }
      } catch (err) {
        console.error('[SHARE] Copy failed:', err);
        if (typeof showToast === 'function') {
          showToast('❌ Failed to copy link', 'error');
        }
      }
    });
  }

  console.log('[SHARE] All share buttons configured');
}

// =====================================================
// ERROR HANDLING
// =====================================================

/**
 * Show error with redirect
 */
function showError(msg) {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 4rem 2rem; min-height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="error-icon" style="font-size: 5rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;">${msg}</h2>
        <p style="color: #6b7280; margin-bottom: 2rem;">Redirecting you to homepage...</p>
        <a href="${__toAbs('/index.html')}" class="btn btn-primary">← Go Home Now</a>
      </div>
    `;
  }
}

// =====================================================
// INITIALIZATION
// =====================================================

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[DETAILS] Page initialized');
  setTimeout(() => {
    loadDetails();
  }, 200);
});

console.log('[DETAILS] ✅ Script loaded successfully - Production Ready v2.0');
