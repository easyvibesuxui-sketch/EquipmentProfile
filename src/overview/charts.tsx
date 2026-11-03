import { useState, type CSSProperties } from 'react';
import { Button, Card, IconButton, Segmented, Tag } from '@syn/design-system';
import { distance, operatingHours, operationByHour, type HourRun } from '../data/equipment';

const MAX_HOURS = 24;
const GRID_LINES = [24, 20, 16, 12, 8, 4];

interface Bar { value: number; tone?: 'sienna'; label: string }

function ChartToolbar({ period, onPeriod }: { period: string; onPeriod: (p: string) => void }) {
  return (
    <>
      <Tag variant="soft" icon="calendar" onClick={() => undefined} className="ep-chart__range">
        <span className="is-muted">Start date</span><span className="ep-chart__sep" aria-hidden />
        <span className="is-muted">End date</span>
      </Tag>
      <Segmented
        label="Period"
        value={period}
        onChange={onPeriod}
        options={[{ value: 'monthly', label: 'Montly' }, { value: 'weekly', label: 'Weekly' }]}
        className="ep-chart__period"
      />
      <span className="ep-chart__nav">
        <IconButton icon="back" label="Previous period" />
        <IconButton icon="next" label="Next period" />
      </span>
    </>
  );
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

function BarChartWidget({ title, series, bars, xLabels, shaded, groups, defaultPeriod, extraSeries }: {
  title: string; series: string; bars: Bar[]; xLabels: string[]; shaded?: number[]; groups: number;
  defaultPeriod: 'monthly' | 'weekly'; extraSeries?: string;
}) {
  const [period, setPeriod] = useState<string>(defaultPeriod);
  const [shown, setShown] = useState(true);
  const [extraShown, setExtraShown] = useState(false);
  return (
    <Card title={title} actions={<ChartToolbar period={period} onPeriod={setPeriod} />} className="ep-widget ep-chart">
      <div className={shown ? undefined : 'ep-plot--hidden'}>
        <BarPlot bars={bars} xLabels={xLabels} shaded={shaded} groups={groups} unit="H" caption={`${title}, ${period}`} />
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

export function OperatingHoursWidget() {
  const bars = operatingHours.values.map((value, i) => ({ value, label: operatingHours.days[Math.floor(i / 6)] }));
  return (
    <BarChartWidget
      title="Operating Hours"
      series="Operating Hours"
      extraSeries="Idle Hours"
      bars={bars}
      xLabels={operatingHours.days}
      shaded={operatingHours.weekend}
      groups={operatingHours.days.length}
      defaultPeriod="weekly"
    />
  );
}

export function DistanceWidget() {
  const start = new Date(2026, 7, 19);
  const bars: Bar[] = distance.values.map((value, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i);
    return { value, tone: value > distance.longTrip ? 'sienna' : undefined, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
  });
  return (
    <BarChartWidget
      title="Distance travelled"
      series="Distance traveled"
      bars={bars}
      xLabels={distance.labels}
      groups={1}
      defaultPeriod="monthly"
    />
  );
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
