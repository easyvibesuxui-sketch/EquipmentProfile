import { Icon } from '@syn/design-system';
import { MaskIcon } from '../layout/AppShell';
import engineGlyph from '../assets/telemetry/glyph-engine.png';

const START = 225; // degrees, 0 = up, clockwise
const SWEEP = 270;

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Speed gauge from the Telemetry frame: 0–max over 270°, the reading as a cyan arc and needle, engine and hours inside. */
export function Gauge({ speed, max, unit, engineOn, engineHours }: { speed: number; max: number; unit: string; engineOn: boolean; engineHours: number }) {
  const cx = 150; const cy = 140;
  const valueDeg = START + (Math.min(speed, max) / max) * SWEEP;
  const ticks = Array.from({ length: max / 20 + 1 }, (_, i) => i * 20);
  const [nx, ny] = polar(cx, cy, 112, valueDeg);
  const [ix, iy] = polar(cx, cy, 60, valueDeg);
  return (
    <figure className="ep-gauge" aria-label={`Speed ${speed} ${unit}, engine ${engineOn ? 'on' : 'off'}, ${engineHours} engine hours`}>
      <svg viewBox="0 0 300 270" role="img" aria-hidden>
        <circle cx={cx} cy={cy} r={128} className="ep-gauge__ring" />
        <path d={arc(cx, cy, 116, START, START + SWEEP)} className="ep-gauge__track" />
        {speed > 0 && <path d={arc(cx, cy, 116, START, valueDeg)} className="ep-gauge__value" />}
        {ticks.map((t) => {
          const d = START + (t / max) * SWEEP;
          const [x1, y1] = polar(cx, cy, 118, d);
          const [x2, y2] = polar(cx, cy, 112, d);
          const [lx, ly] = polar(cx, cy, 96, d);
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="ep-gauge__tick" />
              {t > 0 && <text x={lx} y={ly} className="ep-gauge__label" textAnchor="middle" dominantBaseline="middle">{t}</text>}
            </g>
          );
        })}
        <line x1={ix} y1={iy} x2={nx} y2={ny} className="ep-gauge__needle" />
        <circle cx={cx} cy={cy} r={62} className="ep-gauge__core" />
        <text x={cx} y={cy + 106} className="ep-gauge__speed" textAnchor="middle">{speed}</text>
        <text x={cx} y={cy + 120} className="ep-gauge__unit" textAnchor="middle">{unit}</text>
      </svg>
      <div className="ep-gauge__center">
        <div className="ep-gauge__stat">
          <span className="ep-gauge__engine">
            <MaskIcon src={engineGlyph} size={[20, 12]} />
            {engineOn && <span className="ep-gauge__live" />}
          </span>
          <strong className={engineOn ? 'is-on' : undefined}>{engineOn ? 'ON' : 'OFF'}</strong>
          <span>Engine</span>
        </div>
        <div className="ep-gauge__stat">
          <Icon name="time" size={16} />
          <strong>{engineHours}</strong>
          <span>H</span>
        </div>
      </div>
    </figure>
  );
}
