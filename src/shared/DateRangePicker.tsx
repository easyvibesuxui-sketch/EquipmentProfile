import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from '@syn/design-system';
import './DateRangePicker.css';

export interface DateRange { from: Date; to: Date }

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
/** Three-letter months as on the charts (Sep, not the en-GB "Sept"). */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const formatDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** The 42 days shown for a month (Sunday first, as in Figma), with the neighbours' days greyed. */
function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i - first.getDay()));
}

interface Props {
  open: boolean;
  /** The control the picker opens from; it is placed under it, right-aligned. */
  anchor: HTMLElement | null;
  value: DateRange;
  /** The last day that has data: later days are disabled. */
  max: Date;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}

const PRESETS: Array<{ label: string; range: (max: Date) => DateRange }> = [
  { label: 'Last 7 days', range: (max) => ({ from: addDays(max, -6), to: max }) },
  { label: 'Last 30 days', range: (max) => ({ from: addDays(max, -29), to: max }) },
  { label: 'This month', range: (max) => ({ from: new Date(max.getFullYear(), max.getMonth(), 1), to: max }) },
  { label: 'Last month', range: (max) => ({ from: new Date(max.getFullYear(), max.getMonth() - 1, 1), to: new Date(max.getFullYear(), max.getMonth(), 0) }) },
];

/**
 * Date range picker after Syn Figma "Large double calendar" (uNTCaDLpRs00HJFMOWXxP6, 1430:24294): two months side
 * by side (one on phones), Sunday first; the start day an Eerie Black circle with ›, the end with ‹, the days
 * between on a light Candy Apple band, today a Candy Apple ring. Quick ranges as outlined chips, Clear and Save at
 * the bottom. The first click sets the start, the second the end (in either order); Save applies.
 * App-level for now: Syn has the Figma design but no component yet, so this could move to Syn later.
 */
