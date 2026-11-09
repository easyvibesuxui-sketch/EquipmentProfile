import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, Grid, GridItem, Icon, IconButton } from '@syn/design-system';
import { ColorDot } from '../shared/ColorDot';
import { consumeDashcamPlay } from '../shared/dashcamBus';
import { Gauge } from './Gauge';
import { SensorTile } from './SensorTile';
import {
  analogueInputs, dashcam, digitalInputs, gauge, lastLocation, statusSensors, trackerSensors,
} from '../data/telemetry';
import flag from '../assets/telemetry/flag-de.png';
import keyArt from '../assets/telemetry/input-key.png';
import switchArt from '../assets/telemetry/input-switch.png';
import signalArt from '../assets/telemetry/input-signal.png';
import device from '../assets/telemetry/dashcam-device.png';
import cab from '../assets/telemetry/dashcam-cab.jpg';
import './Telemetry.css';

const art = { key: keyArt, switch: switchArt, signal: signalArt };

/** A Leaflet map without controls for the location panel; Cultured until the tiles load. */
function LocationMap() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const c: L.LatLngExpression = [lastLocation.lat, lastLocation.lng];
    const m = L.map(el.current, { center: c, zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    L.control.attribution({ position: 'bottomright', prefix: false }).addAttribution('© OpenStreetMap').addTo(m);
    L.marker(c, { icon: L.divIcon({ className: 'ep-pin', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }), keyboard: false }).addTo(m);
    // No veil here: the map sits well in its panel, so the wheel zooms it and it drags (Leaflet's defaults).
    return () => { m.remove(); };
  }, []);
  return <div ref={el} className="ep-tele-map" role="region" aria-label={`Map of ${lastLocation.place}`} />;
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="ep-tele-copy"
      aria-label={done ? 'Copied' : 'Copy IMEI number'}
      title={done ? 'Copied' : 'Copy IMEI number'}
      onClick={() => { navigator.clipboard?.writeText(value).catch(() => undefined); setDone(true); window.setTimeout(() => setDone(false), 1500); }}
    >
      <Icon name={done ? 'check' : 'copy'} size={10} />
    </button>
  );
}

/** Figma hero: the gauge, the last known location and the map over a Smoke slot with 96px top corners, then the status tiles. */
export function TelemetryHero() {
  return (
    <section className="ep-tele-hero" aria-label="Live telemetry">
      <div className="ep-tele-hero__slot">
        <div className="ep-tele-hero__gauge"><Gauge {...gauge} /></div>
        <div className="ep-tele-hero__info">
          <div className="ep-tele-loc">
            <div className="ep-tele-loc__head">
              <p className="ep-tele-muted">Last known location</p>
              <p className="ep-tele-loc__place"><img src={flag} alt="" width={16} height={16} /><span className="syn-title-text">{lastLocation.place}</span></p>
              <p className="ep-tele-loc__address">{lastLocation.street}<span className="ep-tele-sep" aria-hidden />{lastLocation.area}</p>
            </div>
            <dl className="ep-tele-loc__facts">
              <div><dt>Last position update</dt><dd>{lastLocation.lastPosition}</dd></div>
              <div><dt>Last seen</dt><dd>{lastLocation.lastSeen}</dd></div>
              <div><dt>Operating hours</dt><dd>{lastLocation.operatingHours} <span className="ep-tele-muted">h</span></dd></div>
            </dl>
          </div>
        </div>
        <div className="ep-tele-hero__map"><LocationMap /></div>
      </div>
      <div className="ep-tele-hero__tiles">
        {statusSensors.map((s) => <SensorTile key={s.id} sensor={s} />)}
      </div>
    </section>
  );
}

