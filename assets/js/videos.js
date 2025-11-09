// =====================================================
// VIDEOS PAGE SCRIPT - FIXED VERSION
// Handles all video loading with proper error handling
// =====================================================

(function() {
  'use strict';

  // Page state
  let allVideos = [];
  let filteredVideos = [];
  let currentCategory = 'all';
  let currentSort = 'latest';
  let searchQuery = '';
  let isLoading = false;

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[VIDEOS PAGE] Starting initialization...');
    setTimeout(initVideosPage, 100); // Small delay to ensure DOM is ready
  });

  async function initVideosPage() {
    if (isLoading) return;
    isLoading = true;

    try {
      console.log('[VIDEOS PAGE] Loading videos data...');
      await loadVideosData();
      
      setupFilters();
      setupSearch();
      setupSort();
      
      // Handle hash navigation after a delay
      setTimeout(handleHashNavigation, 1500);
      
      console.log('[VIDEOS PAGE] ✅ Initialized successfully');
      isLoading = false;
    } catch (error) {
      console.error('[VIDEOS PAGE] Initialization error:', error);
      showError('Failed to load videos. Please check your data/videos.json file.');
      isLoading = false;
    }
  }

  async function loadVideosData() {
    const possiblePaths = [
      '../data/videos.json',
      './data/videos.json',
      '/data/videos.json'
    ];

    let lastError = null;

    // Try each path
    for (const path of possiblePaths) {
      try {
        console.log('[VIDEOS PAGE] Trying path:', path);
        const response = await fetch(path, { 
          cache: 'no-cache',
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          console.warn('[VIDEOS PAGE] Failed:', path, response.status);
          continue;
        }

        const data = await response.json();
        console.log('[VIDEOS PAGE] ✅ Loaded from:', path);
        
        // Parse data
        if (Array.isArray(data)) {
          allVideos = data;
        } else if (data.videos && Array.isArray(data.videos)) {
          allVideos = data.videos;
        } else {
          throw new Error('Invalid JSON structure');
        }
        
        // Filter active videos
        allVideos = allVideos.filter(v => v && v.active !== false);
        
        if (allVideos.length === 0) {
          throw new Error('No active videos found');
        }

        filteredVideos = [...allVideos];
        
        console.log('[VIDEOS PAGE] Total videos:', allVideos.length);
        
        // Render everything
        renderVideos();
        renderCategories();
        updateStats();
        
        return; // Success!
        
      } catch (error) {
        console.warn('[VIDEOS PAGE] Error with path', path, ':', error);
        lastError = error;
        continue;
      }
    }

    // If we get here, all paths failed
    console.error('[VIDEOS PAGE] All paths failed. Last error:', lastError);
    
    // Try to load sample data as fallback
    loadSampleData();
  }

  function loadSampleData() {
    console.log('[VIDEOS PAGE] Loading sample data as fallback...');
    
    allVideos = [
      {
        id: 'sample-1',
        title: 'Sample Video 1',
        description: 'This is a sample video. Please add your videos to data/videos.json',
        category: 'Sample',
        source_type: 'youtube',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail: 'https://via.placeholder.com/640x360/0e5aa7/ffffff?text=Sample+Video+1',
        duration: '5:00',
        date: '2025-11-01',
        views: 100,
        active: true
      },
      {
        id: 'sample-2',
        title: 'Sample Video 2',
        description: 'Another sample video. Configure your videos in data/videos.json',
        category: 'Sample',
        source_type: 'youtube',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail: 'https://via.placeholder.com/640x360/60a5fa/ffffff?text=Sample+Video+2',
        duration: '3:30',
        date: '2025-10-28',
        views: 50,
        active: true
      }
    ];

    filteredVideos = [...allVideos];
    
    renderVideos();
    renderCategories();
    updateStats();
    
    // Show info message
    setTimeout(() => {
      const container = document.getElementById('videos-grid');
      if (container) {
        container.insertAdjacentHTML('afterbegin', `
          <div class="info-banner" style="grid-column: 1/-1; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <strong>⚠️ Using Sample Data</strong>
            <p style="margin: 0.5rem 0 0 0;">Please create <code>data/videos.json</code> file with your actual videos.</p>
          </div>
        `);
      }
    }, 100);
  }

  function renderVideos() {
    const container = document.getElementById('videos-grid');
    if (!container) {
      console.error('[VIDEOS PAGE] videos-grid container not found!');
      return;
    }

    // Remove loading placeholder
    const loading = container.querySelector('.loading-placeholder');
    if (loading) loading.remove();

    if (filteredVideos.length === 0) {
      container.innerHTML = `
        <div class="no-videos" style="grid-column: 1/-1;">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
            <line x1="7" y1="2" x2="7" y2="6"></line>
            <line x1="17" y1="2" x2="17" y2="6"></line>
          </svg>
          <h3>No videos found</h3>
          <p>Try adjusting your filters or search query.</p>
          <button class="btn btn-primary" onclick="videosPage.resetFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredVideos.map((video, idx) => {
      const thumbnail = getVideoThumbnail(video);
      
      return `
        <article class="video-grid-card" data-video-index="${idx}" data-video-id="${escapeAttr(video.id)}">
          <div class="video-grid-thumbnail" onclick="videosPage.openVideo(${idx})">
            <img src="${escapeAttr(thumbnail)}" alt="${escapeAttr(video.title)}" loading="lazy" />
            
            <div class="video-grid-overlay">
              <button class="video-grid-play-btn" aria-label="Play ${escapeAttr(video.title)}">
                <svg width="50" height="50" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="28" fill="rgba(255,255,255,0.95)" />
                  <polygon points="24,18 24,42 42,30" fill="#0e5aa7" />
                </svg>
              </button>
            </div>

            ${video.duration ? `
              <span class="video-grid-duration">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${escapeHtml(video.duration)}
              </span>
            ` : ''}

            ${video.featured ? '<span class="video-grid-badge">Featured</span>' : ''}
          </div>

          <div class="video-grid-info">
            ${video.category ? `<span class="video-grid-category">${escapeHtml(video.category)}</span>` : ''}
            <h3 class="video-grid-title">${escapeHtml(video.title)}</h3>
            
            ${video.description ? `
              <p class="video-grid-description">${escapeHtml(truncateText(video.description, 100))}</p>
            ` : ''}

            <div class="video-grid-meta">
              ${video.date ? `
                <span class="video-grid-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  ${formatDate(video.date)}
                </span>
              ` : ''}

              ${video.views ? `
                <span class="video-grid-views">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  ${formatViews(video.views)} views
                </span>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

    console.log('[VIDEOS PAGE] Rendered', filteredVideos.length, 'videos');
  }

  function renderCategories() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const categories = ['all', ...new Set(allVideos.map(v => v.category).filter(Boolean))];
    
    container.innerHTML = categories.map(cat => {
      const count = cat === 'all' ? allVideos.length : allVideos.filter(v => v.category === cat).length;
      const active = currentCategory === cat ? 'active' : '';
      
      return `
        <button class="filter-btn ${active}" 
                data-category="${escapeAttr(cat)}"
                onclick="videosPage.filterByCategory('${escapeAttr(cat)}')">
          ${escapeHtml(cat === 'all' ? 'All Videos' : cat)}
          <span class="filter-count">${count}</span>
        </button>
      `;
    }).join('');
  }

  function setupFilters() {
    console.log('[VIDEOS PAGE] Filters ready');
  }

  function setupSearch() {
    const searchInput = document.getElementById('video-search');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.toLowerCase().trim();
        applyFilters();
      }, 300);
    });
  }

  function setupSort() {
    const sortSelect = document.getElementById('video-sort');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFilters();
    });
  }

  function filterByCategory(category) {
    currentCategory = category;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    applyFilters();
  }

  function applyFilters() {
    filteredVideos = [...allVideos];

    if (currentCategory !== 'all') {
      filteredVideos = filteredVideos.filter(v => v.category === currentCategory);
    }

    if (searchQuery) {
      filteredVideos = filteredVideos.filter(v => 
        v.title?.toLowerCase().includes(searchQuery) ||
        v.description?.toLowerCase().includes(searchQuery) ||
        v.category?.toLowerCase().includes(searchQuery)
      );
    }

    switch (currentSort) {
      case 'latest':
        filteredVideos.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        break;
      case 'oldest':
        filteredVideos.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        break;
      case 'title':
        filteredVideos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'views':
        filteredVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    renderVideos();
    updateStats();
  }

  function resetFilters() {
    currentCategory = 'all';
    currentSort = 'latest';
    searchQuery = '';
    
    const searchInput = document.getElementById('video-search');
    if (searchInput) searchInput.value = '';
    
    const sortSelect = document.getElementById('video-sort');
    if (sortSelect) sortSelect.value = 'latest';
    
    applyFilters();
    renderCategories();
  }

  function updateStats() {
    const statsEl = document.getElementById('videos-stats');
    if (!statsEl) return;

    const totalVideos = allVideos.length;
    const filteredCount = filteredVideos.length;
    const categories = new Set(allVideos.map(v => v.category).filter(Boolean)).size;

    statsEl.innerHTML = `
      <span class="stat-item">
        <strong>${filteredCount}</strong> ${filteredCount === 1 ? 'video' : 'videos'}
        ${filteredCount !== totalVideos ? ` of ${totalVideos}` : ''}
      </span>
      <span class="stat-divider">•</span>
      <span class="stat-item">
        <strong>${categories}</strong> ${categories === 1 ? 'category' : 'categories'}
      </span>
    `;
  }

  function openVideo(index) {
    console.log('[VIDEOS PAGE] Opening video:', index);
    
    const video = filteredVideos[index];
    if (!video) {
      console.error('[VIDEOS PAGE] Video not found at index:', index);
      return;
    }

    const actualIndex = allVideos.findIndex(v => v.id === video.id);
    
    if (window.videoPlayer && typeof window.videoPlayer.openModal === 'function') {
      console.log('[VIDEOS PAGE] Opening modal via videoPlayer');
      window.videoPlayer.allVideosData = allVideos;
      window.videoPlayer.openModal(actualIndex);
    } else {
      console.error('[VIDEOS PAGE] videoPlayer not available');
      alert('Video player is loading. Please try again in a moment.');
    }
  }

  function handleHashNavigation() {
    if (!window.location.hash) {
      console.log('[VIDEOS PAGE] No hash in URL');
      return;
    }

    const hash = window.location.hash.substring(1);
    const videoId = hash.replace('video-', '');
    
    console.log('[VIDEOS PAGE] Hash navigation to:', videoId);
    
    const videoIndex = allVideos.findIndex(v => String(v.id) === String(videoId));
    
    if (videoIndex !== -1) {
      console.log('[VIDEOS PAGE] Found video at index:', videoIndex);
      
      // Scroll to video card
      setTimeout(() => {
        const card = document.querySelector(`[data-video-id="${videoId}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      // Open modal
      setTimeout(() => {
        openVideo(videoIndex);
      }, 1000);
    } else {
      console.warn('[VIDEOS PAGE] Video not found:', videoId);
    }
  }

  function showError(message) {
    const container = document.getElementById('videos-grid');
    if (!container) return;

    container.innerHTML = `
      <div class="error-message" style="grid-column: 1/-1;">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Error</h3>
        <p>${escapeHtml(message)}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }

  // Utility functions
  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str || '').replace(/[&<>"']/g, m => map[m]);
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
      return dateStr;
    }
  }

  function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  }

  function getVideoThumbnail(video) {
    if (video.thumbnail) {
      // Try to resolve relative paths
      if (video.thumbnail.startsWith('/')) {
        return video.thumbnail;
      }
      return video.thumbnail;
    }
    if (video.source_type === 'youtube' && video.video_url) {
      const id = extractVideoId(video.video_url, 'youtube');
      if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
    return `https://via.placeholder.com/640x360/0e5aa7/ffffff?text=${encodeURIComponent(video.title || 'Video')}`;
  }

  function extractVideoId(url, sourceType) {
    if (!url) return null;
    try {
      if (sourceType === 'youtube') {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/,
          /youtube\.com\/shorts\/([^&?\/]+)/
        ];
        for (const p of patterns) {
          const m = url.match(p);
          if (m && m[1]) return m[1];
        }
      } else if (sourceType === 'vimeo') {
        const m = url.match(/vimeo\.com\/(\d+)/);
        if (m && m[1]) return m[1];
      }
    } catch (_) {}
    return null;
  }

  // Expose public API
  window.videosPage = {
    filterByCategory,
    resetFilters,
    openVideo,
    reload: initVideosPage
  };

  console.log('[VIDEOS PAGE] Script loaded');

})();
