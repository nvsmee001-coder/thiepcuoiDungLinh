/* Rhythmic photo interactions: thumbnail -> lightbox -> zoom -> thumbnail. */
(() => {
  'use strict';
  const dialog = document.getElementById('gallery-dialog');
  const image = document.getElementById('gallery-image');
  const surface = document.getElementById('gallery-zoom-surface');
  const zoomButton = document.getElementById('gallery-zoom-toggle');
  const hint = document.getElementById('gallery-hint');
  if (!dialog || !image || !surface || !zoomButton) return;
  let photos = [
    {src:'assets/memory-01-garden.jpg',alt:'Khánh Linh và Lê Dũng trong khu vườn hoa',caption:'01 / The two of us'},
    {src:'assets/memory-02-castle.jpg',alt:'Khánh Linh và Lê Dũng trước lâu đài',caption:'02 / Always you'},
    {src:'assets/memory-03-piano.jpg',alt:'Khánh Linh và Lê Dũng bên đàn piano',caption:'03 / Forever starts here'}
  ];
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.22,1,.36,1)';
  let thumbs = [...document.querySelectorAll('[data-photo-index]')];
  const cache = new Map();
  const running = new Set();
  let index = 0, serial = 0, closing = false, zoomed = false, busy = false;
  let sourceButton = null, sourceGroup = null, imageAnimation = null;
  let panFrame = 0, panX = 0, panY = 0, drag = null, suppressClickUntil = 0, touchStart = null;

  function run(element, frames, options) {
    if (media.matches || typeof element.animate !== 'function') return null;
    const animation = element.animate(frames, options);
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    return animation;
  }
  function clearPictureMotion() {
    if (imageAnimation) imageAnimation.cancel();
    imageAnimation = null;
    dialog.querySelectorAll('.gallery-outgoing').forEach(node => node.remove());
  }
  function cancelAll() {
    running.forEach(animation => animation.cancel()); running.clear(); clearPictureMotion();
    if (panFrame) cancelAnimationFrame(panFrame); panFrame = 0;
  }
  function preload(src) {
    if (!cache.has(src)) cache.set(src, new Promise(resolve => {
      const photo = new Image();
      photo.onload = () => { if (photo.decode) photo.decode().catch(() => {}).then(resolve); else resolve(); };
      photo.onerror = resolve; photo.src = src;
    }));
    return cache.get(src);
  }
  function setBusy(value) {
    busy = value; dialog.setAttribute('aria-busy', String(value)); zoomButton.disabled = value;
  }
  function resetPan() {
    panX = 0; panY = 0; drag = null;
    dialog.classList.remove('is-panning');
    if (panFrame) cancelAnimationFrame(panFrame); panFrame = 0;
    image.style.setProperty('--pan-x','0px'); image.style.setProperty('--pan-y','0px');
  }
  function updateZoom(value, immediate = false) {
    zoomed = value; resetPan(); clearPictureMotion();
    if (immediate) image.style.transition = 'none';
    dialog.classList.toggle('is-zoomed', value);
    surface.setAttribute('aria-pressed',String(value)); zoomButton.setAttribute('aria-pressed',String(value));
    surface.setAttribute('aria-label',value ? 'Thu nhỏ ảnh' : 'Phóng to ảnh');
    zoomButton.innerHTML = value ? 'Thu nhỏ <span>−</span>' : 'Phóng to <span>＋</span>';
    hint.textContent = value ? 'Kéo hoặc dùng phím mũi tên để xem ảnh · Chạm để thu nhỏ' : 'Chạm ảnh để phóng to · Vuốt hoặc dùng ← → để chuyển ảnh';
    if (immediate) { image.getBoundingClientRect(); image.style.transition = ''; }
  }
  function setCaption() {
    document.getElementById('gallery-caption').textContent = photos[index].caption;
    document.getElementById('gallery-counter').textContent = (index+1)+' / '+photos.length;
    thumbs.forEach((button,i) => { button.classList.toggle('is-current',i === index); button.setAttribute('aria-pressed',String(i === index)); });
  }
  function sourceForCurrent() {
    return sourceGroup?.querySelector('[data-gallery="'+index+'"]') || sourceButton;
  }
  function outgoingClone(rect) {
    const ghost = image.cloneNode(); ghost.removeAttribute('id'); ghost.className = 'gallery-outgoing'; ghost.alt = '';
    ghost.setAttribute('aria-hidden','true');
    Object.assign(ghost.style,{position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',maxWidth:'none',maxHeight:'none',objectFit:'contain',pointerEvents:'none',zIndex:'4'});
    dialog.appendChild(ghost); return ghost;
  }
  async function selectPhoto(next, options = {}) {
    if (closing) return;
    const ticket = ++serial;
    const oldIndex = index;
    index = (Number(next)+photos.length)%photos.length;
    const direction = options.direction || (index >= oldIndex ? 1 : -1);
    const opening = Boolean(options.opening);
    setBusy(true); clearPictureMotion(); updateZoom(false,true);
    await preload(photos[index].src);
    if (ticket !== serial || !dialog.open || closing) return;
    let ghost;
    if (!opening && !media.matches && image.complete && image.naturalWidth && image.src.endsWith(photos[index].src.split('/').pop()) === false) {
      ghost = outgoingClone(image.getBoundingClientRect());
      const fade = run(ghost,[{opacity:1,transform:'translate3d(0,0,0) scale(1)'},{opacity:0,transform:'translate3d('+(-direction*30)+'px,0,0) scale(.94) rotateY('+(-direction*4)+'deg)'}],{duration:380,easing:ease,fill:'forwards'});
      if (fade) fade.finished.then(()=>ghost.remove(),()=>ghost.remove()); else ghost.remove();
    }
    image.src = photos[index].src; image.alt = photos[index].alt;
    try { if (image.decode) await image.decode(); } catch (_) { /* Keep the descriptive alt and controls available. */ }
    if (ticket !== serial || !dialog.open || closing) return;
    setCaption(); setBusy(false);
    if (!media.matches) {
      const rect = image.getBoundingClientRect();
      if (opening && options.from && rect.width && rect.height) {
        const from = options.from, dx=from.left+from.width/2-rect.left-rect.width/2,dy=from.top+from.height/2-rect.top-rect.height/2;
        const scale = Math.max(.08,Math.min(.95,from.width/rect.width));
        imageAnimation = run(image,[{opacity:.5,transform:'translate3d('+dx+'px,'+dy+'px,0) scale('+scale+') rotateZ(-2deg)'},{opacity:1,transform:'translate3d(0,0,0) scale(1) rotateZ(0deg)'}],{duration:760,easing:ease,fill:'none'});
      } else {
        imageAnimation = run(image,[{opacity:.15,transform:'perspective(1200px) translate3d('+(direction*28)+'px,0,0) scale(1.075) rotateY('+(direction*4)+'deg)'},{opacity:1,transform:'perspective(1200px) translate3d(0,0,0) scale(1) rotateY(0deg)'}],{duration:680,easing:ease,fill:'none'});
      }
    }
    preload(photos[(index+1)%photos.length].src);
  }
  function openGallery(button) {
    if (dialog.open || closing) return;
    sourceButton = button; sourceGroup = button.closest('.arrival-photos, .album-grid');
    const thumb = button.querySelector('img'); const from = thumb?.getBoundingClientRect();
    if (!media.matches && thumb) run(thumb,[{transform:'scale(1)'},{transform:'scale(.96)',offset:.35},{transform:'scale(1)'}],{duration:330,easing:ease});
    document.documentElement.classList.add('gallery-active');
    dialog.classList.remove('is-closing'); dialog.classList.add('is-opening'); dialog.showModal();
    run(dialog,[{opacity:0},{opacity:1}],{duration:250,easing:'ease-out'});
    selectPhoto(button.dataset.gallery,{opening:true,from}).catch(()=>setBusy(false));
  }
  async function closeGallery() {
    if (!dialog.open || closing) return;
    const pendingPhoto = busy;
    closing = true; ++serial;
    const initialTransform = getComputedStyle(image).transform;
    cancelAll(); updateZoom(false,true); dialog.classList.add('is-closing');
    const targetButton = sourceForCurrent(); const target = targetButton?.querySelector('img')?.getBoundingClientRect();
    const rect = image.getBoundingClientRect(); const animations = [];
    if (!pendingPhoto && !media.matches && rect.width && target?.width && target.bottom>0 && target.top<innerHeight) {
      const dx = target.left+target.width/2-rect.left-rect.width/2,dy=target.top+target.height/2-rect.top-rect.height/2;
      const scale = Math.max(.08,Math.min(1,target.width/rect.width));
      const flight = run(image,[{opacity:1,transform:initialTransform === 'none' ? 'scale(1)' : initialTransform},{opacity:.1,transform:'translate3d('+dx+'px,'+dy+'px,0) scale('+scale+')'}],{duration:460,easing:'cubic-bezier(.45,0,.55,1)',fill:'forwards'});
      if (flight) animations.push(flight.finished);
    }
    const fade = run(dialog,[{opacity:1},{opacity:0}],{duration:400,delay:60,easing:'ease-in',fill:'forwards'});
    if (fade) animations.push(fade.finished);
    await Promise.allSettled(animations);
    if (dialog.open) dialog.close();
    if (targetButton?.isConnected) targetButton.focus({preventScroll:true});
  }

  function rebindGalleryElements() {
    thumbs = [...document.querySelectorAll('[data-photo-index]')];
    thumbs.forEach(button => {
      button.onclick = () => selectPhoto(button.dataset.photoIndex).catch(() => setBusy(false));
    });
    document.querySelectorAll('[data-gallery]').forEach(button => {
      button.onclick = () => openGallery(button);
    });
  }

  window.syncGalleryPhotos = function(newPhotos) {
    if (Array.isArray(newPhotos) && newPhotos.length > 0) {
      photos = newPhotos;
    }
    rebindGalleryElements();
  };

  window.openWeddingGalleryIndex = function(targetIdx) {
    const idx = Math.max(0, Math.min((photos.length || 1) - 1, Number(targetIdx) || 0));
    if (dialog.open) {
      selectPhoto(idx).catch(() => setBusy(false));
      return;
    }
    const btn = document.querySelector(`[data-gallery="${idx}"]`) || document.querySelector(`[data-photo-index="${idx}"]`);
    if (btn) {
      openGallery(btn);
    } else {
      const dummy = document.createElement('button');
      dummy.dataset.gallery = String(idx);
      openGallery(dummy);
    }
  };

  rebindGalleryElements();
  dialog.querySelector('[data-close="gallery-dialog"]').addEventListener('click',closeGallery);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeGallery();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeGallery();});
  dialog.addEventListener('close',()=>{
    ++serial; cancelAll(); closing=false; setBusy(false); updateZoom(false,true);
    dialog.classList.remove('is-closing','is-opening'); document.documentElement.classList.remove('gallery-active');
  });
  document.querySelector('.gallery-prev').addEventListener('click',()=>selectPhoto(index-1,{direction:-1}).catch(()=>setBusy(false)));
  document.querySelector('.gallery-next').addEventListener('click',()=>selectPhoto(index+1,{direction:1}).catch(()=>setBusy(false)));
  thumbs.forEach(button=>button.addEventListener('click',()=>selectPhoto(button.dataset.photoIndex).catch(()=>setBusy(false))));
  function toggleZoom() { if (!busy && !closing && performance.now()>=suppressClickUntil) updateZoom(!zoomed); }
  surface.addEventListener('click',toggleZoom); zoomButton.addEventListener('click',toggleZoom);
  dialog.addEventListener('keydown',event=>{
    if (closing) return;
    if (zoomed && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const limitX=Math.min(180,image.offsetWidth*.38), limitY=Math.min(150,image.offsetHeight*.35);
      panX=Math.max(-limitX,Math.min(limitX,panX+(event.key==='ArrowLeft'?45:event.key==='ArrowRight'?-45:0)));
      panY=Math.max(-limitY,Math.min(limitY,panY+(event.key==='ArrowUp'?45:event.key==='ArrowDown'?-45:0)));
      applyPan(); return;
    }
    if (event.key==='ArrowLeft'||event.key==='ArrowRight') {event.preventDefault();selectPhoto(index+(event.key==='ArrowRight'?1:-1),{direction:event.key==='ArrowRight'?1:-1}).catch(()=>setBusy(false));}
    if (['+','=','-'].includes(event.key)) {event.preventDefault();if(!busy)updateZoom(event.key!=='-');}
  });
  function applyPan() {panFrame=0;image.style.setProperty('--pan-x',panX.toFixed(2)+'px');image.style.setProperty('--pan-y',panY.toFixed(2)+'px');}
  surface.addEventListener('pointerdown',event=>{
    if(!zoomed||closing)return;
    drag={x:event.clientX,y:event.clientY,panX,panY,moved:false};surface.setPointerCapture(event.pointerId);dialog.classList.add('is-panning');
  });
  surface.addEventListener('pointermove',event=>{
    if(!drag||!zoomed)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.hypot(dx,dy)>6)drag.moved=true;
    const limitX=Math.min(180,image.offsetWidth*.38),limitY=Math.min(150,image.offsetHeight*.35);
    panX=Math.max(-limitX,Math.min(limitX,drag.panX+dx*.75));panY=Math.max(-limitY,Math.min(limitY,drag.panY+dy*.75));
    if(!panFrame)panFrame=requestAnimationFrame(applyPan);
  });
  function endPan(){if(drag?.moved)suppressClickUntil=performance.now()+300;drag=null;dialog.classList.remove('is-panning');}
  surface.addEventListener('pointerup',endPan);surface.addEventListener('pointercancel',endPan);surface.addEventListener('lostpointercapture',endPan);
  dialog.addEventListener('touchstart',event=>{if(!zoomed)touchStart={x:event.changedTouches[0].clientX,y:event.changedTouches[0].clientY};},{passive:true});
  dialog.addEventListener('touchend',event=>{
    if(!touchStart||zoomed){touchStart=null;return;}
    const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;touchStart=null;
    if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.25){suppressClickUntil=performance.now()+300;selectPhoto(index+(dx<0?1:-1),{direction:dx<0?1:-1}).catch(()=>setBusy(false));}
  },{passive:true});
  const motionChanged=()=>{if(media.matches){cancelAll();updateZoom(false,true);if(closing&&dialog.open)dialog.close();}};
  if(media.addEventListener)media.addEventListener('change',motionChanged);else media.addListener(motionChanged);
})();
