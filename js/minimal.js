/**
 * ============================================================================
 * MINIMALIST EDITORIAL LUXURY WEDDING SCRIPT
 * Inspired by Susie & Jay (wedding.jongjeonglee.com)
 * Dũng & Linh — A journey of love
 * ============================================================================
 */

(function () {
  "use strict";

  // --- STATE ---
  let db = null;
  let currentStage = "intro"; // 'intro' | 'wedding'
  let currentTab = "detail";   // 'detail' | 'timeline' | 'menu'

  // Cinematic 5-Chapter Intro State & Timers
  let currentChapterIndex = 0;
  let chapterTimer = null;
  let isTransitioningToWedding = false;
  let currentBackdropLayer = "A";
  const CHAPTER_DURATIONS = [4200, 4200, 4200, 4200, 6800];
  let allPhotosReel = [];

  // Album Modal State
  let albumIndex = 0;
  let albumList = [];

  // Audio State
  let isAudioPlaying = false;
  let currentAudioIndex = 0;

  // DOM Elements Cache
  const appRoot = document.getElementById("appRoot");
  const stageIntro = document.getElementById("stageIntro");
  const stageWedding = document.getElementById("stageWedding");

  // Cinematic Intro Elements
  const introStoryBars = document.getElementById("introStoryBars");
  const introBackdropA = document.getElementById("introBackdropA");
  const introBackdropB = document.getElementById("introBackdropB");
  const introCurtainTransition = document.getElementById("introCurtainTransition");
  const introAudioHint = document.getElementById("introAudioHint");
  const btnIntroSkip = document.getElementById("btnIntroSkip");
  const btnExploreWedding = document.getElementById("btnExploreWedding");
  const introTouchLeft = document.getElementById("introTouchLeft");
  const introTouchRight = document.getElementById("introTouchRight");

  const scene1 = document.getElementById("scene1");
  const scene2 = document.getElementById("scene2");
  const scene3 = document.getElementById("scene3");
  const scene4 = document.getElementById("scene4");
  const scene5 = document.getElementById("scene5");
  const scenes = [scene1, scene2, scene3, scene4, scene5];

  const affirmationCoupleTitle = document.getElementById("affirmationCoupleTitle");
  const affirmationDateBadge = document.getElementById("affirmationDateBadge");

  // Dock Elements
  const btnDockIntro = document.getElementById("btnDockIntro");
  const btnDockWedding = document.getElementById("btnDockWedding");
  const dockTrackIndicator = document.getElementById("dockTrackIndicator");
  const btnAudioToggle = document.getElementById("btnAudioToggle");
  const btnOpenAlbum = document.getElementById("btnOpenAlbum");
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  const audioToast = document.getElementById("audioToast");
  const audioToastText = document.getElementById("audioToastText");
  const weddingAudio = document.getElementById("weddingAudio");

  // Wedding Sub-tabs Elements
  const tabBtnDetail = document.getElementById("tabBtnDetail");
  const tabBtnTimeline = document.getElementById("tabBtnTimeline");
  const tabBtnMenu = document.getElementById("tabBtnMenu");
  const subTabSlider = document.getElementById("subTabSlider");
  const viewDetail = document.getElementById("viewDetail");
  const viewTimeline = document.getElementById("viewTimeline");
  const viewMenu = document.getElementById("viewMenu");

  // Album Modal Elements
  const albumModal = document.getElementById("albumModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const btnModalClose = document.getElementById("btnModalClose");
  const btnModalPrev = document.getElementById("btnModalPrev");
  const btnModalNext = document.getElementById("btnModalNext");
  const modalCurrentImg = document.getElementById("modalCurrentImg");
  const modalCounter = document.getElementById("modalCounter");
  const modalThumbnailTrack = document.getElementById("modalThumbnailTrack");

  // --------------------------------------------------------------------------
  // 1. INITIALIZATION & DATA BINDING
  // --------------------------------------------------------------------------
  async function init() {
    // 0. Khóa cuộn trang 100% trong suốt quá trình chiếu Intro (không sinh thanh cuộn)
    document.documentElement.classList.add("intro-locked");
    document.body.classList.add("intro-locked");

    // 1. Load Data
    if (typeof window.fetchWeddingDBFromServer === "function") {
      try {
        db = await window.fetchWeddingDBFromServer();
      } catch (e) {
        db = window.WEDDING_DB || window.DEFAULT_WEDDING_DB;
      }
    } else {
      db = window.WEDDING_DB || window.DEFAULT_WEDDING_DB;
    }

    // 2. Setup Saved Theme
    initTheme();

    // 3. Prepare All Photos & Preload for Zero-Lag Rapid Cuts
    setupAllPhotos();

    // 4. Bind Wedding Content
    renderWeddingContent();

    // 5. Start Countdown
    startCountdown();

    // 6. Setup Audio
    setupAudio();

    // 7. Setup Event Listeners
    setupEventListeners();

    // 8. Start Cinematic Marvel-Style Poetic Montage Intro
    startCinematicIntro();

    // 9. Align SubTab Slider
    setTimeout(updateSubTabSlider, 100);

    // 10. Listen for Live DB updates from Admin
    if (window.WEDDING_LIVE_CHANNEL) {
      window.WEDDING_LIVE_CHANNEL.addEventListener("message", function (ev) {
        if (ev.data && (ev.data.type === "DB_UPDATED" || ev.data.type === "STATE_CHANGED")) {
          if (typeof window.fetchWeddingDBFromServer === "function") {
            window.fetchWeddingDBFromServer().then(function (updated) {
              db = updated;
              setupAllPhotos();
              renderWeddingContent();
            });
          }
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. THEME MANAGEMENT (LIGHT / DARK)
  // --------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem("minimal_wedding_theme") || "light";
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("minimal_wedding_theme", theme);

    const iconMoon = btnThemeToggle.querySelector(".icon-moon");
    const iconSun = btnThemeToggle.querySelector(".icon-sun");

    if (theme === "dark") {
      if (iconMoon) iconMoon.style.display = "none";
      if (iconSun) iconSun.style.display = "block";
    } else {
      if (iconMoon) iconMoon.style.display = "block";
      if (iconSun) iconSun.style.display = "none";
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  // --------------------------------------------------------------------------
  // 3. STAGE MANAGEMENT (INTRO <-> WEDDING)
  // --------------------------------------------------------------------------
  function switchStage(stage) {
    if (stage === currentStage) return;
    currentStage = stage;

    if (stage === "intro") {
      // Khóa cuộn màn hình khi ở Intro (100% không sinh thanh cuộn)
      document.documentElement.classList.add("intro-locked");
      document.body.classList.add("intro-locked");

      appRoot.classList.remove("stage-wedding-active");
      appRoot.classList.add("stage-intro-active");
      btnDockIntro.classList.add("active");
      btnDockWedding.classList.remove("active");
      dockTrackIndicator.style.left = "0%";

      // Khởi chạy lại 5 chương thơ Intro từ đầu
      startCinematicIntro();
    } else {
      // Mở khóa cuộn trang khi vào Thiệp Cưới
      document.documentElement.classList.remove("intro-locked");
      document.body.classList.remove("intro-locked");

      clearTimeout(chapterTimer);

      appRoot.classList.remove("stage-intro-active");
      appRoot.classList.add("stage-wedding-active");
      btnDockIntro.classList.remove("active");
      btnDockWedding.classList.add("active");
      dockTrackIndicator.style.left = "100%";

      if (introAudioHint) {
        introAudioHint.classList.add("hidden");
      }

      // Canh chỉnh thanh gạch dưới sub-tabs
      setTimeout(updateSubTabSlider, 60);

      // Cuộn lên đầu trang thiệp cưới
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  // --------------------------------------------------------------------------
  // 4. CINEMATIC 5-CHAPTER POETIC INTRO ENGINE
  // --------------------------------------------------------------------------
  function setupAllPhotos() {
    allPhotosReel = [];
    const addPhoto = (src) => {
      if (src && typeof src === "string" && !allPhotosReel.includes(src)) {
        allPhotosReel.push(src);
      }
    };

    if (db) {
      if (Array.isArray(db.introPhotos)) db.introPhotos.forEach(addPhoto);
      if (db.couple && Array.isArray(db.couple.heroBackdrops)) db.couple.heroBackdrops.forEach(addPhoto);
      if (Array.isArray(db.albumPhotos)) db.albumPhotos.forEach(addPhoto);
      if (db.couple && db.couple.heroBackdrop) addPhoto(db.couple.heroBackdrop);
      if (db.couple && db.couple.detailsBackdrop) addPhoto(db.couple.detailsBackdrop);
      if (db.couple && db.couple.leftFramePhoto) addPhoto(db.couple.leftFramePhoto);
      if (db.couple && db.couple.rightFramePhoto) addPhoto(db.couple.rightFramePhoto);
    }

    const fallbacks = [
      "img/08-trang-an-hero.jpg",
      "img/06-shanghai-dem.jpg",
      "img/03-disney-cau-hon.jpg",
      "img/wedding-photo-card-left.jpg",
      "img/wedding-photo-card-right.jpg",
      "img/02-disney-phao-hoa.jpg",
      "img/07-trang-an-b.jpg",
      "img/01-trang-an-a.jpg",
      "img/04-shanghai-mua.jpg",
      "img/09-wuzhen-moi.jpg",
      "img/05-wuzhen-ma.jpg"
    ];
    fallbacks.forEach(addPhoto);

    // Preload in background
    allPhotosReel.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  function getChapterPhoto(index) {
    if (db && Array.isArray(db.introPhotos) && db.introPhotos[index]) {
      return db.introPhotos[index];
    }
    const curated = [
      "img/08-trang-an-hero.jpg",         // Chương I: Gặp Gỡ
      "img/06-shanghai-dem.jpg",          // Chương II: Đồng Hành
      "img/03-disney-cau-hon.jpg",         // Chương III: Lời Hứa
      "img/wedding-photo-card-left.jpg",  // Chương IV: Gắn Kết
      "img/wedding-photo-card-right.jpg"  // Chương V: Lời Khẳng Định
    ];
    return curated[index % curated.length];
  }

  function updateStoryBars(activeIdx, durationMs) {
    const segs = document.querySelectorAll(".intro-story-seg");
    segs.forEach((seg, i) => {
      const fill = seg.querySelector(".intro-story-seg-fill");
      if (!fill) return;

      if (i < activeIdx) {
        seg.classList.add("completed");
        fill.style.transition = "none";
        fill.style.width = "100%";
      } else if (i === activeIdx) {
        seg.classList.remove("completed");
        fill.style.transition = "none";
        fill.style.width = "0%";
        // Trigger reflow to restart CSS animation cleanly
        void fill.offsetWidth;
        fill.style.transition = `width ${durationMs}ms linear`;
        fill.style.width = "100%";
      } else {
        seg.classList.remove("completed");
        fill.style.transition = "none";
        fill.style.width = "0%";
      }
    });
  }

  function playPoemChapter(chapterIdx) {
    if (chapterIdx < 0) chapterIdx = 0;
    if (chapterIdx >= 5) {
      transitionToWedding();
      return;
    }

    clearTimeout(chapterTimer);
    currentChapterIndex = chapterIdx;

    // 1. Cập nhật Story Progress Bars phong cách Vogue / Instagram Stories
    const duration = CHAPTER_DURATIONS[chapterIdx] || 4200;
    updateStoryBars(chapterIdx, duration);

    // 2. Chuyển đổi mượt mà giữa 2 lớp ảnh nền (Backdrop Layer A <-> B Dissolve)
    const photoUrl = getChapterPhoto(chapterIdx);
    if (currentBackdropLayer === "A") {
      if (introBackdropB) {
        introBackdropB.style.backgroundImage = `url("${photoUrl}")`;
        introBackdropB.classList.add("active");
      }
      if (introBackdropA) {
        introBackdropA.classList.remove("active");
      }
      currentBackdropLayer = "B";
    } else {
      if (introBackdropA) {
        introBackdropA.style.backgroundImage = `url("${photoUrl}")`;
        introBackdropA.classList.add("active");
      }
      if (introBackdropB) {
        introBackdropB.classList.remove("active");
      }
      currentBackdropLayer = "A";
    }

    // 3. Chuyển cảnh câu thơ với hiệu ứng Blur-Fade & Soft Drift
    scenes.forEach((scene, sIdx) => {
      if (!scene) return;
      if (sIdx === chapterIdx) {
        scene.classList.remove("exiting");
        scene.classList.add("active");
      } else if (scene.classList.contains("active")) {
        scene.classList.remove("active");
        scene.classList.add("exiting");
        setTimeout(() => {
          scene.classList.remove("exiting");
        }, 850);
      } else {
        scene.classList.remove("active");
        scene.classList.remove("exiting");
      }
    });

    // 4. Hẹn giờ tự động chuyển câu tiếp theo
    chapterTimer = setTimeout(() => {
      if (currentStage === "intro") {
        playPoemChapter(chapterIdx + 1);
      }
    }, duration);
  }

  function startCinematicIntro() {
    clearTimeout(chapterTimer);
    if (allPhotosReel.length === 0) setupAllPhotos();

    // Reset backdrop classes
    if (introBackdropA) {
      introBackdropA.className = "intro-backdrop-layer layer-a";
      introBackdropA.classList.remove("active");
    }
    if (introBackdropB) {
      introBackdropB.className = "intro-backdrop-layer layer-b";
      introBackdropB.classList.remove("active");
    }
    currentBackdropLayer = "B"; // Để lần đầu chuyển sang A

    // Bắt đầu từ Chương I
    playPoemChapter(0);
  }

  function nextChapter() {
    if (currentChapterIndex < 4) {
      playPoemChapter(currentChapterIndex + 1);
    } else {
      transitionToWedding();
    }
  }

  function prevChapter() {
    if (currentChapterIndex > 0) {
      playPoemChapter(currentChapterIndex - 1);
    } else {
      playPoemChapter(0);
    }
  }

  function transitionToWedding() {
    if (isTransitioningToWedding) return;
    isTransitioningToWedding = true;
    clearTimeout(chapterTimer);

    // Kéo màn chuyển tiếp điện ảnh nhẹ nhàng (Curtain wipe / dissolve)
    if (introCurtainTransition) {
      introCurtainTransition.classList.add("active");
    }

    setTimeout(() => {
      switchStage("wedding");
      setTimeout(() => {
        if (introCurtainTransition) {
          introCurtainTransition.classList.remove("active");
        }
        isTransitioningToWedding = false;
      }, 400);
    }, 550);
  }

  // --------------------------------------------------------------------------
  // 5. WEDDING SUB-TABS (DETAIL | TIMELINE | MENU)
  // --------------------------------------------------------------------------
  function switchTab(tabKey) {
    if (tabKey === currentTab) return;
    currentTab = tabKey;

    const tabs = [
      { key: "detail", btn: tabBtnDetail, view: viewDetail },
      { key: "timeline", btn: tabBtnTimeline, view: viewTimeline },
      { key: "menu", btn: tabBtnMenu, view: viewMenu }
    ];

    tabs.forEach((t) => {
      if (t.key === tabKey) {
        t.btn.classList.add("active");
        t.view.classList.add("active");
      } else {
        t.btn.classList.remove("active");
        t.view.classList.remove("active");
      }
    });

    updateSubTabSlider();
  }

  function updateSubTabSlider() {
    const activeBtn = document.querySelector(".sub-tab-item.active");
    if (!activeBtn || !subTabSlider) return;

    const parentRect = activeBtn.parentElement.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    const left = btnRect.left - parentRect.left;
    const width = btnRect.width;

    subTabSlider.style.transform = `translateX(${left}px)`;
    subTabSlider.style.width = `${width}px`;
  }

  // --------------------------------------------------------------------------
  // 6. RENDER WEDDING CONTENT FROM DB
  // --------------------------------------------------------------------------
  function renderWeddingContent() {
    if (!db) return;

    // Couple Names
    const groom = (db.couple && db.couple.groomName) || "Dũng";
    const bride = (db.couple && db.couple.brideName) || "Linh";

    const headerGroom = document.getElementById("headerGroom");
    const headerBride = document.getElementById("headerBride");
    if (headerGroom) headerGroom.textContent = groom;
    if (headerBride) headerBride.textContent = bride;

    // Populate Titles in Intro Scenes (Chapter V Affirmation)
    if (affirmationCoupleTitle) {
      affirmationCoupleTitle.innerHTML = `VĂN ${groom.toUpperCase()} <em>&amp;</em> THU ${bride.toUpperCase()}`;
    }
    if (affirmationDateBadge && db.date) {
      const d = db.date;
      affirmationDateBadge.textContent = `${d.dayOfWeek || "CHỦ NHẬT"} • ${d.dayNumber || "07"} THÁNG ${d.monthLabel ? d.monthLabel.replace("THÁNG ", "") : "12"} NĂM ${d.yearLabel || "2026"}`;
    }

    // Detail Calendar Date Header & Lunar Date
    const detailCalendarDate = document.getElementById("detailCalendarDate");
    const detailLunarDate = document.getElementById("detailLunarDate");
    if (detailCalendarDate) {
      detailCalendarDate.textContent = "DECEMBER 7TH 2026";
    }
    if (detailLunarDate && db.date) {
      detailLunarDate.textContent = db.date.lunarDate || "(Nhằm ngày 29 tháng 10 năm Bính Ngọ)";
    }

    // Detail Signature Quote
    const detailSignature = document.getElementById("detailSignature");
    const quote = (db.couple && db.couple.signatureQuote) || "“Một hành trình mới • Trọn vẹn yêu thương”";
    if (detailSignature) detailSignature.textContent = quote;

    // Venues: Nhà Trai & Nhà Gái
    if (db.venues) {
      // Groom
      if (db.venues.groom) {
        const g = db.venues.groom;
        setText("groomBadgeCover", g.badgeCover || "❖ HÔN LỄ NHÀ TRAI");
        setText("groomNameFull", g.nameFull || g.nameShort || "Trống Đồng Palace");
        setText("groomTimeCover", g.timeCover || "11:00 Trưa • 07.12.2026");
        setText("groomParents", g.parents ? `Trân trọng kính báo: ${g.parents}` : "");
        setText("groomAddress", g.address || "Số 65 Quán Sứ / Cầu Giấy, TP. Hà Nội");
        setText("groomHexText", "TRỐNG ĐỒNG");

        const groomIframe = document.getElementById("groomMapIframe");
        if (groomIframe && g.mapEmbed) groomIframe.src = g.mapEmbed;

        const groomMapDirect = document.getElementById("groomMapDirect");
        if (groomMapDirect && g.mapLink) groomMapDirect.href = g.mapLink;
      }

      // Bride
      if (db.venues.bride) {
        const b = db.venues.bride;
        setText("brideBadgeCover", b.badgeCover || "❖ VU QUY NHÀ GÁI");
        setText("brideNameFull", b.nameFull || b.nameShort || "White Palace");
        setText("brideTimeCover", b.timeCover || "18:00 Tối • 07.12.2026");
        setText("brideParents", b.parents ? `Trân trọng kính báo: ${b.parents}` : "");
        setText("brideAddress", b.address || "194 Hoàng Văn Thụ, Phường 9, Q. Phú Nhuận, TP. HCM");
        setText("brideHexText", "WHITE PALACE");

        const brideIframe = document.getElementById("brideMapIframe");
        if (brideIframe && b.mapEmbed) brideIframe.src = b.mapEmbed;

        const brideMapDirect = document.getElementById("brideMapDirect");
        if (brideMapDirect && b.mapLink) brideMapDirect.href = b.mapLink;
      }
    }

    // Timeline Events
    renderTimeline();

    // Menu Courses
    renderMenu();

    // Album Photos for Modal
    albumList = Array.isArray(db.albumPhotos) && db.albumPhotos.length > 0 ? db.albumPhotos : [
      "img/wedding-photo-card-left.jpg",
      "img/wedding-photo-card-right.jpg",
      "img/02-disney-phao-hoa.jpg",
      "img/03-disney-cau-hon.jpg",
      "img/08-trang-an-hero.jpg",
      "img/07-trang-an-b.jpg",
      "img/01-trang-an-a.jpg"
    ];
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // --------------------------------------------------------------------------
  // 7. RENDER TIMELINE
  // --------------------------------------------------------------------------
  function renderTimeline() {
    const container = document.getElementById("timelineContainer");
    if (!container) return;

    const events = (db.schedule && Array.isArray(db.schedule.events)) ? db.schedule.events : [
      { time: "07:30", title: "Lễ Ăn Hỏi & Nghi Thức Rước Dâu", desc: "Họ nhà trai trao tráp sính lễ và đón dâu trang trọng tại tư gia nhà gái." },
      { time: "09:30", title: "Lễ Thành Hôn Gia Tiên (Nhà Trai)", desc: "Nghi lễ dâng hương tổ tiên, trao nhẫn cưới và nhận lời chúc phúc hai họ." },
      { time: "11:00", title: "Đón Khách & Chụp Hình (Tiệc Nhà Trai)", desc: "Chào đón quý khách tại sảnh Trống Đồng Palace — Cầu Giấy, Hà Nội.", highlight: true },
      { time: "11:30", title: "Khai Tiệc Mừng Hôn Lễ Nhà Trai", desc: "Nghi thức cắt bánh, rót rượu Champagne mừng hạnh phúc và dùng tiệc trưa.", highlight: true },
      { time: "17:30", title: "Đón Khách & Chụp Hình (Tiệc Nhà Gái)", desc: "Chào đón quý khách tại sảnh White Palace — Phú Nhuận, TP. HCM.", highlight: true },
      { time: "18:30", title: "Khai Tiệc Mừng Vu Quy Nhà Gái", desc: "Cùng nâng ly chúc phúc trăm năm và thưởng thức bữa tiệc tối ấm cúng.", highlight: true }
    ];

    container.innerHTML = events.map((ev) => `
      <div class="timeline-event-item ${ev.highlight ? "highlight" : ""}">
        <div class="timeline-time-col">${ev.time || ""}</div>
        <div class="timeline-node-dot"></div>
        <div class="timeline-content-col">
          <h4 class="timeline-event-title">${ev.title || ""}</h4>
          <p class="timeline-event-desc">${ev.desc || ""}</p>
        </div>
      </div>
    `).join("");
  }

  // --------------------------------------------------------------------------
  // 8. RENDER MENU
  // --------------------------------------------------------------------------
  function renderMenu() {
    const container = document.getElementById("menuContainer");
    if (!container) return;

    const courses = (db.menu && Array.isArray(db.menu.courses)) ? db.menu.courses : [
      { name: "Khai Vị Tam Hợp Hoàng Kim", tag: "Khai Vị", desc: "Súp Bào Ngư Vi Cá • Gỏi Ngó Sen Tôm Thịt • Chả Giò Hải Sản" },
      { name: "Tôm Hùm Bỏ Lò Phô Mai Pháp", tag: "Hải Sản", desc: "Tôm hùm tươi đút lò béo ngậy dùng kèm bánh mì bơ tỏi" },
      { name: "Bò Mỹ Áp Chảo Sốt Nấm Truffle", tag: "Món Chính", desc: "Thăn ngoại bò Mỹ mềm mọng dùng kèm măng tây & khoai nghiền" },
      { name: "Cá Song Hấp Xì Dầu Hồng Kông", tag: "Món Chính", desc: "Cá song biển tươi hấp gừng hành & nước tương thượng hạng" },
      { name: "Gà Đông Tảo Hầm Hạt Sen & Táo Đỏ", tag: "Món Tần", desc: "Món tần bổ dưỡng thanh ngọt hầm cùng nấm hương rừng" },
      { name: "Lẩu Thái Hải Sản & Cơm Chiên", tag: "Món Nóng", desc: "Cơm chiên Dương Châu dùng kèm lẩu hải sản & rau nấm theo mùa" },
      { name: "Chè Hạt Sen Long Nhãn & Đồ Uống", tag: "Tráng Miệng", desc: "Trái cây nhiệt đới • Rượu Vang Đỏ, Bia tươi & Nước ngọt suốt tiệc" }
    ];

    container.innerHTML = courses.map((item, idx) => {
      const numStr = (idx + 1) < 10 ? `0${idx + 1}` : `${idx + 1}`;
      return `
        <article class="menu-course-item">
          <div class="menu-course-left">
            <div class="menu-course-tag">${item.tag || "Món Ngon"}</div>
            <h4 class="menu-course-name">${item.name || ""}</h4>
            <p class="menu-course-desc">${item.desc || ""}</p>
          </div>
          <div class="menu-course-num">${numStr}</div>
        </article>
      `;
    }).join("");
  }

  // --------------------------------------------------------------------------
  // 9. REAL-TIME COUNTDOWN
  // --------------------------------------------------------------------------
  function startCountdown() {
    const cdDays = document.getElementById("cdDays");
    const cdHours = document.getElementById("cdHours");
    const cdMins = document.getElementById("cdMins");
    const cdSecs = document.getElementById("cdSecs");

    function update() {
      const targetTime = db && db.date && db.date.isoTarget
        ? new Date(db.date.isoTarget).getTime()
        : new Date("2026-12-07T11:00:00+07:00").getTime();

      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      if (cdDays) cdDays.textContent = String(days).padStart(2, "0");
      if (cdHours) cdHours.textContent = String(hours).padStart(2, "0");
      if (cdMins) cdMins.textContent = String(mins).padStart(2, "0");
      if (cdSecs) cdSecs.textContent = String(secs).padStart(2, "0");
    }

    update();
    setInterval(update, 1000);
  }

  // --------------------------------------------------------------------------
  // 10. BACKGROUND AUDIO PLAYER
  // --------------------------------------------------------------------------
  function setupAudio() {
    const playlist = (db && Array.isArray(db.music) && db.music.length > 0)
      ? db.music
      : [{ title: "Giai Điệu Tình Yêu", src: "https://assets.mixkit.co/music/preview/mixkit-romantic-wedding-love-643.mp3" }];

    currentAudioIndex = 0;
    const song = playlist[currentAudioIndex];
    weddingAudio.src = song.src;

    // User gesture activates audio playback
    const triggerAutoplay = function () {
      if (!isAudioPlaying) {
        weddingAudio.play().then(() => {
          isAudioPlaying = true;
          btnAudioToggle.classList.add("playing");
          if (introAudioHint) introAudioHint.classList.add("hidden");
        }).catch(() => {});
      }
      document.removeEventListener("click", triggerAutoplay);
      document.removeEventListener("touchstart", triggerAutoplay);
    };

    document.addEventListener("click", triggerAutoplay, { once: true });
    document.addEventListener("touchstart", triggerAutoplay, { once: true });
  }

  function toggleAudio() {
    if (weddingAudio.paused) {
      weddingAudio.play().then(() => {
        isAudioPlaying = true;
        btnAudioToggle.classList.add("playing");
        const playlist = db && db.music ? db.music : [];
        const title = playlist[currentAudioIndex] ? playlist[currentAudioIndex].title : "Giai Điệu Tình Yêu";
        showAudioToast(`Đang phát: ${title}`);
        if (introAudioHint) introAudioHint.classList.add("hidden");
      }).catch(() => {});
    } else {
      weddingAudio.pause();
      isAudioPlaying = false;
      btnAudioToggle.classList.remove("playing");
      showAudioToast("Đã dừng nhạc");
    }
  }

  let toastTimeout = null;
  function showAudioToast(text) {
    if (!audioToast || !audioToastText) return;
    audioToastText.textContent = text;
    audioToast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      audioToast.classList.remove("show");
    }, 2800);
  }

  // --------------------------------------------------------------------------
  // 11. ALBUM PHOTO MODAL
  // --------------------------------------------------------------------------
  function openAlbumModal(initialIndex) {
    albumIndex = typeof initialIndex === "number" ? initialIndex : 0;
    renderAlbumModal();
    albumModal.classList.add("active");
    albumModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeAlbumModal() {
    albumModal.classList.remove("active");
    albumModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function renderAlbumModal() {
    if (!albumList || albumList.length === 0) return;

    // Active image
    const src = albumList[albumIndex];
    modalCurrentImg.classList.remove("loaded");
    modalCurrentImg.src = src;
    modalCurrentImg.onload = () => {
      modalCurrentImg.classList.add("loaded");
    };

    // Counter
    const curStr = (albumIndex + 1) < 10 ? `0${albumIndex + 1}` : `${albumIndex + 1}`;
    const totStr = albumList.length < 10 ? `0${albumList.length}` : `${albumList.length}`;
    modalCounter.textContent = `${curStr} / ${totStr}`;

    // Render Thumbnails
    modalThumbnailTrack.innerHTML = albumList.map((item, idx) => `
      <div class="album-thumb-item ${idx === albumIndex ? "active" : ""}" data-index="${idx}">
        <img src="${item}" alt="Thumb ${idx + 1}" loading="lazy">
      </div>
    `).join("");

    // Scroll active thumb into view
    const activeThumb = modalThumbnailTrack.querySelector(".album-thumb-item.active");
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  function nextAlbumPhoto() {
    albumIndex = (albumIndex + 1) % albumList.length;
    renderAlbumModal();
  }

  function prevAlbumPhoto() {
    albumIndex = (albumIndex - 1 + albumList.length) % albumList.length;
    renderAlbumModal();
  }

  // --------------------------------------------------------------------------
  // 12. EVENT LISTENERS SETUP
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Dock Stage buttons
    btnDockIntro.addEventListener("click", () => switchStage("intro"));
    btnDockWedding.addEventListener("click", () => switchStage("wedding"));

    // Skip Intro Button
    if (btnIntroSkip) {
      btnIntroSkip.addEventListener("click", (e) => {
        e.stopPropagation();
        transitionToWedding();
      });
    }

    // Explore Wedding CTA in Chapter V
    if (btnExploreWedding) {
      btnExploreWedding.addEventListener("click", (e) => {
        e.stopPropagation();
        transitionToWedding();
      });
    }

    // Touch zones for previous / next chapter navigation
    if (introTouchLeft) {
      introTouchLeft.addEventListener("click", (e) => {
        e.stopPropagation();
        prevChapter();
      });
    }

    if (introTouchRight) {
      introTouchRight.addEventListener("click", (e) => {
        e.stopPropagation();
        nextChapter();
      });
    }

    // Tap anywhere on Intro Stage to start audio and dismiss hint
    stageIntro.addEventListener("click", () => {
      if (weddingAudio.paused && !isAudioPlaying) {
        toggleAudio();
      }
      if (introAudioHint) introAudioHint.classList.add("hidden");
    });

    // Sub-tabs Navigation
    tabBtnDetail.addEventListener("click", () => switchTab("detail"));
    tabBtnTimeline.addEventListener("click", () => switchTab("timeline"));
    tabBtnMenu.addEventListener("click", () => switchTab("menu"));

    // Window Resize -> Re-align Tab Slider
    window.addEventListener("resize", updateSubTabSlider);

    // Dock Utility buttons
    btnAudioToggle.addEventListener("click", toggleAudio);
    btnOpenAlbum.addEventListener("click", () => openAlbumModal(0));
    btnThemeToggle.addEventListener("click", toggleTheme);

    // Album Modal Navigation
    btnModalClose.addEventListener("click", closeAlbumModal);
    modalBackdrop.addEventListener("click", closeAlbumModal);
    btnModalPrev.addEventListener("click", prevAlbumPhoto);
    btnModalNext.addEventListener("click", nextAlbumPhoto);

    modalThumbnailTrack.addEventListener("click", (e) => {
      const item = e.target.closest(".album-thumb-item");
      if (item && item.dataset.index) {
        albumIndex = parseInt(item.dataset.index, 10);
        renderAlbumModal();
      }
    });

    // Keyboard Navigation
    document.addEventListener("keydown", (e) => {
      if (albumModal.classList.contains("active")) {
        if (e.key === "Escape") closeAlbumModal();
        if (e.key === "ArrowLeft") prevAlbumPhoto();
        if (e.key === "ArrowRight") nextAlbumPhoto();
      } else if (currentStage === "intro") {
        if (e.key === "Escape" || e.key === "ArrowDown") {
          transitionToWedding();
        } else if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
          nextChapter();
        } else if (e.key === "ArrowLeft") {
          prevChapter();
        }
      }
    });

    // Touch Swipe Gestures on Mobile for Modal
    let touchStartX = 0;

    albumModal.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    albumModal.addEventListener("touchend", (e) => {
      const diffX = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) nextAlbumPhoto();
        else prevAlbumPhoto();
      }
    }, { passive: true });
  }

  // DOM Content Loaded Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
