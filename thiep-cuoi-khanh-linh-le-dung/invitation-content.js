/* Shared couple details with a separate invitation for each family, synced with Mini-DB. */
(() => {
  'use strict';

  function getDB() {
    return window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};
  }

  function buildConfig() {
    const db = getDB();
    const groomName = (db.couple && db.couple.groomName) || 'Lê Dũng';
    const brideName = (db.couple && db.couple.brideName) || 'Khánh Linh';
    const coupleNames = `${brideName} & ${groomName}`;
    const coupleNamesHtml = `<span>${brideName}</span><em>&amp;</em><span>${groomName}</span>`;

    // Monogram initials (VD: K & D hoặc K & L)
    const brideInitial = brideName.trim().split(/\s+/).pop()[0]?.toUpperCase() || 'L';
    const groomInitial = groomName.trim().split(/\s+/).pop()[0]?.toUpperCase() || 'D';
    const monogramText = `${brideInitial}<span>&amp;</span>${groomInitial}`;

    // Venues
    const brideVenue = (db.venues && db.venues.bride) || {};
    const groomVenue = (db.venues && db.venues.groom) || {};

    const brideLocation = brideVenue.nameFull || brideVenue.nameShort || 'Trung tâm Trống Đồng Palace';
    const brideAddress = brideVenue.address || '65 Quán Sứ - Cửa Nam - Hà Nội';
    const brideParents = brideVenue.parents || 'PHẠM NGỌC HÙNG<br>NGUYỄN TUYẾT NHUNG';
    const brideDateIso = brideVenue.date || '2026-11-27T11:00:00+07:00';
    const brideDateLabel = '27.11.2026';
    const brideLunar = brideVenue.lunar || '(Tức ngày 19 tháng 10 năm Bính Ngọ)';
    const brideMap = brideVenue.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brideLocation + ', ' + brideAddress)}`;

    const groomLocation = groomVenue.nameFull || groomVenue.nameShort || 'Trung tâm Đại Hoàng Sơn Palace';
    const groomAddress = groomVenue.address || '45 Hùng Vương - Bắc Giang - Bắc Ninh';
    const groomParents = groomVenue.parents || 'NGUYỄN VĂN UY<br>LÊ THỊ HẢO';
    const groomDateIso = groomVenue.date || '2026-11-28T11:00:00+07:00';
    const groomDateLabel = '28.11.2026';
    const groomLunar = groomVenue.lunar || '(Tức ngày 20 tháng 10 năm Bính Ngọ)';
    const groomMap = groomVenue.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(groomLocation + ', ' + groomAddress)}`;

    const details = {
      groom: {
        names: coupleNames,
        side: 'Nhà trai',
        date: groomDateIso,
        dateLabel: groomDateLabel,
        utc: '20261128T040000Z',
        location: `${groomLocation}, ${groomAddress}`,
        uid: 'khanh-linh-le-dung-nha-trai-20261128',
        file: 'khanh-linh-le-dung-nha-trai.ics',
        description: `Tiệc cưới nhà trai: tới dự bữa cơm thân mật chung vui mừng hạnh phúc cùng gia đình chúng tôi. ${groomLunar}.`,
        sample: false
      },
      bride: {
        names: coupleNames,
        side: 'Nhà gái',
        date: brideDateIso,
        dateLabel: brideDateLabel,
        utc: '20261127T040000Z',
        location: `${brideLocation}, ${brideAddress}`,
        uid: 'khanh-linh-le-dung-nha-gai-20261127',
        file: 'khanh-linh-le-dung-nha-gai.ics',
        description: `Tiệc cưới nhà gái: tới dự bữa cơm thân mật chung vui mừng hạnh phúc cùng gia đình chúng tôi. ${brideLunar}.`,
        sample: false
      }
    };

    // Timeline items
    let brideTimeline = `<div><span class="timeline-icon">♡</span><time datetime="${brideDateIso}">11:00 · 27.11.2026</time><h4>Tiệc mừng hạnh phúc</h4><p>Trân trọng kính mời bạn tới dự bữa cơm thân mật chung vui cùng hai gia đình tại ${brideLocation}.</p></div>`;
    let groomTimeline = `<div><span class="timeline-icon">♡</span><time datetime="${groomDateIso}">11:00 · 28.11.2026</time><h4>Tiệc mừng hạnh phúc</h4><p>Trân trọng kính mời bạn tới dự bữa cơm thân mật chung vui cùng hai gia đình tại ${groomLocation}.</p></div>`;

    if (db.schedule && Array.isArray(db.schedule.events) && db.schedule.events.length > 0) {
      const icons = ['✧', '♡', '♧', '✳', '❖', '★'];
      const customTimeline = db.schedule.events.map((ev, i) => {
        return `<div><span class="timeline-icon">${icons[i % icons.length]}</span><time>${ev.time || ''}</time><h4>${ev.title || ''}</h4><p>${ev.desc || ''}</p></div>`;
      }).join('');
      if (customTimeline) {
        brideTimeline = customTimeline;
        groomTimeline = customTimeline;
      }
    }

    const replacements = {
      '.entry-names': coupleNamesHtml,
      '.entry-photo-date': '27 . 11 . 2026',
      '.monogram': `${monogramText}<i>27.11.26</i>`,
      '.invitation-seal': monogramText,
      '.invitation-eyebrow': 'TRÂN TRỌNG KÍNH MỜI',
      '.invitation-intro': 'TỚI DỰ BỮA CƠM THÂN MẬT CHUNG VUI<br>MỪNG HẠNH PHÚC CÙNG GIA ĐÌNH CHÚNG TÔI',
      '#hero-title': coupleNamesHtml,
      '.invite-date': '<span>THỨ SÁU</span><strong>27.11</strong><span>NĂM 2026</span>',
      '.invite-location': `<strong>TẠI: ${brideLocation.toUpperCase()}</strong><br><span>${brideAddress}</span>`,
      '.invite-message': 'Rất hân hạnh được đón tiếp!',
      '.invitation-demo': 'ẢNH MINH HỌA · THÔNG TIN THEO THIỆP NHÀ GÁI',
      '.cover-caption>span:last-child': '27.11.2026 &nbsp; / &nbsp; HÀ NỘI',
      '.photo-date-badge b': '27 · 11',
      '.interlude-copy>span': `${coupleNames} · 27.11.2026`,
      '.celebration-venue>.eyebrow': 'BỮA CƠM THÂN MẬT MỪNG HẠNH PHÚC',
      '.celebration-venue h3': brideLocation,
      '.celebration-venue>p:not(.eyebrow):not(.venue-note)': `11:00 · Thứ Sáu, 27 tháng 11 năm 2026<br>${brideAddress}`,
      '.venue-note': brideLunar,
      '.celebration-venue .text-link': 'Xem đường đi <span>↗</span>',
      '#event-timeline': brideTimeline,
      '#event-faq details:first-child p': `Bữa cơm thân mật bắt đầu lúc 11:00, Thứ Sáu ngày 27/11/2026, tại ${brideLocation}, ${brideAddress}.`,
      '#event-dresscode p': 'Bạn có thể chọn trang phục thanh lịch và thoải mái. Các tông màu bên cạnh là gợi ý cho khách mời.',
      '.rsvp-deadline': 'RẤT HÂN HẠNH ĐƯỢC ĐÓN TIẾP!',
      '.footer-names': coupleNamesHtml,
      '.footer-demo': `THIỆP NHÀ GÁI · ${coupleNames.toUpperCase()} · 27.11.2026 · ẢNH MINH HỌA`,
      '.entry-demo': `${coupleNames.toUpperCase()} · THIỆP NHÀ GÁI · ẢNH MINH HỌA`
    };

    const groomChanges = {
      '.entry-photo-date': '28 . 11 . 2026',
      '.monogram': `${monogramText}<i>28.11.26</i>`,
      '.invite-date': '<span>THỨ BẢY</span><strong>28.11</strong><span>NĂM 2026</span>',
      '.invite-location': `<strong>TẠI: ${groomLocation.toUpperCase()}</strong><br><span>${groomAddress}</span>`,
      '.invite-lunar': groomLunar,
      '.invitation-demo': 'ẢNH MINH HỌA · THÔNG TIN THEO THIỆP NHÀ TRAI',
      '.cover-caption>span:last-child': '28.11.2026 &nbsp; / &nbsp; BẮC GIANG',
      '.photo-date-badge b': '28 · 11',
      '.interlude-copy>span': `${coupleNames} · 28.11.2026`,
      '.celebration-venue h3': groomLocation,
      '.celebration-venue>p:not(.eyebrow):not(.venue-note)': `11:00 · Thứ Bảy, 28 tháng 11 năm 2026<br>${groomAddress}`,
      '.venue-note': groomLunar,
      '#event-timeline': groomTimeline,
      '#event-faq details:first-child p': `Bữa cơm thân mật bắt đầu lúc 11:00, Thứ Bảy ngày 28/11/2026, tại ${groomLocation}, ${groomAddress}.`,
      '.footer-demo': `THIỆP NHÀ TRAI · ${coupleNames.toUpperCase()} · 28.11.2026 · ẢNH MINH HỌA`,
      '.entry-demo': `${coupleNames.toUpperCase()} · THIỆP NHÀ TRAI · ẢNH MINH HỌA`
    };

    const brideFamily = `<div><h3>Nhà Gái</h3><p>${brideParents}</p><span>Cô dâu: ${brideName}</span></div>`;
    const groomFamily = `<div><h3>Nhà Trai</h3><p>${groomParents}</p><span>Chú rể: ${groomName}</span></div>`;

    return { details, replacements, groomChanges, brideFamily, groomFamily, brideMap, groomMap };
  }

  function apply(family) {
    const configData = buildConfig();
    const bride = family === 'bride';
    const config = configData.details[bride ? 'bride' : 'groom'];
    const content = {
      ...configData.replacements,
      '.invite-lunar': '(Tức ngày 19 tháng 10 năm Bính Ngọ)',
      ...(bride ? {} : configData.groomChanges),
      '.invitation-families': bride ? configData.brideFamily + configData.groomFamily : configData.groomFamily + configData.brideFamily
    };
    Object.entries(content).forEach(([selector, html]) => {
      document.querySelectorAll(selector).forEach(node => node.innerHTML = html);
    });
    document.querySelectorAll('[data-bride-only]').forEach(node => node.hidden = false);
    document.body.classList.add('formal-invitation');
    document.title = config.names + ' — Thiệp mời ' + config.side + ' · ' + config.dateLabel;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.content = 'Trân trọng kính mời dự tiệc cưới ' + config.names + ', 11:00 ngày ' + config.dateLabel + ' tại ' + config.location + '.';
    }
    const monogram = document.querySelector('.monogram');
    if (monogram) monogram.setAttribute('aria-label', `${config.names} — Trang đầu`);
    const homeSec = document.getElementById('home');
    if (homeSec) homeSec.setAttribute('aria-label', `Thiệp mời ${config.side.toLowerCase()} — ${config.names}`);
    const mapLink = document.querySelector('.celebration-venue .text-link');
    if (mapLink) {
      mapLink.href = bride ? configData.brideMap : configData.groomMap;
    }
  }

  window.WeddingInvitation = {
    get: () => {
      const configData = buildConfig();
      return configData.details[document.body.dataset.weddingFamily] || configData.details.groom;
    }
  };

  window.addEventListener('wedding:sidechange', event => apply(event.detail.family));

  function initUI() {
    const groom = (getDB().couple && getDB().couple.groomName) || 'Lê Dũng';
    const bride = (getDB().couple && getDB().couple.brideName) || 'Khánh Linh';
    const coupleNamesHtml = `<span>${bride}</span><em>&amp;</em><span>${groom}</span>`;

    const entryNames = document.querySelector('.entry-names');
    if (entryNames) entryNames.innerHTML = coupleNamesHtml;
    const entryDate = document.querySelector('.entry-photo-date');
    if (entryDate) entryDate.textContent = '27 & 28 . 11 . 2026';
    const entryDemo = document.querySelector('.entry-demo');
    if (entryDemo) entryDemo.textContent = `${bride.toUpperCase()} & ${groom.toUpperCase()} · ẢNH MINH HỌA`;

    document.body.classList.add('formal-invitation');

    const currentFamily = document.body.dataset.weddingFamily || 'bride';
    apply(currentFamily);
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
