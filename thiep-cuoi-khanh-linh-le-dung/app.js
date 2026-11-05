'use strict';

// Personalize these sample details and the matching text in index.html.
const invitationDetails = () => window.WeddingInvitation.get();
let weddingDate = new Date(invitationDetails().date);
window.addEventListener('wedding:sidechange', () => { weddingDate = new Date(invitationDetails().date); updateCountdown(); });
window.addEventListener('wedding:db-synced', () => { weddingDate = new Date(invitationDetails().date); updateCountdown(); });
const eventTabs = [...document.querySelectorAll('[data-event]')];
function selectEvent(index, focus = false) {
  eventTabs.forEach((tab,i) => {
    const selected = i === index;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0:-1;
    document.getElementById('event-' + tab.dataset.event).hidden = !selected;
  });
  if (focus) eventTabs[index].focus();
}
eventTabs.forEach((tab,i) => tab.addEventListener('click', () => selectEvent(i)));
document.querySelector('.event-tabs').addEventListener('keydown', event => {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const current = eventTabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
  selectEvent(event.key === 'Home' ? 0 : event.key === 'End' ? eventTabs.length-1 : (current + (event.key === 'ArrowRight' ? 1:-1) + eventTabs.length) % eventTabs.length, true);
});
function updateCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const values = {days:Math.floor(seconds/86400),hours:Math.floor(seconds/3600)%24,minutes:Math.floor(seconds/60)%60,seconds:seconds%60};
  Object.entries(values).forEach(([name,value]) => document.getElementById('count-'+name).textContent = String(value).padStart(2,'0'));
}
updateCountdown(); setInterval(updateCountdown,1000);

function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
function escapeCalendarText(value) {
  return value.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
}
function foldCalendarLine(line) {
  const encoder = new TextEncoder(); let folded = '', current = '';
  for (const character of line) {
    if (encoder.encode(current + character).length > 75) { folded += current + '\r\n'; current = ' '; }
    current += character;
  }
  return folded + current;
}
function createCalendar(details) {
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Wedding Invitation//VI','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+details.uid,'DTSTAMP:'+stamp,'DTSTART:'+details.utc];
  if (details.end) lines.push('DTEND:'+details.end);
  lines.push('SUMMARY:'+escapeCalendarText('Tiệc cưới '+details.names+(details.sample?' (lịch minh họa)':' — '+details.side)),'LOCATION:'+escapeCalendarText(details.location),'DESCRIPTION:'+escapeCalendarText(details.description),'END:VEVENT','END:VCALENDAR');
  return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
}
document.getElementById('save-date').addEventListener('click', () => {
  const details = invitationDetails();
  downloadFile(details.file,createCalendar(details),'text/calendar;charset=utf-8');
  showToast('Đã tạo lịch cho ngày '+details.dateLabel+' ♡');
});
let toastTimer;
function showToast(message) {
  const toast = document.getElementById('toast'); toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'),4000);
}

