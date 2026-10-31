/* Optional Hanoi → Shanghai scene. The inline album is the no-JavaScript fallback. */
(() => {
  'use strict';

  function initializeTravel() {
    const stage = document.getElementById('travel-stage');
    const album = document.getElementById('travel-album');
    if (!stage || !album) return;
    const canvas = document.getElementById('travel-globe');
    const track = document.getElementById('travel-route-track');
    const route = document.getElementById('travel-route-progress');
    const contrail = document.getElementById('travel-contrail');
    const arrivalRings = [document.getElementById('travel-arrival-ring'), document.getElementById('travel-arrival-ring-two')];
    const originDot = document.getElementById('travel-origin-dot');
    const destinationDot = document.getElementById('travel-destination-dot');
    const plane = document.getElementById('travel-plane');
    const originLabel = document.getElementById('travel-hanoi');
    const destinationLabel = document.getElementById('travel-shanghai');
    const startButton = document.getElementById('travel-start');
    const skipButton = document.getElementById('travel-skip');
    const status = document.getElementById('travel-status');
    const width = 1000, height = 600, duration = 3600, flightDuration = 3150, rad = Math.PI / 180;
    const boardingEnd = duration * (340 / 6300), takeoffEnd = duration * (1400 / 6300), landingStart = duration * (4300 / 6300);
    const origin = [105.854, 21.028], destination = [121.474, 31.230];
    let context;
    let state = 'idle';
    let elapsed = 0;
    let previousTime = null;
    let raf = 0;
    let ready = false;
    let autoStarted = false;
    let meaningfullyVisible = false;
    let needsResize = true;
    let globeDirty = true;
    let lastRasterTime = -Infinity;
    let observer;
    let geometry = { scaleX: 1, scaleY: 1, left: 0, top: 0, width, height, planeWidth: 70, planeHeight: 86 };
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motionMedia.matches;
    const entryPending = () => document.documentElement.classList.contains('entry-pending');
    let wasEntryPending = entryPending();

    const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
    const mix = (from, to, amount) => from + (to - from) * amount;
    const smoother = value => { const t = clamp(value, 0, 1); return t * t * t * (10 + t * (-15 + t * 6)); };
    const vector = ([longitude, latitude]) => {
      const lon = longitude * rad, lat = latitude * rad;
      return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
    };
    const convertPolygon = polygon => polygon.map(ring => ring.map(vector));
    // A local Asian silhouette keeps the route usable even without map data.
    const land = [convertPolygon([[[35, 36], [43, 48], [60, 57], [80, 70], [113, 72], [145, 60], [164, 58], [145, 46], [138, 35], [127, 39], [122, 31], [120, 25], [111, 20], [108, 10], [101, 1], [98, 15], [90, 22], [80, 8], [71, 24], [57, 25], [45, 31], [35, 36]]])];
    let landGeo = null;

    function stopFrame() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      previousTime = null;
    }

    function exposeAlbum() {
      album.hidden = false;
      album.inert = false;
      album.removeAttribute('inert');
      album.setAttribute('aria-hidden', 'false');
    }

    function failOpen() {
      stopFrame();
      state = 'arrived';
      ready = false;
      autoStarted = true;
      if (observer) observer.disconnect();
      exposeAlbum();
      stage.classList.remove('travel-ready');
      stage.classList.add('is-arrived');
      stage.dataset.state = 'arrived';
      stage.dataset.phase = 'arrived';
      stage.style.setProperty('--flight-progress', '1');
      stage.style.setProperty('--camera-progress', '1');
      stage.style.setProperty('--flight-elevation', '0');
      stage.style.setProperty('--flight-speed', '0');
      stage.style.setProperty('--landing-progress', '1');
      if (contrail) contrail.style.opacity = '0';
      arrivalRings.forEach(ring => { if (ring) ring.style.opacity = '0'; });
      if (startButton) startButton.disabled = true;
      if (skipButton) skipButton.disabled = true;
      if (status) status.textContent = 'Hà Nội → Shanghai · Mở những kỷ niệm của chúng mình.';
    }

    function setState(next) {
      state = next;
      const arrived = next === 'arrived';
      stage.dataset.state = next;
      stage.dataset.phase = arrived ? 'arrived' : 'boarding';
      stage.classList.toggle('is-arrived', arrived);
      album.hidden = false;
      album.inert = !arrived;
      if (arrived) album.removeAttribute('inert');
      else album.setAttribute('inert', '');
      album.setAttribute('aria-hidden', String(!arrived));
      startButton.textContent = next === 'idle' ? 'Bắt đầu chuyến đi' : next === 'flying' ? 'Bay lại từ đầu' : 'Xem lại chuyến bay';
      status.textContent = next === 'flying'
        ? 'Hà Nội · Chuẩn bị cho một hành trình mới…'
        : arrived ? 'Đã đến Shanghai. Chạm một tấm ảnh để mở kỷ niệm.' : 'Hà Nội → Shanghai · Cùng nhau bắt đầu chuyến đi.';
    }

    function resize() {
      // client/offset dimensions exclude the CSS arrival camera transform.
      const stageWidth = stage.clientWidth || width;
      const stageHeight = stage.clientHeight || height;
      const bottomline = stage.querySelector('.travel-bottomline');
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      geometry = {
        scaleX: (canvas.clientWidth || stageWidth) / width,
        scaleY: (canvas.clientHeight || stageHeight) / height,
        left: canvas.offsetLeft || 0,
        top: canvas.offsetTop || 0,
        width: stageWidth,
        height: stageHeight,
        bottomReserve: (bottomline?.offsetHeight || 60) + 30,
        planeWidth: plane.offsetWidth || 70,
        planeHeight: plane.offsetHeight || 86,
        originWidth: originLabel.offsetWidth || (window.innerWidth < 600 ? 105 : 130),
        originHeight: originLabel.offsetHeight || 68,
        destinationWidth: destinationLabel.offsetWidth || (window.innerWidth < 600 ? 105 : 130),
        destinationHeight: destinationLabel.offsetHeight || 68
      };
      needsResize = false;
      globeDirty = true;
    }

    function cameraAt(progress) {
      const cameraProgress = smoother(progress);
      const zoomIn = smoother(progress / 0.9);
      const settle = smoother((progress - 0.9) / 0.1);
      const anticipation = Math.sin(Math.PI * cameraProgress);
      const lon = (mix(112, 113, cameraProgress) + anticipation * 0.12) * rad;
      const lat = (mix(25, 20, cameraProgress) + anticipation * 0.15) * rad;
      const compact = geometry.width <= 600;
      const initialRadius = compact ? 470 : 360;
      const finalRadius = compact ? 540 : 500;
      return {
        x: 500, y: (compact ? 318 : 400) - anticipation * 6,
        radius: initialRadius + (finalRadius - initialRadius + 10) * zoomIn - 10 * settle,
        sphereAspect: geometry.scaleX / Math.max(0.001, geometry.scaleY),
        sinLon: Math.sin(lon), cosLon: Math.cos(lon), sinLat: Math.sin(lat), cosLat: Math.cos(lat),
        progress: cameraProgress
      };
    }

    function view(point, camera) {
      const [x, y, z] = point;
      const horizontal = camera.cosLon * x + camera.sinLon * y;
      return { x: -camera.sinLon * x + camera.cosLon * y,
        y: camera.cosLat * z - camera.sinLat * horizontal,
        z: camera.sinLat * z + camera.cosLat * horizontal };
    }

    function project(point, camera) {
      const p = view(point, camera);
      return { x: camera.x + p.x * camera.radius, y: camera.y - p.y * camera.radius, z: p.z };
    }

    function landRing(ring, camera) {
      const points = ring.map(point => view(point, camera));
      if (!points.some(point => point.z >= 0)) return false;
      // Keep the actual front-facing outline. Back-facing vertices clamp to
      // the rim instead of introducing a limb arc with ambiguous winding.
      points.forEach((point, index) => {
        let x = point.x, y = point.y;
        if (point.z < 0) {
          const length = Math.hypot(x, y) || 1;
          x /= length; y /= length;
        }
        const screenX = camera.x + x * camera.radius;
        const screenY = camera.y - y * camera.radius;
        if (index === 0) context.moveTo(screenX, screenY);
        else context.lineTo(screenX, screenY);
      });
      context.closePath();
      return true;
    }

    function graticule(points, camera) {
      let pen = false;
      context.beginPath();
      points.forEach(point => {
        const p = project(point, camera);
        if (p.z < 0) { pen = false; return; }
        if (pen) context.lineTo(p.x, p.y);
        else context.moveTo(p.x, p.y);
        pen = true;
      });
      context.stroke();
    }

    const graticules = [];
    for (let lat = -60; lat <= 60; lat += 20) {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 3) points.push(vector([lon, lat]));
      graticules.push(points);
    }
    for (let lon = -180; lon < 180; lon += 20) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += 3) points.push(vector([lon, lat]));
      graticules.push(points);
    }

    function drawGlobe(camera) {
      const c = context;
      c.clearRect(0, 0, width, height);
      // The canvas intentionally fills a responsive rectangle. Compensate that
      // CSS stretch so projected land, graticules and the rim remain a sphere.
      c.save();
      c.translate(camera.x, camera.y);
      c.scale(1, camera.sphereAspect);
      c.translate(-camera.x, -camera.y);
      c.save();
      c.shadowColor = 'rgba(38,58,38,.18)'; c.shadowBlur = 30; c.shadowOffsetY = 14;
      const ocean = c.createRadialGradient(camera.x - camera.radius * 0.45, camera.y - camera.radius * 0.6, 20, camera.x, camera.y, camera.radius * 1.25);
      ocean.addColorStop(0, '#9ba78a'); ocean.addColorStop(0.58, '#798e6c'); ocean.addColorStop(1, '#405b46');
      c.beginPath(); c.arc(camera.x, camera.y, camera.radius, 0, Math.PI * 2); c.fillStyle = ocean; c.fill(); c.restore();
      c.save(); c.beginPath(); c.arc(camera.x, camera.y, camera.radius - 0.3, 0, Math.PI * 2); c.clip();
      c.fillStyle = '#e2e3c8'; c.strokeStyle = 'rgba(245,241,211,.44)'; c.lineWidth = 0.75;
      if (landGeo && window.d3?.geoOrthographic && window.d3?.geoPath) {
        const projection = window.d3.geoOrthographic()
          .translate([camera.x, camera.y])
          .scale(camera.radius)
          .rotate([-Math.atan2(camera.sinLon, camera.cosLon) / rad, -Math.asin(camera.sinLat) / rad])
          .clipAngle(90)
          .precision(0.35);
        c.beginPath();
        window.d3.geoPath(projection, c)(landGeo);
        c.fill('evenodd'); c.stroke();
      } else {
        land.forEach(polygon => {
          c.beginPath();
          let visible = false;
          polygon.forEach(ring => { visible = landRing(ring, camera) || visible; });
          if (visible) { c.fill('evenodd'); c.stroke(); }
        });
      }
      c.strokeStyle = 'rgba(247,246,218,.15)'; c.lineWidth = 0.7;
      graticules.forEach(points => graticule(points, camera));
      const shade = c.createRadialGradient(camera.x - camera.radius * 0.4, camera.y - camera.radius * 0.6, 10, camera.x + camera.radius * 0.15, camera.y + camera.radius * 0.1, camera.radius * 1.15);
      shade.addColorStop(0, 'rgba(255,250,222,.16)'); shade.addColorStop(0.6, 'rgba(26,53,33,0)'); shade.addColorStop(1, 'rgba(20,43,27,.32)');
      c.fillStyle = shade;
      c.fillRect(camera.x - camera.radius, camera.y - camera.radius, camera.radius * 2, camera.radius * 2);
      c.restore();
      c.beginPath(); c.arc(camera.x, camera.y, camera.radius, 0, Math.PI * 2); c.strokeStyle = 'rgba(250,249,224,.38)'; c.lineWidth = 1.1; c.stroke();
      c.restore();
    }

    function cubicPoint(points, t) {
      const u = 1 - t;
      return { x: u ** 3 * points[0].x + 3 * u * u * t * points[1].x + 3 * u * t * t * points[2].x + t ** 3 * points[3].x,
        y: u ** 3 * points[0].y + 3 * u * u * t * points[1].y + 3 * u * t * t * points[2].y + t ** 3 * points[3].y };
    }

    function cubicTangent(points, t) {
      const u = 1 - t;
      return { x: 3 * u * u * (points[1].x - points[0].x) + 6 * u * t * (points[2].x - points[1].x) + 3 * t * t * (points[3].x - points[2].x),
        y: 3 * u * u * (points[1].y - points[0].y) + 6 * u * t * (points[2].y - points[1].y) + 3 * t * t * (points[3].y - points[2].y) };
    }

    function flightAt(progress) {
      const time = progress * duration, u = clamp(time / flightDuration, 0, 1);
      const integratedRamp = x => 2.5 * x ** 4 - 3 * x ** 5 + x ** 6;
      const distance = u < 0.2 ? 0.25 * integratedRamp(5 * u)
        : u > 0.8 ? 1 - 0.25 * integratedRamp(5 * (1 - u)) : (u - 0.1) / 0.8;
      const speed = u < 0.2 ? smoother(5 * u) : u > 0.8 ? smoother(5 * (1 - u)) : 1;
      const elevation = 16 * distance * distance * (1 - distance) * (1 - distance);
      return {
        distance, speed, elevation,
        settle: smoother((time - flightDuration) / (duration - flightDuration)),
        landing: smoother((time - landingStart) / (duration - landingStart)),
        phase: time >= duration ? 'arrived' : time < boardingEnd ? 'boarding' : time < takeoffEnd ? 'takeoff' : time < landingStart ? 'cruise' : 'landing'
      };
    }

    function curveMetrics(points) {
      const samples = [{ t: 0, physical: 0, logical: 0 }];
      let previous = points[0], physical = 0, logical = 0;
      for (let index = 1; index <= 64; index += 1) {
        const t = index / 64, point = cubicPoint(points, t);
        const dx = point.x - previous.x, dy = point.y - previous.y;
        physical += Math.hypot(dx * geometry.scaleX, dy * geometry.scaleY);
        logical += Math.hypot(dx, dy);
        samples.push({ t, physical, logical }); previous = point;
      }
      return { samples, physical: Math.max(physical, 0.001), logical: Math.max(logical, 0.001) };
    }

    function curvePosition(metrics, distance) {
      const target = clamp(distance, 0, 1) * metrics.physical;
      let low = 0, high = metrics.samples.length - 1;
      while (high - low > 1) {
        const middle = (low + high) >> 1;
        if (metrics.samples[middle].physical < target) low = middle;
        else high = middle;
      }
      const a = metrics.samples[low], b = metrics.samples[high];
      const fraction = clamp((target - a.physical) / Math.max(0.001, b.physical - a.physical), 0, 1);
      return { t: mix(a.t, b.t, fraction), logical: mix(a.logical, b.logical, fraction) / metrics.logical };
    }

    function paintContrail(points, metrics, flight, scale) {
      if (!contrail) return;
      const head = Math.max(0, flight.distance * metrics.physical - geometry.planeHeight * scale * 0.26);
      const tail = Math.max(0, head - (18 + 50 * flight.speed));
      const commands = [];
      for (let index = 0; index <= 18; index += 1) {
        const distance = mix(tail, head, index / 18) / metrics.physical;
        const point = cubicPoint(points, curvePosition(metrics, distance).t);
        commands.push((index ? 'L' : 'M') + point.x.toFixed(2) + ',' + point.y.toFixed(2));
      }
      contrail.setAttribute('d', commands.join(' '));
      contrail.style.opacity = (flight.speed * 0.8 * (1 - flight.settle)).toFixed(4);
    }

    function paintArrival(point, camera, flight) {
      arrivalRings.forEach((ring, index) => {
        if (!ring) return;
        const pulse = clamp((flight.landing - index * 0.22) / (1 - index * 0.22), 0, 1);
        ring.setAttribute('cx', '0'); ring.setAttribute('cy', '0');
        ring.setAttribute('r', ((9 + 34 * pulse) / Math.max(0.01, geometry.scaleX)).toFixed(3));
        ring.setAttribute('transform', `translate(${point.x.toFixed(2)},${point.y.toFixed(2)}) scale(1,${camera.sphereAspect.toFixed(5)})`);
        ring.style.opacity = (Math.sin(Math.PI * pulse) * 0.7).toFixed(4);
      });
    }

    function positionLabel(element, point, destinationSide) {
      const labelWidth = destinationSide ? geometry.destinationWidth : geometry.originWidth;
      const labelHeight = destinationSide ? geometry.destinationHeight : geometry.originHeight;
      const x = geometry.left + point.x * geometry.scaleX;
      const y = geometry.top + point.y * geometry.scaleY;
      const preferredX = destinationSide ? x + 22 : x - labelWidth - 22;
      const preferredY = destinationSide ? y - labelHeight - 18 : y + 18;
      element.style.left = clamp(preferredX, 18, Math.max(18, geometry.width - labelWidth - 18)).toFixed(2) + 'px';
      element.style.top = clamp(preferredY, 68, Math.max(68, geometry.height - labelHeight - geometry.bottomReserve)).toFixed(2) + 'px';
    }

    function render(progress, frameTime = 0, forceRaster = false) {
      if (needsResize) resize();
      const camera = cameraAt(progress);
      const flight = flightAt(progress);
      const flightProgress = flight.distance;
      const surfacePoint = coordinate => {
        const point = project(vector(coordinate), camera);
        point.y = camera.y + (point.y - camera.y) * camera.sphereAspect;
        return point;
      };
      const from = surfacePoint(origin), to = surfacePoint(destination);
      const dx = to.x - from.x, dy = to.y - from.y;
      const lift = Math.max(96 * camera.sphereAspect, (geometry.width <= 600 ? 76 : 78) / geometry.scaleY);
      const points = [from,
        { x: from.x + dx * 0.22 - lift * 0.12, y: from.y + dy * 0.2 - lift },
        { x: from.x + dx * 0.78 - lift * 0.06, y: from.y + dy * 0.78 - lift * 0.5 }, to];
      // Keep a 29fps raster clock without dropping to every third 60Hz frame.
      // Geographic paths are the expensive layer; route/plane retain full rAF cadence.
      const rasterInterval = 1000 / 29, sinceRaster = frameTime - lastRasterTime;
      const rebaseRaster = forceRaster || globeDirty || !Number.isFinite(sinceRaster) || frameTime < lastRasterTime;
      if (rebaseRaster || sinceRaster >= rasterInterval) {
        drawGlobe(camera);
        lastRasterTime = rebaseRaster ? frameTime : frameTime - sinceRaster % rasterInterval;
        globeDirty = false;
      }
      const path = `M${from.x.toFixed(2)},${from.y.toFixed(2)} C${points[1].x.toFixed(2)},${points[1].y.toFixed(2)} ${points[2].x.toFixed(2)},${points[2].y.toFixed(2)} ${to.x.toFixed(2)},${to.y.toFixed(2)}`;
      track.setAttribute('d', path); route.setAttribute('d', path);
      const metrics = curveMetrics(points), position = curvePosition(metrics, flightProgress);
      route.style.strokeDashoffset = (1 - position.logical).toFixed(5);
      originDot.setAttribute('cx', from.x.toFixed(2)); originDot.setAttribute('cy', from.y.toFixed(2));
      destinationDot.setAttribute('cx', to.x.toFixed(2)); destinationDot.setAttribute('cy', to.y.toFixed(2));
      const point = cubicPoint(points, position.t), tangent = cubicTangent(points, position.t);
      const angle = Math.atan2(tangent.y * geometry.scaleY, tangent.x * geometry.scaleX) / rad + 90;
      const u = 1 - position.t;
      const secondX = (6 * u * (points[2].x - 2 * points[1].x + points[0].x) + 6 * position.t * (points[3].x - 2 * points[2].x + points[1].x)) * geometry.scaleX;
      const secondY = (6 * u * (points[2].y - 2 * points[1].y + points[0].y) + 6 * position.t * (points[3].y - 2 * points[2].y + points[1].y)) * geometry.scaleY;
      const vx = tangent.x * geometry.scaleX, vy = tangent.y * geometry.scaleY;
      const curvature = (vx * secondY - vy * secondX) / Math.max(0.001, Math.hypot(vx, vy) ** 3);
      const bank = 16 * Math.tanh(curvature * metrics.physical * 0.7) * flight.elevation;
      const pitch = -8 * Math.sin(2 * Math.PI * flightProgress);
      const scale = 1 + flight.elevation * 0.26;
      const lift3d = flight.elevation * (geometry.width <= 600 ? 48 : 82);
      const x = geometry.left + point.x * geometry.scaleX - geometry.planeWidth / 2;
      const y = geometry.top + point.y * geometry.scaleY - geometry.planeHeight / 2;
      plane.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${lift3d.toFixed(2)}px) rotateZ(${angle.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) rotateY(${bank.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      paintContrail(points, metrics, flight, scale);
      paintArrival(to, camera, flight);
      positionLabel(originLabel, from, false); positionLabel(destinationLabel, to, true);
      stage.style.setProperty('--flight-progress', flightProgress.toFixed(5));
      stage.style.setProperty('--camera-progress', camera.progress.toFixed(5));
      stage.style.setProperty('--flight-elevation', flight.elevation.toFixed(5));
      stage.style.setProperty('--flight-speed', flight.speed.toFixed(5));
      stage.style.setProperty('--landing-progress', flight.landing.toFixed(5));
      stage.style.setProperty('--flight-shadow-opacity', (0.58 - flight.elevation * 0.32).toFixed(4));
      stage.style.setProperty('--flight-shadow-blur', (4 + flight.elevation * 8).toFixed(2) + 'px');
      stage.style.setProperty('--flight-shadow-spread', (1 + flight.elevation * 0.45).toFixed(4));
      stage.style.setProperty('--flight-shadow-offset', (18 + flight.elevation * 28).toFixed(2) + 'px');
      if (stage.dataset.phase !== flight.phase) {
        stage.dataset.phase = flight.phase;
        if (state === 'flying') {
          status.textContent = flight.phase === 'takeoff' ? 'Cất cánh từ Hà Nội. Chuyến đi của chúng mình bắt đầu…'
            : flight.phase === 'cruise' ? 'Trên những tầng mây, cùng hướng về Shanghai…'
              : flight.phase === 'landing' ? 'Shanghai ở ngay phía trước. Chậm lại để giữ từng khoảnh khắc.'
                : flight.phase === 'arrived' ? 'Đã đến Shanghai. Những kỷ niệm đang mở ra…' : 'Hà Nội · Chuẩn bị cho một hành trình mới…';
        }
      }
    }

    function requestFrame() {
      if (ready && !raf && !document.hidden && !entryPending()) raf = window.requestAnimationFrame(tick);
    }

    function finish() {
      stopFrame();
      elapsed = duration;
      autoStarted = true;
      if (observer) observer.disconnect();
      try { render(1, 0, true); setState('arrived'); }
      catch (_) { failOpen(); }
    }

    function start() {
      if (!ready) { failOpen(); return; }
      if (entryPending()) return;
      autoStarted = true;
      if (observer) observer.disconnect();
      if (reduced) { finish(); return; }
      stopFrame(); elapsed = 0;
      try { setState('flying'); render(0, 0, true); requestFrame(); }
      catch (_) { failOpen(); }
    }

    function tick(time) {
      raf = 0;
      if (document.hidden || entryPending()) { previousTime = null; return; }
      try {
        if (state === 'flying') {
          if (previousTime !== null) elapsed += clamp(time - previousTime, 0, 64);
          previousTime = time;
          if (elapsed >= duration) { finish(); return; }
        }
        render(state === 'arrived' ? 1 : elapsed / duration, time);
        if (state === 'flying') requestFrame();
      } catch (_) { failOpen(); }
    }

    function checkVisibility() {
      if (autoStarted || document.hidden || !ready || entryPending()) return;
      const bounds = stage.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
      meaningfullyVisible = visibleHeight >= Math.min(bounds.height * 0.32, window.innerHeight * 0.4);
      if (meaningfullyVisible) start();
    }

    function queueResize() { needsResize = true; requestFrame(); }

    function resumeAfterEntry() {
      if (entryPending()) return;
      wasEntryPending = false;
      previousTime = null;
      needsResize = true;
      if (!autoStarted) checkVisibility();
      requestFrame();
    }

    try {
      if (![canvas, track, route, originDot, destinationDot, plane, originLabel, destinationLabel, startButton, skipButton, status].every(Boolean)) {
        failOpen(); return;
      }
      context = canvas.getContext('2d');
      if (!context) { failOpen(); return; }
      exposeAlbum();
      route.setAttribute('pathLength', '1');
      route.style.strokeDasharray = '1';
      resize(); render(reduced ? 1 : 0, 0, true);
      startButton.addEventListener('click', start);
      skipButton.addEventListener('click', finish);
      window.addEventListener('resize', queueResize, { passive: true });
      window.addEventListener('pagehide', stopFrame);
      window.addEventListener('wedding:entered', resumeAfterEntry);
      if ('MutationObserver' in window) new MutationObserver(() => {
        const pending = entryPending();
        if (pending === wasEntryPending) return;
        wasEntryPending = pending;
        if (pending) stopFrame();
        else resumeAfterEntry();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      window.addEventListener('pageshow', () => {
        needsResize = true; previousTime = null;
        if (!autoStarted) checkVisibility();
        requestFrame();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopFrame();
        else {
          previousTime = null;
          if (!autoStarted) checkVisibility();
          if (state === 'flying' || needsResize) requestFrame();
        }
      });
      const motionChanged = () => {
        reduced = motionMedia.matches;
        if (reduced) finish();
      };
      if (typeof motionMedia.addEventListener === 'function') motionMedia.addEventListener('change', motionChanged);
      else if (typeof motionMedia.addListener === 'function') motionMedia.addListener(motionChanged);
      if ('ResizeObserver' in window) new ResizeObserver(queueResize).observe(stage);
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          const entry = entries[0];
          meaningfullyVisible = entry.isIntersecting && entry.intersectionRatio >= 0.32;
          if (meaningfullyVisible && !autoStarted && !document.hidden && !entryPending()) start();
        }, { threshold: [0, 0.32, 0.6] });
        observer.observe(stage);
      } else window.addEventListener('scroll', () => { if (!autoStarted) checkVisibility(); }, { passive: true });

      album.querySelectorAll('img').forEach(image => {
        image.loading = 'eager'; image.decoding = 'async';
        if (typeof image.decode === 'function') image.decode().catch(() => {});
      });
      ready = true;
      if (reduced) { setState('arrived'); elapsed = duration; autoStarted = true; if (observer) observer.disconnect(); }
      else setState('idle');
      stage.classList.add('travel-ready');
      if (!reduced) checkVisibility();

      fetch('assets/world.json').then(response => {
        if (!response.ok) throw new Error('Map unavailable');
        return response.json();
      }).then(data => {
        const geographicPolygons = [];
        const appendPolygon = coordinates => {
          const polygon = { type: 'Polygon', coordinates };
          // Natural Earth winding can describe a polygon's spherical complement
          // under D3's convention. Every individual land polygon is <hemisphere.
          if (window.d3?.geoArea && window.d3.geoArea(polygon) > Math.PI * 2) {
            polygon.coordinates = coordinates.map(ring => ring.slice().reverse());
          }
          geographicPolygons.push(polygon);
        };
        data.features.forEach(feature => {
          if (feature.geometry?.type === 'Polygon') appendPolygon(feature.geometry.coordinates);
          else if (feature.geometry?.type === 'MultiPolygon') feature.geometry.coordinates.forEach(appendPolygon);
        });
        if (geographicPolygons.length) {
          // Preserve the local fallback silhouette if the optional vendor fails.
          landGeo = { type: 'GeometryCollection', geometries: geographicPolygons };
          globeDirty = true;
          requestFrame();
        }
      }).catch(() => { /* The bundled silhouette and album remain fully functional. */ });
    } catch (_) { failOpen(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeTravel, { once: true });
  else initializeTravel();
})();
