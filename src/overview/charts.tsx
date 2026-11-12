import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, Card, IconButton, Segmented, Tag } from '@syn/design-system';
import { distance, operatingHours, operationByHour, type HourRun } from '../data/equipment';
import { DateRangePicker, MONTHS, addDays, daysBetween, formatDay, sameDay, type DateRange } from '../shared/DateRangePicker';

const MAX_HOURS = 24;
const GRID_LINES = [24, 20, 16, 12, 8, 4];

interface Bar { value: number; tone?: 'sienna'; label: string }

type Period = 'monthly' | 'weekly' | 'custom';

/** The last day with data: today. */
const lastDay = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const minDate = (a: Date, b: Date) => (a < b ? a : b);

/** Weekly: the 7 days up to the range's end; Monthly: the calendar month of the range's end. */
function rangeFor(period: Period, end: Date): DateRange {
  const to = minDate(end, lastDay());
  if (period === 'weekly') return { from: addDays(to, -6), to };
  if (period === 'monthly') return { from: new Date(to.getFullYear(), to.getMonth(), 1), to: minDate(new Date(to.getFullYear(), to.getMonth() + 1, 0), lastDay()) };
  return { from: to, to };
}
/** Previous / next period: a week, a calendar month, or a custom range of the same length. */
function shiftRange(period: Period, r: DateRange, dir: -1 | 1): DateRange {
  if (period === 'monthly') {
    const m = new Date(r.from.getFullYear(), r.from.getMonth() + dir, 1);
    return { from: m, to: minDate(new Date(m.getFullYear(), m.getMonth() + 1, 0), lastDay()) };
  }
  const len = daysBetween(r.from, r.to) + 1;
  const from = addDays(r.from, dir * len);
  return { from, to: addDays(from, len - 1) };
}

