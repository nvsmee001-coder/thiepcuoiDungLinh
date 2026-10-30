/**
 * RESPONSIVE APP TABS SCRIPT — DŨNG & LINH
 * Đồng bộ hóa tương tác giữa Desktop (PC Widescreen) và Mobile (Bottom Nav):
 * - Chuyển đổi tab 2 chiều mượt mà
 * - Đếm ngược ngày cưới hiển thị trên cả 2 giao diện
 * - Lightbox xem ảnh
 * - Phát nhạc cưới
 * - Sao chép số tài khoản
 * - Form gửi lời chúc
 */

(function () {
  "use strict";

  // Toast
  var toastTimer = null;
  function showAppToast(msg) {
    var toast = document.getElementById("appToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2800);
  }

  // 1. Đồng bộ chuyển Tab giữa Desktop và Mobile
  function initTabSync() {
    var mobileTabBtns = document.querySelectorAll(".mobile-only-nav .nav-tab-item");
    var desktopTabBtns = document.querySelectorAll(".desktop-tab-btn");
    var tabPanels = document.querySelectorAll(".tab-panel");

    function switchTab(targetId) {
      // Sync mobile nav
      mobileTabBtns.forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === targetId);
      });

      // Sync desktop nav
      desktopTabBtns.forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === targetId);
      });

      // Show active panel
      tabPanels.forEach(function (panel) {
        var isMatch = panel.id === targetId;
        panel.classList.toggle("active", isMatch);
        if (isMatch) panel.scrollTop = 0;
      });
    }

    mobileTabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.getAttribute("data-tab"));
      });
    });

    desktopTabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchTab(btn.getAttribute("data-tab"));
      });
    });
  }

  // 2. Countdown Timer (Đồng bộ cả Mobile pill và PC 4 ô)
  function initCountdown() {
    var target = new Date("2026-12-07T11:00:00+07:00").getTime();
    var pill = document.getElementById("heroCountdownPill");
    var pcDays = document.getElementById("pcCDays");
    var pcHours = document.getElementById("pcCHours");
    var pcMins = document.getElementById("pcCMins");
    var pcSecs = document.getElementById("pcCSecs");

    function update() {
      var diff = target - new Date().getTime();
      if (diff <= 0) {
        if (pill) pill.textContent = "🎉 Hôm nay là ngày cưới!";
        if (pcDays) pcDays.textContent = "00";
        if (pcHours) pcHours.textContent = "00";
        if (pcMins) pcMins.textContent = "00";
        if (pcSecs) pcSecs.textContent = "00";
        return;
      }
      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((diff % (1000 * 60)) / 1000);

      if (pill) pill.textContent = "⏳ Còn " + d + " ngày nữa";
      if (pcDays) pcDays.textContent = d < 10 ? "0" + d : d;
      if (pcHours) pcHours.textContent = h < 10 ? "0" + h : h;
      if (pcMins) pcMins.textContent = m < 10 ? "0" + m : m;
      if (pcSecs) pcSecs.textContent = s < 10 ? "0" + s : s;
    }

    update();
    setInterval(update, 1000);
  }

  // 3. Sao chép số tài khoản
  function initCopyButtons() {
    document.querySelectorAll(".btn-copy-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var num = btn.getAttribute("data-stk") || "0900000000";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(num).then(function () {
            showAppToast("Đã sao chép số tài khoản: " + num);
          });
        } else {
          var input = document.createElement("input");
          input.value = num;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
          showAppToast("Đã sao chép số tài khoản: " + num);
        }
      });
    });
  }

  // 4. Lightbox Gallery
  function initLightbox() {
    var modal = document.getElementById("appLightbox");
    var modalImg = document.getElementById("appLightboxImg");
    var closeBtn = document.getElementById("appLightboxClose");

    document.querySelectorAll(".album-photo-item img").forEach(function (img) {
      img.addEventListener("click", function () {
        if (modalImg) modalImg.src = img.src;
        if (modal) modal.classList.add("active");
      });
    });

    function close() {
      if (modal) modal.classList.remove("active");
    }

    if (closeBtn) closeBtn.addEventListener("click", close);
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) close();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  // 5. Music Player
  var isPlaying = false;
  var audio = null;
  var audioCtx = null;
  var synthTimer = null;

  function initMusic() {
    var btns = document.querySelectorAll(".btn-music-ctrl");
    if (!btns.length) return;

    var notes = [261.63, 329.63, 392.0, 523.25, 440.0, 392.0];
    var nIdx = 0;

    function playSynth() {
      if (!isPlaying) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AC();
        if (audioCtx.state === "suspended") audioCtx.resume();

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(notes[nIdx % notes.length], audioCtx.currentTime);
        nIdx++;

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.25);
      } catch (e) {}
    }

    function toggle() {
      if (!isPlaying) {
        isPlaying = true;
        btns.forEach(function (b) {
          b.classList.add("playing");
          var label = b.querySelector(".btn-txt");
          if (label) label.textContent = "Đang phát";
        });
        showAppToast("Đang phát nhạc cưới 🎵");

        try {
          if (!audio) {
            audio = new Audio("audio/wedding.mp3");
            audio.loop = true;
          }
          audio.play().catch(function () {
            synthTimer = setInterval(playSynth, 750);
            playSynth();
          });
        } catch (e) {
          synthTimer = setInterval(playSynth, 750);
          playSynth();
        }
      } else {
        isPlaying = false;
        btns.forEach(function (b) {
          b.classList.remove("playing");
          var label = b.querySelector(".btn-txt");
          if (label) label.textContent = "Nhạc";
        });
        if (audio) audio.pause();
        if (synthTimer) clearInterval(synthTimer);
        showAppToast("Đã tạm dừng âm nhạc");
      }
    }

    btns.forEach(function (b) {
      b.addEventListener("click", toggle);
    });
  }

  // 6. RSVP Form
  function initRsvp() {
    var form = document.getElementById("appRsvpForm");
    var list = document.getElementById("wishesPreviewList");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("rsvpName");
      var textEl = document.getElementById("rsvpText");
      var name = (nameEl && nameEl.value.trim()) || "Bạn bè";
      var text = (textEl && textEl.value.trim()) || "Chúc hai bạn trăm năm hạnh phúc!";

      if (list) {
        var bubble = document.createElement("div");
        bubble.className = "wish-bubble";
        bubble.innerHTML =
          '<div class="wish-bubble-author">' +
          '<span>' + name + '</span>' +
          '<span class="wish-bubble-time">Vừa xong</span>' +
          '</div>' +
          '<p class="wish-bubble-text">' + text + '</p>';
        list.insertBefore(bubble, list.firstChild);
      }

      showAppToast("❤️ Cảm ơn " + name + "! Lời chúc đã được gửi thành công!");
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTabSync();
    initCountdown();
    initCopyButtons();
    initLightbox();
    initMusic();
    initRsvp();
  });
})();