export function DateRangePicker({ open, anchor, value, max, onApply, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState<Date | null>(value.from);
  const [to, setTo] = useState<Date | null>(value.to);
  const [hover, setHover] = useState<Date | null>(null);
  // The first month shown: the end's month on phones (one month), the month before it otherwise (two).
  const firstMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() - (window.innerWidth < 760 ? 0 : 1), 1);
  const [month, setMonth] = useState(() => firstMonth(value.to));
  const [focusDay, setFocusDay] = useState<Date>(value.to);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; single: boolean } | null>(null);

  // Opening starts from the applied range again.
  useEffect(() => {
    if (!open) return;
    setFrom(value.from); setTo(value.to); setHover(null); setFocusDay(value.to);
    setMonth(firstMonth(value.to));
  }, [open, value.from, value.to]);

  // Under the anchor, right-aligned to it; above it when there is no room below; always inside the window.
  useLayoutEffect(() => {
    if (!open || !anchor) return undefined;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const single = window.innerWidth < 760;
      const width = Math.min(single ? 360 : 868, window.innerWidth - 32);
      const left = Math.max(16, Math.min(r.right - width, window.innerWidth - width - 16));
      const h = panel.current?.offsetHeight ?? (single ? 620 : 600);
      const below = r.bottom + 8;
      const above = r.top - 8 - h;
      const top = below + h <= window.innerHeight - 16 ? below : above >= 16 ? above : Math.max(16, window.innerHeight - h - 16);
      setPos((p) => (p && p.top === top && p.left === left && p.width === width && p.single === single ? p : { top, left, width, single }));
    };
    place();
    // Again once the panel has its real height.
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, anchor]);

  // Escape or a click outside closes it; focus goes into the calendar on open and back to the anchor on close.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); anchor?.querySelector('button')?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor?.contains(t)) onClose();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('.ep-range__day[tabindex="0"]')?.focus());
    return () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !pos) return null;

  const today = startOfDay(new Date());
  const lastDay = startOfDay(max);
  const pick = (d: Date) => {
    if (!from || to) { setFrom(d); setTo(null); return; }
    if (d < from) { setTo(from); setFrom(d); } else setTo(d);
  };
  // While choosing the end, the band follows the pointer.
  const end = to ?? (from && hover ? hover : null);
  const [lo, hi] = from && end ? (end < from ? [end, from] : [from, end]) : [from, from];
  const stateOf = (d: Date) => {
    if (!lo || !hi) return '';
    const isLo = sameDay(d, lo); const isHi = sameDay(d, hi);
    if (isLo && isHi) return 'is-single';
    if (isLo) return 'is-start';
    if (isHi) return 'is-end';
    return d > lo && d < hi ? 'is-between' : '';
  };

  const moveFocus = (d: Date) => {
    setFocusDay(d);
    // Keep the focused day on screen: page the months when it leaves them.
    const shown = pos.single ? 1 : 2;
    const firstShown = month; const lastShown = addMonths(month, shown - 1);
    if (d < firstShown) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    else if (d >= addMonths(lastShown, 1)) setMonth(addMonths(new Date(d.getFullYear(), d.getMonth(), 1), -(shown - 1)));
    requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>(`[data-day="${d.toDateString()}"]`)?.focus());
  };
  const onDayKey = (e: KeyboardEvent<HTMLButtonElement>, d: Date) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step) { e.preventDefault(); moveFocus(addDays(d, step)); }
  };

  const months = pos.single ? [month] : [month, addMonths(month, 1)];
  const label = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return createPortal(
    <div
      ref={panel}
      className={pos.single ? 'ep-range is-single' : 'ep-range'}
      role="dialog"
      aria-label="Choose a date range"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div className="ep-range__fields" aria-live="polite">
        <span className={from && !to ? 'ep-range__field is-active' : 'ep-range__field'}>
          <Icon name="calendar" size={14} /> {from ? formatDay(from) : 'Start date'}
        </span>
        <span className={from && !to ? 'ep-range__field' : 'ep-range__field is-active'}>
          <Icon name="calendar" size={14} /> {to ? formatDay(to) : 'End date'}
        </span>
      </div>
      <div className="ep-range__months">
        {months.map((m, mi) => (
          <div key={m.toISOString()} className="ep-range__month">
            <div className="ep-range__head">
              {mi === 0 ? (
                <button type="button" className="ep-range__nav" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><Icon name="back" size={20} /></button>
              ) : <span className="ep-range__nav-space" />}
              <span className="ep-range__title">{MONTHS[m.getMonth()]} {m.getFullYear()}</span>
              {mi === months.length - 1 ? (
                <button type="button" className="ep-range__nav" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><Icon name="next" size={20} /></button>
              ) : <span className="ep-range__nav-space" />}
            </div>
            <div className="ep-range__grid" role="grid" aria-label={m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}>
              <div role="row" className="ep-range__week">
                {WEEKDAYS.map((w) => <span key={w} role="columnheader" className="ep-range__wd">{w}</span>)}
              </div>
              {Array.from({ length: 6 }, (_, w) => (
                <div role="row" key={w} className="ep-range__week">
                  {monthDays(m).slice(w * 7, w * 7 + 7).map((d) => {
                    const outside = d.getMonth() !== m.getMonth();
                    if (outside) return <span key={d.toISOString()} role="gridcell" className="ep-range__cell is-outside" aria-hidden><span>{d.getDate()}</span></span>;
                    const disabled = d > lastDay;
                    const st = stateOf(d);
                    return (
                      <span key={d.toISOString()} role="gridcell" className={`ep-range__cell ${st}`}>
                        <button
                          type="button"
                          data-day={d.toDateString()}
                          className={sameDay(d, today) ? 'ep-range__day is-today' : 'ep-range__day'}
                          tabIndex={sameDay(d, focusDay) ? 0 : -1}
                          disabled={disabled}
                          aria-label={label(d)}
                          aria-pressed={st === 'is-start' || st === 'is-end' || st === 'is-single'}
                          onClick={() => pick(d)}
                          onMouseEnter={() => setHover(d)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setFocusDay(d)}
                          onKeyDown={(e) => onDayKey(e, d)}
                        >
                          {st === 'is-end' && <Icon name="back" size={10} className="ep-range__chev" />}
                          {d.getDate()}
                          {st === 'is-start' && <Icon name="next" size={10} className="ep-range__chev" />}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="ep-range__presets">
        <div className="ep-range__chips" role="group" aria-label="Quick ranges">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="ep-range__chip" onClick={() => { const r = p.range(lastDay); setFrom(r.from); setTo(r.to); setMonth(new Date(r.to.getFullYear(), r.to.getMonth() - (pos.single ? 0 : 1), 1)); }}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="ep-range__info"><Icon name="info-circle" size={16} /> Click a start day, then an end day.</p>
      </div>
      <div className="ep-range__foot">
        <button type="button" className="ep-range__clear" onClick={() => { setFrom(null); setTo(null); }}>Clear</button>
        <Button size="md" disabled={!from} onClick={() => { if (from) { onApply({ from, to: to ?? from }); onClose(); } }}>Save</Button>
      </div>
    </div>,
    document.body,
  );
}
