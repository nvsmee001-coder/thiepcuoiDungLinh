/* Progressive, optional motion. All content and controls work without this file. */
(() => {
  'use strict';

  function startMotion() {
    const body = document.body;
    if (!body || body.classList.contains('motion-ready')) return;

    const reveals = [...document.querySelectorAll('[data-reveal]')];
    const parallax = [...document.querySelectorAll('[data-parallax]')];
    const progress = document.getElementById('reading-progress');
    const header = document.querySelector('.site-header');
    const storyPanel = document.getElementById('story-panel');
    const sectionIds = ['home', 'journey', 'celebration', 'album'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
    const navLinks = [...document.querySelectorAll('.site-header nav a[href^="#"]')]
      .filter(link => sectionIds.includes(link.hash.slice(1)));
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopMedia = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
    const animations = new Map();
    let reduced = motionMedia.matches;
    let frame = 0;
    let needsMeasure = true;
    let documentHeight = 1;
    let sectionPositions = [];
    let activeId = '';
    let pointer = { x: 0, y: 0 };
    let parallaxDirty = true;
    let storyPending = false;
    let eventPending = false;
    let revealObserver;

    const revealAll = () => reveals.forEach(element => element.classList.add('is-revealed'));
    const canParallax = () => !reduced && desktopMedia.matches;
    const queueFrame = () => {
      if (!frame) frame = window.requestAnimationFrame(updateFrame);
    };
    const queueMeasurement = () => { needsMeasure = true; queueFrame(); };

    function measure() {
      documentHeight = Math.max(document.documentElement.scrollHeight, body.scrollHeight);
      const scrollY = window.scrollY || 0;
      sectionPositions = sections.map(element => ({
        id: element.id,
        top: element.getBoundingClientRect().top + scrollY
      })).sort((a, b) => a.top - b.top);
      needsMeasure = false;
    }

    function updateNav(scrollY) {
      const readingLine = scrollY + window.innerHeight * 0.32;
      let next = sectionPositions[0]?.id || '';
      sectionPositions.forEach(section => { if (section.top <= readingLine) next = section.id; });
      if (scrollY + window.innerHeight >= documentHeight - 4 && sectionPositions.length) {
        next = sectionPositions[sectionPositions.length - 1].id;
      }
      if (next === activeId) return;
      activeId = next;
      navLinks.forEach(link => {
        const active = link.hash === '#' + next;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    function updateParallax() {
      const enabled = canParallax();
      parallax.forEach(element => {
        const parsed = Number.parseFloat(element.dataset.parallax);
        const factor = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1;
        const x = enabled ? Math.max(-12, Math.min(12, pointer.x * 12 * factor)) : 0;
        const y = enabled ? Math.max(-12, Math.min(12, pointer.y * 12 * factor)) : 0;
        element.style.setProperty('--mx', x.toFixed(2) + 'px');
        element.style.setProperty('--my', y.toFixed(2) + 'px');
        element.style.setProperty('--rx', (-y * 0.15).toFixed(2) + 'deg');
        element.style.setProperty('--ry', (x * 0.2).toFixed(2) + 'deg');
      });
      parallaxDirty = false;
    }

    function animateEntrance(element, index = 0, distance = 18) {
      if (!element || reduced || typeof element.animate !== 'function') return;
      const previous = animations.get(element);
      if (previous) previous.cancel();
      const animation = element.animate([
        { opacity: 0.25, transform: 'translate3d(0,' + distance + 'px,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)' }
      ], { duration: 480, delay: index * 55, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      animations.set(element, animation);
      animation.finished.then(() => {
        if (animations.get(element) === animation) animations.delete(element);
      }).catch(() => { /* A newer selection or reduced-motion preference cancelled it. */ });
    }

    function animateStory() {
      if (!storyPanel || reduced) return;
      const bounds = storyPanel.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const targets = [...storyPanel.querySelectorAll('.story-photo, .story-copy')];
      (targets.length ? targets : [storyPanel]).forEach((element, index) => animateEntrance(element, index, 22));
    }

    function animateEvent() {
      document.querySelectorAll('.event-panel').forEach(panel => {
        const previous = animations.get(panel);
        if (previous) { previous.cancel(); animations.delete(panel); }
        if (!panel.hidden) animateEntrance(panel, 0, 14);
      });
    }

    function updateFrame() {
      frame = 0;
      if (needsMeasure) measure();
      const scrollY = Math.max(0, window.scrollY || 0);
      if (progress) {
        const range = Math.max(1, documentHeight - window.innerHeight);
        const amount = Math.max(0, Math.min(1, scrollY / range));
        progress.style.transform = 'scaleX(' + amount.toFixed(4) + ')';
      }
      if (header) header.classList.toggle('is-scrolled', scrollY > 30);
      updateNav(scrollY);
      if (parallaxDirty) updateParallax();
      if (storyPending) { storyPending = false; animateStory(); }
      if (eventPending) { eventPending = false; animateEvent(); }
    }

    function changeMotionPreference() {
      reduced = motionMedia.matches;
      body.classList.toggle('motion-reduced', reduced);
      if (reduced) {
        animations.forEach(animation => animation.cancel());
        animations.clear();
        revealAll();
        if (revealObserver) revealObserver.disconnect();
      }
      pointer = { x: 0, y: 0 };
      parallaxDirty = true;
      queueFrame();
    }

    function resetPointer() {
      pointer = { x: 0, y: 0 };
      parallaxDirty = true;
      queueFrame();
    }

    function listenMedia(media, listener) {
      if (typeof media.addEventListener === 'function') media.addEventListener('change', listener);
      else if (typeof media.addListener === 'function') media.addListener(listener);
    }

    try {
      body.classList.toggle('motion-reduced', reduced);
      if (!reduced && 'IntersectionObserver' in window) {
        revealObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
        reveals.forEach(element => {
          const bounds = element.getBoundingClientRect();
          // Keep the first screen and any restored scroll position visible at setup.
          if (bounds.top < window.innerHeight && bounds.bottom > 0) element.classList.add('is-revealed');
          else revealObserver.observe(element);
        });
      } else revealAll();

      const petalField = document.getElementById('petal-field');
      if (petalField) {
        petalField.setAttribute('aria-hidden', 'true');
        if (!petalField.children.length) {
          const fragment = document.createDocumentFragment();
          for (let index = 0; index < 12; index += 1) {
            const petal = document.createElement('span');
            petal.className = 'petal';
            petal.setAttribute('aria-hidden', 'true');
            petal.style.setProperty('--petal-x', ((index * 29 + 7) % 100) + '%');
            petal.style.setProperty('--petal-size', (7 + index % 7) + 'px');
            petal.style.setProperty('--petal-delay', (-index * 1.7).toFixed(1) + 's');
            petal.style.setProperty('--petal-duration', (15 + index % 6 * 2) + 's');
            petal.style.setProperty('--petal-drift', ((index % 5 - 2) * 28) + 'px');
            petal.style.setProperty('--petal-spin', (120 + index * 17) + 'deg');
            petal.style.setProperty('--petal-opacity', (0.2 + index % 4 * 0.06).toFixed(2));
            fragment.appendChild(petal);
          }
          petalField.appendChild(fragment);
        }
      }

      window.addEventListener('scroll', queueFrame, { passive: true });
      window.addEventListener('resize', queueMeasurement, { passive: true });
      window.addEventListener('load', queueMeasurement, { once: true });
      window.addEventListener('pageshow', queueMeasurement);
      window.addEventListener('blur', resetPointer);
      document.documentElement.addEventListener('pointerleave', resetPointer);
      document.addEventListener('visibilitychange', () => { if (document.hidden) resetPointer(); });
      window.addEventListener('pointermove', event => {
        if (!canParallax() || event.pointerType === 'touch') return;
        pointer = {
          x: Math.max(-1, Math.min(1, event.clientX / Math.max(1, window.innerWidth) * 2 - 1)),
          y: Math.max(-1, Math.min(1, event.clientY / Math.max(1, window.innerHeight) * 2 - 1))
        };
        parallaxDirty = true;
        queueFrame();
      }, { passive: true });
      document.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest('[data-story], #next-story')) storyPending = true;
        if (event.target.closest('[data-event]')) eventPending = true;
        if (storyPending || eventPending) queueMeasurement();
      });
      document.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !(event.target instanceof Element)) return;
        if (event.target.closest('.journey-tabs')) storyPending = true;
        if (event.target.closest('.event-tabs')) eventPending = true;
        if (storyPending || eventPending) queueMeasurement();
      });
      listenMedia(motionMedia, changeMotionPreference);
      listenMedia(desktopMedia, resetPointer);
      if ('ResizeObserver' in window) new ResizeObserver(queueMeasurement).observe(body);

      // Add the CSS enhancement gate only after fallbacks and observers exist.
      updateFrame();
      body.classList.add('motion-ready');
    } catch (_) {
      // CSS must leave its default content visible if an optional API fails.
      body.classList.remove('motion-ready');
      revealAll();
      animations.forEach(animation => animation.cancel());
      if (revealObserver) revealObserver.disconnect();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startMotion, { once: true });
  else startMotion();
})();
