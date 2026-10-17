/**
 * Core đếm số tăng dần — không phụ thuộc HTML/CSS nào, chỉ nhận số và trả về
 * số đã format tại từng khung hình. Dùng được trong React/Vue/vanilla, miễn
 * là bạn gọi animateCount() và tự quyết định hiển thị kết quả ra đâu.
 */

export function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Chạy animation từ `from` đến `to` trong `duration` ms.
 *
 * @param {number} to - Giá trị đích. Đây là chỗ bạn truyền số lấy từ DB/API
 *   vào (vd: stat.value từ kết quả fetch), KHÔNG cần đọc qua data-attribute
 *   của HTML như bản gốc.
 * @param {object} [opts]
 * @param {number} [opts.from=0]
 * @param {number} [opts.duration=2000]
 * @param {(x:number)=>number} [opts.easing=easeOutCubic]
 * @param {(n:number)=>string} [opts.format] - Hàm định dạng số hiển thị.
 * @param {(formatted:string, raw:number)=>void} opts.onUpdate - Gọi lại mỗi
 *   khung hình với giá trị đã format và giá trị thô. Đây là chỗ bạn tự nối
 *   vào DOM (element.textContent = formatted) hoặc state của framework
 *   (setCount(raw) trong React, ref.value = raw trong Vue...).
 * @param {() => void} [opts.onComplete]
 * @returns {() => void} Hàm cancel — gọi để dừng animation giữa chừng (vd khi
 *   component unmount).
 */
export function animateCount(to, opts) {
  var options = opts || {};
  var from = options.from || 0;
  var duration = options.duration || 2000;
  var easing = options.easing || easeOutCubic;
  var format = options.format || function (n) {
    return Math.floor(n).toLocaleString("en-US");
  };
  var onUpdate = options.onUpdate;
  var onComplete = options.onComplete;

  var startTime = null;
  var rafId = null;
  var cancelled = false;

  function tick(now) {
    if (cancelled) return;
    if (startTime === null) startTime = now;

    var progress = Math.min((now - startTime) / duration, 1);
    var eased = easing(progress);
    var current = from + (to - from) * eased;

    if (onUpdate) onUpdate(format(current), current);

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      if (onUpdate) onUpdate(format(to), to);
      if (onComplete) onComplete();
    }
  }

  rafId = requestAnimationFrame(tick);

  return function cancel() {
    cancelled = true;
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}

/**
 * Tiện ích: chỉ chạy animateCount() khi `element` lọt vào khung nhìn.
 * Vẫn nhận `to` trực tiếp (số từ DB), chỉ lo phần "khi nào thì bắt đầu chạy".
 *
 * @param {Element} element
 * @param {number} to
 * @param {object} [opts] - giống animateCount, cộng thêm:
 * @param {number} [opts.threshold=0.3]
 * @param {(formatted:string, raw:number)=>void} [opts.onUpdate] - nếu không
 *   truyền, mặc định set element.textContent = formatted.
 */
export function animateCountOnVisible(element, to, opts) {
  var options = opts || {};
  var threshold = options.threshold || 0.3;
  var onUpdate = options.onUpdate || function (formatted) {
    element.textContent = formatted;
  };

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(to, Object.assign({}, options, { onUpdate: onUpdate }));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: threshold });

  observer.observe(element);

  return function stopObserving() {
    observer.unobserve(element);
  };
}

/*
=====================================================================
VÍ DỤ: lấy data từ DB/API rồi chạy — đây là đoạn bạn sẽ viết khác đi
tuỳ frontend của bạn (vanilla / React / Vue), chỉ là minh hoạ cách nối:
=====================================================================

import { animateCountOnVisible } from "./counter.js";

const stats = await fetch("/api/stats").then((r) => r.json());
// stats = [{ label: "Doanh số", value: 12000, suffix: "", format: "currency" }, ...]

stats.forEach((stat, i) => {
  const el = document.querySelector(`[data-stat-index="${i}"]`);
  const suffix = stat.suffix || "";

  animateCountOnVisible(el, stat.value, {
    duration: 2000,
    format: (n) => Math.floor(n).toLocaleString("en-US") + suffix,
  });
});

---------------------------------------------------------------------
VÍ DỤ trong React (chỉ phần logic, bỏ qua JSX):

const [display, setDisplay] = useState("0");

useEffect(() => {
  const cancel = animateCount(stat.value, {
    onUpdate: (formatted) => setDisplay(formatted),
  });
  return cancel; // dọn dẹp khi component unmount
}, [stat.value]);
=====================================================================
*/