const rsvpDialog = document.getElementById('rsvp-dialog');
const rsvpForm = document.getElementById('rsvp-form');
let savedResponse = null;
try { savedResponse = JSON.parse(localStorage.getItem('minh-anh-rsvp-demo')); } catch (_) { /* Browser-local storage is optional. */ }
if (savedResponse && typeof savedResponse === 'object') {
  if (rsvpForm.elements.name) rsvpForm.elements.name.value = savedResponse.name || '';
  if (rsvpForm.elements.phone) rsvpForm.elements.phone.value = savedResponse.phone || '';
  if (rsvpForm.elements.attending) rsvpForm.elements.attending.value = savedResponse.attending === 'no' ? 'no':'yes';
  if (rsvpForm.elements.guests) rsvpForm.elements.guests.value = String(savedResponse.guests || 1);
  if (rsvpForm.elements.message) rsvpForm.elements.message.value = savedResponse.message || '';
}
function updateAttendance() { document.getElementById('guest-count').disabled = rsvpForm.elements.attending.value === 'no'; }
rsvpForm.elements.attending.forEach(radio => radio.addEventListener('change',updateAttendance)); updateAttendance();
document.querySelectorAll('[data-rsvp]').forEach(button => button.addEventListener('click', () => {
  document.getElementById('rsvp-form-view').hidden = false; document.getElementById('rsvp-success').hidden = true;
  rsvpDialog.setAttribute('aria-labelledby','rsvp-dialog-title'); rsvpDialog.showModal();
}));
document.querySelectorAll('[data-close]').forEach(button => { if (button.dataset.close !== 'gallery-dialog') button.addEventListener('click', () => document.getElementById(button.dataset.close).close()); });
rsvpDialog.addEventListener('click',event => {
  const rect = rsvpDialog.getBoundingClientRect();
  if (event.target === rsvpDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) rsvpDialog.close();
});
rsvpForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = rsvpForm.elements.name.value.trim();
  if (!name) { rsvpForm.elements.name.setCustomValidity('Bạn hãy nhập tên nhé.'); rsvpForm.elements.name.reportValidity(); return; }
  const phone = (rsvpForm.elements.phone ? rsvpForm.elements.phone.value : '').trim();
  if (!phone) { rsvpForm.elements.phone.setCustomValidity('Bạn hãy nhập số điện thoại nhé.'); rsvpForm.elements.phone.reportValidity(); return; }
  const attending = rsvpForm.elements.attending.value;
  const family = ['groom','bride'].includes(rsvpForm.elements.family.value) ? rsvpForm.elements.family.value : (document.body.dataset.weddingFamily || 'bride');
  const response = {
    name,
    phone,
    attending,
    family,
    eventDate: invitationDetails().date,
    couple: invitationDetails().names,
    guests: attending === 'yes' ? Number(rsvpForm.elements.guests.value) : 0,
    message: rsvpForm.elements.message.value.trim()
  };

  // 1. Lưu backup ở local storage
  try { localStorage.setItem('wedding-rsvp-saved', JSON.stringify(response)); } catch (_) {}

  // 2. Gửi trực tiếp lên server /api/rsvp để lưu vào database & báo cho Admin
  fetch('/api/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response)
  }).then(r => r.json()).then(data => {
    if (data && data.ok && window.WEDDING_LIVE_CHANNEL) {
      window.WEDDING_LIVE_CHANNEL.postMessage({ type: 'RSVP_NEW', rsvp: data.saved });
    }
  }).catch(() => {});

  document.getElementById('rsvp-form-view').hidden = true;
  document.getElementById('rsvp-success').hidden = false;
  const message = document.getElementById('success-message');
  message.textContent = attending === 'yes' ? `Cảm ơn ${name}! Hẹn gặp bạn trong chương đẹp nhất của chúng mình.` : `Cảm ơn ${name} đã dành tình cảm cho chúng mình. Thương mến gửi bạn một cái ôm thật ấm!`;
  const note = document.querySelector('#rsvp-success .form-note');
  if (note) {
    note.textContent = 'Phản hồi của bạn đã được gửi thành công đến cô dâu & chú rể ♡';
  }
  const successTitle = document.querySelector('#rsvp-success h2');
  if (successTitle) successTitle.id = 'rsvp-success-title';
  rsvpDialog.setAttribute('aria-labelledby', 'rsvp-success-title');
  rsvpDialog.scrollTop = 0;
  const closeBtn = document.querySelector('#rsvp-success [data-close]');
  if (closeBtn) closeBtn.focus();
});
rsvpForm.elements.name.addEventListener('input', () => rsvpForm.elements.name.setCustomValidity(''));
if (rsvpForm.elements.phone) rsvpForm.elements.phone.addEventListener('input', () => rsvpForm.elements.phone.setCustomValidity(''));
document.getElementById('edit-response').addEventListener('click', () => {
  document.getElementById('rsvp-form-view').hidden = false; document.getElementById('rsvp-success').hidden = true;
  rsvpDialog.setAttribute('aria-labelledby','rsvp-dialog-title'); rsvpForm.elements.name.focus();
});

