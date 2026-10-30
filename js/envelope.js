/**
 * ENVELOPE WEDDING SCRIPT — DŨNG & LINH
 * Interactive logic for Style 1: 3D Envelope Opening, Reopen control,
 * Countdown, Bank tabs, Copy STK, Music, and RSVP feedback.
 */

(function () {
  "use strict";

  // Toast
  var toastTimer = null;
  function showEnvToast(msg) {
    var toast = document.getElementById("envToast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 3000);
  }

  // 1. Envelope Opening Interaction
  function initEnvelopeOpening() {
    var wrapper = document.getElementById("envelopeWrapper");
    var screen = document.getElementById("envelopeScreen");
    var reopenBtn = document.getElementById("btnReopen");

    if (!wrapper || !screen) return;

    function openEnvelope() {
      if (wrapper.classList.contains("opening")) return;
      wrapper.classList.add("opening");

      // Auto start romantic music on user touch/gesture
      tryPlayMusic();

      // After card slides up out of envelope, smoothly reveal the main invitation
      setTimeout(function () {
        screen.classList.add("opened-complete");
        showEnvToast("Chào mừng bạn đến với thiệp cưới Dũng & Linh! ✨");
      }, 1300);
    }

    wrapper.addEventListener("click", openEnvelope);

    if (reopenBtn) {
      reopenBtn.addEventListener("click", function () {
        screen.classList.remove("opened-complete");
        wrapper.classList.remove("opening");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // 2. Countdown Timer
  function initEnvCountdown() {
    var target = new Date("2026-12-07T11:00:00+07:00").getTime();
    var dEl = document.getElementById("envDays");
    var hEl = document.getElementById("envHours");
    var mEl = document.getElementById("envMins");
    var sEl = document.getElementById("envSecs");

    function update() {
      var diff = target - new Date().getTime();
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

    update();
    setInterval(update, 1000);
  }

  // 3. Bank Switcher & Copy STK
  var bankData = {
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

  function initEnvBank() {
    var tabG = document.getElementById("envTabGroom");
    var tabB = document.getElementById("envTabBride");
    var qrImg = document.getElementById("envQrImg");
    var bankTitle = document.getElementById("envBankTitle");
    var bankNum = document.getElementById("envBankNum");
    var bankOwner = document.getElementById("envBankOwner");
    var btnCopy = document.getElementById("envBtnCopy");

    function setBank(type) {
      curBank = type;
      var d = bankData[type];
      if (tabG && tabB) {
        tabG.classList.toggle("active", type === "groom");
        tabB.classList.toggle("active", type === "bride");
      }
      if (qrImg) qrImg.src = d.qr;
      if (bankTitle) bankTitle.textContent = d.bank;
      if (bankNum) bankNum.textContent = d.num;
      if (bankOwner) bankOwner.textContent = "Chủ TK: " + d.owner;
    }

    if (tabG) tabG.addEventListener("click", function () { setBank("groom"); });
    if (tabB) tabB.addEventListener("click", function () { setBank("bride"); });

    if (btnCopy) {
      btnCopy.addEventListener("click", function () {
        var num = bankData[curBank].num;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(num).then(function () {
            showEnvToast("Đã sao chép số tài khoản: " + num);
          });
        } else {
          var input = document.createElement("input");
          input.value = num;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
          showEnvToast("Đã sao chép số tài khoản: " + num);
        }
      });
    }

    setBank("groom");
  }

  // 4. Music Player
  var isPlaying = false;
  var audio = null;
  var audioCtx = null;
  var synthTimer = null;

  function tryPlayMusic() {
    if (isPlaying) return;
    var musicBtn = document.getElementById("envMusicBtn");
    isPlaying = true;
    if (musicBtn) {
      musicBtn.classList.add("playing");
      musicBtn.querySelector(".btn-label").textContent = "Tắt nhạc";
    }

    try {
      if (!audio) {
        audio = new Audio("audio/wedding.mp3");
        audio.loop = true;
      }
      audio.play().catch(function () {
        startSynth();
      });
    } catch (e) {
      startSynth();
    }
  }

  function startSynth() {
    var notes = [261.63, 329.63, 392.0, 523.25, 440.0, 392.0];
    var nIdx = 0;
    synthTimer = setInterval(function () {
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
        osc.stop(audioCtx.currentTime + 1.3);
      } catch (err) {}
    }, 750);
  }

  function initEnvAudio() {
    var btn = document.getElementById("envMusicBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      if (!isPlaying) {
        tryPlayMusic();
        showEnvToast("Đang phát nhạc cưới 🎵");
      } else {
        isPlaying = false;
        btn.classList.remove("playing");
        btn.querySelector(".btn-label").textContent = "Nhạc cưới";
        if (audio) audio.pause();
        if (synthTimer) clearInterval(synthTimer);
        showEnvToast("Đã tạm dừng âm thanh");
      }
    });
  }

  // 5. RSVP Form
  function initEnvRsvp() {
    var form = document.getElementById("envRsvpForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("envName").value.trim() || "Bạn";
      showEnvToast("Cảm ơn " + name + " đã gửi lời chúc và xác nhận! ❤️");
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initEnvelopeOpening();
    initEnvCountdown();
    initEnvBank();
    initEnvAudio();
    initEnvRsvp();
  });
})();
