import L from 'leaflet';
import './mapGestures.css';

/** The veil clears in this long after a click (the reveal from the click point). */
const REVEAL_MS = 360;
/** After the pointer leaves an active map, it goes back to sleep after this long. */
const SLEEP_MS = 600;

/** A hand with a tap ring (the "click to activate" glyph), drawn for the map's veil. */
const HAND = `<svg width="24" height="24" viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false">
<path d="M14.5 4.5a4 4 0 0 1 4 4M10.5 8.5a4 4 0 0 1 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
<path d="M13 31.5c-1.6-1.4-4.9-5.2-6.3-7.3-.9-1.3-.6-2.9.7-3.6 1.1-.6 2.4-.3 3.2.6l1.9 2.1V9.5a1.75 1.75 0 0 1 3.5 0v8.25m0-1.75a1.75 1.75 0 0 1 3.5 0v1.75m0-.75a1.75 1.75 0 0 1 3.5 0v1.25m0-.25a1.75 1.75 0 0 1 3.5 0v5.5c0 3.4-1.1 5.8-2.6 7.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/**
 * Click to activate (as Leaflet.Sleep and Google's embeds do): on the page a map sleeps under a grey veil with
 * "Click to activate map", and the wheel and one-finger drag stay with the page, so scrolling past never zooms it.
 *
 * - A click (or Enter / Space on the veil, or a tap) activates it: the veil clears in a circle growing from the
 *   click point, then the wheel zooms and the map drags. Clicks on an active map do not open the card's drawer.
 * - It sleeps again 0.6s after the pointer leaves it, on a click or tap elsewhere, or on Escape.
 * - Ctrl/⌘ + wheel (or a trackpad pinch) zooms even while asleep.
 * - `setFree(true)`: a full-screen map is always active.
 */
export function cooperativeGestures(m: L.Map) {
  const el = m.getContainer();
  // The map's own frame (Syn MapView with its zoom and layer buttons) counts as the map for leaving and outside clicks.
  const zone: HTMLElement = el.closest('.syn-map') ?? el;
  // The grey tint lives in its own pane between the tiles (200) and the pin (600), so the pin stays red.
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

  // The call to action sits above everything in the map (the pin included) and takes the click anywhere on it.
  const cta = L.DomUtil.create('button', 'ep-map-wake', el) as HTMLButtonElement;
  cta.type = 'button';
  cta.innerHTML = `<span class="ep-map-wake__label">${HAND}<span>Click to activate map</span></span>`;
  L.DomEvent.disableClickPropagation(cta);

  let free = false;
  let awake = false;
  let sleepTimer = 0;
  let last = 0;

  const enable = (on: boolean) => {
    if (on) { m.scrollWheelZoom.enable(); m.dragging.enable(); } else { m.scrollWheelZoom.disable(); m.dragging.disable(); }
  };
  const place = (x: number, y: number) => {
    const r = el.getBoundingClientRect();
    const px = x || r.left + r.width / 2;
    const py = y || r.top + r.height / 2;
    veil.style.setProperty('--ep-x', `${px - r.left}px`);
    veil.style.setProperty('--ep-y', `${py - r.top}px`);
    const dx = Math.max(px - r.left, r.right - px);
    const dy = Math.max(py - r.top, r.bottom - py);
    veil.style.setProperty('--ep-reveal-max', `${Math.ceil(Math.hypot(dx, dy)) + 2}px`);
  };
  const activate = (x: number, y: number, viaKeyboard: boolean) => {
    window.clearTimeout(sleepTimer);
    if (awake) return;
    awake = true;
    place(x, y);
    veil.style.setProperty('--ep-wake-ms', `${REVEAL_MS}ms`);
    veil.classList.add('is-waking');
    window.setTimeout(() => { if (awake) { veil.classList.remove('is-waking'); veil.classList.add('is-awake'); } }, REVEAL_MS);
    cta.classList.add('is-hidden');
    el.classList.add('is-map-awake');
    enable(true);
    // Focus moves into the map (the CTA is about to hide): keyboard users carry on there (arrows pan, +/- zoom),
    // and a hidden, focused CTA would otherwise blur and put the map straight back to sleep.
    if (viaKeyboard || document.activeElement === cta) el.focus({ preventScroll: true });
  };
  const sleep = () => {
    window.clearTimeout(sleepTimer);
    if (free || !awake) return;
    awake = false;
    veil.classList.remove('is-waking', 'is-awake');
    cta.classList.remove('is-hidden');
    el.classList.remove('is-map-awake');
    enable(false);
  };

  const onCta = (e: MouseEvent) => activate(e.clientX, e.clientY, e.detail === 0);
  const onLeave = () => { if (awake && !free) { window.clearTimeout(sleepTimer); sleepTimer = window.setTimeout(sleep, SLEEP_MS); } };
  const onEnter = () => window.clearTimeout(sleepTimer);
  const onOutside = (e: PointerEvent) => { if (awake && !free && !zone.contains(e.target as Node)) sleep(); };
  // The CTA is visible again only after the next style pass, so it takes the focus a frame later.
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && awake && !free) { sleep(); requestAnimationFrame(() => cta.focus({ preventScroll: true })); } };
  const onFocusOut = (e: FocusEvent) => { if (awake && !free && !zone.contains(e.relatedTarget as Node)) sleep(); };
  const onWheel = (e: WheelEvent) => {
    if (free || awake || !(e.ctrlKey || e.metaKey)) return; // asleep, a plain wheel scrolls the page
    e.preventDefault(); // Ctrl/⌘ + wheel zooms the map, not the page
    const now = Date.now();
    if (now - last < 180) return; // one step per burst (trackpads send many small events)
    last = now;
    m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() + (e.deltaY < 0 ? 1 : -1));
  };

  cta.addEventListener('click', onCta);
  zone.addEventListener('mouseleave', onLeave);
  zone.addEventListener('mouseenter', onEnter);
  zone.addEventListener('keydown', onKey);
  zone.addEventListener('focusout', onFocusOut);
  el.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('pointerdown', onOutside, true);
  enable(false);

  const setFree = (next: boolean) => {
    free = next;
    if (next) {
      window.clearTimeout(sleepTimer);
      awake = true;
      veil.classList.remove('is-waking');
      veil.classList.add('is-awake');
      cta.classList.add('is-hidden');
      el.classList.add('is-map-awake');
      enable(true);
    } else if (awake) {
      awake = true; // force the sleep below
      sleep();
    }
  };

  return {
    setFree,
    destroy: () => {
      window.clearTimeout(sleepTimer);
      m.off('move zoomend viewreset resize', fit);
      cta.removeEventListener('click', onCta);
      zone.removeEventListener('mouseleave', onLeave);
      zone.removeEventListener('mouseenter', onEnter);
      zone.removeEventListener('keydown', onKey);
      zone.removeEventListener('focusout', onFocusOut);
      el.removeEventListener('wheel', onWheel);
      document.removeEventListener('pointerdown', onOutside, true);
      veil.remove();
      cta.remove();
    },
  };
}

/**
 * A map that needs no veil (the Telemetry map sits well in its panel): it stays live, drags and keeps its pin, but
 * the plain wheel still scrolls the page; Ctrl/⌘ + wheel (or a trackpad pinch) zooms it. On touch screens one finger
 * scrolls the page and two move and pinch the map.
 */
export function quietWheel(m: L.Map) {
  const el = m.getContainer();
  let last = 0;
  m.scrollWheelZoom.disable();
  if (window.matchMedia('(pointer: coarse)').matches) m.dragging.disable();
  const onWheel = (e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const now = Date.now();
    if (now - last < 180) return;
    last = now;
    m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() + (e.deltaY < 0 ? 1 : -1));
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  return { destroy: () => el.removeEventListener('wheel', onWheel) };
}
