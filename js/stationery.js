/**
 * ============================================================================
 * CINEMATIC EDITORIAL WEDDING ENGINE — DŨNG & LINH
 * ============================================================================
 * 1. Kết nối trực tiếp với WEDDING_DB (js/content.js + data/wedding-db.json):
 *    - Đồng bộ 100% thông tin Dâu Rể, Ngày Giờ, Đếm Ngược, Ảnh Nền, Khung Ảnh
 *    - Đồng bộ Địa điểm & Bản đồ Google Maps 2 nhà (Nhà Trai & Nhà Gái)
 *    - Đồng bộ Thực đơn tiệc cưới (Menu) & Lịch trình hôn lễ (Schedule)
 *    - Album ảnh số lượng lớn (10 -> 100+ ảnh): Không cần đặt tên hay gắn tag,
 *      tự động nhận diện ảnh Đứng / Ngang 100%, chiếu tới ảnh nào nền sau của
 *      tab Album đổi sang ảnh đó ngay lập tức!
 * ============================================================================
 */

(function () {
  "use strict";

  // Tự động làm sạch thanh địa chỉ về đúng domain gốc "/" (bỏ /stationery.html hoặc /index.html)
  try {
    var p = window.location.pathname || "";
    if (p.endsWith("/stationery.html") || p.endsWith("/index.html") || p === "/stationery") {
      window.history.replaceState(null, "", "/" + window.location.search + window.location.hash);
    }
  } catch (e) {}

  var countdownTargetMs = new Date("2026-12-07T11:00:00+07:00").getTime();

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el && text !== undefined && text !== null) {
      el.textContent = text;
    }
  }

  var heroSlideTimer = null;
  var detailsSlideTimer = null;

  function startDualLayerSlideshow(primaryEl, secondaryEl, photoList, intervalMs, setTimerRef) {
    if (!primaryEl) return;
    var list = Array.isArray(photoList) ? photoList.filter(Boolean) : [];
    if (!list.length) return;

    primaryEl.src = list[0];
    primaryEl.style.opacity = "1";
    if (secondaryEl) {
      secondaryEl.classList.remove("is-visible");
      secondaryEl.style.opacity = "0";
      secondaryEl.src = list[0];
    }

    if (list.length < 2 || !secondaryEl) return;

    var idx = 0;
    var showingSecondary = false;

    var timer = setInterval(function () {
      idx = (idx + 1) % list.length;
      var nextSrc = list[idx];
      var preload = new Image();
      preload.onload = function () {
        if (!showingSecondary) {
          secondaryEl.src = nextSrc;
          secondaryEl.style.opacity = "1";
          secondaryEl.classList.add("is-visible");
          primaryEl.style.opacity = "0";
          primaryEl.classList.remove("is-visible");
          showingSecondary = true;
        } else {
          primaryEl.src = nextSrc;
          primaryEl.style.opacity = "1";
          primaryEl.classList.add("is-visible");
          secondaryEl.style.opacity = "0";
          secondaryEl.classList.remove("is-visible");
          showingSecondary = false;
        }
      };
      preload.src = nextSrc;
    }, intervalMs);

    setTimerRef(timer);
  }

  // ==========================================================================
  // 0. ĐỒNG BỘ DỮ LIỆU TỪ WEDDING_DB LÊN TOÀN BỘ 3 TAB (FULL DATA BINDING)
  // ==========================================================================
  function syncDOMFromWeddingDB() {
    var db = window.WEDDING_DB;
    if (!db) return;

    // --- A. ĐỒNG BỘ TAB 1 (TRANG BÌA MỞ ĐẦU) & SLIDESHOW ẢNH NỀN ĐA ẢNH ---
    if (db.couple) {
      var c = db.couple;
      setText("#tab-hero .couple-calligraphy-name.groom", c.groomName);
      setText("#tab-hero .couple-calligraphy-name.bride", c.brideName);
      setText("#tab-hero .hero-family-eyebrow span:nth-child(2)", c.eyebrow);
      setText("#tab-hero .hero-invitation-subtext", c.invitationText);
      setText("#tab-hero .cover-signature-quote", c.signatureQuote);

      var heroBg = document.getElementById("heroPhoto");
      var heroBgNext = document.getElementById("heroPhotoNext");
      var heroList = Array.isArray(c.heroBackdrops) && c.heroBackdrops.length
        ? c.heroBackdrops
        : (c.heroBackdrop ? [c.heroBackdrop] : []);
      if (heroSlideTimer) clearInterval(heroSlideTimer);
      startDualLayerSlideshow(heroBg, heroBgNext, heroList, 6500, function (t) { heroSlideTimer = t; });

      var detailsBg = document.getElementById("detailsPhoto") || document.querySelector("#tab-details .details-backdrop-img");
      var detailsBgNext = document.getElementById("detailsPhotoNext");
      var detailsList = Array.isArray(c.detailsBackdrops) && c.detailsBackdrops.length
        ? c.detailsBackdrops
        : (c.detailsBackdrop ? [c.detailsBackdrop] : []);
      if (detailsSlideTimer) clearInterval(detailsSlideTimer);
      startDualLayerSlideshow(detailsBg, detailsBgNext, detailsList, 7200, function (t) { detailsSlideTimer = t; });

      var leftImg = document.querySelector("#leftPhotoFrame .frame-canvas-img");
      if (leftImg && c.leftFramePhoto) {
        leftImg.src = c.leftFramePhoto;
      }
      setText("#leftPhotoFrame .frame-brass-plaque span", c.leftFramePlaque);

      var rightImg = document.querySelector("#rightPhotoFrame .frame-canvas-img");
      if (rightImg && c.rightFramePhoto) {
        rightImg.src = c.rightFramePhoto;
      }
      setText("#rightPhotoFrame .frame-brass-plaque span", c.rightFramePlaque);
    }

    // --- B. ĐỒNG BỘ NGÀY GIỜ & ĐẾM NGƯỢC ---
    if (db.date) {
      var d = db.date;
      if (d.isoTarget) {
        var parsedTime = new Date(d.isoTarget).getTime();
        if (!isNaN(parsedTime)) {
          countdownTargetMs = parsedTime;
        }
      }
      setText("#tab-hero .triad-day", d.dayOfWeek);
      setText("#tab-hero .triad-month-top", d.monthLabel);
      setText("#tab-hero .triad-hero-num", d.dayNumber);
      setText("#tab-hero .triad-year-bottom", d.yearLabel);
      setText("#tab-hero .triad-event", d.eventLabel);
      setText("#tab-hero .cover-lunar-date", d.lunarDate);

      var bannerDatePill = document.querySelector("#tab-details .banner-date-pill");
      if (bannerDatePill && (d.shortDatePill || d.shortLunarPill)) {
        bannerDatePill.innerHTML =
          (d.shortDatePill || "") +
          (d.shortLunarPill ? " <span>" + d.shortLunarPill + "</span>" : "");
      }
    }

    // --- C. ĐỒNG BỘ 4 DÒNG CHECKLIST NHỎ TRÊN TAB 1 ---
    if (Array.isArray(db.checklist) && db.checklist.length) {
      var checkPaper = document.querySelector("#tab-hero .mini-checklist-paper");
      if (checkPaper) {
        checkPaper.innerHTML = db.checklist
          .map(function (item) {
            var isDone = item.done !== false;
            return (
              '<div class="mini-check-row ' + (isDone ? "is-done" : "is-pending") + '">' +
                '<span class="mini-box">' + (isDone ? '<span class="mini-tick">&#10003;</span>' : "") + "</span>" +
                '<span class="mini-line">' + (item.text || "") + "</span>" +
              "</div>"
            );
          })
          .join("");
      }
    }

    // --- D. ĐỒNG BỘ ĐỊA ĐIỂM & BẢN ĐỒ 2 NHÀ (TAB 1 & TAB 2) ---
    if (db.venues) {
      var vg = db.venues.groom;
      var vb = db.venues.bride;
      var mapBlocks = document.querySelectorAll("#tab-details .map-station-block");

      if (vg) {
        setText("#tab-hero .pavilion-groom .pavilion-role-badge", vg.badgeCover);
        setText("#tab-hero .pavilion-groom .pavilion-palace-title", vg.nameShort);
        setText("#tab-hero .pavilion-groom .pavilion-address", vg.cityShort);
        setText("#tab-hero .pavilion-groom .pavilion-time", vg.timeCover);

        if (mapBlocks[0]) {
          var b0 = mapBlocks[0];
          var tag0 = b0.querySelector(".map-side-tag");
          var name0 = b0.querySelector(".map-hall-name");
          var par0 = b0.querySelector(".map-parents-line");
          var addr0 = b0.querySelector(".map-hall-addr");
          var link0 = b0.querySelector(".map-direct-link");
          var iframe0 = b0.querySelector("iframe");

          if (tag0 && vg.badgeMap) tag0.textContent = vg.badgeMap;
          if (name0 && vg.nameFull) name0.textContent = vg.nameFull;
          if (par0 && vg.parents !== undefined) {
            par0.innerHTML = vg.parents ? "Song thân: <strong>" + vg.parents + "</strong>" : "";
          }
          if (addr0 && vg.address) {
            addr0.textContent = vg.address.indexOf("📍") === 0 ? vg.address : "📍 " + vg.address;
          }
          if (link0 && vg.mapLink) link0.href = vg.mapLink;
          if (iframe0 && vg.mapEmbed) iframe0.src = vg.mapEmbed;
        }
      }

      if (vb) {
        setText("#tab-hero .pavilion-bride .pavilion-role-badge", vb.badgeCover);
        setText("#tab-hero .pavilion-bride .pavilion-palace-title", vb.nameShort);
        setText("#tab-hero .pavilion-bride .pavilion-address", vb.cityShort);
        setText("#tab-hero .pavilion-bride .pavilion-time", vb.timeCover);

        if (mapBlocks[1]) {
          var b1 = mapBlocks[1];
          var tag1 = b1.querySelector(".map-side-tag");
          var name1 = b1.querySelector(".map-hall-name");
          var par1 = b1.querySelector(".map-parents-line");
          var addr1 = b1.querySelector(".map-hall-addr");
          var link1 = b1.querySelector(".map-direct-link");
          var iframe1 = b1.querySelector("iframe");

          if (tag1 && vb.badgeMap) tag1.textContent = vb.badgeMap;
          if (name1 && vb.nameFull) name1.textContent = vb.nameFull;
          if (par1 && vb.parents !== undefined) {
            par1.innerHTML = vb.parents ? "Song thân: <strong>" + vb.parents + "</strong>" : "";
          }
          if (addr1 && vb.address) {
            addr1.textContent = vb.address.indexOf("📍") === 0 ? vb.address : "📍 " + vb.address;
          }
          if (link1 && vb.mapLink) link1.href = vb.mapLink;
          if (iframe1 && vb.mapEmbed) iframe1.src = vb.mapEmbed;
        }
      }
    }

    // --- E. ĐỒNG BỘ THỰC ĐƠN (MENU) Ở TAB 2 ---
    if (db.menu) {
      setText("#tab-details .details-col-menu .col-eyebrow", db.menu.eyebrow);
      setText("#tab-details .details-col-menu .col-main-heading", db.menu.heading);
      setText("#tab-details .details-col-menu .col-sub-note", db.menu.subNote);

      if (Array.isArray(db.menu.courses)) {
        var menuListEl = document.querySelector("#tab-details .banquet-menu-list");
        if (menuListEl) {
          menuListEl.innerHTML = db.menu.courses
            .map(function (c, idx) {
              var num = idx + 1 < 10 ? "0" + (idx + 1) : String(idx + 1);
              return (
                '<li class="menu-course-item">' +
                  '<span class="course-num">' + num + "</span>" +
                  '<div class="course-body">' +
                    '<div class="course-title-row">' +
                      '<h4 class="course-name">' + (c.name || "") + "</h4>" +
                      '<span class="course-dots"></span>' +
                      (c.tag ? '<span class="course-tag">' + c.tag + "</span>" : "") +
                    "</div>" +
                    (c.desc ? '<p class="course-desc">' + c.desc + "</p>" : "") +
                  "</div>" +
                "</li>"
              );
            })
            .join("");
        }
      }
    }

    // --- F. ĐỒNG BỘ LỊCH TRÌNH (SCHEDULE) Ở TAB 2 ---
    if (db.schedule) {
      setText("#tab-details .schedule-top-banner .banner-eyebrow", db.schedule.eyebrow);
      setText("#tab-details .schedule-top-banner .banner-title", db.schedule.heading);

      if (Array.isArray(db.schedule.events)) {
        var schListEl = document.querySelector("#tab-details .schedule-timeline-list");
        if (schListEl) {
          schListEl.innerHTML = db.schedule.events
            .map(function (ev) {
              var hlClass = ev.highlight ? " is-highlight" : "";
              var symbol = ev.highlight ? "❖" : "✦";
              return (
                '<div class="schedule-row' + hlClass + '">' +
                  '<div class="sch-time">' + (ev.time || "") + "</div>" +
                  '<div class="sch-dot"><span>' + symbol + "</span></div>" +
                  '<div class="sch-info">' +
                    '<h4 class="sch-title">' + (ev.title || "") + "</h4>" +
                    '<p class="sch-desc">' + (ev.desc || "") + "</p>" +
                  "</div>" +
                "</div>"
              );
            })
            .join("");
        }
      }
    }

    // --- G. ĐỒNG BỘ CHỒNG 5 ẢNH NHỎ TRÊN TAB 1 TỪ ALBUM ---
    if (Array.isArray(db.albumPhotos) && db.albumPhotos.length >= 5) {
      var pileImgs = document.querySelectorAll("#tab-hero .mini-photo-pile .pile-photo img");
      var sampleIndices = [
        Math.min(6, db.albumPhotos.length - 1),
        Math.min(3, db.albumPhotos.length - 1),
        Math.min(4, db.albumPhotos.length - 1),
        Math.min(2, db.albumPhotos.length - 1),
        0
      ];
      pileImgs.forEach(function (imgEl, i) {
        var item = db.albumPhotos[sampleIndices[i] || 0];
        var src = typeof item === "string" ? item : (item && item.src ? item.src : "");
        if (src) imgEl.src = src;
      });
    }
  }

  // ==========================================================================
  // 1. HỆ THỐNG ĐIỀU HƯỚNG CHUYỂN TAB (NAVIGATION ENGINE)
  // ==========================================================================
  function initTabNavigation() {
    var tabViews = document.querySelectorAll(".wedding-tab-view");
    var dockButtons = document.querySelectorAll(".dock-tab-btn");
    var actionButtons = document.querySelectorAll("[data-navigate]");

    function switchTab(targetId) {
      if (!targetId) return;

      tabViews.forEach(function (tab) {
        var isMatch = tab.id === targetId;
        tab.classList.toggle("active", isMatch);
        if (isMatch) {
          tab.scrollTop = 0;
        }
      });

      dockButtons.forEach(function (btn) {
        var btnTarget = btn.getAttribute("data-navigate");
        btn.classList.toggle("active", btnTarget === targetId);
      });

      if (targetId === "tab-hero") {
        document.body.classList.remove("dock-active");
      } else {
        document.body.classList.add("dock-active");
      }
    }

    actionButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var targetId = btn.getAttribute("data-navigate");
        switchTab(targetId);
      });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var targetId = btn.getAttribute("data-navigate");
          switchTab(targetId);
        }
      });
    });

    window.navigateToTab = switchTab;
  }

  // ==========================================================================
  // 2. BỘ ĐẾM NGƯỢC THỜI GIAN THỰC (LIVE COUNTDOWN)
  // ==========================================================================
  function initCountdown() {
    var dEl = document.getElementById("envDays");
    var hEl = document.getElementById("envHours");
    var mEl = document.getElementById("envMins");
    var sEl = document.getElementById("envSecs");

    function render() {
      var now = new Date().getTime();
      var diff = countdownTargetMs - now;

      if (diff <= 0) {
        if (dEl) dEl.textContent = "00";
        if (hEl) hEl.textContent = "00";
        if (mEl) mEl.textContent = "00";
        if (sEl) sEl.textContent = "00";
        return;
      }

      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((diff % (1000 * 60)) / 1000);

      if (dEl) dEl.textContent = d < 10 ? "0" + d : d;
      if (hEl) hEl.textContent = h < 10 ? "0" + h : h;
      if (mEl) mEl.textContent = m < 10 ? "0" + m : m;
      if (sEl) sEl.textContent = s < 10 ? "0" + s : s;
    }

    render();
    setInterval(render, 1000);
  }

  // ==========================================================================
  // 3. ĐĨA THAN NHẠC CƯỚI XOAY 3D & DANH SÁCH CHỌN BÀI (TỐI ĐA 5 BÀI TỪ ADMIN)
  // ==========================================================================
  var refreshMusicPlaylistFn = null;

  function initAudioPlayer() {
    var widget = document.getElementById("vinylPlayerWidget");
    var triggerBtn = document.getElementById("cornerMusicBtn");
    var popover = document.getElementById("vinylPlaylistPopover");
    var audio = document.getElementById("weddingBgm");
    var titleEl = document.getElementById("vinylCurrentTitle");
    var stateTagEl = document.getElementById("vinylStateTag");
    var playToggleBtn = document.getElementById("vinylPlayToggleBtn");
    var playToggleIcon = document.getElementById("vinylPlayToggleIcon");
    var playToggleText = document.getElementById("vinylPlayToggleText");
    var prevTrackBtn = document.getElementById("vinylPrevTrackBtn");
    var nextTrackBtn = document.getElementById("vinylNextTrackBtn");
    var trackCounterEl = document.getElementById("vinylTrackCounter");
    var tracklistEl = document.getElementById("vinylTracklist");

    if (!triggerBtn || !audio) return;

    var tracks = [];
    var currentTrackIdx = 0;
    var isPlaying = false;

    function getTracksFromDB() {
      var db = window.WEDDING_DB || {};
      if (Array.isArray(db.music) && db.music.length) {
        return db.music.slice(0, 5);
      }
      return [
        {
          title: "Giai Điệu Tình Yêu (Bản Giao Hưởng)",
          src: "https://assets.mixkit.co/music/preview/mixkit-romantic-wedding-love-643.mp3"
        }
      ];
    }

    function updatePlayerUI() {
      if (widget) {
        widget.classList.toggle("is-playing", isPlaying);
      }
      if (stateTagEl) {
        stateTagEl.textContent = isPlaying ? "ĐANG PHÁT ♫ ▾" : "ĐÃ DỪNG • CHỌN BÀI ▾";
      }
      if (playToggleIcon) {
        playToggleIcon.textContent = isPlaying ? "⏸" : "▶";
      }
      if (playToggleText) {
        playToggleText.textContent = isPlaying ? "Dừng Nhạc" : "Phát Nhạc";
      }
      var cur = tracks[currentTrackIdx];
      if (cur && titleEl) {
        titleEl.textContent = cur.title || ("Bài nhạc #" + (currentTrackIdx + 1));
      }
      if (trackCounterEl) {
        trackCounterEl.textContent = (currentTrackIdx + 1) + " / " + tracks.length;
      }
      if (tracklistEl) {
        var items = tracklistEl.querySelectorAll(".vinyl-track-item");
        items.forEach(function (li, idx) {
          var active = idx === currentTrackIdx;
          li.classList.toggle("active", active);
          var badge = li.querySelector(".vinyl-track-badge");
          if (badge) {
            badge.textContent = active ? (isPlaying ? "♫ Đang quay" : "⏸ Đang chọn") : ("0" + (idx + 1));
          }
        });
      }
    }

    function loadTrack(idx, autoPlay) {
      if (!tracks.length) return;
      currentTrackIdx = (idx + tracks.length) % tracks.length;
      var target = tracks[currentTrackIdx];
      if (!target || !target.src) return;

      if (audio.getAttribute("data-cur-src") !== target.src) {
        audio.src = target.src;
        audio.setAttribute("data-cur-src", target.src);
      }
      updatePlayerUI();

      if (autoPlay) {
        audio.play().then(function () {
          isPlaying = true;
          updatePlayerUI();
          showToast("♫ Đang phát: " + (target.title || "Nhạc cưới"));
        }).catch(function () {});
      }
    }

    function renderPlaylist() {
      tracks = getTracksFromDB();
      if (currentTrackIdx >= tracks.length) currentTrackIdx = 0;

      if (tracklistEl) {
        tracklistEl.innerHTML = "";
        tracks.forEach(function (t, idx) {
          var numStr = "0" + (idx + 1);
          var li = document.createElement("li");
          li.className = "vinyl-track-item" + (idx === currentTrackIdx ? " active" : "");
          li.innerHTML =
            '<span class="vinyl-track-name">' + numStr + ". " + (t.title || "Bài nhạc cưới") + "</span>" +
            '<span class="vinyl-track-badge">' + (idx === currentTrackIdx ? "♫" : numStr) + "</span>";
          li.addEventListener("click", function (e) {
            e.stopPropagation();
            if (idx === currentTrackIdx) {
              togglePlay();
            } else {
              loadTrack(idx, true);
            }
          });
          tracklistEl.appendChild(li);
        });
      }

      var cur = tracks[currentTrackIdx];
      if (cur && audio.getAttribute("data-cur-src") !== cur.src) {
        audio.src = cur.src;
        audio.setAttribute("data-cur-src", cur.src);
        if (isPlaying) {
          audio.play().catch(function () {});
        }
      }
      updatePlayerUI();
    }

    refreshMusicPlaylistFn = renderPlaylist;
    renderPlaylist();

    audio.addEventListener("play", function () {
      isPlaying = true;
      updatePlayerUI();
    });

    audio.addEventListener("pause", function () {
      isPlaying = false;
      updatePlayerUI();
    });

    // Tự động chuyển sang bài tiếp theo khi hết bài
    audio.addEventListener("ended", function () {
      if (tracks.length > 1) {
        loadTrack(currentTrackIdx + 1, true);
      } else {
        audio.currentTime = 0;
        audio.play().catch(function () {});
      }
    });

    function togglePlay() {
      if (isPlaying) {
        audio.pause();
        showToast("Đã dừng đĩa nhạc cưới");
      } else {
        audio.play().then(function () {
          var cur = tracks[currentTrackIdx];
          showToast("♫ Đang phát: " + ((cur && cur.title) || "Nhạc cưới"));
        }).catch(function () {
          showToast("Vui lòng chạm vào màn hình để bật nhạc");
        });
      }
    }

    // Bấm vào Đĩa Than: Mở / Đóng hộp điều khiển Dừng & Chọn bài
    triggerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (widget) {
        widget.classList.toggle("is-open");
      }
    });

    if (playToggleBtn) {
      playToggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        togglePlay();
      });
    }
    if (prevTrackBtn) {
      prevTrackBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        loadTrack(currentTrackIdx - 1, true);
      });
    }
    if (nextTrackBtn) {
      nextTrackBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        loadTrack(currentTrackIdx + 1, true);
      });
    }

    // Bấm ra ngoài thì đóng bảng chọn bài (đĩa than vẫn tiếp tục quay ở góc)
    document.addEventListener("click", function (e) {
      if (widget && widget.classList.contains("is-open")) {
        if (!widget.contains(e.target)) {
          widget.classList.remove("is-open");
        }
      }
    });

    function autoPlayOnFirstTouch(e) {
      if (widget && widget.contains(e.target)) return;
      if (!isPlaying) {
        audio.play().then(function () {
          isPlaying = true;
          updatePlayerUI();
        }).catch(function () {});
      }
      document.removeEventListener("click", autoPlayOnFirstTouch);
      document.removeEventListener("touchstart", autoPlayOnFirstTouch);
    }
    document.addEventListener("click", autoPlayOnFirstTouch, { once: true });
    document.addEventListener("touchstart", autoPlayOnFirstTouch, { once: true });
  }

  // ==========================================================================
  // 4. BỤI VÀNG ÁNH KIM & CÁNH HOA BAY LÃNG MẠN (GOLD STARDUST & PETALS)
  // ==========================================================================
  function initPetals() {
    var canvas = document.getElementById("petalsCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var width, height;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    var petalCount = 20;
    var petals = [];
    for (var i = 0; i < petalCount; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        r: Math.random() * 4.5 + 3,
        dx: Math.random() * 1.2 - 0.6,
        dy: Math.random() * 1.3 + 0.7,
        tilt: Math.random() * 10,
        tiltAngle: Math.random() * Math.PI,
        tiltAngleInc: (Math.random() * 0.035) + 0.015,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.4 ? "#fce8dc" : "#fae0cc"
      });
    }

    var dustCount = 45;
    var stardust = [];
    for (var j = 0; j < dustCount; j++) {
      stardust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 0.8,
        dy: -(Math.random() * 0.35 + 0.12),
        dx: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.65 + 0.2,
        pulseSpeed: Math.random() * 0.035 + 0.015,
        pulseVal: Math.random() * Math.PI * 2,
        color: Math.random() > 0.3 ? "226, 196, 142" : "255, 245, 220"
      });
    }

    function drawPetal(p) {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;

      ctx.translate(p.x, p.y);
      ctx.rotate(p.tiltAngle);
      ctx.scale(1, Math.sin(p.tilt));

      ctx.arc(0, 0, p.r, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (var s = 0; s < stardust.length; s++) {
        var d = stardust[s];
        d.pulseVal += d.pulseSpeed;
        var currentAlpha = d.alpha * (0.6 + 0.4 * Math.sin(d.pulseVal));
        d.y += d.dy;
        d.x += d.dx;

        if (d.y < -15) {
          d.y = height + 15;
          d.x = Math.random() * width;
        }
        if (d.x < -15) d.x = width + 15;
        if (d.x > width + 15) d.x = -15;

        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + d.color + ", " + currentAlpha.toFixed(2) + ")";
        ctx.shadowColor = "rgba(226, 196, 142, 0.75)";
        ctx.shadowBlur = d.r * 3.5;
        ctx.fill();
        ctx.restore();
      }

      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.tiltAngle += p.tiltAngleInc;
        p.y += p.dy;
        p.x += Math.sin(p.tiltAngle) * 0.7 + p.dx;

        if (p.y > height + 20) {
          p.x = Math.random() * width;
          p.y = -20;
          p.tilt = Math.random() * 10;
        }

        drawPetal(p);
      }

      requestAnimationFrame(animate);
    }

    animate();
  }

  // ==========================================================================
  // 5. KHUNG ẢNH CƯỚI 3D PARALLAX TILT & LIGHTBOX TRANG BÌA
  // ==========================================================================
  var globalSetLightboxZoom = null;

  function init3DPhotoFrame() {
    var leftUnit = document.getElementById("leftPhotoFrame");
    var rightUnit = document.getElementById("rightPhotoFrame");
    if (!leftUnit && !rightUnit) return;

    var leftFrame = leftUnit ? leftUnit.querySelector(".baroque-royal-frame") : null;
    var rightFrame = rightUnit ? rightUnit.querySelector(".baroque-royal-frame") : null;

    var baseLeftY = 16, baseRightY = -16, baseRotX = 2.5;
    var targetLeftY = 16, targetRightY = -16, targetRotX = 2.5;
    var currentLeftY = 16, currentRightY = -16, currentRotX = 2.5;
    var isTicking = false;

    window.addEventListener("mousemove", function (e) {
      if (window.innerWidth < 992) return;
      var normX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      var normY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

      targetLeftY = baseLeftY + normX * 8;
      targetRightY = baseRightY + normX * 8;
      targetRotX = baseRotX - normY * 6;

      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(updateTilt);
      }
    });

    function updateTilt() {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentLeftY += (targetLeftY - currentLeftY) * 0.08;
      currentRightY += (targetRightY - currentRightY) * 0.08;

      if (leftFrame) {
        leftFrame.style.transform =
          "perspective(1200px) rotateY(" + currentLeftY.toFixed(2) + "deg) rotateX(" + currentRotX.toFixed(2) + "deg) rotateZ(-1.5deg)";
      }
      if (rightFrame) {
        rightFrame.style.transform =
          "perspective(1200px) rotateY(" + currentRightY.toFixed(2) + "deg) rotateX(" + currentRotX.toFixed(2) + "deg) rotateZ(1.5deg)";
      }

      var dX = Math.abs(targetRotX - currentRotX);
      var dLY = Math.abs(targetLeftY - currentLeftY);
      var dRY = Math.abs(targetRightY - currentRightY);
      if (dX > 0.02 || dLY > 0.02 || dRY > 0.02) {
        requestAnimationFrame(updateTilt);
      } else {
        isTicking = false;
      }
    }

    var modal = document.getElementById("galleryLightbox");
    var imgEl = document.getElementById("lightboxImg");
    var captionEl = document.getElementById("lightboxCaption");

    if (leftUnit && modal && imgEl) {
      leftUnit.addEventListener("click", function () {
        var leftSrc =
          (window.WEDDING_DB && window.WEDDING_DB.couple && window.WEDDING_DB.couple.leftFramePhoto) ||
          "img/wedding-photo-card-left.jpg";
        imgEl.src = leftSrc;
        if (typeof globalSetLightboxZoom === "function") globalSetLightboxZoom(1);
        if (captionEl) captionEl.textContent = (window.WEDDING_DB && window.WEDDING_DB.couple && window.WEDDING_DB.couple.leftFramePlaque) || "✦ DŨNG • LINH ✦";
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    }

    if (rightUnit && modal && imgEl) {
      rightUnit.addEventListener("click", function () {
        var rightSrc =
          (window.WEDDING_DB && window.WEDDING_DB.couple && window.WEDDING_DB.couple.rightFramePhoto) ||
          "img/wedding-photo-card-right.jpg";
        imgEl.src = rightSrc;
        if (typeof globalSetLightboxZoom === "function") globalSetLightboxZoom(1);
        if (captionEl) captionEl.textContent = (window.WEDDING_DB && window.WEDDING_DB.couple && window.WEDDING_DB.couple.rightFramePlaque) || "✦ 07 . 12 . 2026 ✦";
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    }
  }

  // ==========================================================================
  // 6. HỆ THỐNG ALBUM 3D SỐNG ĐỘNG TỰ SINH TỪ MINI-DB (HỖ TRỢ 10 - 100+ ẢNH)
  //    - Nạp thẳng mảng đường dẫn ["img/a.jpg", ...] không cần đặt tên hay gắn tag
  //    - Chiếu đến ảnh nào thì nền đằng sau của Tab Album đổi thành ảnh đó luôn
  //    - Tự động nhận diện ảnh Đứng (Portrait) / Ngang (Landscape)
  // ==========================================================================
  var albumTimerId = null;
  var albumBoundOnce = false;

  function initGalleryLightbox() {
    var tabGallery = document.getElementById("tab-gallery");
    var deckContainer = document.getElementById("album3DDeck");
    var filmstripContainer = document.getElementById("albumFilmstrip");
    var wallContainer = document.getElementById("albumMasonryGrid");

    if (!tabGallery || !deckContainer || !filmstripContainer || !wallContainer) return;

    var db = window.WEDDING_DB || {};
    var rawPhotos = Array.isArray(db.albumPhotos) && db.albumPhotos.length
      ? db.albumPhotos
      : [
          "img/wedding-photo-card-left.jpg",
          "img/wedding-photo-card-right.jpg",
          "img/02-disney-phao-hoa.jpg",
          "img/03-disney-cau-hon.jpg",
          "img/08-trang-an-hero.jpg",
          "img/07-trang-an-b.jpg",
          "img/01-trang-an-a.jpg",
          "img/06-shanghai-dem.jpg",
          "img/04-shanghai-mua.jpg",
          "img/09-wuzhen-moi.jpg",
          "img/05-wuzhen-ma.jpg"
        ];

    // Chuẩn hóa danh sách ảnh (chỉ lấy đường dẫn ảnh, không dùng tag hay tên)
    var allPhotos = rawPhotos
      .map(function (item, idx) {
        var src = typeof item === "string" ? item : (item && item.src ? item.src : "");
        return {
          index: idx,
          src: src
        };
      })
      .filter(function (p) { return Boolean(p.src); });

    if (!allPhotos.length) return;

    var viewToggleLabel = document.getElementById("albumViewToggleLabel");
    if (viewToggleLabel && !tabGallery.classList.contains("is-wall-mode")) {
      viewToggleLabel.textContent = "Xem Lưới " + allPhotos.length + " Ảnh";
    }

    // 1. Tự động sinh DOM cho Sân khấu 3D, Dải Phim và Tường Triển Lãm từ allPhotos
    deckContainer.innerHTML = "";
    filmstripContainer.innerHTML = "";
    wallContainer.innerHTML = "";

    var deckCards = [];
    var thumbBtns = [];
    var wallFrames = [];

    allPhotos.forEach(function (photo, idx) {
      var numStr = idx + 1 < 10 ? "0" + (idx + 1) : String(idx + 1);

      // a) Tạo khung tranh 3D trong #album3DDeck
      var card = document.createElement("div");
      card.className = "deck-photo-card";
      card.setAttribute("data-index", String(idx));
      card.setAttribute("data-orient", "portrait");
      card.innerHTML =
        '<div class="deck-gilded-frame">' +
          '<div class="deck-velvet-mat">' +
            '<div class="deck-img-viewport">' +
              '<img src="' + photo.src + '" alt="Ảnh ' + numStr + '">' +
              '<div class="deck-glass-sheen"></div>' +
            '</div>' +
          '</div>' +
        '</div>';

      // Tự động nhận diện ảnh Đứng (Portrait) hay Ngang (Landscape)
      var imgNode = card.querySelector("img");
      if (imgNode) {
        var checkOrientation = function () {
          if (imgNode.naturalWidth && imgNode.naturalHeight) {
            var orient = imgNode.naturalWidth > imgNode.naturalHeight * 1.08 ? "landscape" : "portrait";
            card.setAttribute("data-orient", orient);
          }
        };
        if (imgNode.complete) {
          checkOrientation();
        } else {
          imgNode.addEventListener("load", checkOrientation);
        }
      }

      deckContainer.appendChild(card);
      deckCards.push(card);

      // b) Tạo nút thumbnail trong #albumFilmstrip
      var thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "filmstrip-thumb-btn";
      thumb.setAttribute("data-index", String(idx));
      thumb.title = "Ảnh " + numStr;
      thumb.innerHTML =
        '<img src="' + photo.src + '" alt="' + numStr + '" loading="lazy">' +
        '<span class="thumb-num-badge">' + numStr + '</span>';
      filmstripContainer.appendChild(thumb);
      thumbBtns.push(thumb);

      // c) Tạo khung ảnh trong Tường Triển Lãm Toàn Cảnh (#albumMasonryGrid) — Không có chữ/tag thừa
      var wallItem = document.createElement("div");
      wallItem.className = "wall-art-frame";
      wallItem.setAttribute("data-index", String(idx));
      wallItem.innerHTML =
        '<div class="wall-art-inner">' +
          '<img src="' + photo.src + '" alt="Ảnh ' + numStr + '" loading="lazy">' +
        '</div>';
      wallContainer.appendChild(wallItem);
      wallFrames.push(wallItem);
    });

    // Các phần tử điều khiển HUD & Nền Ảnh Động (Active-Photo Backdrop)
    var ambientA = document.getElementById("albumAmbientA");
    var ambientB = document.getElementById("albumAmbientB");
    var activeAmbientLayer = "A";

    var storyIndexEl = document.getElementById("albumStoryIndex");
    var totalCountEl = document.getElementById("albumTotalCount");
    var progressFillEl = document.getElementById("albumProgressFill");

    if (totalCountEl) {
      totalCountEl.textContent = allPhotos.length < 10 ? "0" + allPhotos.length : String(allPhotos.length);
    }

    var prevSlideBtn = document.getElementById("albumPrevBtn");
    var nextSlideBtn = document.getElementById("albumNextBtn");
    var zoomActiveBtn = document.getElementById("albumZoomActiveBtn");
    var autoplayBtn = document.getElementById("albumAutoplayBtn");
    var autoplayLabel = document.getElementById("albumAutoplayLabel");
    var viewToggleBtn = document.getElementById("albumViewToggleBtn");
    var viewToggleIcon = document.getElementById("albumViewToggleIcon");

    var modal = document.getElementById("galleryLightbox");
    var imgEl = document.getElementById("lightboxImg");
    var captionEl = document.getElementById("lightboxCaption");
    var closeBtn = document.getElementById("lightboxClose");
    var prevBtn = document.getElementById("lightboxPrev");
    var nextBtn = document.getElementById("lightboxNext");

    var totalSlides = allPhotos.length;
    var currentIndex = 0;
    var isAutoplay = autoplayBtn ? autoplayBtn.classList.contains("is-playing") : true;
    var isHoverPaused = false;
    var isWallMode = tabGallery.classList.contains("is-wall-mode");
    var progressMs = 0;
    var slideDurationMs = 4200;
    var lastWheelTime = 0;

    // Chiếu đến ảnh nào thì nền đằng sau của Tab Album đổi thành ảnh đó luôn
    function updateAmbientAura(imgSrc) {
      if (!ambientA || !ambientB || !imgSrc) return;
      if (activeAmbientLayer === "A") {
        ambientB.style.backgroundImage = "url('" + imgSrc + "')";
        ambientB.classList.add("is-visible");
        ambientA.classList.remove("is-visible");
        activeAmbientLayer = "B";
      } else {
        ambientA.style.backgroundImage = "url('" + imgSrc + "')";
        ambientA.classList.add("is-visible");
        ambientB.classList.remove("is-visible");
        activeAmbientLayer = "A";
      }
    }

    // Sắp xếp 7 lớp 3D Coverflow xung quanh currentIndex
    function selectSlide(targetIdx, resetTimer) {
      currentIndex = (targetIdx + totalSlides) % totalSlides;
      if (resetTimer !== false) {
        progressMs = 0;
        if (progressFillEl) progressFillEl.style.width = "0%";
      }

      var activeData = allPhotos[currentIndex];

      deckCards.forEach(function (card, i) {
        card.classList.remove(
          "is-active",
          "is-prev-1",
          "is-prev-2",
          "is-prev-3",
          "is-next-1",
          "is-next-2",
          "is-next-3",
          "is-hidden-left",
          "is-hidden-right"
        );
        card.style.transform = "";

        var diff = i - currentIndex;
        if (diff > totalSlides / 2) diff -= totalSlides;
        if (diff < -totalSlides / 2) diff += totalSlides;

        if (diff === 0) {
          card.classList.add("is-active");
        } else if (diff === -1) {
          card.classList.add("is-prev-1");
        } else if (diff === 1) {
          card.classList.add("is-next-1");
        } else if (diff === -2) {
          card.classList.add("is-prev-2");
        } else if (diff === 2) {
          card.classList.add("is-next-2");
        } else if (diff === -3) {
          card.classList.add("is-prev-3");
        } else if (diff === 3) {
          card.classList.add("is-next-3");
        } else if (diff < -3) {
          card.classList.add("is-hidden-left");
        } else {
          card.classList.add("is-hidden-right");
        }
      });

      // Cập nhật Dải Phim & tự động cuộn thumbnail đang chọn ra giữa dải phim
      thumbBtns.forEach(function (btn, i) {
        var isCurrent = i === currentIndex;
        btn.classList.toggle("active", isCurrent);
        if (isCurrent && btn.scrollIntoView) {
          btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      });

      // Cập nhật số thứ tự trên HUD & Đổi ảnh nền Tab Album theo đúng ảnh đang chiếu
      if (activeData) {
        var numStr = currentIndex + 1 < 10 ? "0" + (currentIndex + 1) : String(currentIndex + 1);
        if (storyIndexEl) storyIndexEl.textContent = numStr;
        updateAmbientAura(activeData.src);
      }
    }

    // Khởi tạo ở bức ảnh đầu tiên
    if (ambientA && allPhotos[0]) {
      ambientA.style.backgroundImage = "url('" + allPhotos[0].src + "')";
      ambientA.classList.add("is-visible");
      if (ambientB) ambientB.classList.remove("is-visible");
      activeAmbientLayer = "A";
    }
    selectSlide(0, true);

    // Gắn sự kiện tương tác cho các lá bài 3D
    deckCards.forEach(function (card, idx) {
      card.addEventListener("click", function () {
        if (idx === currentIndex) {
          openModal(currentIndex);
        } else {
          selectSlide(idx, true);
        }
      });

      card.addEventListener("mouseenter", function () {
        if (idx === currentIndex) isHoverPaused = true;
      });
      card.addEventListener("mouseleave", function () {
        isHoverPaused = false;
        if (idx === currentIndex) card.style.transform = "";
      });

      card.addEventListener("mousemove", function (e) {
        if (idx !== currentIndex || window.innerWidth < 992) return;
        var rect = card.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;
        var rotY = relX * 12;
        var rotX = -relY * 10;
        card.style.transform =
          "translate3d(0, 0, 88px) rotateY(" + rotY.toFixed(2) + "deg) rotateX(" + rotX.toFixed(2) + "deg) scale(1.02)";
      });
    });

    thumbBtns.forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        selectSlide(idx, true);
      });
    });

    wallFrames.forEach(function (frame, idx) {
      frame.addEventListener("click", function () {
        selectSlide(idx, true);
        openModal(idx);
      });
    });

    // ========================================================================
    // LIGHTBOX DEEP ZOOM & PAN ENGINE (100% -> 400%, LĂN CHUỘT, KÉO CHUỘT, CHỤM 2 NGÓN)
    // ========================================================================
    var lbZoom = 1;
    var lbPanX = 0;
    var lbPanY = 0;
    var lbIsDragging = false;
    var lbStartX = 0;
    var lbStartY = 0;
    var lbPinchDist = 0;
    var lbZoomResetBtn = document.getElementById("lbZoomReset");
    var lbZoomInBtn = document.getElementById("lbZoomIn");
    var lbZoomOutBtn = document.getElementById("lbZoomOut");

    function applyLightboxTransform() {
      if (!imgEl) return;
      if (lbZoom <= 1.01) {
        lbZoom = 1;
        lbPanX = 0;
        lbPanY = 0;
        imgEl.classList.remove("is-zoomed");
      } else {
        imgEl.classList.add("is-zoomed");
      }
      imgEl.style.transform = "translate3d(" + lbPanX.toFixed(1) + "px, " + lbPanY.toFixed(1) + "px, 0) scale(" + lbZoom.toFixed(2) + ")";
      if (lbZoomResetBtn) {
        lbZoomResetBtn.textContent = Math.round(lbZoom * 100) + "%";
      }
    }

    function setLightboxZoom(newZoom) {
      lbZoom = Math.max(1, Math.min(4, newZoom));
      if (lbZoom <= 1.01) {
        lbPanX = 0;
        lbPanY = 0;
      }
      applyLightboxTransform();
    }
    globalSetLightboxZoom = setLightboxZoom;

    function openModal(idx) {
      var item = allPhotos[idx];
      if (!item || !modal || !imgEl) return;
      currentIndex = idx;
      imgEl.src = item.src;
      setLightboxZoom(1);
      var numStr = idx + 1 < 10 ? "0" + (idx + 1) : String(idx + 1);
      var totalStr = allPhotos.length < 10 ? "0" + allPhotos.length : String(allPhotos.length);
      if (captionEl) {
        captionEl.textContent = numStr + " / " + totalStr;
      }
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      if (!modal) return;
      setLightboxZoom(1);
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }

    if (lbZoomInBtn) {
      lbZoomInBtn.onclick = function (e) {
        e.stopPropagation();
        setLightboxZoom(lbZoom + 0.5);
      };
    }
    if (lbZoomOutBtn) {
      lbZoomOutBtn.onclick = function (e) {
        e.stopPropagation();
        setLightboxZoom(lbZoom - 0.5);
      };
    }
    if (lbZoomResetBtn) {
      lbZoomResetBtn.onclick = function (e) {
        e.stopPropagation();
        setLightboxZoom(1);
      };
    }

    function showNext() {
      var nextIdx = (currentIndex + 1) % allPhotos.length;
      selectSlide(nextIdx, true);
      openModal(nextIdx);
    }

    function showPrev() {
      var prevIdx = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
      selectSlide(prevIdx, true);
      openModal(prevIdx);
    }

    if (prevSlideBtn) prevSlideBtn.onclick = function () { selectSlide(currentIndex - 1, true); };
    if (nextSlideBtn) nextSlideBtn.onclick = function () { selectSlide(currentIndex + 1, true); };
    if (zoomActiveBtn) zoomActiveBtn.onclick = function () { openModal(currentIndex); };

    if (autoplayBtn) {
      autoplayBtn.onclick = function () {
        isAutoplay = !isAutoplay;
        autoplayBtn.classList.toggle("is-playing", isAutoplay);
        if (autoplayLabel) {
          autoplayLabel.textContent = isAutoplay ? "Đang Chiếu Tự Động" : "Tự Động Chiếu";
        }
        if (!isAutoplay && progressFillEl) {
          progressFillEl.style.width = "0%";
        }
      };
    }

    if (viewToggleBtn && tabGallery) {
      viewToggleBtn.onclick = function () {
        isWallMode = !isWallMode;
        tabGallery.classList.toggle("is-wall-mode", isWallMode);
        if (viewToggleIcon) viewToggleIcon.textContent = isWallMode ? "❖" : "⊞";
        if (viewToggleLabel) {
          viewToggleLabel.textContent = isWallMode
            ? "Về Sân Khấu 3D"
            : "Xem Lưới " + allPhotos.length + " Ảnh";
        }
      };
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    if (nextBtn) nextBtn.onclick = function (e) { e.stopPropagation(); showNext(); };
    if (prevBtn) prevBtn.onclick = function (e) { e.stopPropagation(); showPrev(); };

    if (albumTimerId) clearInterval(albumTimerId);
    albumTimerId = setInterval(function () {
      if (!tabGallery || !tabGallery.classList.contains("active")) return;
      if (!isAutoplay || isHoverPaused || isWallMode) return;
      if (modal && modal.classList.contains("active")) return;

      progressMs += 80;
      var pct = Math.min(100, (progressMs / slideDurationMs) * 100);
      if (progressFillEl) {
        progressFillEl.style.width = pct.toFixed(1) + "%";
      }
      if (progressMs >= slideDurationMs) {
        selectSlide(currentIndex + 1, true);
      }
    }, 80);

    if (!albumBoundOnce) {
      albumBoundOnce = true;

      var livingStageEl = document.getElementById("albumLivingStage");
      if (livingStageEl) {
        livingStageEl.addEventListener("wheel", function (e) {
          if (tabGallery.classList.contains("is-wall-mode") || window.innerWidth < 1100) return;
          e.preventDefault();
          var now = Date.now();
          if (now - lastWheelTime < 380) return;
          lastWheelTime = now;
          if (e.deltaY > 0 || e.deltaX > 0) {
            if (nextSlideBtn) nextSlideBtn.click();
          } else if (e.deltaY < 0 || e.deltaX < 0) {
            if (prevSlideBtn) prevSlideBtn.click();
          }
        }, { passive: false });

        var touchStartX = 0;
        livingStageEl.addEventListener("touchstart", function (e) {
          if (e.touches && e.touches.length) touchStartX = e.touches[0].clientX;
        }, { passive: true });
        livingStageEl.addEventListener("touchend", function (e) {
          if (!e.changedTouches || !e.changedTouches.length) return;
          var diffX = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(diffX) > 40) {
            if (diffX < 0 && nextSlideBtn) nextSlideBtn.click();
            else if (diffX > 0 && prevSlideBtn) prevSlideBtn.click();
          }
        }, { passive: true });
      }

      if (modal) {
        modal.addEventListener("click", function (e) {
          if (e.target === modal || e.target.classList.contains("lightbox-stage")) {
            closeModal();
          }
        });

        // Lăn chuột để Zoom ảnh trong Lightbox (100% -> 400%)
        modal.addEventListener("wheel", function (e) {
          if (!modal.classList.contains("active")) return;
          e.preventDefault();
          var step = e.deltaY < 0 ? 0.28 : -0.28;
          setLightboxZoom(lbZoom + step);
        }, { passive: false });
      }

      if (imgEl) {
        // Nhấp đúp vào ảnh để Phóng to 2.5x hoặc Thu về 1x
        imgEl.addEventListener("dblclick", function (e) {
          e.stopPropagation();
          if (lbZoom > 1.05) {
            setLightboxZoom(1);
          } else {
            setLightboxZoom(2.5);
          }
        });

        // Giữ chuột kéo di chuyển (Pan) khi ảnh đang phóng to
        imgEl.addEventListener("mousedown", function (e) {
          if (lbZoom <= 1.01) return;
          e.preventDefault();
          lbIsDragging = true;
          lbStartX = e.clientX - lbPanX;
          lbStartY = e.clientY - lbPanY;
          imgEl.classList.add("is-dragging");
        });
        window.addEventListener("mousemove", function (e) {
          if (!lbIsDragging) return;
          lbPanX = e.clientX - lbStartX;
          lbPanY = e.clientY - lbStartY;
          applyLightboxTransform();
        });
        window.addEventListener("mouseup", function () {
          if (lbIsDragging) {
            lbIsDragging = false;
            if (imgEl) imgEl.classList.remove("is-dragging");
          }
        });

        // Chụm 2 ngón tay để Zoom (Pinch-to-Zoom) & Kéo 1 ngón trên điện thoại
        imgEl.addEventListener("touchstart", function (e) {
          if (e.touches.length === 2) {
            var dx = e.touches[0].clientX - e.touches[1].clientX;
            var dy = e.touches[0].clientY - e.touches[1].clientY;
            lbPinchDist = Math.hypot(dx, dy);
          } else if (e.touches.length === 1 && lbZoom > 1.01) {
            lbIsDragging = true;
            lbStartX = e.touches[0].clientX - lbPanX;
            lbStartY = e.touches[0].clientY - lbPanY;
          }
        }, { passive: true });

        imgEl.addEventListener("touchmove", function (e) {
          if (e.touches.length === 2 && lbPinchDist > 0) {
            e.preventDefault();
            var dx = e.touches[0].clientX - e.touches[1].clientX;
            var dy = e.touches[0].clientY - e.touches[1].clientY;
            var dist = Math.hypot(dx, dy);
            var ratio = dist / lbPinchDist;
            lbPinchDist = dist;
            setLightboxZoom(lbZoom * ratio);
          } else if (e.touches.length === 1 && lbIsDragging && lbZoom > 1.01) {
            e.preventDefault();
            lbPanX = e.touches[0].clientX - lbStartX;
            lbPanY = e.touches[0].clientY - lbStartY;
            applyLightboxTransform();
          }
        }, { passive: false });

        imgEl.addEventListener("touchend", function () {
          lbIsDragging = false;
          lbPinchDist = 0;
        });
      }

      document.addEventListener("keydown", function (e) {
        if (modal && modal.classList.contains("active")) {
          if (e.key === "Escape") closeModal();
          if (e.key === "ArrowRight" && nextBtn) nextBtn.click();
          if (e.key === "ArrowLeft" && prevBtn) prevBtn.click();
          return;
        }
        if (tabGallery && tabGallery.classList.contains("active") && !tabGallery.classList.contains("is-wall-mode")) {
          if (e.key === "ArrowRight" && nextSlideBtn) nextSlideBtn.click();
          if (e.key === "ArrowLeft" && prevSlideBtn) prevSlideBtn.click();
        }
      });
    }
  }

  // ==========================================================================
  // 7. TIỆN ÍCH TOAST NOTIFICATION
  // ==========================================================================
  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById("stToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  // ==========================================================================
  // KHỞI ĐỘNG KHI TẢI TRANG & TỰ ĐỘNG ĐỒNG BỘ TỪ SERVER DB
  // ==========================================================================
  document.addEventListener("DOMContentLoaded", function () {
    syncDOMFromWeddingDB();
    initTabNavigation();
    initCountdown();
    initAudioPlayer();
    initPetals();
    init3DPhotoFrame();
    initGalleryLightbox();

    // Tải bản DB mới nhất từ IndexedDB / Server và cập nhật giao diện
    if (typeof window.fetchWeddingDBFromServer === "function") {
      window.fetchWeddingDBFromServer().then(function () {
        syncDOMFromWeddingDB();
        initGalleryLightbox();
        if (typeof refreshMusicPlaylistFn === "function") refreshMusicPlaylistFn();
      });
    }

    // Tự động đồng bộ tức thì khi dữ liệu thiệp được cập nhật
    if (window.WEDDING_LIVE_CHANNEL) {
      window.WEDDING_LIVE_CHANNEL.addEventListener("message", function (e) {
        if (e.data && e.data.type === "DB_UPDATED" && typeof window.fetchWeddingDBFromServer === "function") {
          window.fetchWeddingDBFromServer().then(function () {
            syncDOMFromWeddingDB();
            initGalleryLightbox();
            if (typeof refreshMusicPlaylistFn === "function") refreshMusicPlaylistFn();
            showToast("✨ Đã cập nhật dữ liệu mới từ trang Quản Lý!");
          });
        }
      });
    }
  });

})();