export function TrackerWidget() {
  return (
    <Card title="Tracker" actions={<span className="ep-tele-count">{trackerSensors.count} in count</span>} className="ep-widget ep-tele-tracker">
      <div className="ep-tele-tracker__grid">
        {trackerSensors.columns.map((col, i) => (
          <div key={i} className="ep-tele-tracker__col">
            {col.map((s) => <SensorTile key={s.id} sensor={s} />)}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DigitalInputsWidget() {
  return (
    <Card title="Digital inputs" className="ep-widget ep-tele-digital">
      <ul className="ep-tele-digital__list">
        {digitalInputs.map((d) => (
          <li key={d.id} className="ep-tele-input">
            <span className="ep-tele-input__label syn-title-text">{d.label}</span>
            <span className="ep-tele-input__state"><ColorDot color={d.on ? 'success' : 'idle'} />{d.on ? 'ON' : 'OFF'}</span>
            <img className="ep-tele-input__art" src={art[d.art]} alt="" />
            <span className="ep-tele-input__channel">{d.channel}</span>
            <IconButton icon="history" label={`${d.label} history`} className="ep-tele-input__history" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AnalogueInputsWidget() {
  return (
    <Card title="Analogue Inputs" className="ep-widget ep-tele-analogue">
      {analogueInputs.map((a) => (
        <div key={a.id} className="ep-tele-analogue__row">
          <span className="ep-tele-analogue__label syn-title-text">{a.label}</span>
          <span className="ep-tele-analogue__value">{a.value}</span>
          <img src={signalArt} alt="" width={24} height={24} />
          <IconButton icon="history" label={`${a.label} history`} />
        </div>
      ))}
    </Card>
  );
}

function DashcamDeviceWidget() {
  return (
    <Card title="Dashcam Player" className="ep-widget ep-tele-device">
      <img className="ep-tele-device__photo" src={device} alt={dashcam.name} width={270} height={270} />
      <dl className="ep-tele-device__info">
        <div className="ep-tele-device__name"><dt>Tracker</dt><dd className="syn-title-text">{dashcam.name}</dd></div>
        <div className="ep-tele-device__row">
          <div><dt>IMEI Number</dt><dd className="ep-tele-device__imei">{dashcam.imei}<CopyButton value={dashcam.imei} /></dd></div>
          <div>
            <dt>Last Update</dt>
            <dd className="ep-tele-device__update"><ColorDot color="amber" size={8} /><span>{dashcam.lastUpdate}</span><span className="ep-tele-muted">{dashcam.ago}</span></dd>
          </div>
        </div>
      </dl>
    </Card>
  );
}

function DashcamPlayerWidget() {
  // Opened from the header's camera Play: start full screen and playing.
  const [autoplay] = useState(consumeDashcamPlay);
  const [playing, setPlaying] = useState(autoplay);
  const [expanded, setExpanded] = useState(autoplay);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded]);
  return (
    <div className={expanded ? 'ep-tele-player is-expanded' : 'ep-tele-player'}>
      <Card title="Dashcam Player" className="ep-widget ep-tele-player__card">
        <div className="ep-tele-player__grid">
          {dashcam.cameras.map((c) => (
            <figure key={c.id} className="ep-tele-cam">
              <img src={cab} alt={`${c.label}, ${c.online ? 'online' : 'offline'}`} />
              <span className={c.online ? 'ep-tele-cam__status is-online' : 'ep-tele-cam__status'} aria-hidden />
            </figure>
          ))}
          <button type="button" className="ep-tele-player__play" aria-pressed={playing} aria-label={playing ? 'Pause all cameras' : 'Play all cameras'} onClick={() => setPlaying(!playing)}>
            <Icon name={playing ? 'pause' : 'play'} size={24} />
          </button>
          <button type="button" className="ep-tele-player__expand" aria-pressed={expanded} aria-label={expanded ? 'Minimize player' : 'Expand player'} onClick={() => setExpanded(!expanded)}>
            <Icon name={expanded ? 'minimize' : 'expand'} size={20} />
          </button>
        </div>
      </Card>
    </div>
  );
}

/** Telemetry tab (Figma "Equipment Accecories", 14571:18707). */
export function TelemetryTab() {
  return (
    <div className="ep-telemetry">
      <TelemetryHero />
      <Grid gap={24}>
        <GridItem span={8} className="ep-col ep-col--wide"><TrackerWidget /></GridItem>
        <GridItem span={4} className="ep-col ep-col--half"><DigitalInputsWidget /></GridItem>
      </Grid>
      <Grid gap={24} className="ep-tele-row3">
        <GridItem span={4} className="ep-col ep-col--half"><AnalogueInputsWidget /></GridItem>
        <GridItem span={4} className="ep-col ep-col--half"><DashcamDeviceWidget /></GridItem>
        <GridItem span={4} className="ep-col ep-col--half"><DashcamPlayerWidget /></GridItem>
      </Grid>
    </div>
  );
}
