// =====================================================
// VIDEO PLAYER SYSTEM - v3.3 ULTIMATE FINAL
// Complete with return navigation, modal buttons, 3D effects
// =====================================================

(function() {
  'use strict';

  const htmlEscapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, m => htmlEscapeMap[m]);
  const escapeAttr = escapeHtml;
  const toAbs = s => (window.__toAbs ? window.__toAbs(s) : s || '');

  // Global referrer storage
  let modalReferrer = null;

  class VideoPlayer {
    constructor(options = {}) {
      this.opts = Object.assign({
        reelsSectionId: 'video-reels',
        reelsContainerId: 'reels-container',
        reelsPrevId: 'reels-prev',
        reelsNextId: 'reels-next',
        modalId: 'video-modal',
        modalIframeId: 'modal-iframe',
        modalVideoId: 'modal-video',
        modalCategoryId: 'modal-category',
        modalTitleId: 'modal-title',
        modalDescriptionId: 'modal-description',
        modalSuggestedId: 'modal-suggested-videos',
        pipBtnId: 'pip-btn',
        muteBtnId: 'mute-btn',
        videosPageUrl: './videos/index.html',
        enable3DEffects: true,
        enableParallax: true,
        autoplayOnScroll: true,
        snapScroll: true,
        ioRootMargin: '-20% 0px -20% 0px',
        ioThreshold: 0.9,
        scrollSnapDelay: 400,
        autoAdvanceDelay: 800,
        cardHoverScale: 1.05
      }, options);

      this.isVideosPage = window.location.pathname.includes('videos');
      this.currentModalVideoIndex = null;
      this.currentReelIndex = 0;
      this.allVideosData = [];
      this.videoObserver = null;
      this.sectionObserver = null;
      this.currentPlayingVideo = null;
      this.currentPlayingCard = null;
      this.isModalOpen = false;
      this.hasUserInteracted = false;
      this.scrollSnapTimeout = null;
      this.playPromise = null;
      this.isPlayingLocked = false;
      this.boundTrapHandler = null;
      this.sectionVisible = false;

      this.cacheDOMElements();
      this.bindGlobalEvents();
      this.init3DEffects();
    }

    cacheDOMElements() {
      this.$reelsSection = document.getElementById(this.opts.reelsSectionId);
      this.$reelsContainer = document.getElementById(this.opts.reelsContainerId);
      this.$reelsPrev = document.getElementById(this.opts.reelsPrevId);
      this.$reelsNext = document.getElementById(this.opts.reelsNextId);
      this.$modal = document.getElementById(this.opts.modalId);
      this.$modalIframe = document.getElementById(this.opts.modalIframeId);
      this.$modalVideo = document.getElementById(this.opts.modalVideoId);
      this.$pipBtn = document.getElementById(this.opts.pipBtnId);
      this.$muteBtn = document.getElementById(this.opts.muteBtnId);
      this.$modalCategory = document.getElementById(this.opts.modalCategoryId);
      this.$modalTitle = document.getElementById(this.opts.modalTitleId);
      this.$modalDesc = document.getElementById(this.opts.modalDescriptionId);
      this.$modalSuggested = document.getElementById(this.opts.modalSuggestedId);
    }

    async initFromJson(jsonPath) {
      try {
        const url = toAbs(jsonPath);
        const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          this.renderVideoShowcase(data);
        } else if (Array.isArray(data?.videos)) {
          this.renderVideoShowcase(data.videos);
        } else {
          console.warn('[VIDEO] JSON missing videos array');
          this.hideSection();
        }
      } catch (e) {
        console.error('[VIDEO] Failed to load videos JSON:', e);
        this.hideSection();
      }
    }

    renderVideoShowcase(videos) {
      if (!this.$reelsContainer) return;
      if (!Array.isArray(videos) || videos.length === 0) {
        this.hideSection();
        return;
      }

      const activeVideos = videos
        .filter(v => v?.active !== false)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      if (activeVideos.length === 0) {
        this.hideSection();
        return;
      }

      this.allVideosData = activeVideos;
      const placeholder = this.$reelsContainer.querySelector('.loading-placeholder');
      if (placeholder) placeholder.remove();

      this.$reelsContainer.innerHTML = activeVideos.map((video, idx) => {
        const videoSource = this.getVideoSource(video);
        const thumbnail = this.getVideoThumbnail(video);
        if (!videoSource) return '';

        const watchFullButton = this.isVideosPage 
          ? `<button class="reel-watch-more" 
                      onclick="videoPlayer.openModal(${idx}); event.stopPropagation();" 
                      title="Watch full video in modal" 
                      aria-label="Watch full video"
                      type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
              </svg>
              <span>Watch Full Video</span>
            </button>`
          : `<a href="${this.opts.videosPageUrl}#video-${escapeAttr(video.id || idx)}" 
                class="reel-watch-more" 
                onclick="event.stopPropagation();" 
                title="Watch full video on videos page" 
                aria-label="Watch full video">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon>
              </svg>
              <span>Watch Full Video</span>
            </a>`;

        return `
          <div class="reel-card" 
               data-video-index="${idx}" 
               data-video-id="${escapeAttr(video.id || idx)}" 
               data-category="${escapeAttr(video.category || 'Video')}"
               role="group" 
               aria-label="${escapeAttr(video.title)}"
               style="animation-delay: ${idx * 0.1}s;">
            
            <div class="reel-thumbnail" 
                 onclick="videoPlayer.enableSoundAndPlay(${idx})" 
                 aria-label="Play ${escapeAttr(video.title)}" 
                 role="button" 
                 tabindex="0">
              
              <img src="${escapeAttr(thumbnail)}" 
                   alt="${escapeAttr(video.title)}" 
                   loading="lazy" 
                   class="reel-thumb-img" />

              <div class="reel-overlay"></div>

              <button class="reel-mute-btn" 
                      onclick="videoPlayer.toggleReelMute(${idx}); event.stopPropagation();" 
                      style="display:none;" 
                      title="Toggle sound" 
                      aria-label="Toggle sound">🔊</button>

              <div class="reel-preview-player" style="display:none;">
                ${videoSource.type === 'upload' ? `
                  <video class="reel-video-preview" 
                         loop 
                         playsinline 
                         muted 
                         preload="metadata" 
                         data-video-index="${idx}">
                    <source src="${escapeAttr(videoSource.url)}" type="video/mp4">
                  </video>
                ` : `
                  <iframe 
                    class="reel-iframe-preview"
                    src=""
                    data-src="${escapeAttr(videoSource.url)}&autoplay=1&mute=1&loop=1&controls=0"
                    frameborder="0"
                    title="${escapeAttr(video.title)}"
                    allow="autoplay; picture-in-picture; encrypted-media"
                    referrerpolicy="no-referrer-when-downgrade"
                    loading="lazy"
                    data-video-index="${idx}">
                  </iframe>
                `}
              </div>

              <div class="reel-play-icon" aria-hidden="true">
                <div class="play-icon-3d">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <defs>
                      <linearGradient id="playGradient${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    <circle cx="30" cy="30" r="28" fill="url(#playGradient${idx})" />
                    <polygon points="24,18 24,42 42,30" fill="#0e5aa7" />
                  </svg>
                </div>
              </div>

              ${watchFullButton}

              ${video.duration ? `
                <span class="reel-duration" aria-label="Duration ${escapeHtml(video.duration)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  ${escapeHtml(video.duration)}
                </span>
              ` : ''}
            </div>

            <div class="reel-info">
              ${video.category ? `<span class="reel-category">${escapeHtml(video.category)}</span>` : ''}
              <h4 class="reel-title">${escapeHtml(video.title)}</h4>
              ${video.date ? `
                <p class="reel-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  ${this.formatDate(video.date)}
                </p>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      this.initReelsCarousel();
      this.initVideoAutoplay();
      this.init3DCardEffects();
      this.initParallax();
      this.initSectionObserver();
      
      console.log(`[VIDEO] ✅ Rendered ${activeVideos.length} videos (${this.isVideosPage ? 'Videos Page' : 'Home Page'})`);
    }

    initSectionObserver() {
      if (!this.opts.autoplayOnScroll || !this.$reelsSection) return;
      if (this.sectionObserver) this.sectionObserver.disconnect();

      const options = { root: null, rootMargin: '0px', threshold: 0.3 };

      this.sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.sectionVisible = entry.isIntersecting;
          
          if (entry.isIntersecting) {
            if (!this.currentPlayingVideo && !this.isModalOpen) {
              const firstCard = this.$reelsContainer?.querySelector('.reel-card');
              if (firstCard) {
                setTimeout(() => this.playVideo(firstCard, this.hasUserInteracted), 500);
              }
            }
          } else {
            this.stopAllVideos();
          }
        });
      }, options);

      this.sectionObserver.observe(this.$reelsSection);
    }

    init3DEffects() {
      if (!this.opts.enable3DEffects) return;
      document.body.classList.add('gpu-accelerated');
    }

    init3DCardEffects() {
      if (!this.opts.enable3DEffects || !this.$reelsContainer) return;

      const cards = this.$reelsContainer.querySelectorAll('.reel-card');
      
      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 20;
          const rotateY = (centerX - x) / 20;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${this.opts.cardHoverScale})`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('card-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        observer.observe(card);
      });
    }

    initParallax() {
      if (!this.opts.enableParallax || !this.$reelsContainer) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let ticking = false;

      const updateParallax = () => {
        const cards = this.$reelsContainer.querySelectorAll('.reel-card');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const cardTop = rect.top + scrollTop;
          const windowHeight = window.innerHeight;
          
          if (rect.top < windowHeight && rect.bottom > 0) {
            const offset = (scrollTop - cardTop) * 0.1;
            const thumbnail = card.querySelector('.reel-thumb-img');
            if (thumbnail) {
              thumbnail.style.transform = `translateY(${offset}px) scale(1.1)`;
            }
          }
        });

        ticking = false;
      };

      const requestParallaxUpdate = () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      };

      window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    }

    formatDate(dateStr) {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (_) {
        return dateStr;
      }
    }

    hideSection() {
      if (this.$reelsSection) this.$reelsSection.style.display = 'none';
    }

    bindGlobalEvents() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.isModalOpen) this.closeModal();
          else this.stopAllVideos();
        }
        if (!this.isModalOpen) {
          if (e.key === 'ArrowRight') { this.hasUserInteracted = true; this.$reelsNext?.click(); }
          if (e.key === 'ArrowLeft') { this.hasUserInteracted = true; this.$reelsPrev?.click(); }
        }
      });

      document.addEventListener('keydown', (e) => {
        if (!this.isModalOpen) return;
        const video = this.$modalVideo;
        if (!video || video.style.display !== 'block') return;

        if (e.code === 'Space' || e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (video.paused) video.play();
          else video.pause();
        }
        if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'l') {
          e.preventDefault();
          const delta = e.key.toLowerCase() === 'j' ? -10 : 10;
          video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          const wrapper = document.querySelector('.video-modal-player-wrapper');
          if (!document.fullscreenElement) wrapper?.requestFullscreen?.();
          else document.exitFullscreen?.();
        }
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          this.toggleMute();
        }
      });

      document.addEventListener('click', () => { this.hasUserInteracted = true; }, { once: true });
      document.addEventListener('touchstart', () => { this.hasUserInteracted = true; }, { once: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden && !this.isModalOpen) {
          this.stopAllVideos();
        }
      });

      window.videoPlayer = this;
      window.openVideoModal = (idx) => this.openModal(idx);
      window.closeVideoModal = () => this.closeModal();
      window.toggleMute = () => this.toggleMute();
      window.togglePiP = () => this.togglePiP();
    }

    enableSoundAndPlay(videoIndex) {
      this.hasUserInteracted = true;
      const card = this.$reelsContainer?.querySelectorAll('.reel-card')[videoIndex];
      if (card) {
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
          card.style.transform = '';
          this.playVideo(card, true);
        }, 100);
      }
    }

    toggleReelMute(videoIndex) {
      const card = this.$reelsContainer?.querySelectorAll('.reel-card')[videoIndex];
      if (!card) return;
      
      const videoEl = card.querySelector('.reel-video-preview');
      const muteBtn = card.querySelector('.reel-mute-btn');
      
      if (videoEl) {
        videoEl.muted = !videoEl.muted;
        if (muteBtn) {
          muteBtn.innerHTML = videoEl.muted ? '🔇' : '🔊';
          muteBtn.title = videoEl.muted ? 'Unmute' : 'Mute';
          muteBtn.setAttribute('aria-label', videoEl.muted ? 'Unmute' : 'Mute');
        }
      }
    }

    async stopAllVideos() {
      if (this.playPromise) {
        try { await this.playPromise; } catch(e) { /* noop */ }
        this.playPromise = null;
      }

      this.$reelsContainer?.querySelectorAll('.reel-card').forEach(card => {
        card.classList.remove('playing');
        card.style.transform = '';
      });
      
      this.$reelsContainer?.querySelectorAll('.reel-video-preview').forEach(v => {
        if (!v.paused) v.pause();
        v.currentTime = 0;
        v.muted = true;
      });
      
      this.$reelsContainer?.querySelectorAll('.reel-iframe-preview').forEach(iframe => { iframe.src = ''; });
      this.$reelsContainer?.querySelectorAll('.reel-preview-player').forEach(p => { p.style.display = 'none'; });
      this.$reelsContainer?.querySelectorAll('.reel-thumb-img').forEach(t => { t.style.display = 'block'; });
      this.$reelsContainer?.querySelectorAll('.reel-play-icon').forEach(i => { i.style.opacity = '1'; });
      this.$reelsContainer?.querySelectorAll('.reel-mute-btn').forEach(btn => { btn.style.display = 'none'; });

      this.currentPlayingVideo = null;
      this.currentPlayingCard = null;
      this.isPlayingLocked = false;
    }

    async playVideo(cardElement, enableSound = false) {
      if (this.isPlayingLocked) return;

      const videoIndex = parseInt(cardElement.dataset.videoIndex, 10);
      if (this.currentPlayingCard === cardElement && this.currentPlayingVideo) return;

      this.isPlayingLocked = true;

      const previewPlayer = cardElement.querySelector('.reel-preview-player');
      const thumbImg = cardElement.querySelector('.reel-thumb-img');
      const playIcon = cardElement.querySelector('.reel-play-icon');
      const videoEl = cardElement.querySelector('.reel-video-preview');
      const iframeEl = cardElement.querySelector('.reel-iframe-preview');
      const muteBtn = cardElement.querySelector('.reel-mute-btn');

      await this.stopAllVideos();

      cardElement.classList.add('playing');
      
      if (thumbImg) {
        thumbImg.style.opacity = '0';
        setTimeout(() => { thumbImg.style.display = 'none'; }, 300);
      }
      
      if (playIcon) {
        playIcon.style.opacity = '0';
        playIcon.style.transform = 'scale(0.8)';
      }
      
      if (previewPlayer) {
        previewPlayer.style.display = 'block';
        setTimeout(() => { previewPlayer.style.opacity = '1'; }, 50);
      }

      if (videoEl) {
        videoEl.muted = !(enableSound || this.hasUserInteracted);
        videoEl.loop = false;
        
        this.playPromise = videoEl.play();

        this.playPromise
          .then(() => {
            this.currentPlayingVideo = videoEl;
            this.currentPlayingCard = cardElement;
            this.currentReelIndex = videoIndex;
            this.isPlayingLocked = false;
          })
          .catch(() => {
            videoEl.muted = true;
            this.playPromise = videoEl.play();
            this.playPromise.finally(() => { this.isPlayingLocked = false; });
          });

        if (muteBtn) {
          muteBtn.style.display = 'flex';
          muteBtn.innerHTML = videoEl.muted ? '🔇' : '🔊';
        }

        videoEl.onended = () => { 
          if (!this.isModalOpen) this.advanceToNextVideo(); 
        };
      } else if (iframeEl) {
        const base = iframeEl.dataset.src || '';
        const wantSound = enableSound || this.hasUserInteracted;
        const url = base.replace(/(&|\?)mute=\d/g, '') + (base.includes('?') ? '&' : '?') + `mute=${wantSound ? '0' : '1'}`;
        iframeEl.src = url;

        this.currentPlayingVideo = iframeEl;
        this.currentPlayingCard = cardElement;
        this.currentReelIndex = videoIndex;
        this.isPlayingLocked = false;
      }
    }

    advanceToNextVideo() {
      if (this.isPlayingLocked) return;
      const cards = this.$reelsContainer?.querySelectorAll('.reel-card');
      if (!cards || !cards.length) return;

      const nextIndex = (this.currentReelIndex + 1) % cards.length;
      cards[nextIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setTimeout(() => this.playVideo(cards[nextIndex], this.hasUserInteracted), this.opts.autoAdvanceDelay);
    }

    initVideoAutoplay() {
      if (!this.$reelsContainer) return;
      if (this.videoObserver) this.videoObserver.disconnect();

      const options = {
        root: null,
        rootMargin: this.opts.ioRootMargin,
        threshold: this.opts.ioThreshold
      };

      this.videoObserver = new IntersectionObserver((entries) => {
        let mostVisible = null, maxRatio = 0;
        
        entries.forEach(entry => {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisible = entry;
          }
        });
        
        if (mostVisible && mostVisible.isIntersecting && !this.currentPlayingVideo && !this.isModalOpen && !this.isPlayingLocked && this.sectionVisible) {
          this.playVideo(mostVisible.target, this.hasUserInteracted);
        }
      }, options);

      this.$reelsContainer.querySelectorAll('.reel-card').forEach(card => {
        this.videoObserver.observe(card);
      });
    }

    initReelsCarousel() {
      const container = this.$reelsContainer;
      if (!container) return;

      const prevBtn = this.$reelsPrev;
      const nextBtn = this.$reelsNext;

      const cardWidth = () => {
        const first = container.querySelector('.reel-card');
        if (!first) return 320;
        const style = getComputedStyle(first);
        return first.getBoundingClientRect().width + parseFloat(style.marginRight || 16);
      };

      const snapToNearest = () => {
        const w = cardWidth();
        const index = Math.round(container.scrollLeft / w);
        const cards = container.querySelectorAll('.reel-card');
        const clamped = Math.max(0, Math.min(index, cards.length - 1));
        this.currentReelIndex = clamped;
        
        if (!this.isModalOpen && cards[clamped] && this.sectionVisible) {
          setTimeout(() => this.playVideo(cards[clamped], this.hasUserInteracted), this.opts.scrollSnapDelay);
        }
      };

      const scrollReels = (dir) => {
        const w = cardWidth();
        container.scrollTo({ left: container.scrollLeft + (dir === 'next' ? w : -w), behavior: 'smooth' });
        clearTimeout(this.scrollSnapTimeout);
        this.scrollSnapTimeout = setTimeout(snapToNearest, this.opts.scrollSnapDelay);
      };

      container.addEventListener('scroll', () => {
        if (!this.opts.snapScroll) return;
        clearTimeout(this.scrollSnapTimeout);
        this.scrollSnapTimeout = setTimeout(snapToNearest, this.opts.scrollSnapDelay);
      }, { passive: true });

      prevBtn?.addEventListener('click', () => { 
        this.hasUserInteracted = true; 
        scrollReels('prev'); 
      });
      
      nextBtn?.addEventListener('click', () => { 
        this.hasUserInteracted = true; 
        scrollReels('next'); 
      });

      container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { this.hasUserInteracted = true; e.preventDefault(); scrollReels('next'); }
        if (e.key === 'ArrowLeft') { this.hasUserInteracted = true; e.preventDefault(); scrollReels('prev'); }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const cards = container.querySelectorAll('.reel-card');
          const active = cards[this.currentReelIndex];
          if (active) this.playVideo(active, true);
        }
      });

      container.setAttribute('tabindex', '0');
      container.setAttribute('role', 'listbox');
    }

    renderSuggestedVideos(currentIndex) {
      if (!this.$modalSuggested) return;
      
      const suggested = this.allVideosData.filter((_, i) => i !== currentIndex).slice(0, 3);
      
      this.$modalSuggested.innerHTML = suggested.map(v => {
        const idx = this.allVideosData.findIndex(x => x.id === v.id);
        const thumb = this.getVideoThumbnail(v);
        
        return `
          <button class="suggested-video-card" 
                  onclick="videoPlayer.loadVideoInModal(${idx})" 
                  aria-label="Play ${escapeAttr(v.title)}"
                  type="button">
            <div class="suggested-video-thumbnail">
              <img src="${escapeAttr(thumb)}" alt="${escapeAttr(v.title)}" loading="lazy" />
              <div class="suggested-play-icon">▶</div>
            </div>
            <div class="suggested-video-info">
              <h5>${escapeHtml(v.title)}</h5>
              ${v.category ? `<span class="suggested-category">${escapeHtml(v.category)}</span>` : ''}
              ${v.duration ? `<span class="suggested-duration">⏱️ ${escapeHtml(v.duration)}</span>` : ''}
            </div>
          </button>
        `;
      }).join('');
    }

    loadVideoInModal(videoIndex) {
      const video = this.allVideosData[videoIndex];
      if (!video) return;
      
      this.currentModalVideoIndex = videoIndex;
      const src = this.getVideoSource(video);
      if (!src) return;

      if (this.$modalCategory) this.$modalCategory.textContent = video.category || '';
      if (this.$modalTitle) this.$modalTitle.textContent = video.title || '';
      if (this.$modalDesc) this.$modalDesc.textContent = video.description || '';

      if (src.type === 'upload') {
        this.$modalIframe.style.display = 'none';
        this.$modalVideo.style.display = 'block';
        this.$modalVideo.src = src.url;
        this.$modalVideo.controls = true;
        this.$modalVideo.muted = false;
        this.$modalVideo.play().catch(()=>{});
        
        if (this.$pipBtn) this.$pipBtn.style.display = 'flex';
        if (this.$muteBtn) this.$muteBtn.style.display = 'flex';
        
        this.$modalVideo.onended = () => this.playNextVideoInModal();
        this.setFocus(this.$modalVideo);
      } else {
        this.$modalVideo.style.display = 'none';
        this.$modalIframe.style.display = 'block';
        this.$modalIframe.src = src.url + (src.url.includes('?') ? '&' : '?') + 'autoplay=1';
        
        if (this.$pipBtn) this.$pipBtn.style.display = 'none';
        if (this.$muteBtn) this.$muteBtn.style.display = 'none';
        
        this.setFocus(this.$modalIframe);
      }

      this.renderSuggestedVideos(videoIndex);
      this.updateMuteButtonState();
    }

    playNextVideoInModal() {
      const next = (this.currentModalVideoIndex + 1) % this.allVideosData.length;
      this.loadVideoInModal(next);
    }

    openModal(videoIndex) {
      this.stopAllVideos();
      this.isModalOpen = true;
      this.hasUserInteracted = true;
      this.currentModalVideoIndex = videoIndex;

      // Store referrer for back navigation
      if (document.referrer && !this.isVideosPage) {
        modalReferrer = document.referrer;
      }

      // Hide/show appropriate buttons
      const returnBtn = document.getElementById('modal-return-btn');
      const viewAllBtn = document.getElementById('view-all-videos-btn');
      
      if (this.isVideosPage) {
        if (returnBtn) returnBtn.style.display = 'none';
        if (viewAllBtn) viewAllBtn.style.display = 'none';
      } else {
        if (returnBtn) returnBtn.style.display = 'flex';
        if (viewAllBtn) viewAllBtn.style.display = 'flex';
      }

      if (!this.$modal) return;
      
      this.$modal.style.display = 'flex';
      this.$modal.classList.add('modal-opening');
      document.body.classList.add('modal-open');
      
      setTimeout(() => {
        this.$modal.classList.remove('modal-opening');
      }, 400);
      
      this.loadVideoInModal(videoIndex);
      this.wireKeyboardTrap(true);
    }

    closeModal() {
      if (!this.$modal) return;

      this.$modal.classList.add('modal-closing');
      
      setTimeout(() => {
        this.$modalIframe.src = '';
        this.$modalVideo.pause();
        this.$modalVideo.src = '';

        this.$modal.style.display = 'none';
        this.$modal.classList.remove('modal-closing');
        document.body.classList.remove('modal-open');
        
        this.isModalOpen = false;
        this.currentModalVideoIndex = null;
        this.wireKeyboardTrap(false);
        
        // Return to referrer if from home page
        if (modalReferrer && modalReferrer !== window.location.href) {
          window.location.href = modalReferrer;
        } else {
          this.setFocus(this.$reelsContainer);
        }
      }, 300);
    }

    toggleMute() {
      if (this.$modalVideo && this.$modalVideo.style.display === 'block') {
        this.$modalVideo.muted = !this.$modalVideo.muted;
        this.updateMuteButtonState();
      }
    }

    updateMuteButtonState() {
      if (!this.$muteBtn || !this.$modalVideo) return;
      
      const muted = !!this.$modalVideo.muted;
      this.$muteBtn.innerHTML = muted ? '🔇' : '🔊';
      this.$muteBtn.title = muted ? 'Unmute' : 'Mute';
      this.$muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    }

    async togglePiP() {
      if (!document.pictureInPictureEnabled || !this.$modalVideo || this.$modalVideo.style.display !== 'block') {
        alert('Picture-in-Picture not supported');
        return;
      }
      
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await this.$modalVideo.requestPictureInPicture();
        }
      } catch (e) {
        console.error('[VIDEO] PiP error:', e);
      }
    }

    setFocus(el) {
      if (!el) return;
      requestAnimationFrame(() => {
        try { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: false }); } catch(_) {}
      });
    }

    wireKeyboardTrap(enable = false) {
      if (!this.$modal) return;

      if (!enable) {
        this.$modal.removeAttribute('aria-modal');
        this.$modal.removeAttribute('role');
        if (this.boundTrapHandler) {
          this.$modal.removeEventListener('keydown', this.boundTrapHandler);
          this.boundTrapHandler = null;
        }
        return;
      }

      this.$modal.setAttribute('aria-modal', 'true');
      this.$modal.setAttribute('role', 'dialog');

      const focusable = () => Array.from(this.$modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

      this.boundTrapHandler = (e) => {
        if (e.key !== 'Tab') return;
        const nodes = focusable();
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };

      this.$modal.addEventListener('keydown', this.boundTrapHandler);
    }

    extractVideoId(url, sourceType) {
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

    getVideoSource(video) {
      if (video.source_type === 'upload' && video.video_file) {
        return { type: 'upload', url: toAbs(video.video_file) };
      }
      if (video.source_type === 'youtube' && video.video_url) {
        const id = this.extractVideoId(video.video_url, 'youtube');
        if (id) {
          return { type: 'youtube', videoId: id, url: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1` };
        }
      }
      if (video.source_type === 'vimeo' && video.video_url) {
        const id = this.extractVideoId(video.video_url, 'vimeo');
        if (id) {
          return { type: 'vimeo', videoId: id, url: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&playsinline=1` };
        }
      }
      return null;
    }

    getVideoThumbnail(video) {
      if (video.thumbnail) return toAbs(video.thumbnail);
      if (video.source_type === 'youtube' && video.video_url) {
        const id = this.extractVideoId(video.video_url, 'youtube');
        if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
      }
      return `https://via.placeholder.com/400x600/0e5aa7/ffffff?text=${encodeURIComponent(video.source_type || 'Video')}`;
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const player = new VideoPlayer({
      enable3DEffects: true,
      enableParallax: true,
      autoplayOnScroll: true,
      videosPageUrl: './videos/index.html'
    });

    const reelsSection = document.getElementById('video-reels');
    const dataSrc = reelsSection?.getAttribute('data-src');
    if (dataSrc) {
      player.initFromJson(dataSrc);
    }

    // Handle hash navigation on videos page
    if (player.isVideosPage && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const videoId = hash.replace('video-', '');
      
      setTimeout(() => {
        const targetCard = document.querySelector(`[data-video-id="${videoId}"]`);
        if (targetCard) {
          const videoIndex = parseInt(targetCard.dataset.videoIndex, 10);
          if (!isNaN(videoIndex) && window.videoPlayer) {
            window.videoPlayer.openModal(videoIndex);
          }
        }
      }, 1000);
    }

    window.videoPlayer = player;
    console.log('[VIDEO PLAYER] ✅ v3.3 ULTIMATE - Complete with return navigation');
  });

})();

// Global navigation functions
window.returnToSource = function() {
  if (window.videoPlayer) {
    window.videoPlayer.closeModal();
  }
};

window.goToVideosPage = function() {
  const videosUrl = window.location.pathname.includes('videos') 
    ? window.location.pathname 
    : './videos/index.html';
  window.location.href = videosUrl;
};
