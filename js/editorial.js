/**
 * EDITORIAL WEDDING SCRIPT — DŨNG & LINH
 * Logic for Editorial Magazine wedding invitation:
 * Live Countdown, Bank Tab switcher, Copy STK, Lookbook Lightbox, Music player, and RSVP feedback.
 */

(function () {
  "use strict";

  // Data from content.js or defaults
  var C = window.WEDDING_CONTENT || {};

  // 1. Toast Notification
  var toastTimer = null;
  function showEdToast(msg) {
    var toast = document.getElementById("edToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 3000);
  }

  // 2. Countdown Timer
  function initEdCountdown() {
    var target = new Date("2026-12-07T11:00:00+07:00").getTime();
    var dEl = document.getElementById("edDays");
    var hEl = document.getElementById("edHours");
    var mEl = document.getElementById("edMins");
    var sEl = document.getElementById("edSecs");

    function render() {
      var now = new Date().getTime();
      var diff = target - now;
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

  // 3. Bank Switcher
  var bankAccounts = {
    groom: {
      bank: "MB Bank (Quân Đội)",
      num: "0900000000",
      owner: "NGUYEN VAN DUNG",
      qr: "https://img.vietqr.io/image/MB-0900000000-compact2.png?amount=0&addInfo=Mung%20cuoi%20Dung%20Linh"
    },
    bride: {
      bank: "Techcombank",
      num: "19000000000000",
      owner: "TRAN THI LINH",
      qr: "https://img.vietqr.io/image/TCB-19000000000000-compact2.png?amount=0&addInfo=Mung%20cuoi%20Dung%20Linh"
    }
  };

  var curBank = "groom";

  function initEdBank() {
    var tabGroom = document.getElementById("edTabGroom");
    var tabBride = document.getElementById("edTabBride");
    var qrImg = document.getElementById("edQrImg");
    var bankOrg = document.getElementById("edBankOrg");
    var bankNum = document.getElementById("edBankNum");
    var bankOwner = document.getElementById("edBankOwner");
    var copyBtn = document.getElementById("edBtnCopy");

    function update(type) {
      curBank = type;
      var d = bankAccounts[type];
      if (tabGroom && tabBride) {
        tabGroom.classList.toggle("active", type === "groom");
        tabBride.classList.toggle("active", type === "bride");
      }
      if (qrImg) qrImg.src = d.qr;
      if (bankOrg) bankOrg.textContent = d.bank;
      if (bankNum) bankNum.textContent = d.num;
      if (bankOwner) bankOwner.textContent = "Chủ tài khoản: " + d.owner;
    }

    if (tabGroom) tabGroom.addEventListener("click", function () { update("groom"); });
    if (tabBride) tabBride.addEventListener("click", function () { update("bride"); });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var num = bankAccounts[curBank].num;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(num).then(function () {
            showEdToast("ĐÃ SAO CHÉP STK: " + num);
          });
        } else {
          var input = document.createElement("input");
          input.value = num;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
          showEdToast("ĐÃ SAO CHÉP STK: " + num);
        }
      });
    }

    update("groom");
  }

  // 4. Lookbook Lightbox
  function initEdLightbox() {
    var modal = document.getElementById("edLightbox");
    var modalImg = document.getElementById("edLightboxImg");
    var closeBtn = document.getElementById("edLightboxClose");

    document.querySelectorAll(".lookbook-item img").forEach(function (img) {
      img.addEventListener("click", function () {
        if (modalImg) modalImg.src = img.src;
        if (modal) modal.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    });

    function close() {
      if (modal) modal.classList.remove("active");
      document.body.style.overflow = "";
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

  // 5. Audio Player
  function initEdAudio() {
    var btn = document.getElementById("edMusicBtn");
    if (!btn) return;

    var audio = null;
    var isPlaying = false;
    var audioCtx = null;
    var synthInterval = null;

    try {
      audio = new Audio("audio/wedding.mp3");
      audio.loop = true;
    } catch (e) {
      audio = null;
    }

    var pentatonic = [293.66, 369.99, 440.0, 554.37, 587.33, 440.0];
    var noteIdx = 0;

    function playNote() {
      if (!isPlaying) return;
      try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") audioCtx.resume();

        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        var freq = pentatonic[noteIdx % pentatonic.length];
        noteIdx++;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.09, audioCtx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
      } catch (err) {}
    }

    function toggle() {
      if (!isPlaying) {
        isPlaying = true;
        btn.classList.add("playing");
        btn.querySelector(".btn-label").textContent = "Pause Audio";
        showEdToast("Đang phát nhạc nền...");
        if (audio) {
          audio.play().catch(function () {
            synthInterval = setInterval(playNote, 800);
            playNote();
          });
        } else {
          synthInterval = setInterval(playNote, 800);
          playNote();
        }
      } else {
        isPlaying = false;
        btn.classList.remove("playing");
        btn.querySelector(".btn-label").textContent = "Play Music";
        if (audio) audio.pause();
        if (synthInterval) clearInterval(synthInterval);
        showEdToast("Đã tạm dừng âm thanh");
      }
    }

    btn.addEventListener("click", toggle);
  }

  // 6. RSVP Form
  function initEdForm() {
    var form = document.getElementById("edRsvpForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("edName");
      var name = (nameEl && nameEl.value.trim()) || "Quý khách";
      showEdToast("CẢM ƠN " + name.toUpperCase() + " ĐÃ GỬI LỜI CHÚC & XÁC NHẬN!");
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initEdCountdown();
    initEdBank();
    initEdLightbox();
    initEdAudio();
    initEdForm();
  });
})();
