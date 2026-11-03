import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, IconButton } from '@syn/design-system';
import { location } from '../data/equipment';
import satelliteImage from '../assets/map-satellite.png';
import mapImage from '../assets/map-bremen.png';
import './LocationWidget.css';

const LIVE_SITE = 'https://easyvibesuxui-sketch.github.io/EquipmentProfile/';

const layers = {
  map: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
  }),
  hybrid: () => L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Imagery © Esri',
    }),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
  ]),
};

/** Current location: a live OpenStreetMap / Esri map with the equipment pin, zoom, full screen and the Hybrid switch. */
export function LocationWidget() {
  const card = useRef<HTMLDivElement>(null);
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.Layer | null>(null);
  const [view, setView] = useState<'map' | 'hybrid'>('map');
  const [tilesFailed, setTilesFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const center: L.LatLngExpression = [location.lat, location.lng];

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center, zoom: location.zoom, zoomControl: false, attributionControl: true });
    m.attributionControl.setPrefix(false);
    L.marker(center, {
      icon: L.divIcon({ className: 'ep-pin', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }),
      title: location.address,
      keyboard: false,
    }).addTo(m);
    map.current = m;
    const onFs = () => { setFullscreen(document.fullscreenElement === card.current); window.setTimeout(() => m.invalidateSize(), 50); };
    document.addEventListener('fullscreenchange', onFs);
    return () => { document.removeEventListener('fullscreenchange', onFs); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (layer.current) m.removeLayer(layer.current);
    const next = layers[view]();
    let loaded = false;
    const watch = (t: L.Layer) => {
      t.on('tileload', () => { loaded = true; setTilesFailed(false); });
      t.on('tileerror', () => { if (!loaded) setTilesFailed(true); });
    };
    if (next instanceof L.LayerGroup) next.eachLayer(watch); else watch(next);
    next.addTo(m);
    layer.current = next;
  }, [view]);

  const toggleFullscreen = () => {
    if (!card.current) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else card.current.requestFullscreen?.().catch(() => setFullscreen((f) => !f));
  };

  return (
    <div ref={card} className={fullscreen ? 'ep-location is-fullscreen' : 'ep-location'}>
      <Card
        title={<>Current Location: <span className="ep-location__address">{location.address}</span></>}
        className="ep-widget ep-map"
      >
        <div className="ep-map__frame">
          <div ref={el} className="ep-map__canvas" role="region" aria-label={`Map of ${location.address}`} />
          {tilesFailed && (
            <p className="ep-map__offline">
              The live map can't load here. <a href={LIVE_SITE} target="_blank" rel="noreferrer">Open the live site</a> to see it.
            </p>
          )}
          <IconButton
            icon={fullscreen ? 'minimize' : 'frame'}
            label={fullscreen ? 'Exit full screen' : 'Full screen'}
            variant="outline"
            size="sm"
            className="ep-map__fullscreen"
            onClick={toggleFullscreen}
          />
          <button
            type="button"
            className="ep-map__view"
            aria-pressed={view === 'hybrid'}
            onClick={() => setView(view === 'map' ? 'hybrid' : 'map')}
          >
            <img src={view === 'map' ? satelliteImage : mapImage} alt="" className={view === 'map' ? 'is-satellite' : undefined} />
            <span>{view === 'map' ? 'Hybrid' : 'Map'}</span>
          </button>
          <div className="ep-map__controls">
            <IconButton icon="expand" label="Center on equipment" variant="outline" size="sm" onClick={() => map.current?.setView(center, location.zoom)} />
            <div className="ep-map__zoom">
              <IconButton icon="plus" label="Zoom in" variant="outline" size="sm" onClick={() => map.current?.zoomIn()} />
              <IconButton icon="minus" label="Zoom out" variant="outline" size="sm" onClick={() => map.current?.zoomOut()} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
