import L from 'leaflet';
import './mapGestures.css';

/** Rest the pointer this long on a sleeping map to wake it (Leaflet.Sleep's default is 750ms). */
const WAKE_MS = 700;
/** After the pointer leaves, the map falls asleep again after this long. */
const SLEEP_MS = 600;
/** On touch screens the map sleeps again this long after the last finger lifts. */
const TOUCH_SLEEP_MS = 1500;

/**
 * A map that sleeps while the page scrolls (the "hover to wake" pattern of Leaflet.Sleep). Asleep, the map sits
 * under a grey veil and leaves the wheel and one-finger drag to the page, so scrolling past it never zooms it.
 *
 * - Mouse: resting the pointer on the map for 0.7s wakes it; the veil clears in a circle that grows from the pointer
 *   as the time runs (leave early and it closes again). A wheel turn restarts the wait, so a page that scrolls under
 *   a still pointer does not wake it. Awake, the wheel zooms and the map drags; 0.6s after the pointer leaves, the
 *   veil comes back.
 * - Keyboard: focusing the map wakes it at once; leaving it puts it to sleep.
 * - Touch: one finger scrolls the page; two fingers wake the map (the veil clears from between them) and pan and
 *   pinch it.
 * - Ctrl/⌘ + wheel (or a trackpad pinch) zooms even while asleep, as a shortcut.
 * - `setFree(true)`: a full-screen map never sleeps.
 */
export function cooperativeGestures(m: L.Map) {
  const el = m.getContainer();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  // The veil lives in its own pane between the tiles (200) and the pin (600), so the pin stays red; it is kept
  // over the container as the map pane moves.
  const pane = m.getPane('epSleep') ?? m.createPane('epSleep');
  pane.style.zIndex = '550';
  pane.style.pointerEvents = 'none';
  const veil = L.DomUtil.create('div', 'ep-map-sleep', pane);
  veil.setAttribute('aria-hidden', 'true');
  const fit = () => {
    const size = m.getSize();
    veil.style.width = `${size.x}px`;
    veil.style.height = `${size.y}px`;
    L.DomUtil.setPosition(veil, m.containerPointToLayerPoint([0, 0]));
  };
  fit();
  m.on('move zoomend viewreset resize', fit);

  let free = false;
  let awake = false;
  let wakeTimer = 0;
  let sleepTimer = 0;
  let last = 0;

  const enable = (on: boolean) => {
    if (on) { m.scrollWheelZoom.enable(); m.dragging.enable(); return; }
    m.scrollWheelZoom.disable();
    m.dragging.disable();
  };
  const place = (x: number, y: number) => {
    const r = el.getBoundingClientRect();
    veil.style.setProperty('--ep-x', `${x - r.left}px`);
    veil.style.setProperty('--ep-y', `${y - r.top}px`);
    // The circle has to reach the farthest corner from the pointer.
    const dx = Math.max(x - r.left, r.right - x);
    const dy = Math.max(y - r.top, r.bottom - y);
    veil.style.setProperty('--ep-reveal-max', `${Math.ceil(Math.hypot(dx, dy)) + 2}px`);
  };
  const wake = () => {
    window.clearTimeout(wakeTimer);
    window.clearTimeout(sleepTimer);
    if (awake) return;
    awake = true;
    veil.classList.remove('is-waking');
    veil.classList.add('is-awake');
    enable(true);
  };
  const sleep = () => {
    window.clearTimeout(wakeTimer);
    window.clearTimeout(sleepTimer);
    veil.classList.remove('is-waking');
    if (free) return;
    awake = false;
    veil.classList.remove('is-awake');
    enable(false);
  };
  /** Starts the wake countdown: the veil opens from the point and the map wakes when it is gone. */
  const startWaking = (x: number, y: number, ms: number) => {
    if (free || awake) return;
    window.clearTimeout(sleepTimer);
    place(x, y);
    veil.classList.remove('is-waking');
    void veil.offsetWidth; // restart the reveal
    veil.style.setProperty('--ep-wake-ms', `${ms}ms`);
    veil.classList.add('is-waking');
    window.clearTimeout(wakeTimer);
    wakeTimer = window.setTimeout(wake, ms);
  };
  const cancelWaking = () => { window.clearTimeout(wakeTimer); veil.classList.remove('is-waking'); };

  const onEnter = (e: MouseEvent) => startWaking(e.clientX, e.clientY, WAKE_MS);
  const onMove = (e: MouseEvent) => {
    if (free || awake) return;
    if (!veil.classList.contains('is-waking')) startWaking(e.clientX, e.clientY, WAKE_MS);
  };
  const onLeave = () => {
    if (free) return;
    cancelWaking();
    if (awake) { window.clearTimeout(sleepTimer); sleepTimer = window.setTimeout(sleep, SLEEP_MS); }
  };
  const onWheel = (e: WheelEvent) => {
    if (free || awake) return; // Leaflet's own wheel zoom handles it
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); // zoom the map, not the page
      const now = Date.now();
      if (now - last < 180) return; // one step per burst (trackpads send many small events)
      last = now;
      m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() + (e.deltaY < 0 ? 1 : -1));
      return;
    }
    // The page is scrolling: restart the wait so a page moving under a still pointer does not wake the map.
    cancelWaking();
    window.clearTimeout(wakeTimer);
    wakeTimer = window.setTimeout(() => startWaking(e.clientX, e.clientY, WAKE_MS), 250);
  };
  const onTouchStart = (e: TouchEvent) => {
    if (free) return;
    window.clearTimeout(sleepTimer);
    if (e.touches.length > 1 && !awake) {
      const [a, b] = [e.touches[0], e.touches[1]];
      place((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      veil.style.setProperty('--ep-wake-ms', '240ms');
      veil.classList.add('is-waking');
      wake();
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (free || e.touches.length) return;
    window.clearTimeout(sleepTimer);
    sleepTimer = window.setTimeout(sleep, TOUCH_SLEEP_MS);
  };

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('focus', wake);
  el.addEventListener('blur', sleep);
  el.addEventListener('touchstart', onTouchStart, { passive: true });
  el.addEventListener('touchend', onTouchEnd, { passive: true });
  if (coarse) m.dragging.disable();
  sleep();

  const setFree = (next: boolean) => {
    free = next;
    if (next) { window.clearTimeout(wakeTimer); window.clearTimeout(sleepTimer); veil.classList.remove('is-waking'); veil.classList.add('is-awake'); awake = true; enable(true); } else sleep();
  };

  return {
    setFree,
    destroy: () => {
      m.off('move zoomend viewreset resize', fit);
      veil.remove();
      window.clearTimeout(wakeTimer);
      window.clearTimeout(sleepTimer);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('focus', wake);
      el.removeEventListener('blur', sleep);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    },
  };
}