function ChartToolbar({ period, range, onPeriod, onRange }: {
  period: Period; range: DateRange; onPeriod: (p: Period) => void; onRange: (r: DateRange, custom?: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const atEnd = range.to >= lastDay();
  useEffect(() => {
    const b = anchor.current?.querySelector('button');
    if (b) { b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', `Date range: ${formatDay(range.from)} to ${formatDay(range.to)}. Change`); }
  }, [open, range]);
  return (
    <>
      {/* Opens the range picker (Syn Figma "Large double calendar"). */}
      <span ref={anchor} className="ep-chart__range-anchor">
        <Tag variant="soft" icon="calendar" onClick={() => setOpen((o) => !o)} className={open ? 'ep-chart__range is-open' : 'ep-chart__range'}>
          <span>{formatDay(range.from)}</span><span className="ep-chart__sep" aria-hidden />
          <span>{formatDay(range.to)}</span>
        </Tag>
      </span>
      <DateRangePicker open={open} anchor={anchor.current} value={range} max={lastDay()} onApply={(r) => onRange(r, true)} onClose={() => setOpen(false)} />
      <Segmented
        label="Period"
        value={period}
        onChange={(p) => onPeriod(p as Period)}
        options={[{ value: 'monthly', label: 'Montly' }, { value: 'weekly', label: 'Weekly' }]}
        className="ep-chart__period"
      />
      <span className="ep-chart__nav">
        <IconButton icon="back" label={period === 'monthly' ? 'Previous month' : period === 'weekly' ? 'Previous week' : 'Previous period'} onClick={() => onRange(shiftRange(period, range, -1))} />
        <IconButton icon="next" label={period === 'monthly' ? 'Next month' : period === 'weekly' ? 'Next week' : 'Next period'} disabled={atEnd} onClick={() => onRange(shiftRange(period, range, 1))} />
      </span>
    </>
  );
}

/**
 * A chart's data by day. Inside the Figma window the Figma values are used, so the default view is the design;
 * other days get stable sample values (the same every time, from the date).
 */
interface SeriesDef {
  key: string;
  /** Bars per day in short ranges (Operating Hours: six 4-hour blocks); 1 otherwise. */
  slots: number;
  window: DateRange;
  figma: number[];
  /** Figma x labels for the Figma window. */
  figmaLabels: string[];
  /** Shade weekends (Operating Hours). */
  weekends: boolean;
  longTrip?: number;
}
const noise = (key: string, day: number, slot: number) => {
  let h = 2166136261;
  for (const c of `${key}:${day}:${slot}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
};
const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
function slotValue(s: SeriesDef, d: Date, slot: number) {
  const i = daysBetween(s.window.from, d);
  if (i >= 0 && d <= s.window.to) return s.figma[i * s.slots + slot] ?? 0;
  const r = noise(s.key, dayNumber(d), slot);
  return r < 0.14 ? 0 : Math.round((2.5 + noise(s.key, dayNumber(d), slot + 7) * 11.8) * 10) / 10;
}
const dayValue = (s: SeriesDef, d: Date) => {
  if (s.slots === 1) return slotValue(s, d, 0);
  const vals = Array.from({ length: s.slots }, (_, k) => slotValue(s, d, k));
  return Math.min(22, Math.round((vals.reduce((a, b) => a + b, 0) / s.slots) * 1.4 * 10) / 10);
};
const shortDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const weekday = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short' });

function barsFor(s: SeriesDef, r: DateRange) {
  const days = Array.from({ length: daysBetween(r.from, r.to) + 1 }, (_, i) => addDays(r.from, i));
  const isFigma = sameDay(r.from, s.window.from) && sameDay(r.to, s.window.to);
  const tone = (v: number) => (s.longTrip && v > s.longTrip ? 'sienna' as const : undefined);
  const shaded = s.weekends ? days.flatMap((d, i) => (d.getDay() === 0 || d.getDay() === 6 ? [i] : [])) : [];
  if (s.slots > 1 && days.length <= 10) {
    return {
      bars: days.flatMap((d) => Array.from({ length: s.slots }, (_, k) => ({ value: slotValue(s, d, k), label: `${shortDay(d)}. ${weekday(d)}` }))),
      xLabels: isFigma ? s.figmaLabels : days.map((d) => `${shortDay(d)}. ${weekday(d)}`),
      groups: days.length, shaded,
    };
  }
  const n = Math.min(days.length, 14);
  const xLabels = isFigma ? s.figmaLabels : n < 2 ? days.map(shortDay) : Array.from({ length: n }, (_, i) => shortDay(days[Math.round((i * (days.length - 1)) / (n - 1))]));
  return {
    bars: days.map((d) => { const v = dayValue(s, d); return { value: v, tone: tone(v), label: shortDay(d) }; }),
    xLabels, groups: days.length, shaded,
  };
}

function LegendChip({ label, color, active, onToggle }: { label: string; color: string; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="ep-legend" aria-pressed={active} onClick={onToggle} style={{ '--dot': color } as CSSProperties}>
      <span className="ep-legend__dot" aria-hidden />
      {label}
    </button>
  );
}

/** Bars on a 0–24 scale with the Figma grid lines (8 H dashed), optional shaded columns and x labels. */
function BarPlot({ bars, xLabels, shaded = [], groups, unit, caption }: {
  bars: Bar[]; xLabels: string[]; shaded?: number[]; groups: number; unit: string; caption: string;
}) {
  const perGroup = bars.length / groups;
  return (
    <figure className="ep-plot">
      <div className="ep-plot__area">
        {GRID_LINES.map((h) => (
          <div key={h} className={h === 8 ? 'ep-plot__line is-dashed' : 'ep-plot__line'} style={{ bottom: `${(h / MAX_HOURS) * 100}%` }}>
            <span>{h} H</span>
          </div>
        ))}
        <div className="ep-plot__bars" aria-hidden style={{ gridTemplateColumns: `repeat(${bars.length}, 1fr)` }}>
          {shaded.map((g) => (
            <span key={`s${g}`} className="ep-plot__shade" style={{ gridColumn: `${g * perGroup + 1} / span ${perGroup}` }} />
          ))}
          {bars.map((b, i) => (
            <span key={i} className="ep-plot__slot" style={{ gridColumn: i + 1 }}>
              {b.value > 0 && (
                <span className={b.tone ? `ep-plot__bar is-${b.tone}` : 'ep-plot__bar'} style={{ height: `${(b.value / MAX_HOURS) * 100}%` }}>
                  <span className="ep-plot__tip">{Math.round(b.value)}{unit}<br />{b.label}</span>
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <div className="ep-plot__x" aria-hidden>
        {xLabels.map((l) => <span key={l}>{l}</span>)}
      </div>
      <figcaption className="syn-visually-hidden">{caption}</figcaption>
      <div className="syn-visually-hidden">
        <table>
          <caption>{caption}</caption>
          <tbody>{bars.map((b, i) => <tr key={i}><th scope="row">{b.label}</th><td>{b.value} {unit}</td></tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}

function BarChartWidget({ title, series, data, defaultPeriod, extraSeries }: {
  title: string; series: string; data: SeriesDef; defaultPeriod: 'monthly' | 'weekly'; extraSeries?: string;
}) {
  // Opens on the Figma window; Monthly / Weekly, the arrows and the range picker change it.
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [range, setRange] = useState<DateRange>(data.window);
  const [shown, setShown] = useState(true);
  const [extraShown, setExtraShown] = useState(false);
  const { bars, xLabels, groups, shaded } = barsFor(data, range);
  const caption = `${title}, ${formatDay(range.from)} to ${formatDay(range.to)}`;
  return (
    <Card
      title={title}
      actions={(
        <ChartToolbar
          period={period} range={range}
          onPeriod={(p) => { setPeriod(p); setRange(rangeFor(p, range.to)); }}
          onRange={(r, custom) => { setRange(r); if (custom) setPeriod('custom'); }}
        />
      )}
      className="ep-widget ep-chart"
    >
      <div className={shown ? undefined : 'ep-plot--hidden'}>
        <BarPlot key={`${range.from.toDateString()}-${range.to.toDateString()}`} bars={bars} xLabels={xLabels} shaded={shaded} groups={groups} unit="H" caption={caption} />
      </div>
      <footer className="ep-chart__footer">
        <div className="ep-chart__legend">
          <LegendChip label={series} color="var(--syn-action-brand)" active={shown} onToggle={() => setShown(!shown)} />
          {extraSeries && (
            <LegendChip label={extraSeries} color="var(--syn-status-info)" active={extraShown} onToggle={() => setExtraShown(!extraShown)} />
          )}
        </div>
        <Button variant="secondary" size="xs" iconStart="download" shape="pill">Report</Button>
      </footer>
    </Card>
  );
}

const operatingSeries: SeriesDef = {
  key: 'operating', slots: 6, weekends: true,
  window: { from: new Date(2026, 7, 19), to: new Date(2026, 7, 28) },
  figma: operatingHours.values, figmaLabels: operatingHours.days,
};
const distanceSeries: SeriesDef = {
  key: 'distance', slots: 1, weekends: false, longTrip: distance.longTrip,
  window: { from: new Date(2026, 7, 19), to: addDays(new Date(2026, 7, 19), distance.values.length - 1) },
  figma: distance.values, figmaLabels: distance.labels,
};

export function OperatingHoursWidget() {
  return <BarChartWidget title="Operating Hours" series="Operating Hours" extraSeries="Idle Hours" data={operatingSeries} defaultPeriod="weekly" />;
}

export function DistanceWidget() {
  return <BarChartWidget title="Distance travelled" series="Distance traveled" data={distanceSeries} defaultPeriod="monthly" />;
}

const hourLabel = (h: number) => `${String(((h + 11) % 12) + 1).padStart(2, '0')} ${h < 12 || h === 24 ? 'AM' : 'PM'}`;
const HOURS = Array.from({ length: 24 }, (_, i) => i + 1);

function runBlocks(runs: HourRun[]) {
  return runs.flatMap((r) => (r.joined
    ? [{ from: r.from, to: r.to, planned: r.planned }]
    : Array.from({ length: r.to - r.from + 1 }, (_, k) => ({ from: r.from + k, to: r.from + k, planned: r.planned }))));
}

/** Figma "Operation Hours by hour": one row a day, one column an hour, red blocks for the hours worked. */
export function OperationByHourWidget() {
  const { week, year, days } = operationByHour;
  return (
    <Card
      title="Operation Hours by hour"
      actions={(
        <span className="ep-week">
          <IconButton icon="back" label="Previous week" />
          <span className="ep-week__label"><span className="syn-title-text">{week} <span className="is-muted">{year}</span></span></span>
          <IconButton icon="next" label="Next week" />
        </span>
      )}
      className="ep-widget ep-heat"
    >
      <div className="ep-heat__grid" role="table" aria-label={`Operation hours by hour, ${week} ${year}`}>
        <div role="row" className="ep-heat__row ep-heat__row--head">
          <span role="columnheader" className="ep-heat__day"><span className="syn-visually-hidden">Day</span></span>
          {HOURS.map((h) => <span key={h} role="columnheader" className="ep-heat__hour">{hourLabel(h)}</span>)}
        </div>
        {days.map((d) => {
          const worked = d.runs.reduce((n, r) => n + r.to - r.from + 1, 0);
          return (
            <div key={d.day} role="row" className={d.upcoming ? 'ep-heat__row is-upcoming' : 'ep-heat__row'}>
              <span role="rowheader" className="ep-heat__day">
                <span>{d.month}</span><strong>{d.day}</strong><span>{d.weekday}</span>
              </span>
              <span role="cell" className="ep-heat__cells">
                <span className="syn-visually-hidden">{d.upcoming ? 'Upcoming' : `${worked} hours`}</span>
                {runBlocks(d.runs).map((b) => (
                  <span
                    key={b.from}
                    className={b.planned ? 'ep-heat__block is-planned' : 'ep-heat__block'}
                    style={{ gridColumn: `${b.from} / ${b.to + 1}` }}
                    title={`${hourLabel(b.from)}–${hourLabel(b.to)}`}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
