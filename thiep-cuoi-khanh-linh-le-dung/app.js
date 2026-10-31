'use strict';

// Personalize these sample details and the matching text in index.html.
const invitationDetails = () => window.WeddingInvitation.get();
let weddingDate = new Date(invitationDetails().date);
window.addEventListener('wedding:sidechange', () => { weddingDate = new Date(invitationDetails().date); updateCountdown(); });
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
if (savedResponse && typeof savedResponse === 'object' && typeof savedResponse.name === 'string') {
  rsvpForm.elements.name.value = savedResponse.name;
  rsvpForm.elements.attending.value = savedResponse.attending === 'no' ? 'no':'yes';
  rsvpForm.elements.guests.value = String(savedResponse.guests || 1);
  rsvpForm.elements.message.value = savedResponse.message || '';
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
  const attending = rsvpForm.elements.attending.value;
  const family = ['groom','bride'].includes(rsvpForm.elements.family.value) ? rsvpForm.elements.family.value : (document.body.dataset.weddingFamily || 'bride');
  const response = {
    name,
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
document.getElementById('edit-response').addEventListener('click', () => {
  document.getElementById('rsvp-form-view').hidden = false; document.getElementById('rsvp-success').hidden = true;
  rsvpDialog.setAttribute('aria-labelledby','rsvp-dialog-title'); rsvpForm.elements.name.focus();
});

// User-provided piano recording; playback starts only after a guest clicks.
const backgroundMusic = document.getElementById('background-music');
const soundButton = document.getElementById('sound-toggle');
let audioPending = false;
backgroundMusic.volume = 0.45;
const musicStartSeconds = 10;
function skipMusicIntro() {
  if (backgroundMusic.currentTime >= musicStartSeconds) return;
  try { backgroundMusic.currentTime = musicStartSeconds; }
  catch (_) { /* Retry when media metadata becomes available. */ }
}
backgroundMusic.addEventListener('loadedmetadata',skipMusicIntro);
backgroundMusic.addEventListener('seeking',skipMusicIntro);
backgroundMusic.addEventListener('timeupdate',skipMusicIntro);
function syncMusicButton() {
  const playing = !backgroundMusic.paused && !backgroundMusic.ended;
  soundButton.setAttribute('aria-pressed',String(playing));
  soundButton.setAttribute('aria-label',(playing ? 'Tắt' : 'Bật')+' nhạc nền — River Flows in You');
  soundButton.title = 'River Flows in You — Yiruma · '+(playing ? 'Tắt nhạc' : 'Bật nhạc');
}
backgroundMusic.addEventListener('play',syncMusicButton);
backgroundMusic.addEventListener('pause',syncMusicButton);
backgroundMusic.addEventListener('ended',syncMusicButton);
backgroundMusic.addEventListener('error',() => {
  backgroundMusic.pause(); syncMusicButton();
  audioPending = false; soundButton.disabled = false;
});
soundButton.addEventListener('click',async () => {
  if (audioPending) return;
  if (!backgroundMusic.paused) { backgroundMusic.pause(); return; }
  audioPending = true; soundButton.disabled = true;
  try {
    skipMusicIntro();
    await backgroundMusic.play();
    syncMusicButton();
  } catch (_) {
    backgroundMusic.pause(); syncMusicButton();
    showToast('Chưa phát được nhạc. Bạn hãy thử bấm lại nút nhạc nhé.');
  } finally {
    audioPending = false; soundButton.disabled = false;
  }
});
window.addEventListener('pagehide',() => backgroundMusic.pause());
syncMusicButton();
