import L from 'leaflet';
import './mapGestures.css';

const apple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/**
 * "Cooperative gestures" for a map that sits in a scrolling page (the pattern of Google Maps' gestureHandling
 * "cooperative", Mapbox's cooperativeGestures and Leaflet.GestureHandling). Without it the wheel zooms the map as
 * soon as the pointer crosses it while the page scrolls, so the page stops and the map jumps.
 *
 * - Mouse wheel: scrolls the page. Ctrl/⌘ + wheel (and the trackpad pinch, which browsers send as Ctrl + wheel)
 *   zooms the map around the pointer. A plain wheel over the map shows "Use ⌘ + scroll to zoom the map".
 * - Touch: one finger scrolls the page; two fingers move and pinch the map. One finger shows "Use two fingers…".
 * - `setFree(true)` (a full-screen map, where nothing else scrolls) gives the map the plain wheel and one-finger drag.
 */
export function cooperativeGestures(m: L.Map) {
  const el = m.getContainer();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  let free = false;
  let timer = 0;
  let last = 0;

  const hint = L.DomUtil.create('div', 'ep-map-hint', el);
  hint.setAttribute('aria-hidden', 'true');
  const show = (text: string) => {
    hint.textContent = text;
    hint.classList.add('is-on');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => hint.classList.remove('is-on'), 1500);
  };
  const hide = () => { window.clearTimeout(timer); hint.classList.remove('is-on'); };

  const onWheel = (e: WheelEvent) => {
    if (free) return; // Leaflet's own wheel zoom is on
    if (!(e.ctrlKey || e.metaKey)) { show(`Use ${apple ? '⌘' : 'Ctrl'} + scroll to zoom the map`); return; }
    e.preventDefault(); // keep the browser from zooming the page
    hide();
    const now = Date.now();
    if (now - last < 180) return; // one step per gesture burst (trackpads send many small events)
    last = now;
    m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() + (e.deltaY < 0 ? 1 : -1));
  };
  const onTouchMove = (e: TouchEvent) => { if (!free && e.touches.length === 1) show('Use two fingers to move the map'); };
  const onTouchStart = (e: TouchEvent) => { if (e.touches.length > 1) hide(); };

  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('touchmove', onTouchMove, { passive: true });
  el.addEventListener('touchstart', onTouchStart, { passive: true });

  const setFree = (next: boolean) => {
    free = next;
    if (next) { m.scrollWheelZoom.enable(); m.dragging.enable(); hide(); } else {
      m.scrollWheelZoom.disable();
      // On touch screens one finger must scroll the page; Leaflet's pinch still moves and zooms with two.
      if (coarse) m.dragging.disable(); else m.dragging.enable();
    }
  };
  setFree(false);

  return {
    setFree,
    destroy: () => {
      window.clearTimeout(timer);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchstart', onTouchStart);
    },
  };
}
