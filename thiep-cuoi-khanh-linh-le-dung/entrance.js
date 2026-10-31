/* A deliberate welcome: choose a family, then unfold the invitation. */
(() => {
  'use strict';
  const root = document.documentElement;
  const dialog = document.getElementById('entry-dialog');
  const back = document.getElementById('entry-back');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = { groom: 'Nhà trai', bride: 'Nhà gái' };
  const choices = [...document.querySelectorAll('[data-family]')];
  let selected = null, entered = false, leaving = false, originFocus = null;
  const animations = new Set();

  function applyFamily(family) {
    if (!labels[family]) return;
    selected = family;
    document.body.dataset.weddingFamily = family;
    document.querySelectorAll('[data-selected-family]').forEach(node => node.textContent = labels[family]);
    document.querySelectorAll('[data-change-side],[data-rsvp-family]').forEach(node => node.hidden = false);
    document.querySelectorAll('input[name="family"]').forEach(node => node.value = family);
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.family === family)));
    const introNode = document.querySelector('.invitation-intro');
    if (introNode) {
      introNode.innerHTML = 'Gia đình ' + labels[family].toLowerCase() + ' trân trọng kính mời<br>bạn đến dự lễ thành hôn của chúng mình';
    }
    window.dispatchEvent(new CustomEvent('wedding:sidechange', { detail: { family } }));
  }

  function animate(element, frames, options) {
    if (reduced.matches || !element || typeof element.animate !== 'function') return null;
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation.finished;
  }

  async function enter(family = selected) {
    if (leaving || !labels[family]) return;
    applyFamily(family);
    leaving = true;
    dialog.classList.add('is-leaving');
    choices.forEach(button => button.setAttribute('aria-disabled', 'true'));
    const transitions = [
      animate(dialog.querySelector('.entry-shell'), [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(-16px) scale(.98)' }
      ], { duration: 430, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }),
      animate(dialog, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-in', fill: 'forwards' })
    ].filter(Boolean);
    await Promise.allSettled(transitions);
    const firstEntry = !entered;
    entered = true;
    dialog.close();
    animations.forEach(animation => animation.cancel());
    animations.clear();
    dialog.classList.remove('is-leaving');
    choices.forEach(button => button.removeAttribute('aria-disabled'));
    root.classList.remove('entry-pending');
    leaving = false;
    if (firstEntry) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const title = document.getElementById('hero-title');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
      }
      const paper = document.querySelector('.invitation-paper');
      if (paper) {
        animate(paper, [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], {
          duration: 700,
          easing: 'cubic-bezier(.22,1,.36,1)',
          fill: 'none'
        });
      }
    } else {
      originFocus?.focus({ preventScroll: true });
    }
    window.dispatchEvent(new CustomEvent('wedding:entered', { detail: { family: selected } }));
  }

  function showChoice() {
    if (dialog.open || leaving) return;
    originFocus = document.activeElement;
    back.hidden = !entered;
    root.classList.add('entry-pending');

    if (introFinished) {
      dialog.classList.remove('is-intro-mode', 'is-morphing');
      dialog.classList.add('is-choice-mode');
    }
    dialog.showModal();
    choices.find(button => button.dataset.family === selected)?.focus({ preventScroll: true });
  }

  // ==========================================================================
  // VISUAL NOVEL TYPEWRITER CONTROLLER (3 CẢNH TRỰC TIẾP TRÊN NỀN ẢNH)
  // ==========================================================================
  const scenes = [
    document.getElementById('introScene0'),
    document.getElementById('introScene1'),
    document.getElementById('introScene2')
  ];

  const skipBtn = document.getElementById('btnSkipIntro');
  const tapZone = document.getElementById('introTapZone');

  const VERSE_TEXTS = [
    "“Có những cuộc gặp gỡ ngỡ như tình cờ,\nnhưng lại là sự an bài đẹp nhất của duyên số.”",
    "“Cùng nhau đi qua năm tháng, cùng sẻ chia từng nụ cười,\nmỗi khoảnh khắc có nhau đều trở thành kỷ niệm vô giá.”",
    "“Từ hai người xa lạ, ta tìm thấy bình yên nơi ánh mắt,\nvà nhận ra rằng: đối phương chính là bến đỗ trọn đời.”"
  ];

  let currentIdx = -1;
  let typingTimer = null;
  let autoTimer = null;
  let isTyping = false;
  let currentActiveVerseEl = null;
  let currentTargetText = '';
  let introFinished = false;

  function resolveAssetUrl(u) {
    if (!u) return '';
    if (/^(https?:|data:|blob:)/.test(u)) return u;
    if (u.startsWith('/')) return u;
    return '/' + u;
  }

  function updateResponsiveCover() {
    const db = window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};
    const couple = db.couple || {};
    const isMobile = window.innerWidth <= 600;

    const coverPc = resolveAssetUrl(couple.coverPhoto || couple.heroBackdrop || '/assets/cover-khanh-linh-le-dung.jpg');
    const coverMob = couple.coverPhotoMobile ? resolveAssetUrl(couple.coverPhotoMobile) : coverPc;

    const finalImg = document.getElementById('finalCoverImg');
    const finalSourceMob = document.getElementById('finalCoverSourceMobile');

    if (finalSourceMob) {
      finalSourceMob.srcset = coverMob;
    }
    if (finalImg) {
      finalImg.src = isMobile && coverMob ? coverMob : coverPc;
    }
  }

  function updateResponsiveIntroScenes() {
    const db = window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};
    const scs = Array.isArray(db.introScenes) ? db.introScenes : [];
    const isMobile = window.innerWidth <= 600;

    scs.forEach((sc, i) => {
      const targetBg = (isMobile && sc.backdropMobile) ? sc.backdropMobile : sc.backdrop;
      if (targetBg) {
        const backdropEl = scenes[i]?.querySelector('.scene-backdrop');
        if (backdropEl) {
          backdropEl.style.backgroundImage = `url('${resolveAssetUrl(targetBg)}')`;
        }
      }
    });
  }

  window.addEventListener('resize', () => {
    updateResponsiveCover();
    updateResponsiveIntroScenes();
  });

  function morphToChoice() {
    if (introFinished) return;
    introFinished = true;
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }

    updateResponsiveCover();

    // Transition dialog: Intro dark scene fades away, Choice Stage unveils smoothly
    dialog.classList.remove('is-intro-mode');
    dialog.classList.add('is-morphing');

    setTimeout(() => {
      dialog.classList.remove('is-morphing');
      dialog.classList.add('is-choice-mode');
      choices.find(button => button.dataset.family === selected)?.focus({ preventScroll: true });
    }, 700);
  }

  function advanceSlide() {
    if (introFinished) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= scenes.length) {
      morphToChoice();
      return;
    }
    renderSlide(nextIdx);
  }

  function instantCompleteTyping() {
    if (!isTyping || !currentActiveVerseEl) return false;
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    isTyping = false;

    const stream = currentActiveVerseEl.querySelector('.vn-text-stream');
    const caret = currentActiveVerseEl.querySelector('.vn-caret');
    if (stream) {
      stream.innerHTML = currentTargetText.replace(/\n/g, '<br>');
    }
    if (caret) {
      caret.classList.add('finished');
    }

    if (currentIdx === scenes.length - 1) {
      autoTimer = setTimeout(morphToChoice, 2500);
    } else {
      autoTimer = setTimeout(advanceSlide, 2200);
    }
    return true;
  }

  function typeWriter(element, fullText, onFinish) {
    if (typingTimer) clearTimeout(typingTimer);
    if (autoTimer) clearTimeout(autoTimer);

    currentActiveVerseEl = element;
    currentTargetText = fullText;
    isTyping = true;
    element.innerHTML = '';

    const stream = document.createElement('span');
    stream.className = 'vn-text-stream';
    const caret = document.createElement('span');
    caret.className = 'vn-caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.textContent = '|';

    element.appendChild(stream);
    element.appendChild(caret);

    let charIdx = 0;
    const speed = 36; // 36ms per char - smooth visual novel typing

    function step() {
      if (charIdx < fullText.length) {
        const ch = fullText.charAt(charIdx);
        if (ch === '\n') {
          stream.appendChild(document.createElement('br'));
        } else {
          stream.appendChild(document.createTextNode(ch));
        }
        charIdx++;
        typingTimer = setTimeout(step, speed);
      } else {
        isTyping = false;
        caret.classList.add('finished');
        if (typeof onFinish === 'function') {
          onFinish();
        }
      }
    }

    step();
  }

  function renderSlide(idx) {
    currentIdx = idx;
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }

    const db = window.WEDDING_DB || window.DEFAULT_WEDDING_DB || {};
    let text = VERSE_TEXTS[idx] || '';
    if (db.introScenes && db.introScenes[idx] && db.introScenes[idx].verse) {
      text = db.introScenes[idx].verse;
    }

    const isMobile = window.innerWidth <= 600;
    if (db.introScenes && db.introScenes[idx]) {
      const sc = db.introScenes[idx];
      const targetBg = (isMobile && sc.backdropMobile) ? sc.backdropMobile : sc.backdrop;
      if (targetBg) {
        const backdropEl = scenes[idx]?.querySelector('.scene-backdrop');
        if (backdropEl) backdropEl.style.backgroundImage = `url('${resolveAssetUrl(targetBg)}')`;
      }
    }

    const readingTime = (idx === scenes.length - 1) ? 2600 : 2200;

    // Cross-fade scene layers
    scenes.forEach((scene, i) => {
      if (!scene) return;
      if (i === idx) {
        scene.classList.add('active');
        scene.classList.remove('exiting');
      } else if (scene.classList.contains('active')) {
        scene.classList.remove('active');
        scene.classList.add('exiting');
      } else {
        scene.classList.remove('active', 'exiting');
      }
    });

    // Start typing
    const verseEl = document.getElementById(`typewriterVerse${idx}`);
    if (verseEl) {
      typeWriter(verseEl, text, () => {
        // Typing finished callback
        if (idx === scenes.length - 1) {
          autoTimer = setTimeout(morphToChoice, readingTime);
        } else {
          autoTimer = setTimeout(advanceSlide, readingTime);
        }
      });
    } else {
      const fallbackDuration = (text.length * 36) + readingTime;
      autoTimer = setTimeout(advanceSlide, fallbackDuration);
    }
  }

  function startIntro() {
    if (reduced.matches) {
      morphToChoice();
      return;
    }

    // Sync DB configurations if present
    const db = (typeof window.WEDDING_DB === 'object' && window.WEDDING_DB) || (typeof window.DEFAULT_WEDDING_DB === 'object' && window.DEFAULT_WEDDING_DB) || {};
    if (db.couple) {
      const bName = db.couple.brideName || 'Khánh Linh';
      const gName = db.couple.groomName || 'Lê Dũng';
      const finaleNames = document.querySelector('.intro-finale-names');
      if (finaleNames) {
        finaleNames.innerHTML = `<span>${bName}</span><em class="intro-finale-amp">&amp;</em><span>${gName}</span>`;
      }
    }

    // Preload all intro images (PC & Mobile) from DB into memory
    if (db.introScenes && Array.isArray(db.introScenes)) {
      db.introScenes.forEach(sc => {
        if (sc && sc.backdrop) {
          const img = new Image();
          img.src = resolveAssetUrl(sc.backdrop);
        }
        if (sc && sc.backdropMobile) {
          const imgMob = new Image();
          imgMob.src = resolveAssetUrl(sc.backdropMobile);
        }
      });
    }
    const coverPc = resolveAssetUrl((db.couple && (db.couple.coverPhoto || db.couple.heroBackdrop)) || '/assets/cover-khanh-linh-le-dung.jpg');
    if (coverPc) {
      const img = new Image();
      img.src = coverPc;
    }
    if (db.couple && db.couple.coverPhotoMobile) {
      const imgMob = new Image();
      imgMob.src = resolveAssetUrl(db.couple.coverPhotoMobile);
    }

    // Skip button triggers instant smooth morphing
    if (skipBtn) {
      skipBtn.addEventListener('click', e => {
        e.stopPropagation();
        morphToChoice();
      });
    }

    // Tap anywhere: if typing, instant finish; if already typed, advance immediately!
    if (tapZone) {
      tapZone.addEventListener('click', () => {
        if (isTyping) {
          instantCompleteTyping();
        } else {
          advanceSlide();
        }
      });
    }

    renderSlide(0);
  }

  async function bootEntrance() {
    if (typeof window.fetchWeddingDBFromServer === 'function') {
      try {
        const fresh = await window.fetchWeddingDBFromServer();
        if (fresh) {
          window.WEDDING_DB = fresh;
        }
      } catch (_) {}
    }
    startIntro();
  }

  // Listen for live DB updates from Admin Studio
  if (window.WEDDING_LIVE_CHANNEL) {
    window.WEDDING_LIVE_CHANNEL.addEventListener('message', ev => {
      if (ev.data && (ev.data.type === 'DB_UPDATED' || ev.data.type === 'STATE_CHANGED')) {
        if (typeof window.fetchWeddingDBFromServer === 'function') {
          window.fetchWeddingDBFromServer().then(fresh => {
            if (fresh) {
              window.WEDDING_DB = fresh;
              if (currentIdx >= 0 && !introFinished) {
                renderSlide(currentIdx);
              }
            }
          });
        }
      }
    });
  }

  try {
    if (!dialog || !back || typeof dialog.showModal !== 'function') throw new Error('Native dialog unavailable');
    choices.forEach(button => button.addEventListener('click', () => enter(button.dataset.family)));
    document.querySelectorAll('[data-change-side]').forEach(button => button.addEventListener('click', showChoice));
    back.addEventListener('click', () => enter());
    dialog.addEventListener('cancel', event => { event.preventDefault(); if (entered) enter(); });
    const stopMotion = () => { if (reduced.matches) { animations.forEach(animation => animation.cancel()); animations.clear(); } };
    if (reduced.addEventListener) reduced.addEventListener('change', stopMotion); else reduced.addListener(stopMotion);
    root.setAttribute('data-entry-ready', '');
    dialog.showModal();
    bootEntrance();
  } catch (_) {
    if (dialog?.open) dialog.close();
    root.classList.remove('entry-pending');
    document.querySelectorAll('[data-change-side]').forEach(node => node.hidden = true);
  }
})();
