import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Card, MapControls, MapExpandButton, MapLayerSwitch, MapStreetViewButton, MapView, MapZoomControls, type MapLayer,
} from '@syn/design-system';
import { location } from '../data/equipment';
import './LocationWidget.css';

const LIVE_SITE = 'https://easyvibesuxui-sketch.github.io/EquipmentProfile/';
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

const layers: Record<MapLayer, () => L.Layer> = {
  map: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAX_ZOOM,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
  }),
  satellite: () => L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: MAX_ZOOM,
      attribution: 'Imagery © Esri',
    }),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: MAX_ZOOM }),
  ]),
};

/**
 * Current location: a live Leaflet map inside Syn's MapView, with the Syn map controls (street view, layer
 * switch, zoom) and the Map Button, which opens the full "Equipment Map" with Close map.
 */
export function LocationWidget() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.Layer | null>(null);
  const [view, setView] = useState<MapLayer>('map');
  const [zoom, setZoom] = useState(location.zoom);
  const [expanded, setExpanded] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const center: L.LatLngExpression = [location.lat, location.lng];

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center, zoom: location.zoom, minZoom: MIN_ZOOM, zoomControl: false });
    m.attributionControl.setPrefix(false);
    L.marker(center, {
      icon: L.divIcon({ className: 'ep-pin', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }),
      title: location.address,
      keyboard: false,
    }).addTo(m);
    m.on('zoomend', () => setZoom(m.getZoom()));
    map.current = m;
    return () => { m.remove(); map.current = null; };
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

  // The map container changes size when the full map opens or closes.
  useEffect(() => {
    const t = window.setTimeout(() => map.current?.invalidateSize(), 50);
    if (!expanded) return () => window.clearTimeout(t);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [expanded]);

  const streetView = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`;

  return (
    <div className={expanded ? 'ep-location is-expanded' : 'ep-location'}>
      <Card
        title={expanded ? undefined : <>Current Location: <span className="ep-location__address">{location.address}</span></>}
        className="ep-widget ep-map"
      >
        <div className="ep-map__stage">
        <MapView
          label={`Map of ${location.address}`}
          onClose={expanded ? () => setExpanded(false) : undefined}
          controls={(
            <MapControls>
              <MapStreetViewButton onClick={() => window.open(streetView, '_blank', 'noopener')} />
              <MapLayerSwitch value={view} onChange={setView} />
              <MapZoomControls
                onZoomIn={() => map.current?.zoomIn()}
                onZoomOut={() => map.current?.zoomOut()}
                canZoomIn={zoom < MAX_ZOOM}
                canZoomOut={zoom > MIN_ZOOM}
              />
            </MapControls>
          )}
        >
          <div ref={el} className="ep-map__canvas" />
        </MapView>
        {!expanded && (
          <MapExpandButton expanded={false} expandLabel="Open full map" className="ep-map__expand" onClick={() => setExpanded(true)} />
        )}
        </div>
        {tilesFailed && (
          <p className="ep-map__offline">
            The live map can't load here. <a href={LIVE_SITE} target="_blank" rel="noreferrer">Open the live site</a> to see it.
          </p>
        )}
      </Card>
    </div>
  );
}
