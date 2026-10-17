(function () {
  "use strict";

  var C = WEDDING_CONTENT;
  var TYPE_MS = 28; // ms per character while "telling" the story
  var UNTYPE_TICKS = 10; // erase in ~10 steps total, however long the text —
  var UNTYPE_TICK_MS = 12; // ...so erasing always takes ~120ms, never scales with length
  var MEDIA_MS = 1350; // photo + theme arrival duration before typewriter begins
  var CAPTION_DELAY = 350; // theme appears right after photo lands
  var LINGER_MS = 650; // text disappears -> photo pauses/lingers for visual breath
  var EXIT_MS = 950; // photo + theme: gentle upward drift and soft film dissolve

  function getField(path) {
    return path.split(".").reduce(function (obj, key) {
      return obj == null ? undefined : obj[key];
    }, C);
  }

  function fillSimpleFields(root) {
    root.querySelectorAll("[data-field]").forEach(function (node) {
      var value = getField(node.getAttribute("data-field"));
      if (value != null) node.textContent = value;
    });
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function bgPhoto(className, src) {
    var node = el("div", className);
    node.style.backgroundImage = "url('" + src + "')";
    return node;
  }

  function framedPhoto(frameClass, photoClass, src) {
    var frame = el("div", frameClass);
    frame.appendChild(bgPhoto(photoClass, src));
    return frame;
  }

  // ---------- Scene data: intro + each milestone, one after another ----------

  var LAYOUTS = ["right", "left", "top"];

  function buildScenesData() {
    var scenes = [
      {
        photo: C.coverPhoto,
        script: C.groom + " & " + C.bride,
        small: "Thiệp mời",
        text: C.opening.body.join(" "),
      },
    ];
    C.story.milestones.forEach(function (m) {
      scenes.push({
        photo: m.photo,
        script: m.label,
        small: m.place + " · " + m.when,
        text: m.text,
      });
    });
    scenes.forEach(function (s, i) {
      s.layout = LAYOUTS[i % LAYOUTS.length];
    });
    return scenes;
  }

  // ---------- Build scene DOM (all scenes exist upfront, toggled by class) ----------

  function buildSceneEl(data) {
    var scene = el("div", "scene scene--" + data.layout);

    var media = el("div", "scene-media");
    media.appendChild(framedPhoto("scene-photo-frame", "scene-photo", data.photo));
    media.appendChild(el("span", "tape tape--a"));
    media.appendChild(el("span", "tape tape--b"));
    scene.appendChild(media);

    var copy = el("div", "scene-copy");
    var caption = el("div", "scene-caption");
    caption.appendChild(el("p", "scene-caption-script", data.script));
    caption.appendChild(el("p", "scene-caption-small", data.small));
    copy.appendChild(caption);
    copy.appendChild(el("p", "scene-typed"));
    scene.appendChild(copy);

    return scene;
  }

  // ---------- Click-driven state machine ----------

  function PVStage(scenesData, hostEl, hint, onFinale) {
    this.data = scenesData;
    this.host = hostEl;
    this.hint = hint;
    this.onFinale = onFinale;
    this.els = scenesData.map(function (d) {
      var node = buildSceneEl(d);
      hostEl.appendChild(node);
      return node;
    });
    this.index = -1;
    this.complete = false;
    this.typeTimer = null;
    this.finaleShown = false;
    // True while a scene is mid-exit (untyping) and the next one hasn't
    // taken over yet — guards against a click landing in that window
    // and firing a second, overlapping transition.
    this.busy = false;
    this.goTo(0);
  }

  // Exit sequence:
  // 1. Chữ ký sự xóa nhanh (~120ms)
  // 2. Chữ biến mất -> Ảnh + chủ đề nán lại (LINGER_MS: 650ms) cho người xem chiêm ngưỡng
  // 3. Ảnh + chủ đề trôi nhẹ lên và mờ dần trong 950ms (EXIT_MS) với filter blur mượt mà
  // 4. Khi hoàn thành toàn bộ, scene cũ mới dọn dẹp và gọi done()
  PVStage.prototype.exitCurrent = function (done) {
    var self = this;
    this.busy = true;
    this.hint.classList.remove("is-shown");
    var prevEl = this.els[this.index];
    this.clearTimer();
    this.untype(prevEl.querySelector(".scene-typed"), function () {
      setTimeout(function () {
        prevEl.classList.add("is-exiting");
        setTimeout(function () {
          prevEl.classList.remove("is-active", "is-exiting");
          done();
        }, EXIT_MS);
      }, LINGER_MS);
    });
  };


  PVStage.prototype.goTo = function (index) {
    var self = this;
    if (this.index >= 0) {
      this.exitCurrent(function () {
        self.enter(index);
      });
    } else {
      this.enter(index);
    }
  };

  PVStage.prototype.enter = function (index) {
    this.busy = false;
    this.index = index;
    this.complete = false;
    this.hint.classList.remove("is-shown");
    var sceneEl = this.els[index];
    sceneEl.classList.add("is-active");
    var self = this;
    var typedEl = sceneEl.querySelector(".scene-typed");
    typedEl.textContent = "";
    // Photo + theme take MEDIA_MS to fully appear; only once that's
    // completely done does the text start being "told".
    setTimeout(function () {
      self.type(typedEl, self.data[index].text);
    }, MEDIA_MS);
  };

  PVStage.prototype.type = function (typedEl, text) {
    var self = this;
    var i = 0;
    this.clearTimer();
    function step() {
      typedEl.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) {
        self.typeTimer = setTimeout(step, TYPE_MS);
      } else {
        self.finishTyping();
      }
    }
    step();
  };

  PVStage.prototype.clearTimer = function () {
    if (this.typeTimer) {
      clearTimeout(this.typeTimer);
      this.typeTimer = null;
    }
  };

  PVStage.prototype.finishTyping = function () {
    this.clearTimer();
    this.complete = true;
    this.hint.classList.add("is-shown");
  };

  PVStage.prototype.untype = function (typedEl, done) {
    var text = typedEl.textContent;
    var len = text.length;
    if (len === 0) {
      done();
      return;
    }
    var chunk = Math.max(1, Math.ceil(len / UNTYPE_TICKS));
    function step() {
      len = Math.max(0, len - chunk);
      typedEl.textContent = text.slice(0, len);
      if (len > 0) {
        setTimeout(step, UNTYPE_TICK_MS);
      } else {
        done();
      }
    }
    step();
  };

  PVStage.prototype.advance = function () {
    if (this.finaleShown || this.busy) return;

    if (!this.complete) {
      // Tap while the story is still being "told" → show the rest at once.
      var typedEl = this.els[this.index].querySelector(".scene-typed");
      typedEl.textContent = this.data[this.index].text;
      this.finishTyping();
      return;
    }

    var next = this.index + 1;
    if (next < this.data.length) {
      this.goTo(next);
    } else {
      var self = this;
      this.exitCurrent(function () {
        self.finaleShown = true;
        self.onFinale();
      });
    }
  };

  PVStage.prototype.reset = function () {
    this.clearTimer();
    this.els.forEach(function (sceneEl) {
      sceneEl.classList.remove("is-active", "is-exiting");
      sceneEl.querySelector(".scene-typed").textContent = "";
    });
    this.index = -1;
    this.complete = false;
    this.busy = false;
    this.finaleShown = false;
    this.hint.classList.remove("is-shown");
    this.goTo(0);
  };

  // ---------- Finale: book that opens into info (left) + map (right) ----------

  function renderFinaleText() {
    var e = C.ceremony;
    var t = C.thanks;
    var b = C.backCover;

    document.getElementById("detailTime").textContent = e.time + " · " + e.date;
    document.getElementById("rsvpLabel").textContent = t.rsvpLabel;
    document.getElementById("detailsSignature").textContent =
      b.line1 + " · " + C.groom + " & " + C.bride + " · " + b.line2;

    var groomBtn = document.querySelector('.home-btn[data-home="groom"]');
    var brideBtn = document.querySelector('.home-btn[data-home="bride"]');
    // Update only the label span, preserving the emoji avatar
    var groomLabelEl = groomBtn.querySelector('.home-btn-label');
    var brideLabelEl = brideBtn.querySelector('.home-btn-label');
    if (groomLabelEl) groomLabelEl.textContent = e.groomHome.label;
    if (brideLabelEl) brideLabelEl.textContent = e.brideHome.label;

    setupHomeToggle(groomBtn, brideBtn);
  }

  function setupHomeToggle(groomBtn, brideBtn) {
    var iframe = document.getElementById("detailsMap");
    var addressEl = document.getElementById("mapAddress");
    var homes = { groom: C.ceremony.groomHome, bride: C.ceremony.brideHome };

    var directLink = document.getElementById('mapDirectLink');

    function show(key, btn) {
      var home = homes[key];
      iframe.src = "https://www.google.com/maps?q=" + home.lat + "," + home.lng + "&z=16&output=embed";
      addressEl.textContent = home.label + ": " + home.address;
      if (directLink) {
        directLink.href = "https://www.google.com/maps?q=" + home.lat + "," + home.lng;
      }
      [groomBtn, brideBtn].forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
    }

    groomBtn.addEventListener("click", function () {
      show("groom", groomBtn);
    });
    brideBtn.addEventListener("click", function () {
      show("bride", brideBtn);
    });

    show("groom", groomBtn);
  }

  // The card appears closed (leaning, per its CSS) and just sits there —
  // opening is a deliberate tap, same as everything else in this piece,
  // and it can be toggled open/closed afterwards as many times as wanted.
  var bookOpen = false;

  // ================================================================
  // MOBILE 3-STEP CARD FLIP CONTROLLER ("Lật thẻ bài" trên điện thoại)
  // ================================================================
  var mobileCardStep = 0;
  var MOBILE_HINTS = [
    { text: "Chạm vào thiệp để xem thông tin", badge: "1/3" },
    { text: "Chạm để xem bản đồ & chỉ đường", badge: "2/3" },
    { text: "Chạm để quay lại bìa thiệp", badge: "3/3" }
  ];

  function isMobileCardMode() {
    return window.innerWidth <= 860;
  }

  function setMobileCardStep(step) {
    mobileCardStep = (step % 3 + 3) % 3;
    var bookEl = document.getElementById("book");
    if (bookEl) {
      bookEl.setAttribute("data-mobile-card", String(mobileCardStep));
    }

    // Update navigation pill buttons
    var pills = document.querySelectorAll(".mobile-nav-pill");
    pills.forEach(function (pill, idx) {
      pill.classList.toggle("is-active", idx === mobileCardStep);
    });

    // Update hint text and badge
    var hintText = document.getElementById("mobileFlipHintText");
    var hintBadge = document.getElementById("mobileFlipBadge");
    if (hintText && MOBILE_HINTS[mobileCardStep]) {
      hintText.textContent = MOBILE_HINTS[mobileCardStep].text;
    }
    if (hintBadge && MOBILE_HINTS[mobileCardStep]) {
      hintBadge.textContent = MOBILE_HINTS[mobileCardStep].badge;
    }

    // Haptic feedback on mobile if supported
    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(12);
      }
    } catch (err) {}
  }

  function mobileNextCard() {
    setMobileCardStep(mobileCardStep + 1);
  }

  function initMobileCardControls() {
    // Click listeners on pill buttons
    var pills = document.querySelectorAll(".mobile-nav-pill");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var step = parseInt(pill.getAttribute("data-step"), 10);
        if (!isNaN(step)) {
          setMobileCardStep(step);
        }
      });
    });

    // Click listener on hint bar and hint pill
    var flipBar = document.getElementById("mobileFlipBar");
    if (flipBar) {
      flipBar.addEventListener("click", function (ev) {
        ev.stopPropagation();
        mobileNextCard();
      });
    }

    setMobileCardStep(0);
  }

  function showFinale() {
    var sceneHost = document.getElementById("sceneHost");
    if (sceneHost) {
      sceneHost.querySelectorAll(".scene").forEach(function (s) {
        s.classList.remove("is-active", "is-exiting");
      });
    }
    document.getElementById("bookWrap").classList.add("is-shown");
    document.getElementById("replayBtn").classList.add("is-shown");
    if (isMobileCardMode()) {
      setMobileCardStep(0);
    }
  }
  window._showFinale = showFinale;
  window._setMobileCardStep = setMobileCardStep;
  window._mobileNextCard = mobileNextCard;

  function toggleBook() {
    bookOpen = !bookOpen;
    document.getElementById("bookWrap").classList.toggle("is-open", bookOpen);
  }

  // ---------- Album modal ----------

  function buildAlbum() {
    var pile = document.getElementById("albumPile");
    C.album.forEach(function (src, i) {
      var card = el("div", "album-card");
      card.style.setProperty("--r", (i % 2 === 0 ? -1 : 1) * (4 + (i % 3) * 3) + "deg");
      card.appendChild(bgPhoto("album-photo", src));
      pile.appendChild(card);
    });

    var modal = document.getElementById("albumModal");
    var openBtn = document.getElementById("albumOpenBtn");
    var closeBtn = document.getElementById("albumClose");

    function open(ev) {
      ev.stopPropagation();
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    if (openBtn) openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (ev) {
      if (ev.target === modal) close();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") close();
    });
  }


  // ================================================================
  // AMBIENT: Background Music
  // ================================================================
  function setupMusic() {
    var btn = document.getElementById('musicBtn');
    if (!btn) return;

    // We create a silent AudioContext and play ambient tones — no
    // external audio file needed; the disc spin alone signals playback.
    // If you have a real mp3, swap `playSilent` for an HTMLAudioElement.
    var playing = false;

    // Optional: real audio file support.
    // Drop a wedding.mp3 in /audio/ and uncomment:
    // var audio = new Audio('audio/wedding.mp3');
    // audio.loop = true;
    // audio.volume = 0.35;

    btn.addEventListener('click', function () {
      playing = !playing;
      btn.classList.toggle('is-playing', playing);
      btn.title = playing ? 'Tắt nhạc cưới' : 'Bật nhạc cưới';
      // audio.paused ? audio.play() : audio.pause();
    });
  }

  // ================================================================
  // AMBIENT: Falling Cherry Petals (canvas)
  // ================================================================
  function setupPetals() {
    var canvas = document.getElementById('petalsCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var petalsOn = true;
    var petalsBtn = document.getElementById('petalsBtn');
    var petals = [];
    var MAX_PETALS = 28;
    var raf;

    var PETAL_COLORS = [
      'rgba(255, 210, 220, 0.82)',
      'rgba(255, 190, 205, 0.72)',
      'rgba(253, 235, 242, 0.68)',
      'rgba(240, 180, 195, 0.75)',
      'rgba(201, 147, 42, 0.22)',
      'rgba(255, 222, 200, 0.65)',
    ];

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function randBetween(a, b) { return a + Math.random() * (b - a); }

    function makePetal() {
      return {
        x:     randBetween(0, canvas.width),
        y:     randBetween(-60, -10),
        size:  randBetween(6, 14),
        color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
        speedY: randBetween(0.6, 1.8),
        speedX: randBetween(-0.6, 0.6),
        rot:   randBetween(0, Math.PI * 2),
        rotSpeed: randBetween(-0.025, 0.025),
        wobble: randBetween(0, Math.PI * 2),
        wobbleSpeed: randBetween(0.018, 0.04),
        wobbleAmp: randBetween(0.4, 1.2),
        opacity: randBetween(0.55, 0.9),
      };
    }

    function drawPetal(p) {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // Simple elliptical petal
      ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      // Vein highlight
      ctx.globalAlpha = p.opacity * 0.35;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.7);
      ctx.lineTo(0, p.size * 0.7);
      ctx.stroke();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (petalsOn) {
        // Spawn up to MAX_PETALS
        if (petals.length < MAX_PETALS && Math.random() < 0.06) {
          petals.push(makePetal());
        }

        petals = petals.filter(function (p) {
          p.wobble += p.wobbleSpeed;
          p.x      += p.speedX + Math.sin(p.wobble) * p.wobbleAmp;
          p.y      += p.speedY;
          p.rot    += p.rotSpeed;
          drawPetal(p);
          return p.y < canvas.height + 30;
        });
      }

      raf = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);

    if (petalsBtn) {
      petalsBtn.addEventListener('click', function () {
        petalsOn = !petalsOn;
        petalsBtn.classList.toggle('is-off', !petalsOn);
        petalsBtn.title = petalsOn ? 'Tắt hiệu ứng hoa rơi' : 'Bật hiệu ứng hoa rơi';
        if (!petalsOn) {
          // Clear remaining petals immediately
          petals = [];
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSimpleFields(document);
    setupMusic();
    setupPetals();
    renderFinaleText();
    buildAlbum();
    initMobileCardControls();

    var host = document.getElementById("sceneHost");
    var hint = document.getElementById("clickHint");
    var stage = document.getElementById("stage");
    var replayBtn = document.getElementById("replayBtn");
    var stageInstance = new PVStage(buildScenesData(), host, hint, showFinale);

    stage.addEventListener("click", function (ev) {
      // Bỏ qua nếu chạm vào các nút điều khiển thực tế (chuyển nhà trai/gái, bản đồ, xem album, v.v.)
      if (ev.target.closest(".home-btn, #detailsMap, #albumOpenBtn, #replayBtn, #albumClose, .album-modal, #mapDirectLink, .map-direct-btn, .mobile-nav-pill")) {
        return;
      }
      var isBookShown = document.getElementById("bookWrap").classList.contains("is-shown");
      if (stageInstance.finaleShown || isBookShown) {
        if (isMobileCardMode()) {
          mobileNextCard();
        } else {
          toggleBook();
        }
        return;
      }
      stageInstance.advance();
    });

    replayBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      document.getElementById("bookWrap").classList.remove("is-shown", "is-open");
      bookOpen = false;
      setMobileCardStep(0);
      replayBtn.classList.remove("is-shown");
      stageInstance.reset();
    });
  });
})();