// Audio controller with interactive playlist popover & user-gesture auto-play
const backgroundMusic = document.getElementById('background-music');
const soundButton = document.getElementById('sound-toggle');
const musicWidget = document.getElementById('weddingMusicWidget');
const playlistPopover = document.getElementById('musicPlaylistPopover');
const popoverTitle = document.getElementById('popoverCurrentTrackName');
const popoverCounter = document.getElementById('popoverTrackCounter');
const btnPrevTrack = document.getElementById('btnPrevTrack');
const btnPlayToggle = document.getElementById('btnPlayToggle');
const playToggleIcon = document.getElementById('playToggleIcon');
const playToggleText = document.getElementById('playToggleText');
const btnNextTrack = document.getElementById('btnNextTrack');
const popoverTracklist = document.getElementById('popoverTracklist');

let audioPending = false;
let currentTrackIndex = 0;

if (backgroundMusic) {
  backgroundMusic.volume = 0.45;

  function getPlaylist() {
    return (Array.isArray(window.__WEDDING_PLAYLIST) && window.__WEDDING_PLAYLIST.length > 0)
      ? window.__WEDDING_PLAYLIST
      : [{ title: 'River Flows in You — Yiruma', src: '/thiep-cuoi-khanh-linh-le-dung/assets/river-flows-in-you.mp3#t=10' }];
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

  function getCurrentTrack() {
    const list = getPlaylist();
    currentTrackIndex = (currentTrackIndex + list.length) % list.length;
    return list[currentTrackIndex] || list[0];
  }

  function skipMusicIntro() {
    const src = backgroundMusic.currentSrc || backgroundMusic.src || '';
    if (src.includes('#t=10') || src.includes('river-flows-in-you')) {
      if (backgroundMusic.currentTime < 10) {
        try { backgroundMusic.currentTime = 10; } catch (_) {}
      }
    }
  }
  backgroundMusic.addEventListener('loadedmetadata', skipMusicIntro);

  function renderPopoverTracklist() {
    if (!popoverTracklist) return;
    const list = getPlaylist();
    const playing = !backgroundMusic.paused && !backgroundMusic.ended;

    popoverTracklist.innerHTML = list.map((item, idx) => {
      const active = idx === currentTrackIndex;
      const numStr = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      const title = item.title || ('Bản nhạc #' + (idx + 1));
      const statusText = active ? (playing ? '♫ Đang phát' : '⏸ Đang chọn') : '';
      return `
        <li class="popover-track-item ${active ? 'active' : ''}" data-track-idx="${idx}" role="button" tabindex="0">
          <span class="track-num">${numStr}</span>
          <span class="track-name" title="${title}">${title}</span>
          ${statusText ? `<span class="track-status">${statusText}</span>` : ''}
        </li>
      `;
    }).join('');

    popoverTracklist.querySelectorAll('.popover-track-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.trackIdx, 10);
        if (!isNaN(idx)) {
          loadAndPlayTrack(idx);
        }
      });
    });
  }

  function syncMusicUI() {
    const playing = !backgroundMusic.paused && !backgroundMusic.ended;
    const cur = getCurrentTrack();
    const list = getPlaylist();
    const title = cur.title || 'Nhạc cưới';

    if (musicWidget) {
      musicWidget.classList.toggle('is-playing', playing);
    }
    if (soundButton) {
      soundButton.setAttribute('aria-pressed', String(playing));
      soundButton.setAttribute('aria-label', (playing ? 'Tắt' : 'Bật') + ' nhạc nền — ' + title);
      soundButton.title = title + ' · ' + (playing ? 'Đang phát' : 'Đã dừng');
    }
    if (popoverTitle) {
      popoverTitle.textContent = title;
      popoverTitle.title = title;
    }
    if (popoverCounter) {
      popoverCounter.textContent = `${currentTrackIndex + 1} / ${list.length}`;
    }
    if (playToggleIcon) {
      playToggleIcon.textContent = playing ? '⏸' : '▶';
    }
    if (playToggleText) {
      playToggleText.textContent = playing ? 'Dừng nhạc' : 'Phát nhạc';
    }

    renderPopoverTracklist();
  }

  async function loadAndPlayTrack(idx) {
    const list = getPlaylist();
    currentTrackIndex = (idx + list.length) % list.length;
    window.__WEDDING_CURRENT_MUSIC_INDEX = currentTrackIndex;
    const target = list[currentTrackIndex];
    if (!target) return;

    const targetSrc = resolveAssetUrl(target.src);
    if (backgroundMusic.getAttribute('data-loaded-src') !== targetSrc) {
      backgroundMusic.setAttribute('data-loaded-src', targetSrc);
      backgroundMusic.src = targetSrc;
    }

    try {
      skipMusicIntro();
      await backgroundMusic.play();
    } catch (_) {}
    syncMusicUI();
  }

  backgroundMusic.addEventListener('play', syncMusicUI);
  backgroundMusic.addEventListener('pause', syncMusicUI);
  backgroundMusic.addEventListener('ended', () => {
    const list = getPlaylist();
    if (list.length > 1) {
      loadAndPlayTrack(currentTrackIndex + 1);
    } else {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(() => {});
      syncMusicUI();
    }
  });

  backgroundMusic.addEventListener('error', () => {
    backgroundMusic.pause();
    syncMusicUI();
    audioPending = false;
    if (soundButton) soundButton.disabled = false;
  });

  window.playWeddingMusic = async function() {
    if (!backgroundMusic) return;
    if (!backgroundMusic.paused) return;
    try {
      skipMusicIntro();
      await backgroundMusic.play();
    } catch (_) {}
    syncMusicUI();
  };

  // Nút trên Header: Bấm để mở / đóng Hộp chọn bài hát (Playlist Popover)
  if (soundButton && musicWidget) {
    soundButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = musicWidget.classList.contains('is-open');
      if (isOpen) {
        musicWidget.classList.remove('is-open');
        soundButton.setAttribute('aria-expanded', 'false');
      } else {
        musicWidget.classList.add('is-open');
        soundButton.setAttribute('aria-expanded', 'true');
        // Nếu đang dừng, tự động phát luôn khi mở popover
        if (backgroundMusic.paused) {
          window.playWeddingMusic();
        }
      }
    });

    // Bấm ra ngoài popover để đóng
    document.addEventListener('click', (e) => {
      if (musicWidget.classList.contains('is-open') && !musicWidget.contains(e.target)) {
        musicWidget.classList.remove('is-open');
        soundButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Nút Dừng / Phát bên trong Popover
  if (btnPlayToggle) {
    btnPlayToggle.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (audioPending) return;
      if (!backgroundMusic.paused) {
        backgroundMusic.pause();
        return;
      }
      audioPending = true;
      btnPlayToggle.disabled = true;
      try {
        skipMusicIntro();
        await backgroundMusic.play();
      } catch (_) {
        if (typeof showToast === 'function') {
          showToast('Chưa phát được nhạc. Hãy thử chọn bài khác nhé.');
        }
      } finally {
        audioPending = false;
        btnPlayToggle.disabled = false;
        syncMusicUI();
      }
    });
  }

  // Nút Bài trước
  if (btnPrevTrack) {
    btnPrevTrack.addEventListener('click', (e) => {
      e.stopPropagation();
      loadAndPlayTrack(currentTrackIndex - 1);
    });
  }

  // Nút Bài tiếp theo
  if (btnNextTrack) {
    btnNextTrack.addEventListener('click', (e) => {
      e.stopPropagation();
      loadAndPlayTrack(currentTrackIndex + 1);
    });
  }

  window.addEventListener('pagehide', () => backgroundMusic.pause());
  window.refreshMusicPlaylistUI = syncMusicUI;

  // Lần đầu tải
  syncMusicUI();
}
