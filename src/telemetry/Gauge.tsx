import engineIcon from '../assets/telemetry/gauge-engine.png';
import hoursIcon from '../assets/telemetry/gauge-hours.png';

// Geometry measured from the Figma gauge (324 x 288).
const CX = 153;
const CY = 141;
const START = 225; // degrees from 12 o'clock, clockwise
const SWEEP = 270;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
}
function arc(r: number, from: number, to: number) {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

/** Speed gauge of the Telemetry frame: 0–max over 270°, the reading as the cyan arc and needle; engine and hours inside. */
export function Gauge({ speed, max, unit, engineOn, engineHours }: { speed: number; max: number; unit: string; engineOn: boolean; engineHours: number }) {
  const valueDeg = START + (Math.min(speed, max) / max) * SWEEP;
  const ticks = Array.from({ length: max / 20 + 1 }, (_, i) => i * 20);
  const [nx1, ny1] = polar(67, valueDeg);
  const [nx2, ny2] = polar(117, valueDeg);
  return (
    <figure className="ep-gauge">
      <svg viewBox="0 0 324 288" role="img" aria-label={`Speed ${speed} ${unit}, engine ${engineOn ? 'on' : 'off'}, ${engineHours} engine hours`}>
        <circle cx={CX} cy={CY} r={127} className="ep-gauge__ring" />
        <path d={arc(111.5, START, START + SWEEP)} className="ep-gauge__track" />
        {speed > 0 && <path d={arc(111.5, START, valueDeg)} className="ep-gauge__value" />}
        {ticks.map((t) => {
          const d = START + (t / max) * SWEEP;
          const [x1, y1] = polar(105, d);
          const [x2, y2] = polar(109, d);
          const [lx, ly] = polar(94, d);
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className="ep-gauge__tick" />
              {t > 0 && <text x={lx} y={ly} className="ep-gauge__label" textAnchor="middle" dominantBaseline="central">{t}</text>}
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r={67} className="ep-gauge__core" />
        <line x1={nx1} y1={ny1} x2={nx2} y2={ny2} className="ep-gauge__needle" />
        <image href={engineIcon} x={117} y={114} width={22} height={20} opacity={engineOn ? 1 : 0.5} />
        <text x={128} y={149} textAnchor="middle" className={engineOn ? 'ep-gauge__state is-on' : 'ep-gauge__state'}>{engineOn ? 'ON' : 'OFF'}</text>
        <text x={128} y={162} textAnchor="middle" className="ep-gauge__caption">Engine</text>
        <image href={hoursIcon} x={171} y={115} width={19} height={19} />
        <text x={180.5} y={150} textAnchor="middle" className="ep-gauge__hours">{engineHours}</text>
        <text x={180.5} y={162} textAnchor="middle" className="ep-gauge__caption">H</text>
        <text x={CX} y={239} textAnchor="middle" className="ep-gauge__speed">{speed}</text>
        <text x={CX} y={251} textAnchor="middle" className="ep-gauge__unit">{unit}</text>
      </svg>
    </figure>
  );
}
