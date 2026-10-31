/* Comprehensive synchronization between Mini-DB and the Wedding Invitation Theme */
(() => {
  'use strict';

  function getDB() {
    return window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};
  }

  function resolveAssetUrl(u) {
    if (!u) return '';
    if (/^(https?:|data:|blob:|\/)/.test(u)) return u;
    if (u.startsWith('assets/')) return u;
    return '/' + u;
  }

  function parseDateParts(dateStr, timeStr) {
    let d = new Date(dateStr || '2026-11-27T11:00:00+07:00');
    if (isNaN(d.getTime())) d = new Date('2026-11-27T11:00:00+07:00');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    const dowNames = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
    const dowTitles = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dow = dowNames[d.getDay()] || 'THỨ SÁU';
    const dowTitle = dowTitles[d.getDay()] || 'Thứ Sáu';
    const time = timeStr || `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { day, month, year, dow, dowTitle, time, dotDate: `${day}.${month}.${year}` };
  }

  function buildConfig() {
    const db = getDB();
    const groomName = (db.couple && db.couple.groomName) || 'Lê Dũng';
    const brideName = (db.couple && db.couple.brideName) || 'Khánh Linh';
    const coupleNames = `${brideName} & ${groomName}`;
    const coupleNamesHtml = `<span>${brideName}</span><em>&amp;</em><span>${groomName}</span>`;

    // Monogram (e.g. K & D or K & L)
    const brideInitial = brideName.trim().split(/\s+/).pop()[0]?.toUpperCase() || 'L';
    const groomInitial = groomName.trim().split(/\s+/).pop()[0]?.toUpperCase() || 'D';
    const monogramText = `${brideInitial}<span>&amp;</span>${groomInitial}`;

    // Venues
    const brideVenue = (db.venues && db.venues.bride) || {};
    const groomVenue = (db.venues && db.venues.groom) || {};

    const brideLocation = brideVenue.nameFull || brideVenue.nameShort || 'Trung tâm Trống Đồng Palace';
    const brideAddress = brideVenue.address || '65 Quán Sứ - Cửa Nam - Hà Nội';
    const brideParents = brideVenue.parents || 'Ông Phạm Ngọc Hùng & Bà Nguyễn Tuyết Nhung';
    const brideDateIso = brideVenue.date || (db.date && db.date.isoTarget) || '2026-11-27T11:00:00+07:00';
    const brideParsed = parseDateParts(brideDateIso, '11:00');
    const brideLunar = brideVenue.lunar || '(Tức ngày 19 tháng 10 năm Bính Ngọ)';
    const brideMap = brideVenue.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brideLocation + ', ' + brideAddress)}`;
    const brideMapEmbed = brideVenue.mapEmbed || '';

    const groomLocation = groomVenue.nameFull || groomVenue.nameShort || 'Trung tâm Đại Hoàng Sơn Palace';
    const groomAddress = groomVenue.address || '45 Hùng Vương - Bắc Giang - Bắc Ninh';
    const groomParents = groomVenue.parents || 'Ông Nguyễn Văn Uy & Bà Lê Thị Hảo';
    const groomDateIso = groomVenue.date || '2026-11-28T11:00:00+07:00';
    const groomParsed = parseDateParts(groomDateIso, '11:00');
    const groomLunar = groomVenue.lunar || '(Tức ngày 20 tháng 10 năm Bính Ngọ)';
    const groomMap = groomVenue.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(groomLocation + ', ' + groomAddress)}`;
    const groomMapEmbed = groomVenue.mapEmbed || '';

    // Photos
    const coverPhoto = resolveAssetUrl((db.couple && (db.couple.coverPhoto || db.couple.heroBackdrop)) || 'assets/cover-khanh-linh-le-dung.jpg');
    const interludePhoto = resolveAssetUrl((db.couple && (db.couple.interludePhoto || db.couple.detailsBackdrop)) || 'assets/hero.jpg');

    const details = {
      groom: {
        names: coupleNames,
        side: 'Nhà trai',
        date: groomDateIso,
        dateLabel: groomParsed.dotDate,
        dateParts: groomParsed,
        utc: '20261128T040000Z',
        location: `${groomLocation}, ${groomAddress}`,
        mapLink: groomMap,
        mapEmbed: groomMapEmbed,
        venueName: groomLocation,
        venueAddress: groomAddress,
        parents: groomParents,
        lunar: groomLunar,
        description: `Tiệc cưới nhà trai: kính mời quý khách đến chung vui mừng hạnh phúc cùng gia đình chúng tôi tại ${groomLocation}. ${groomLunar}.`
      },
      bride: {
        names: coupleNames,
        side: 'Nhà gái',
        date: brideDateIso,
        dateLabel: brideParsed.dotDate,
        dateParts: brideParsed,
        utc: '20261127T040000Z',
        location: `${brideLocation}, ${brideAddress}`,
        mapLink: brideMap,
        mapEmbed: brideMapEmbed,
        venueName: brideLocation,
        venueAddress: brideAddress,
        parents: brideParents,
        lunar: brideLunar,
        description: `Tiệc cưới nhà gái: kính mời quý khách đến chung vui mừng hạnh phúc cùng gia đình chúng tôi tại ${brideLocation}. ${brideLunar}.`
      }
    };

    return {
      db,
      details,
      groomName,
      brideName,
      coupleNames,
      coupleNamesHtml,
      monogramText,
      coverPhoto,
      interludePhoto,
      brideVenue,
      groomVenue,
      brideParsed,
      groomParsed,
      brideLunar,
      groomLunar
    };
  }

  function renderMenu(db) {
    const menuBox = document.getElementById('event-menu');
    const grid = document.getElementById('menu-courses-grid');
    if (!menuBox || !grid) return;

    const m = (db && db.menu) || {};
    const courses = Array.isArray(m.courses) ? m.courses : [];

    const eyebrowEl = document.getElementById('menu-eyebrow');
    if (eyebrowEl && m.eyebrow) eyebrowEl.textContent = m.eyebrow;
    const headingEl = document.getElementById('menu-heading');
    if (headingEl && m.heading) headingEl.textContent = m.heading;
    const subNoteEl = document.getElementById('menu-subnote');
    if (subNoteEl && m.subNote) subNoteEl.textContent = m.subNote;

    if (!courses.length) {
      grid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--muted);font-size:12px;">Đang cập nhật thực đơn tiệc cưới...</p>';
      return;
    }

    grid.innerHTML = courses.map((item, idx) => {
      const tag = item.tag || 'Món chính';
      const name = item.name || '';
      const desc = item.desc || '';
      return `
        <div class="menu-item-card">
          <span class="menu-tag-badge">${tag}</span>
          <h4 class="menu-course-title">${name}</h4>
          <p class="menu-course-detail">${desc}</p>
        </div>
      `;
    }).join('');
  }

  function renderTimeline(db, activeConfig) {
    const timelineEl = document.getElementById('event-timeline');
    if (!timelineEl) return;

    const events = (db.schedule && Array.isArray(db.schedule.events) && db.schedule.events.length > 0)
      ? db.schedule.events
      : null;

    if (events) {
      const icons = ['✧', '♡', '♧', '✳', '❖', '★'];
      timelineEl.innerHTML = events.map((ev, i) => `
        <div>
          <span class="timeline-icon">${icons[i % icons.length]}</span>
          <time>${ev.time || ''}</time>
          <h4>${ev.title || ''}</h4>
          <p>${ev.desc || ''}</p>
        </div>
      `).join('');
    } else {
      timelineEl.innerHTML = `
        <div><span class="timeline-icon">✧</span><time>11:00</time><h4>Đón khách & Chụp hình</h4><p>Chào đón quý khách đến chung vui cùng gia đình tại ${activeConfig.venueName}</p></div>
        <div><span class="timeline-icon">♡</span><time>11:30</time><h4>Lễ thành hôn</h4><p>Nghi thức trao nhẫn cưới &amp; nhận lời chúc phúc của hai bên gia đình</p></div>
        <div><span class="timeline-icon">♧</span><time>12:00</time><h4>Khai tiệc mừng</h4><p>Nâng ly chúc phúc và cùng thưởng thức bữa tiệc thân mật</p></div>
        <div><span class="timeline-icon">✳</span><time>13:30</time><h4>Tiễn khách &amp; Cảm tạ</h4><p>Lưu lại những tấm hình kỷ niệm đẹp cùng cô dâu &amp; chú rể</p></div>
      `;
    }
  }

  function renderAlbumAndGallery(db, coupleNames) {
    const albumGrid = document.querySelector('.album-grid');
    const galleryThumbs = document.getElementById('gallery-thumbs');

    const rawPhotos = (db && Array.isArray(db.albumPhotos) && db.albumPhotos.length > 0)
      ? db.albumPhotos
      : [
          'assets/memory-01-garden.jpg',
          'assets/memory-02-castle.jpg',
          'assets/memory-03-piano.jpg'
        ];

    const photos = rawPhotos.map(p => (typeof p === 'string' ? p : (p && p.src ? p.src : ''))).filter(Boolean).map(resolveAssetUrl);

    // 1. Render Album Grid on Page
    if (albumGrid) {
      albumGrid.innerHTML = photos.map((src, i) => {
        const numStr = (i + 1 < 10 ? '0' : '') + (i + 1);
        return `
          <button data-gallery="${i}" data-reveal aria-label="Mở ảnh cưới #${i + 1}">
            <span class="photo-window">
              <img src="${src}" alt="Ảnh cưới ${coupleNames} #${numStr}" loading="lazy">
            </span>
            <span>${numStr} / MOMENTS TO KEEP <i>↗</i></span>
          </button>
        `;
      }).join('');
    }

    // 2. Render Gallery Dialog Thumbs
    if (galleryThumbs) {
      galleryThumbs.innerHTML = photos.map((src, i) => `
        <button type="button" data-photo-index="${i}" aria-label="Xem ảnh ${i + 1}">
          <img src="${src}" alt="">
        </button>
      `).join('');
    }

    // 3. Sync into Photo Motion Controller
    if (typeof window.syncGalleryPhotos === 'function') {
      const galleryData = photos.map((src, i) => {
        const numStr = (i + 1 < 10 ? '0' : '') + (i + 1);
        return {
          src: src,
          alt: `${coupleNames} - Khoảnh khắc #${numStr}`,
          caption: `${numStr} / Moments to keep`
        };
      });
      window.syncGalleryPhotos(galleryData);
    }
  }

  function renderMusic(db) {
    const audio = document.getElementById('background-music');
    const toggle = document.getElementById('sound-toggle');
    if (!audio) return;

    if (db && Array.isArray(db.music) && db.music.length > 0) {
      const track = db.music[0];
      const trackSrc = resolveAssetUrl(track && track.src);
      if (track && trackSrc && audio.getAttribute('src') !== trackSrc) {
        audio.src = trackSrc;
        if (toggle) {
          toggle.title = `${track.title || 'Nhạc cưới'} · Bật/Tắt nhạc`;
          toggle.setAttribute('aria-label', `Bật nhạc nền — ${track.title || 'Nhạc cưới'}`);
        }
      }
    }
  }

  function renderIntroScenes(db) {
    if (!db || !Array.isArray(db.introScenes)) return;
    db.introScenes.forEach((scene, i) => {
      const layer = document.getElementById(`introScene${i}`);
      if (layer && scene.backdrop) {
        const bd = layer.querySelector('.scene-backdrop');
        if (bd) bd.style.backgroundImage = `url('${resolveAssetUrl(scene.backdrop)}')`;
      }
    });
  }

  function apply(family) {
    const configData = buildConfig();
    const isBride = family === 'bride';
    const config = configData.details[isBride ? 'bride' : 'groom'];
    const p = config.dateParts;

    // 1. Text & Monogram updates
    document.querySelectorAll('.entry-names').forEach(n => n.innerHTML = configData.coupleNamesHtml);
    document.querySelectorAll('#hero-title').forEach(n => n.innerHTML = configData.coupleNamesHtml);
    document.querySelectorAll('.footer-names').forEach(n => n.innerHTML = configData.coupleNamesHtml);
    document.querySelectorAll('.entry-photo-date').forEach(n => n.textContent = `${p.day} . ${p.month} . ${p.year}`);
    document.querySelectorAll('.monogram').forEach(n => {
      n.innerHTML = `${configData.monogramText}<i>${p.day}.${p.month}.${p.year.slice(2)}</i>`;
      n.setAttribute('aria-label', `${configData.coupleNames} — Trang đầu`);
    });
    document.querySelectorAll('.invitation-seal').forEach(n => n.innerHTML = configData.monogramText);

    // 2. Photos (Cover & Interlude)
    const coverImgs = document.querySelectorAll('#finalCoverImg, .cover-photo img, .invitation-photo-watermark img');
    coverImgs.forEach(img => {
      const src = resolveAssetUrl(configData.coverPhoto);
      if (src && img.getAttribute('src') !== src) {
        img.src = src;
      }
    });
    const interludeImgs = document.querySelectorAll('.photo-interlude img');
    interludeImgs.forEach(img => {
      const src = resolveAssetUrl(configData.interludePhoto);
      if (src && img.getAttribute('src') !== src) {
        img.src = src;
      }
    });

    // 3. Date & Time Badges
    document.querySelectorAll('.photo-date-badge b').forEach(n => n.textContent = `${p.day} · ${p.month}`);
    document.querySelectorAll('.cover-caption>span:last-child').forEach(n => n.innerHTML = `${p.dotDate} &nbsp; / &nbsp; ${isBride ? 'HÀ NỘI' : 'BẮC GIANG'}`);
    document.querySelectorAll('.invite-date').forEach(n => {
      n.innerHTML = `<span>${p.dow}</span><strong>${p.day}.${p.month}</strong><span>NĂM ${p.year}</span>`;
    });
    document.querySelectorAll('.invite-time').forEach(n => {
      n.innerHTML = `VÀO LÚC: <strong>${p.time}</strong>`;
      n.hidden = false;
    });
    document.querySelectorAll('.invite-lunar').forEach(n => {
      n.textContent = config.lunar;
      n.hidden = false;
    });

    // 4. Location & Venue
    document.querySelectorAll('.invite-location').forEach(n => {
      n.innerHTML = `<strong>TẠI: ${config.venueName.toUpperCase()}</strong><br><span>${config.venueAddress}</span>`;
    });
    document.querySelectorAll('.invitation-families').forEach(n => {
      const brideCard = `<div><h3>Nhà Gái</h3><p>${configData.details.bride.parents}</p><span>Cô dâu: ${configData.brideName}</span></div>`;
      const groomCard = `<div><h3>Nhà Trai</h3><p>${configData.details.groom.parents}</p><span>Chú rể: ${configData.groomName}</span></div>`;
      n.innerHTML = isBride ? brideCard + groomCard : groomCard + brideCard;
      n.hidden = false;
    });

    // 5. Celebration section
    document.querySelectorAll('.celebration-venue h3').forEach(n => n.textContent = config.venueName);
    document.querySelectorAll('.celebration-venue>p:not(.eyebrow):not(.venue-note)').forEach(n => {
      n.innerHTML = `${p.time} · ${p.dowTitle}, ngày ${p.day} tháng ${p.month} năm ${p.year}<br>${config.venueAddress}`;
    });
    document.querySelectorAll('.venue-note').forEach(n => n.textContent = config.lunar);

    // Map link & embed
    const mapLink = document.querySelector('.celebration-venue .text-link');
    if (mapLink) {
      mapLink.href = config.mapLink;
      mapLink.innerHTML = 'Xem đường đi trên Google Maps <span>↗</span>';
    }
    const mapBox = document.getElementById('celebration-map-box');
    const mapIframe = document.getElementById('celebration-map-iframe');
    if (mapBox && mapIframe) {
      if (config.mapEmbed) {
        mapIframe.src = config.mapEmbed;
        mapBox.hidden = false;
      } else {
        mapBox.hidden = true;
      }
    }

    // 6. Timeline, Menu, Album & Music
    renderTimeline(configData.db, config);
    renderMenu(configData.db);
    renderAlbumAndGallery(configData.db, configData.coupleNames);
    renderMusic(configData.db);
    renderIntroScenes(configData.db);

    // 7. Page title & meta
    document.title = `${configData.coupleNames} — Thiệp Mời ${config.side} · ${config.dateLabel}`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.content = `Trân trọng kính mời dự tiệc cưới ${configData.coupleNames}, lúc ${p.time} ngày ${config.dateLabel} tại ${config.location}.`;
    }

    document.querySelectorAll('.interlude-copy>span').forEach(n => n.textContent = `${configData.coupleNames} · ${config.dateLabel}`);
    document.querySelectorAll('.footer-demo').forEach(n => n.textContent = `THIỆP ${config.side.toUpperCase()} · ${configData.coupleNames.toUpperCase()} · ${config.dateLabel}`);
    document.querySelectorAll('.entry-demo').forEach(n => n.textContent = `${configData.coupleNames.toUpperCase()} · THIỆP ${config.side.toUpperCase()}`);

    document.body.classList.add('formal-invitation');
  }

  window.WeddingInvitation = {
    get: () => {
      const configData = buildConfig();
      const fam = document.body.dataset.weddingFamily || 'bride';
      return configData.details[fam] || configData.details.groom;
    }
  };

  window.addEventListener('wedding:sidechange', event => apply(event.detail.family));

  function initUI() {
    const curFamily = document.body.dataset.weddingFamily || 'bride';
    apply(curFamily);
  }

  // Load latest DB if available
  if (typeof window.fetchWeddingDBFromServer === 'function') {
    window.fetchWeddingDBFromServer().then(db => {
      window.WEDDING_DB = db;
      initUI();
    }).catch(() => {
      initUI();
    });
  } else {
    initUI();
  }

  // Listen for live DB updates from Admin Studio
  if (window.WEDDING_LIVE_CHANNEL) {
    window.WEDDING_LIVE_CHANNEL.addEventListener('message', ev => {
      if (ev.data && (ev.data.type === 'DB_UPDATED' || ev.data.type === 'STATE_CHANGED')) {
        if (typeof window.fetchWeddingDBFromServer === 'function') {
          window.fetchWeddingDBFromServer().then(updated => {
            window.WEDDING_DB = updated;
            initUI();
          });
        }
      }
    });
  }
})();
