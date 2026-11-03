import { Icon } from '@syn/design-system';
import { MaskIcon } from '../layout/AppShell';
import { ColorDot } from '../shared/ColorDot';
import type { Sensor } from '../data/telemetry';
import engineGlyph from '../assets/telemetry/glyph-engine.png';
import infoGlyph from '../assets/telemetry/glyph-info.png';
import signalBars from '../assets/telemetry/signal-bars.png';

function Glyph({ glyph }: { glyph: Sensor['glyph'] }) {
  if (glyph === 'engine') return <MaskIcon src={engineGlyph} size={[31, 19]} />;
  if (glyph === 'info') return <MaskIcon src={infoGlyph} size={26} />;
  return <Icon name={glyph === 'idle' ? 'time' : 'gps-location-default'} size={22} />;
}

/** Figma "Component 1431": a 64px reading tile, icon in a Silver Chalice circle, name, state or value, signal and time. */
export function SensorTile({ sensor }: { sensor: Sensor }) {
  return (
    <div className={`ep-sensor is-${sensor.kind}`}>
      <span className="ep-sensor__icon" aria-hidden><Glyph glyph={sensor.glyph} /></span>
      <div className="ep-sensor__body">
        <span className="ep-sensor__label syn-title-text">{sensor.label}</span>
        {sensor.kind === 'value' ? (
          <span className="ep-sensor__value">{sensor.value}{sensor.unit && <span className="is-muted"> {sensor.unit}</span>}</span>
        ) : (
          <span className="ep-sensor__state"><ColorDot color={sensor.kind === 'on' ? 'success' : 'idle'} />{sensor.kind === 'on' ? 'ON' : 'OFF'}</span>
        )}
      </div>
      <img className="ep-sensor__signal" src={signalBars} alt="" width={38} height={40} />
      <time className="ep-sensor__time">{sensor.date}<span>{sensor.time}</span></time>
    </div>
  );
}
