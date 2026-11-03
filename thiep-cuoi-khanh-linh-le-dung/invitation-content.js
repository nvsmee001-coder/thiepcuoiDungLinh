/* Comprehensive synchronization between Mini-DB and the Wedding Invitation Theme */
(() => {
  'use strict';

  function getDB() {
    return window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};
  }

  function resolveAssetUrl(u) {
    if (!u) return '';
    if (/^(https?:|data:|blob:)/.test(u)) return u;
    const clean = String(u).replace(/^\/+/, '');
    if (clean.startsWith('assets/')) {
      return '/thiep-cuoi-khanh-linh-le-dung/' + clean;
    }
    return '/' + clean;
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

  const DEFAULT_COVER_PHOTO = '/thiep-cuoi-khanh-linh-le-dung/assets/cover-khanh-linh-le-dung.jpg';
  const DEFAULT_INTERLUDE_PHOTO = '/thiep-cuoi-khanh-linh-le-dung/assets/hero.jpg';

  function applySafeImage(img, targetSrc, fallbackSrc) {
    if (!img) return;
    const finalFallback = fallbackSrc || DEFAULT_COVER_PHOTO;
    const initialSrc = targetSrc || finalFallback;

    img.onerror = function () {
      if (this.src !== finalFallback && !this.src.endsWith(finalFallback)) {
        console.warn('[Image Fallback] 404 or load error, switching to safe fallback:', finalFallback);
        this.src = finalFallback;
      }
    };

    if (img.getAttribute('src') !== initialSrc) {
      img.src = initialSrc;
    }
  }

  function formatParentsHtml(parentsStr, venueObj) {
    // 1. Ưu tiên lấy trực tiếp nếu đã lưu riêng father / mother
    if (venueObj && (venueObj.father || venueObj.mother)) {
      const f = (venueObj.father || '').trim();
      const m = (venueObj.mother || '').trim();
      if (f && m) {
        return `<span class="parent-name">${f}</span><span class="parent-amp">&amp;</span><span class="parent-name">${m}</span>`;
      }
      if (f || m) {
        return `<span class="parent-name">${f || m}</span>`;
      }
    }

    if (!parentsStr) return '';
    const raw = String(parentsStr).trim();
    if (raw.includes('parent-name')) return raw;

    let father = '';
    let mother = '';

    // 2. Tách theo ký tự &
    if (raw.includes('&')) {
      const parts = raw.split('&');
      father = parts[0].trim();
      mother = parts.slice(1).join('&').trim();
    }
    // 3. Tách theo xuống dòng \n
    else if (raw.includes('\n')) {
      const parts = raw.split('\n').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        father = parts[0];
        mother = parts.slice(1).join(' ');
      } else {
        father = parts[0] || raw;
      }
    }
    // 4. Tách theo chữ "và"
    else if (/\s+v[àa]\s+/i.test(raw)) {
      const parts = raw.split(/\s+v[àa]\s+/i);
      father = parts[0].trim();
      mother = parts.slice(1).join(' & ').trim();
    }
    // 5. Tách theo dấu +
    else if (raw.includes('+')) {
      const parts = raw.split('+');
      father = parts[0].trim();
      mother = parts.slice(1).join('+').trim();
    }
    // 6. Tách theo thẻ <br>
    else if (/<br\s*\/?>/i.test(raw)) {
      const parts = raw.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        father = parts[0];
        mother = parts.slice(1).join(' ');
      } else {
        father = parts[0] || raw;
      }
    }
    // 7. Tách theo cụm "Ông ... Bà ..."
    else if (/^(Ông\s+.*?)\s+(Bà\s+.*)$/i.test(raw)) {
      const match = raw.match(/^(Ông\s+.*?)\s+(Bà\s+.*)$/i);
      father = match[1].trim();
      mother = match[2].trim();
    }
    // 8. Tách nếu có từ "Bà" hoặc "Mẹ" ở giữa chuỗi
    else if (/\s+(Bà|Mẹ)\s+/i.test(raw)) {
      const idx = raw.search(/\s+(Bà|Mẹ)\s+/i);
      father = raw.slice(0, idx).trim();
      mother = raw.slice(idx).trim();
    } else {
      return `<span class="parent-name">${raw}</span>`;
    }

    if (father && mother) {
      return `<span class="parent-name">${father}</span><span class="parent-amp">&amp;</span><span class="parent-name">${mother}</span>`;
    }
    return `<span class="parent-name">${father || mother || raw}</span>`;
  }

  function cleanMapEmbedUrl(raw, fallbackQuery) {
    if (!raw || typeof raw !== 'string') {
      if (fallbackQuery) {
        return 'https://maps.google.com/maps?q=' + encodeURIComponent(fallbackQuery) + '&t=&z=15&ie=UTF8&iwloc=&output=embed';
      }
      return '';
    }
    let str = raw.trim();

    // 1. Trích xuất src="..." nếu dán nguyên thẻ <iframe> từ Google Maps
    if (/<iframe/i.test(str)) {
      const srcMatch = str.match(/src\s*=\s*["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        str = srcMatch[1].trim();
      }
    }

    // 2. Khử các ký tự HTML entity như &amp;
    str = str.replace(/&amp;/g, '&');

    // 3. Khử dấu ngoặc kép hoặc đơn thừa ở hai đầu
    str = str.replace(/^["']+|["']+$/g, '').trim();

    // 4. Nếu đã là link nhúng chuẩn Google Maps
    if (str.includes('/maps/embed') || str.includes('output=embed')) {
      return str;
    }

    // 5. Nếu là link Google Maps có tham số q=
    if (str.includes('google.com/maps') || str.includes('maps.google.com')) {
      try {
        const u = new URL(str);
        const q = u.searchParams.get('q') || u.searchParams.get('query');
        if (q) {
          return 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&t=&z=15&ie=UTF8&iwloc=&output=embed';
        }
      } catch (_) {}
    }

    // 6. Nếu là link rút gọn maps.app.goo.gl (không nhúng iframe trực tiếp được), fallback sang query địa chỉ
    if (str.includes('maps.app.goo.gl') || str.includes('goo.gl/maps')) {
      if (fallbackQuery) {
        return 'https://maps.google.com/maps?q=' + encodeURIComponent(fallbackQuery) + '&t=&z=15&ie=UTF8&iwloc=&output=embed';
      }
    }

    if (/^https?:\/\//i.test(str)) {
      return str;
    }

    if (fallbackQuery) {
      return 'https://maps.google.com/maps?q=' + encodeURIComponent(fallbackQuery) + '&t=&z=15&ie=UTF8&iwloc=&output=embed';
    }

    return '';
  }

  function cleanMapLinkUrl(raw, fallbackQuery) {
    if (!raw || typeof raw !== 'string') {
      if (fallbackQuery) {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(fallbackQuery);
      }
      return '';
    }
    let str = raw.trim();

    if (/<iframe/i.test(str)) {
      const srcMatch = str.match(/src\s*=\s*["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) str = srcMatch[1].trim();
    } else if (/<a/i.test(str)) {
      const hrefMatch = str.match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch && hrefMatch[1]) str = hrefMatch[1].trim();
    }

    str = str.replace(/&amp;/g, '&');
    str = str.replace(/^["']+|["']+$/g, '').trim();

    if (/^https?:\/\//i.test(str)) {
      return str;
    }

    if (fallbackQuery) {
      return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(fallbackQuery);
    }
    return str;
  }

  function buildConfig() {
    const db = getDB();
    const groomName = (db.couple && db.couple.groomName) || 'Lê Dũng';
    const brideName = (db.couple && db.couple.brideName) || 'Khánh Linh';
    const coupleNames = `${brideName} & ${groomName}`;
    const coupleNamesHtml = `<span>${brideName}</span><em>&amp;</em><span>${groomName}</span>`;

    // Monogram (e.g. L & D)
    const invCard = (db && db.invitationCard) || {};
    const brideInitial = brideName.trim().split(/\s+/).pop()[0]?.toUpperCase() || 'L';
    const groomInitial = groomName.trim().split(/\s+/).pop()[0]?.toUpperCase() || 'D';
    const monogramText = invCard.monogram ? invCard.monogram.replace('&', '<span>&amp;</span>') : `${brideInitial}<span>&amp;</span>${groomInitial}`;
    const subTitle = invCard.subTitle || 'THE WEDDING INVITATION';
    const kinhMoiTitle = invCard.kinhMoiTitle || 'Kính mời';
    const defaultGuestName = (invCard.defaultGuestName && !invCard.defaultGuestName.includes('...'))
      ? invCard.defaultGuestName
      : 'Quý khách và gia đình';
    const introGroom = invCard.introGroom || 'Gia đình nhà trai trân trọng kính mời quý khách<br>đến dự lễ thành hôn của hai con chúng tôi';
    const introBride = invCard.introBride || 'Gia đình nhà gái trân trọng kính mời quý khách<br>đến dự lễ thành hôn của hai con chúng tôi';
    const bottomMessage = invCard.bottomMessage || 'Một ngày đặc biệt, bên những người thương.';

    // Venues
    const brideVenue = (db.venues && db.venues.bride) || {};
    const groomVenue = (db.venues && db.venues.groom) || {};

    const brideLocation = brideVenue.nameFull || brideVenue.nameShort || 'Trung tâm Trống Đồng Palace';
    const brideAddress = brideVenue.address || '65 Quán Sứ - Cửa Nam - Hà Nội';
    const brideParents = brideVenue.parents || 'Ông Phạm Ngọc Hùng & Bà Nguyễn Tuyết Nhung';
    const brideDateIso = brideVenue.date || (db.date && db.date.isoTarget) || '2026-11-27T11:00:00+07:00';
    const brideParsed = parseDateParts(brideDateIso, '11:00');
    const brideLunar = brideVenue.lunar || '(Tức ngày 19 tháng 10 năm Bính Ngọ)';
    const brideFallbackQuery = `${brideLocation}, ${brideAddress}`;
    const brideMap = cleanMapLinkUrl(brideVenue.mapLink, brideFallbackQuery);
    const brideMapEmbed = cleanMapEmbedUrl(brideVenue.mapEmbed, brideFallbackQuery);

    const groomLocation = groomVenue.nameFull || groomVenue.nameShort || 'Trung tâm Đại Hoàng Sơn Palace';
    const groomAddress = groomVenue.address || '45 Hùng Vương - Bắc Giang - Bắc Ninh';
    const groomParents = groomVenue.parents || 'Ông Nguyễn Văn Uy & Bà Lê Thị Hảo';
    const groomDateIso = groomVenue.date || '2026-11-28T11:00:00+07:00';
    const groomParsed = parseDateParts(groomDateIso, '11:00');
    const groomLunar = groomVenue.lunar || '(Tức ngày 20 tháng 10 năm Bính Ngọ)';
    const groomFallbackQuery = `${groomLocation}, ${groomAddress}`;
    const groomMap = cleanMapLinkUrl(groomVenue.mapLink, groomFallbackQuery);
    const groomMapEmbed = cleanMapEmbedUrl(groomVenue.mapEmbed, groomFallbackQuery);

    // Photos (PC & Mobile)
    const coverPhoto = resolveAssetUrl((db.couple && (db.couple.coverPhoto || db.couple.heroBackdrop)) || '/thiep-cuoi-khanh-linh-le-dung/assets/cover-khanh-linh-le-dung.jpg');
    const coverPhotoMobile = resolveAssetUrl((db.couple && db.couple.coverPhotoMobile) || '');
    const interludePhoto = resolveAssetUrl((db.couple && (db.couple.interludePhoto || db.couple.detailsBackdrop)) || '/thiep-cuoi-khanh-linh-le-dung/assets/hero.jpg');
    const interludePhotoMobile = resolveAssetUrl((db.couple && db.couple.interludePhotoMobile) || '');

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
        venue: groomVenue,
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
        venue: brideVenue,
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
      subTitle,
      kinhMoiTitle,
      defaultGuestName,
      introGroom,
      introBride,
      bottomMessage,
      coverPhoto,
      coverPhotoMobile,
      interludePhoto,
      interludePhotoMobile,
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
      timelineEl.innerHTML = events.map((ev, i) => `
        <div>
          <span class="timeline-icon">${i + 1}</span>
          <time>${ev.time || ''}</time>
          <h4>${ev.title || ''}</h4>
          <p>${ev.desc || ''}</p>
        </div>
      `).join('');
    } else {
      timelineEl.innerHTML = `
        <div><span class="timeline-icon">1</span><time>11:00</time><h4>Đón khách & Chụp hình</h4><p>Chào đón quý khách đến chung vui cùng gia đình tại ${activeConfig.venueName}</p></div>
        <div><span class="timeline-icon">2</span><time>11:30</time><h4>Lễ thành hôn</h4><p>Nghi thức trao nhẫn cưới &amp; nhận lời chúc phúc của hai bên gia đình</p></div>
        <div><span class="timeline-icon">3</span><time>12:00</time><h4>Khai tiệc mừng</h4><p>Nâng ly chúc phúc và cùng thưởng thức bữa tiệc thân mật</p></div>
        <div><span class="timeline-icon">4</span><time>13:30</time><h4>Tiễn khách &amp; Cảm tạ</h4><p>Lưu lại những tấm hình kỷ niệm đẹp cùng cô dâu &amp; chú rể</p></div>
      `;
    }
  }

  function renderAlbumAndGallery(db, coupleNames) {
    // 1. Kích hoạt Sân khấu 3D Coverflow & Tường Triển Lãm
    if (typeof window.render3DAlbum === 'function') {
      window.render3DAlbum(db);
    }

    const albumGrid = document.querySelector('.album-grid');
    const galleryThumbs = document.getElementById('gallery-thumbs');

    const rawPhotos = (db && Array.isArray(db.albumPhotos)) ? db.albumPhotos : [];

    const photos = rawPhotos.map(p => (typeof p === 'string' ? p : (p && p.src ? p.src : ''))).filter(Boolean).map(resolveAssetUrl);

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

  let currentMusicTrackIdx = 0;
  function renderMusic(db) {
    const audio = document.getElementById('background-music');
    const toggle = document.getElementById('sound-toggle');
    if (!audio) return;

    const list = (db && Array.isArray(db.music) && db.music.length > 0)
      ? db.music
      : [{ title: 'River Flows in You — Yiruma', src: '/thiep-cuoi-khanh-linh-le-dung/assets/river-flows-in-you.mp3#t=10' }];

    window.__WEDDING_PLAYLIST = list;
    window.__WEDDING_CURRENT_MUSIC_INDEX = currentMusicTrackIdx;

    if (!audio.__playlistBound) {
      audio.__playlistBound = true;
      audio.addEventListener('ended', () => {
        const pl = window.__WEDDING_PLAYLIST || [];
        if (pl.length > 1) {
          currentMusicTrackIdx = (currentMusicTrackIdx + 1) % pl.length;
          window.__WEDDING_CURRENT_MUSIC_INDEX = currentMusicTrackIdx;
          const nextTrack = pl[currentMusicTrackIdx];
          const nextSrc = resolveAssetUrl(nextTrack && nextTrack.src);
          if (nextSrc) {
            audio.src = nextSrc;
            audio.setAttribute('data-loaded-src', nextSrc);
            audio.play().catch(() => {});
            if (toggle) {
              toggle.title = `${nextTrack.title || 'Nhạc cưới'} · Bật/Tắt nhạc`;
              toggle.setAttribute('aria-label', `Bật nhạc nền — ${nextTrack.title || 'Nhạc cưới'}`);
            }
          }
        } else {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      });
    }

    const track = list[currentMusicTrackIdx % list.length];
    const trackSrc = resolveAssetUrl(track && track.src);
    if (track && trackSrc && audio.getAttribute('data-loaded-src') !== trackSrc) {
      audio.setAttribute('data-loaded-src', trackSrc);
      audio.src = trackSrc;
      if (toggle) {
        toggle.title = `${track.title || 'Nhạc cưới'} · Bật/Tắt nhạc`;
        toggle.setAttribute('aria-label', `Bật nhạc nền — ${track.title || 'Nhạc cưới'}`);
      }
    }

    if (typeof window.refreshMusicPlaylistUI === 'function') {
      window.refreshMusicPlaylistUI();
    }
  }

  function renderInterlude(db, configData) {
    const intData = (db && db.interlude) || {};
    const eyebrow = intData.eyebrow || 'AND SO, OUR FOREVER BEGINS';
    const quote = intData.quote || 'Và rồi chúng mình lựa chọn<br><em>trở thành một nửa của nhau.</em>';

    document.querySelectorAll('.interlude-copy .eyebrow').forEach(el => el.textContent = eyebrow);
    document.querySelectorAll('.interlude-copy>p:not(.eyebrow)').forEach(el => {
      el.innerHTML = quote;
    });
  }

  function renderJourney(db) {
    const j = (db && db.journey) || {};
    const origin = j.originCity || 'Hà Nội';
    const dest = j.destinationCity || 'Shanghai';
    const subtitle = j.subtitle || 'Hai thành phố. Một hành trình chung.<br>Và những khoảnh khắc muốn giữ lại mãi.';
    const arrivalTitle = j.arrivalTitle || 'Chạm đến một nơi.<br><em>Mở ra những kỷ niệm.</em>';

    // Heading
    const jTitle = document.getElementById('journey-title');
    if (jTitle) {
      jTitle.innerHTML = `${origin} <span class="heading-route" aria-label="đến">—</span> <em>${dest}.</em>`;
    }
    const jSubtitle = document.querySelector('.travel-heading>p');
    if (jSubtitle && j.subtitle) {
      jSubtitle.innerHTML = subtitle;
    }

    // Topline & Footnote
    const topline = document.querySelector('.travel-topline');
    if (topline) {
      topline.innerHTML = `<span>${origin.toUpperCase()} <i>—</i> ${dest.toUpperCase()}</span><span>A JOURNEY TOGETHER</span>`;
    }
    const footnote = document.querySelector('.travel-footnote');
    if (footnote) {
      footnote.textContent = `${origin.toUpperCase()} — ${dest.toUpperCase()} · TWO CITIES, ONE LOVE`;
    }

    // City labels on canvas
    const originLabel = document.getElementById('travel-hanoi');
    if (originLabel) {
      const strong = originLabel.querySelector('strong');
      if (strong) strong.textContent = origin;
    }
    const destLabel = document.getElementById('travel-shanghai');
    if (destLabel) {
      const strong = destLabel.querySelector('strong');
      if (strong) strong.textContent = dest;
    }

    // Arrival title
    const arrivalTitleEl = document.querySelector('.arrival-heading h3');
    if (arrivalTitleEl && j.arrivalTitle) {
      arrivalTitleEl.innerHTML = arrivalTitle;
    }

    // 3 Polaroids
    const polaroids = Array.isArray(j.polaroids) && j.polaroids.length > 0 ? j.polaroids : null;
    if (polaroids) {
      const buttons = document.querySelectorAll('.arrival-photos .arrival-photo');
      buttons.forEach((btn, idx) => {
        if (polaroids[idx]) {
          const item = polaroids[idx];
          const img = btn.querySelector('img');
          if (img && item.photo) {
            img.src = resolveAssetUrl(item.photo);
            img.alt = `${origin} - ${dest} kỷ niệm ${idx + 1}`;
          }
          const cap = btn.querySelector('span:last-child');
          if (cap && item.caption) {
            cap.innerHTML = `${item.caption}`;
          }
        }
      });
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

    // Invitation Paper Card elements
    const subTitleEl = document.getElementById('invitationSubTitle');
    if (subTitleEl) subTitleEl.textContent = configData.subTitle;

    const kinhMoiEl = document.getElementById('invitationKinhMoi');
    if (kinhMoiEl) kinhMoiEl.textContent = configData.kinhMoiTitle;

    const introTextEl = document.getElementById('invitationIntroText');
    if (introTextEl) {
      introTextEl.innerHTML = isBride ? configData.introBride : configData.introGroom;
    }

    document.querySelectorAll('.invite-message').forEach(n => n.textContent = configData.bottomMessage);

    // Guest name handling (?to=... or ?guest=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const guestParam = urlParams.get('to') || urlParams.get('guest') || urlParams.get('k');
      const guestNameEl = document.getElementById('invitationGuestName');
      if (guestNameEl) {
        if (guestParam && guestParam.trim()) {
          guestNameEl.textContent = guestParam.trim();
          guestNameEl.classList.add('has-guest-name');
        } else if (!guestNameEl.dataset.userEdited) {
          guestNameEl.textContent = configData.defaultGuestName;
          guestNameEl.classList.add('has-guest-name');
        }
        if (!guestNameEl.dataset.bound) {
          guestNameEl.dataset.bound = 'true';
          guestNameEl.addEventListener('input', () => {
            guestNameEl.dataset.userEdited = 'true';
            if (guestNameEl.textContent.trim()) {
              guestNameEl.classList.add('has-guest-name');
            } else {
              guestNameEl.textContent = configData.defaultGuestName;
              guestNameEl.classList.add('has-guest-name');
            }
          });
        }
      }
    } catch (_) {}

    // Synchronize all side switch buttons
    document.querySelectorAll('[data-family-switch]').forEach(btn => {
      const match = btn.dataset.familySwitch === family;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-selected', String(match));
    });

    // 2. Photos (Responsive Cover & Interlude, Safe Fallback chống 404)
    const isMobile = window.innerWidth <= 600;
    const effectiveCover = (isMobile && configData.coverPhotoMobile) ? configData.coverPhotoMobile : (configData.coverPhoto || DEFAULT_COVER_PHOTO);
    const effectiveInterlude = (isMobile && configData.interludePhotoMobile) ? configData.interludePhotoMobile : (configData.interludePhoto || DEFAULT_INTERLUDE_PHOTO);

    const coverImgs = document.querySelectorAll('#finalCoverImg, .cover-photo img, .invitation-photo-watermark img');
    coverImgs.forEach(img => {
      applySafeImage(img, effectiveCover, DEFAULT_COVER_PHOTO);
    });

    const finalSourceMob = document.getElementById('finalCoverSourceMobile');
    if (finalSourceMob) {
      finalSourceMob.srcset = configData.coverPhotoMobile || effectiveCover || DEFAULT_COVER_PHOTO;
    }

    const interludeImgs = document.querySelectorAll('.photo-interlude img');
    interludeImgs.forEach(img => {
      applySafeImage(img, effectiveInterlude, DEFAULT_INTERLUDE_PHOTO);
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
      const brideParentsHtml = formatParentsHtml(configData.details.bride.parents, configData.details.bride.venue);
      const groomParentsHtml = formatParentsHtml(configData.details.groom.parents, configData.details.groom.venue);
      const brideCard = `<div><h3>Nhà Gái</h3><p class="family-parents">${brideParentsHtml}</p><span class="family-role">Cô dâu: <strong class="role-name">${configData.brideName}</strong></span></div>`;
      const groomCard = `<div><h3>Nhà Trai</h3><p class="family-parents">${groomParentsHtml}</p><span class="family-role">Chú rể: <strong class="role-name">${configData.groomName}</strong></span></div>`;
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
    const mapFallback = `${config.venueName || ''}, ${config.venueAddress || ''}`.trim();
    const mapLink = document.querySelector('.celebration-venue .text-link');
    if (mapLink) {
      const targetUrl = cleanMapLinkUrl(config.mapLink, mapFallback);
      mapLink.href = targetUrl || '#';
      mapLink.target = '_blank';
      mapLink.rel = 'noopener noreferrer';
      mapLink.innerHTML = 'Xem đường đi trên Google Maps';
    }
    const mapBox = document.getElementById('celebration-map-box');
    const mapIframe = document.getElementById('celebration-map-iframe');
    if (mapBox && mapIframe) {
      const cleanEmbed = cleanMapEmbedUrl(config.mapEmbed, mapFallback);
      if (cleanEmbed) {
        if (mapIframe.src !== cleanEmbed) {
          mapIframe.src = cleanEmbed;
        }
        mapBox.hidden = false;
      } else {
        mapBox.hidden = true;
      }
    }

    // 6. Timeline, Menu, Album & Music, Interlude & Journey
    renderTimeline(configData.db, config);
    renderMenu(configData.db);
    renderAlbumAndGallery(configData.db, configData.coupleNames);
    renderMusic(configData.db);
    renderIntroScenes(configData.db);
    renderInterlude(configData.db, configData);
    renderJourney(configData.db);

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
    let curFamily = document.body.dataset.weddingFamily;
    if (!curFamily) {
      try {
        const u = new URLSearchParams(window.location.search);
        const s = u.get('side') || u.get('family');
        if (s === 'groom' || s === 'bride') curFamily = s;
      } catch (_) {}
    }
    curFamily = curFamily || 'groom';
    document.body.dataset.weddingFamily = curFamily;
    apply(curFamily);
  }

  window.addEventListener('resize', () => {
    initUI();
  });

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
