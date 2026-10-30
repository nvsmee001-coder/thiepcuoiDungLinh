/**
 * BENTO WEDDING SCRIPT — DŨNG & LINH
 * Interactive logic for Bento Grid layout: Countdown, Location switcher,
 * Photo Lightbox, Gift/QR tabs, Audio player, and RSVP feedback.
 */

(function () {
  "use strict";

  // Data from content.js or defaults
  var C = window.WEDDING_CONTENT || {
    groom: "Dũng",
    bride: "Linh",
    dateDisplay: "07 . 12 . 2026",
    coverPhoto: "img/08-trang-an-hero.jpg",
    ceremony: {
      heading: "Lễ thành hôn",
      time: "11:00",
      date: "Chủ nhật, ngày 07 tháng 12 năm 2026",
      groomHome: {
        label: "Nhà trai",
        address: "Số 00, đường ABC, phường/xã XYZ, Hà Nội",
        lat: 21.0278,
        lng: 105.8342,
      },
      brideHome: {
        label: "Nhà gái",
        address: "Số 00, đường DEF, phường/xã UVW, TP. Hồ Chí Minh",
        lat: 10.7769,
        lng: 106.7009,
      },
    },
    album: [
      "img/08-trang-an-hero.jpg",
      "img/01-trang-an-a.jpg",
      "img/07-trang-an-b.jpg",
      "img/04-shanghai-mua.jpg",
      "img/06-shanghai-dem.jpg",
      "img/03-disney-cau-hon.jpg",
      "img/02-disney-phao-hoa.jpg",
      "img/05-wuzhen-ma.jpg",
      "img/09-wuzhen-moi.jpg",
    ],
  };

  // 1. Toast Notification Helper
  var toastTimer = null;
  function showToast(message) {
    var toast = document.getElementById("toastMsg");
    if (!toast) return;
    toast.querySelector(".toast-text").textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 3200);
  }

  // 2. Live Countdown Timer
  function initCountdown() {
    // Target: 2026-12-07 11:00:00 (Vietnam GMT+7)
    var targetDate = new Date("2026-12-07T11:00:00+07:00").getTime();
    var daysEl = document.getElementById("cDays");
    var hoursEl = document.getElementById("cHours");
    var minsEl = document.getElementById("cMins");
    var secsEl = document.getElementById("cSecs");

    function update() {
      var now = new Date().getTime();
      var diff = targetDate - now;

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = "00";
        if (hoursEl) hoursEl.textContent = "00";
        if (minsEl) minsEl.textContent = "00";
        if (secsEl) secsEl.textContent = "00";
        return;
      }

      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = d < 10 ? "0" + d : d;
      if (hoursEl) hoursEl.textContent = h < 10 ? "0" + h : h;
      if (minsEl) minsEl.textContent = m < 10 ? "0" + m : m;
      if (secsEl) secsEl.textContent = s < 10 ? "0" + s : s;
    }

    update();
    setInterval(update, 1000);
  }

  // 3. Ceremony Location Switcher (Nhà Trai / Nhà Gái)
  var currentHome = "groom";
  function initLocationSwitcher() {
    var btnGroom = document.getElementById("locBtnGroom");
    var btnBride = document.getElementById("locBtnBride");
    var venueNameEl = document.getElementById("locVenueName");
    var venueAddrEl = document.getElementById("locVenueAddress");
    var mapBtn = document.getElementById("btnOpenMap");

    function setLocation(type) {
      currentHome = type;
      var info = type === "groom" ? C.ceremony.groomHome : C.ceremony.brideHome;

      if (btnGroom && btnBride) {
        btnGroom.classList.toggle("active", type === "groom");
        btnBride.classList.toggle("active", type === "bride");
      }

      if (venueNameEl) {
        venueNameEl.textContent = info.label + " — Tiệc Mừng";
      }
      if (venueAddrEl) {
        venueAddrEl.textContent = info.address;
      }
      if (mapBtn) {
        var query = encodeURIComponent(info.address);
        if (info.lat && info.lng) {
          query = info.lat + "," + info.lng;
        }
        mapBtn.href = "https://www.google.com/maps/search/?api=1&query=" + query;
      }
    }

    if (btnGroom) {
      btnGroom.addEventListener("click", function () {
        setLocation("groom");
      });
    }
    if (btnBride) {
      btnBride.addEventListener("click", function () {
        setLocation("bride");
      });
    }

    // Set initial
    setLocation("groom");
  }

  // 4. Gift / QR Switcher
  var bankData = {
    groom: {
      title: "Mừng Chú Rể (Dũng)",
      bankName: "MB Bank (Quân Đội)",
      accountNo: "0900000000",
      accountName: "NGUYEN VAN DUNG",
      qrUrl: "https://img.vietqr.io/image/MB-0900000000-compact2.png?amount=0&addInfo=Mung%20cuoi%20Dung%20Linh",
    },
    bride: {
      title: "Mừng Cô Dâu (Linh)",
      bankName: "Techcombank",
      accountNo: "19000000000000",
      accountName: "TRAN THI LINH",
      qrUrl: "https://img.vietqr.io/image/TCB-19000000000000-compact2.png?amount=0&addInfo=Mung%20cuoi%20Dung%20Linh",
    },
  };

  function initGiftBox() {
    var tabGroom = document.getElementById("giftTabGroom");
    var tabBride = document.getElementById("giftTabBride");
    var qrImg = document.getElementById("giftQrImg");
    var bankNameEl = document.getElementById("giftBankName");
    var accNoEl = document.getElementById("giftAccNo");
    var accHolderEl = document.getElementById("giftAccHolder");
    var copyBtn = document.getElementById("btnCopyAcc");

    var currentBank = "groom";

    function updateGift(type) {
      currentBank = type;
      var data = bankData[type];

      if (tabGroom && tabBride) {
        tabGroom.classList.toggle("active", type === "groom");
        tabBride.classList.toggle("active", type === "bride");
      }
      if (qrImg) qrImg.src = data.qrUrl;
      if (bankNameEl) bankNameEl.textContent = data.bankName;
      if (accNoEl) accNoEl.textContent = data.accountNo;
      if (accHolderEl) accHolderEl.textContent = "Chủ TK: " + data.accountName;
    }

    if (tabGroom) {
      tabGroom.addEventListener("click", function () {
        updateGift("groom");
      });
    }
    if (tabBride) {
      tabBride.addEventListener("click", function () {
        updateGift("bride");
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var num = bankData[currentBank].accountNo;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(num).then(function () {
            showToast("Đã sao chép STK: " + num);
          });
        } else {
          var input = document.createElement("input");
          input.value = num;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
          showToast("Đã sao chép STK: " + num);
        }
      });
    }

    updateGift("groom");
  }

  // 5. Photo Lightbox
  var currentLightboxIndex = 0;
  function initGalleryLightbox() {
    var modal = document.getElementById("lightboxModal");
    var modalImg = document.getElementById("lightboxImg");
    var closeBtn = document.getElementById("lightboxClose");
    var prevBtn = document.getElementById("lightboxPrev");
    var nextBtn = document.getElementById("lightboxNext");

    var album = C.album && C.album.length ? C.album : [
      "img/08-trang-an-hero.jpg",
      "img/01-trang-an-a.jpg",
      "img/07-trang-an-b.jpg",
      "img/04-shanghai-mua.jpg",
      "img/06-shanghai-dem.jpg",
      "img/03-disney-cau-hon.jpg"
    ];

    function showPhoto(idx) {
      currentLightboxIndex = (idx + album.length) % album.length;
      if (modalImg) {
        modalImg.src = album[currentLightboxIndex];
      }
    }

    function openModal(idx) {
      showPhoto(idx);
      if (modal) modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      if (modal) modal.classList.remove("active");
      document.body.style.overflow = "";
    }

    document.querySelectorAll(".gallery-thumb").forEach(function (thumb, index) {
      thumb.addEventListener("click", function () {
        openModal(index);
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        showPhoto(currentLightboxIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        showPhoto(currentLightboxIndex + 1);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (!modal || !modal.classList.contains("active")) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPhoto(currentLightboxIndex - 1);
      if (e.key === "ArrowRight") showPhoto(currentLightboxIndex + 1);
    });
  }

  // 6. Audio Player (Supports local audio or romantic synthesiser harp)
  function initAudioPlayer() {
    var musicBtn = document.getElementById("musicToggleBtn");
    if (!musicBtn) return;

    var audio = null;
    var isPlaying = false;
    var audioCtx = null;
    var synthInterval = null;

    // Try finding local audio file or fallback to synthesized gentle harp melody
    try {
      audio = new Audio("audio/wedding.mp3");
      audio.loop = true;
    } catch (e) {
      audio = null;
    }

    // Gentle arpeggio notes in pentatonic scale for romantic wedding vibe
    var melodyNotes = [261.63, 329.63, 392.0, 440.0, 523.25, 659.25, 523.25, 392.0];
    var noteIdx = 0;

    function playSynthArpeggio() {
      if (!isPlaying) return;
      try {
        if (!audioCtx) {
          var AudioContext = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioContext();
        }
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        var freq = melodyNotes[noteIdx % melodyNotes.length];
        noteIdx++;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.25);
      } catch (err) {
        // Ignore audio context errors
      }
    }

    function toggleMusic() {
      if (!isPlaying) {
        isPlaying = true;
        musicBtn.classList.add("playing");
        showToast("Đang phát giai điệu ngày cưới 🎵");

        // Try playing real audio first
        if (audio) {
          audio.play().catch(function () {
            // If failed to load local file, use gentle romantic synth
            synthInterval = setInterval(playSynthArpeggio, 700);
            playSynthArpeggio();
          });
        } else {
          synthInterval = setInterval(playSynthArpeggio, 700);
          playSynthArpeggio();
        }
      } else {
        isPlaying = false;
        musicBtn.classList.remove("playing");
        if (audio) audio.pause();
        if (synthInterval) clearInterval(synthInterval);
        showToast("Đã tạm dừng âm nhạc");
      }
    }

    musicBtn.addEventListener("click", toggleMusic);
  }

  // 7. RSVP Form Submission
  function initRsvpForm() {
    var form = document.getElementById("rsvpForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameInput = document.getElementById("rsvpGuestName");
      var name = (nameInput && nameInput.value.trim()) || "Bạn";
      showToast("❤️ Cảm ơn " + name + "! Lời chúc và xác nhận đã gửi thành công!");
      form.reset();
    });
  }

  // Dom Ready
  document.addEventListener("DOMContentLoaded", function () {
    initCountdown();
    initLocationSwitcher();
    initGiftBox();
    initGalleryLightbox();
    initAudioPlayer();
    initRsvpForm();
  });
})();
