/**
 * ==============================================================================
 * LIVING 3D COVERFLOW & ROYAL EXHIBITION ALBUM CONTROLLER
 * ==============================================================================
 * Ported & adapted for Section 04 ("Những ngày có nhau")
 * - 7-layer CSS 3D transform coverflow with gilded lacquer frames
 * - Ambient photo aura cross-fader
 * - Touch swipe & wheel navigation
 * - Autoplay timer with golden progress bar
 * - Seamless toggle between 3D Stage & Masonry Gallery Wall
 * - Full deep zoom lightbox integration
 * ==============================================================================
 */
(() => {
  'use strict';

  function resolveAssetUrl(u) {
    if (!u) return '';
    if (/^(https?:|data:|blob:)/.test(u)) return u;
    const clean = String(u).replace(/^\/+/, '');
    if (clean.startsWith('assets/')) {
      return '/thiep-cuoi-khanh-linh-le-dung/' + clean;
    }
    return '/' + clean;
  }

  let albumTimerId = null;
  let isAutoplayActive = true;
  let isHoverPaused = false;
  let currentIndex = 0;
  let progressMs = 0;
  const slideDurationMs = 4500;
  let activeAmbientLayer = 'A';

  function init3DAlbum(db) {
    db = db || window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};

    const albumSection = document.getElementById('album');
    const deckContainer = document.getElementById('album3DDeck');
    const filmstripContainer = document.getElementById('albumFilmstrip');
    const wallContainer = document.getElementById('albumMasonryGrid');

    if (!deckContainer || !filmstripContainer || !wallContainer) return;

    const rawPhotos = (Array.isArray(db.albumPhotos) && db.albumPhotos.length > 0)
      ? db.albumPhotos
      : [
          '/img/wedding-photo-card-left.jpg',
          '/img/wedding-photo-card-right.jpg',
          '/img/02-disney-phao-hoa.jpg',
          '/img/03-disney-cau-hon.jpg',
          '/img/08-trang-an-hero.jpg',
          '/img/07-trang-an-b.jpg',
          '/img/01-trang-an-a.jpg',
          '/img/06-shanghai-dem.jpg',
          '/img/04-shanghai-mua.jpg',
          '/img/09-wuzhen-moi.jpg',
          '/img/05-wuzhen-ma.jpg'
        ];

    const allPhotos = rawPhotos.map((item, idx) => {
      const src = typeof item === 'string' ? item : (item && item.src ? item.src : '');
      return {
        index: idx,
        src: resolveAssetUrl(src)
      };
    }).filter(p => Boolean(p.src));

    if (!allPhotos.length) return;

    // Sync into Gallery Lightbox Modal
    if (typeof window.syncGalleryPhotos === 'function') {
      const bride = (db.couple && db.couple.brideName) || 'Khánh Linh';
      const groom = (db.couple && db.couple.groomName) || 'Lê Dũng';
      const galleryData = allPhotos.map((p, i) => {
        const numStr = (i + 1 < 10 ? '0' : '') + (i + 1);
        return {
          src: p.src,
          alt: `${bride} & ${groom} #${numStr}`,
          caption: `${numStr} / Moments to keep`
        };
      });
      window.syncGalleryPhotos(galleryData);
    }

    const totalSlides = allPhotos.length;
    const viewToggleLabel = document.getElementById('albumViewToggleLabel');
    if (viewToggleLabel && albumSection && !albumSection.classList.contains('is-wall-mode')) {
      viewToggleLabel.textContent = `Xem Lưới ${totalSlides} Ảnh`;
    }

    const totalCountEl = document.getElementById('albumTotalCount');
    if (totalCountEl) {
      totalCountEl.textContent = totalSlides < 10 ? '0' + totalSlides : String(totalSlides);
    }

    // 1. Tự động sinh DOM cho Sân khấu 3D, Dải phim & Tường triển lãm
    deckContainer.innerHTML = '';
    filmstripContainer.innerHTML = '';
    wallContainer.innerHTML = '';

    const deckCards = [];
    const thumbBtns = [];
    const wallFrames = [];

    allPhotos.forEach((photo, idx) => {
      const numStr = idx + 1 < 10 ? '0' + (idx + 1) : String(idx + 1);

      // a) Khung ảnh 3D
      const card = document.createElement('div');
      card.className = 'deck-photo-card';
      card.setAttribute('data-index', String(idx));
      card.setAttribute('data-orient', 'portrait');
      card.innerHTML = `
        <div class="deck-gilded-frame">
          <div class="deck-velvet-mat">
            <div class="deck-img-viewport">
              <img src="${photo.src}" alt="Ảnh cưới #${numStr}" loading="lazy">
              <div class="deck-glass-sheen"></div>
            </div>
          </div>
        </div>
      `;

      const imgNode = card.querySelector('img');
      if (imgNode) {
        const checkOrientation = () => {
          if (imgNode.naturalWidth && imgNode.naturalHeight) {
            const orient = imgNode.naturalWidth > imgNode.naturalHeight * 1.08 ? 'landscape' : 'portrait';
            card.setAttribute('data-orient', orient);
          }
        };
        if (imgNode.complete) checkOrientation();
        else imgNode.addEventListener('load', checkOrientation);
      }

      deckContainer.appendChild(card);
      deckCards.push(card);

      // b) Thumbnail trong dải phim
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'filmstrip-thumb-btn';
      thumb.setAttribute('data-index', String(idx));
      thumb.title = `Ảnh ${numStr}`;
      thumb.innerHTML = `
        <img src="${photo.src}" alt="${numStr}" loading="lazy">
        <span class="thumb-num-badge">${numStr}</span>
      `;
      filmstripContainer.appendChild(thumb);
      thumbBtns.push(thumb);

      // c) Khung trong tường triển lãm (Masonry)
      const wallItem = document.createElement('div');
      wallItem.className = 'wall-art-frame';
      wallItem.setAttribute('data-index', String(idx));
      wallItem.innerHTML = `
        <div class="wall-art-inner">
          <img src="${photo.src}" alt="Ảnh cưới #${numStr}" loading="lazy">
        </div>
      `;
      wallContainer.appendChild(wallItem);
      wallFrames.push(wallItem);
    });

    // Elements điều khiển
    const ambientA = document.getElementById('albumAmbientA');
    const ambientB = document.getElementById('albumAmbientB');
    const storyIndexEl = document.getElementById('albumStoryIndex');
    const progressFillEl = document.getElementById('albumProgressFill');
    const prevSlideBtn = document.getElementById('albumPrevBtn');
    const nextSlideBtn = document.getElementById('albumNextBtn');
    const zoomActiveBtn = document.getElementById('albumZoomActiveBtn');
    const autoplayBtn = document.getElementById('albumAutoplayBtn');
    const autoplayLabel = document.getElementById('albumAutoplayLabel');
    const viewToggleBtn = document.getElementById('albumViewToggleBtn');
    const viewToggleIcon = document.getElementById('albumViewToggleIcon');

    function updateAmbientAura(imgSrc) {
      if (!ambientA || !ambientB || !imgSrc) return;
      if (activeAmbientLayer === 'A') {
        ambientB.style.backgroundImage = `url('${imgSrc}')`;
        ambientB.classList.add('is-visible');
        ambientA.classList.remove('is-visible');
        activeAmbientLayer = 'B';
      } else {
        ambientA.style.backgroundImage = `url('${imgSrc}')`;
        ambientA.classList.add('is-visible');
        ambientB.classList.remove('is-visible');
        activeAmbientLayer = 'A';
      }
    }

    function selectSlide(targetIdx, resetTimer = true) {
      currentIndex = (targetIdx + totalSlides) % totalSlides;
      if (resetTimer) {
        progressMs = 0;
        if (progressFillEl) progressFillEl.style.width = '0%';
      }

      const activeData = allPhotos[currentIndex];

      deckCards.forEach((card, i) => {
        card.classList.remove(
          'is-active',
          'is-prev-1',
          'is-prev-2',
          'is-prev-3',
          'is-next-1',
          'is-next-2',
          'is-next-3',
          'is-hidden-left',
          'is-hidden-right'
        );
        card.style.transform = '';

        let diff = i - currentIndex;
        if (diff > totalSlides / 2) diff -= totalSlides;
        if (diff < -totalSlides / 2) diff += totalSlides;

        if (diff === 0) {
          card.classList.add('is-active');
        } else if (diff === -1) {
          card.classList.add('is-prev-1');
        } else if (diff === 1) {
          card.classList.add('is-next-1');
        } else if (diff === -2) {
          card.classList.add('is-prev-2');
        } else if (diff === 2) {
          card.classList.add('is-next-2');
        } else if (diff === -3) {
          card.classList.add('is-prev-3');
        } else if (diff === 3) {
          card.classList.add('is-next-3');
        } else if (diff < -3) {
          card.classList.add('is-hidden-left');
        } else {
          card.classList.add('is-hidden-right');
        }
      });

      // Cuộn thumbnail dải phim ra giữa
      thumbBtns.forEach((btn, i) => {
        const isCurrent = i === currentIndex;
        btn.classList.toggle('active', isCurrent);
        if (isCurrent && btn.scrollIntoView) {
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });

      if (activeData) {
        const numStr = currentIndex + 1 < 10 ? '0' + (currentIndex + 1) : String(currentIndex + 1);
        if (storyIndexEl) storyIndexEl.textContent = numStr;
        updateAmbientAura(activeData.src);
      }
    }

    // Khởi tạo ảnh đầu tiên
    if (ambientA && allPhotos[0]) {
      ambientA.style.backgroundImage = `url('${allPhotos[0].src}')`;
      ambientA.classList.add('is-visible');
      if (ambientB) ambientB.classList.remove('is-visible');
      activeAmbientLayer = 'A';
    }
    selectSlide(0, true);

    function openFullLightbox(idx) {
      if (typeof window.openWeddingGalleryIndex === 'function') {
        window.openWeddingGalleryIndex(idx);
      }
    }

    // Gắn sự kiện cho các lá bài 3D
    deckCards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (idx === currentIndex) {
          openFullLightbox(currentIndex);
        } else {
          selectSlide(idx, true);
        }
      });

      card.addEventListener('mouseenter', () => {
        if (idx === currentIndex) isHoverPaused = true;
      });
      card.addEventListener('mouseleave', () => {
        isHoverPaused = false;
        if (idx === currentIndex) card.style.transform = '';
      });

      card.addEventListener('mousemove', e => {
        if (idx !== currentIndex || window.innerWidth < 992) return;
        const rect = card.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        const rotY = relX * 12;
        const rotX = -relY * 10;
        card.style.transform = `translate3d(0, 0, 88px) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) scale(1.02)`;
      });
    });

    // Thumbnail dải phim
    thumbBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => selectSlide(idx, true));
    });

    // Khung tường triển lãm
    wallFrames.forEach((frame, idx) => {
      frame.addEventListener('click', () => {
        selectSlide(idx, true);
        openFullLightbox(idx);
      });
    });

    // Nút điều hướng Sân khấu 3D
    if (prevSlideBtn) prevSlideBtn.onclick = () => selectSlide(currentIndex - 1, true);
    if (nextSlideBtn) nextSlideBtn.onclick = () => selectSlide(currentIndex + 1, true);
    if (zoomActiveBtn) zoomActiveBtn.onclick = () => openFullLightbox(currentIndex);

    // Nút Bật / Tắt Chiếu Tự Động
    if (autoplayBtn) {
      autoplayBtn.onclick = () => {
        isAutoplayActive = !isAutoplayActive;
        autoplayBtn.classList.toggle('is-playing', isAutoplayActive);
        if (autoplayLabel) {
          autoplayLabel.textContent = isAutoplayActive ? 'Đang Chiếu Tự Động' : 'Tự Động Chiếu';
        }
        if (!isAutoplayActive && progressFillEl) {
          progressFillEl.style.width = '0%';
        }
      };
    }

    // Nút Đổi Chế Độ Xem (Sân khấu 3D vs Lưới toàn cảnh)
    if (viewToggleBtn && albumSection) {
      viewToggleBtn.onclick = () => {
        const isWall = !albumSection.classList.contains('is-wall-mode');
        albumSection.classList.toggle('is-wall-mode', isWall);
        if (viewToggleIcon) viewToggleIcon.textContent = isWall ? '❖' : '⊞';
        if (viewToggleLabel) {
          viewToggleLabel.textContent = isWall ? 'Về Sân Khấu 3D' : `Xem Lưới ${totalSlides} Ảnh`;
        }
      };
    }

    // Touch swipe trên Sân Khấu 3D (Điện thoại)
    let touchStartX = 0;
    let touchStartY = 0;
    deckContainer.addEventListener('touchstart', e => {
      if (e.touches && e.touches.length) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    deckContainer.addEventListener('touchend', e => {
      if (!e.changedTouches || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx < 0) selectSlide(currentIndex + 1, true);
        else selectSlide(currentIndex - 1, true);
      }
    }, { passive: true });

    // Vòng lặp Autoplay chuẩn xác (chỉ chạy khi tab đang active và không hover)
    if (albumTimerId) clearInterval(albumTimerId);
    const tickInterval = 60;
    albumTimerId = setInterval(() => {
      if (!isAutoplayActive || isHoverPaused || (albumSection && albumSection.classList.contains('is-wall-mode'))) {
        return;
      }
      progressMs += tickInterval;
      if (progressFillEl) {
        const pct = Math.min(100, (progressMs / slideDurationMs) * 100);
        progressFillEl.style.width = pct.toFixed(1) + '%';
      }
      if (progressMs >= slideDurationMs) {
        progressMs = 0;
        selectSlide(currentIndex + 1, false);
      }
    }, tickInterval);
  }

  window.render3DAlbum = init3DAlbum;

  document.addEventListener('DOMContentLoaded', () => {
    init3DAlbum();
  });
})();

