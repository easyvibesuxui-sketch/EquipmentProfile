import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Button, Icon, IconButton, Tooltip } from '@syn/design-system';
import {
  MAX_SPAN, MIN_SPAN, ROW_GAP, ROW_HEIGHT, fitOf, heightToRows, rowsToHeight, heightOf, moveCard, removeCard, setHeight, setSpan, spanOf, stepCard, visibleCards, type WidgetLayout,
} from './layout';
import './EditMode.css';

const GAP = 24;
/** One layout slot (Figma 17107:61363): a 1-row edit card, i.e. its 52px bar over a 450px card and the 2px border. */
const SLOT_HEIGHT = 52 + ROW_HEIGHT + 2;
/** Shortcut text for tooltips: ⌘ on Apple platforms, Ctrl elsewhere. */
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const shortcut = (keys: string) => (isMac ? keys.replace('Ctrl+', '⌘').replace('Shift+', '⇧') : keys);
/**
 * Width presets as the Figma Edit Mode names them on the 12-column grid: "1/3" is the 3-column card (436px at
 * 1920, four to a row), "2/3" two of them (6 columns, 896px, like the map), Full width all 12.
 */
const SIZES = [
  { label: '1/3', span: 3 },
  { label: '2/3', span: 6 },
  { label: 'Full width', short: 'Full', span: MAX_SPAN },
] as Array<{ label: string; short?: string; span: number }>;
/** The size button that shows as current: the preset nearest the card's width (ties go to the smaller). */
const sizeOf = (span: number) => SIZES.reduce((best, s) => (Math.abs(s.span - span) < Math.abs(best - span) ? s.span : best), SIZES[0].span);

/** Figma "Edit Mode" banner (17118:62279): in place of the tabs while editing. */
interface EditBannerProps {
  onSection: () => void;
  /** When unsaved changes from an earlier visit were restored: when they were last edited. */
  restoredAt?: number | null;
  onDiscardRestored?: () => void;
}

const timeOf = (ms: number) => new Date(ms).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function EditBanner({ onSection, restoredAt, onDiscardRestored }: EditBannerProps) {
  return (
    <section className="ep-edit-banner" aria-labelledby="ep-edit-title">
      <div className="ep-edit-banner__text">
        <h2 id="ep-edit-title" className="ep-edit-banner__title">Edit Mode</h2>
        <p className="ep-edit-banner__hint">make overview page more comfortable for you. Replace or remove Widgets, change Widget size, change position.</p>
        {restoredAt && (
          <p className="ep-edit-banner__restored" role="status">
            Unsaved changes restored, last edited {timeOf(restoredAt)}.
            <button type="button" onClick={onDiscardRestored}>Discard them</button>
          </p>
        )}
      </div>
      {/* Figma "Manage widgets — Customize": a 80px Dodger Blue line drawing of a widget and a pencil. */}
      <svg className="ep-edit-banner__art" width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
        <rect x="20.5" y="20.5" width="39" height="11" rx="3" />
        <rect x="20.5" y="38.5" width="15" height="21" rx="3" />
        <path d="M44 59.5h-3.5V56l11-11a2.5 2.5 0 0 1 3.5 0v0a2.5 2.5 0 0 1 0 3.5l-11 11Z" />
        <path d="m49.5 47.5 3.5 3.5" />
      </svg>
      {/* Not in Figma: puts the draft back to the default Overview; Save keeps it, Discard drops it. */}
      {/* Hierarchy: Section (add widgets) is the main action, filled Eerie Black; Reset is Syn's outlined secondary. */}
      <Button size="sm" iconStart="plus-in-circle" className="ep-edit-banner__section" onClick={onSection}>Section</Button>
    </section>
  );
}

/** Figma "Bottom Line" (17107:60003): Discard and Save, kept in view at the bottom while editing. */
interface EditBarProps {
  onDiscard: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Puts the draft back to the Figma Overview (undoable); off while the draft already is the default. */
  onReset: () => void;
  canReset: boolean;
}

export function EditBar({ onDiscard, onSave, onUndo, onRedo, canUndo, canRedo, onReset, canReset }: EditBarProps) {
  return (
    <div className="ep-edit-bar" role="region" aria-label="Edit Mode actions">
      <Button variant="secondary" size="md" className="ep-edit-bar__button" onClick={onDiscard}>Discard</Button>
      {/* Not in Figma: icon-only Undo, Reset to default and Redo between Discard and Save, named by their tooltips. */}
      <div className="ep-edit-bar__history" role="group" aria-label="History">
        <IconButton icon="undo" label="Undo" tooltip={<>Undo <kbd className="ep-kbd">{shortcut('Ctrl+Z')}</kbd></>} size="md" variant="outline" disabled={!canUndo} onClick={onUndo} />
        <IconButton icon="refresh-change" label="Reset to default" size="md" variant="outline" disabled={!canReset} onClick={onReset} />
        {/* Syn has no redo glyph: the undo glyph, mirrored. */}
        <IconButton icon="undo" label="Redo" tooltip={<>Redo <kbd className="ep-kbd">{shortcut('Ctrl+Shift+Z')}</kbd></>} size="md" variant="outline" className="ep-edit-bar__redo" disabled={!canRedo} onClick={onRedo} />
      </div>
      <Button size="md" className="ep-edit-bar__button" onClick={onSave}>Save</Button>
    </div>
  );
}

/** Remove: a 28px circle (Figma) with a 44px hit area and a real tooltip naming the widget. */
function CloseButton({ label, onClick, className }: { label: string; onClick: () => void; className: string }) {
  return (
    <Tooltip content={<>{label} <kbd className="ep-kbd">Delete</kbd></>} placement="left">
      <button type="button" className={`ep-edit-close ${className}`} aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <Icon name="close" size={14} />
      </button>
    </Tooltip>
  );
}

interface GridProps {
  layout: WidgetLayout;
  onChange: (layout: WidgetLayout) => void;
  render: (card: string) => ReactNode;
  labelOf: (card: string) => string;
  onAdd: () => void;
}

/** Resize handles: the right bar changes the width, the bottom bar the height, the corner grip both. */
type Handle = 'e' | 's' | 'se';
const HANDLES: Handle[] = ['e', 's', 'se'];
const changesWidth = (h: Handle) => h !== 's';
const changesHeight = (h: Handle) => h === 's' || h === 'se';
const HANDLE_LABELS: Record<Handle, string> = {
  e: 'Drag to change the width',
  s: 'Drag to change the height (1, 2 or 3 rows); double-click to restore it',
  se: 'Drag to change the width and height; double-click to restore the height',
};
const rowsLabel = (height?: number) => {
  if (!height) return 'Auto';
  const rows = heightToRows(height);
  return rows === 1 ? '1 row' : `${rows} rows`;
};
/** Shift+Arrow Up/Down changes the height by one 450px row. */
const ROW_STEP = ROW_HEIGHT + ROW_GAP;

/**
 * A resize in progress. Nothing reflows while dragging: a preview outline shows the size the card will snap
 * to (columns, rows), and the size is applied on release.
 */
type Resize = {
  card: string; handle: Handle; x: number; y: number;
  /** The card's width and its widget's height when the drag started; the bar's height above the widget. */
  width: number; height: number; bar: number;
  /** Column width, and where the card sits in the grid. */
  col: number; left: number; top: number; colStart: number;
  /** The snapped target. `rows` null keeps the current height. */
  span: number; rows: number | null;
};

/**
 * The Overview in Edit Mode (Figma 17068:71648, 17107:58944, 17107:61363). Every card is in its edit outline
 * at once, no click needed: the dashed border, a bar with the move grip, 1/3, 2/3, Full width and remove, and
 * the resize handles. Drag the right bar to change the width on the 12 columns and the bottom bar to change the
 * height in 450px rows (double-click restores it); the corner grip does both. While dragging nothing reflows: a
 * Dodger Blue outline shows the snapped size over the 12 column slots, and the size applies on release. Drag the card
 * anywhere to move it: it follows the pointer, a Dodger Blue outline shows where it will land, and the move
 * applies on release.
 * Keyboard: Arrow Left/Right moves the focused card, Shift+Left/Right its width, Shift+Up/Down its height,
 * Delete removes it.
 * The widgets themselves are inert while editing, so maps and drawers do not take the pointer.
 */
export function EditGrid({ layout, onChange, render, labelOf, onAdd }: GridProps) {
  const grid = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resize, setResize] = useState<Resize | null>(null);
  // The pressed card: where the pointer went down, where it holds the card, and how far the card is shifted.
  const press = useRef<{ card: string; x: number; y: number; grabX: number; grabY: number; tx: number; ty: number; moved: boolean } | null>(null);
  const [announce, setAnnounce] = useState('');
  const cards = visibleCards(layout);
  // A move in progress. Nothing reflows while dragging: `drop.layout` is the order the card would land in, laid
  // out in a hidden copy of the grid (with each card's measured height) to find where the outline goes.
  const [drop, setDrop] = useState<{ card: string; layout: WidgetLayout; heights: Record<string, number> } | null>(null);
  const [dropRect, setDropRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const ghost = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!drop) { setDropRect(null); return; }
    const el = ghost.current?.querySelector<HTMLElement>(`[data-ghost="${drop.card}"]`);
    if (el) setDropRect({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  }, [drop]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>, card: string) => {
    if (e.button !== 0 || (e.target as Element).closest('button')) return;
    const r = e.currentTarget.getBoundingClientRect();
    press.current = { card, x: e.clientX, y: e.clientY, grabX: e.clientX - r.left, grabY: e.clientY - r.top, tx: 0, ty: 0, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) return;
    if (!p.moved) {
      p.moved = true;
      setDragging(p.card);
      const heights: Record<string, number> = {};
      grid.current?.querySelectorAll<HTMLElement>('[data-card]').forEach((el) => { heights[el.dataset.card!] = el.offsetHeight; });
      setDrop({ card: p.card, layout, heights });
    }
    // The card follows the pointer; the outline shows where it will land.
    const el = e.currentTarget;
    const r0 = el.getBoundingClientRect();
    p.tx = e.clientX - p.grabX - (r0.left - p.tx);
    p.ty = e.clientY - p.grabY - (r0.top - p.ty);
    el.style.transform = `translate(${p.tx}px, ${p.ty}px)`;
    const over = document.elementsFromPoint(e.clientX, e.clientY)
      .map((el) => el.closest<HTMLElement>('[data-card]'))
      .find((el) => el && el.dataset.card !== p.card);
    if (!over) return;
    const r = over.getBoundingClientRect();
    const next = moveCard(layout, p.card, over.dataset.card!, e.clientX > r.left + r.width / 2);
    setDrop((d) => (d && next.order.join() !== d.layout.order.join() ? { ...d, layout: next } : d));
  };
  const endDrag = (el: HTMLElement, apply: boolean) => {
    press.current = null;
    el.style.transform = '';
    setDragging(null);
    if (apply && drop && drop.layout.order.join() !== layout.order.join()) onChange(drop.layout);
    setDrop(null);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => endDrag(e.currentTarget, true);

  const startResize = (e: PointerEvent<HTMLSpanElement>, card: string, handle: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    const item = e.currentTarget.closest<HTMLElement>('[data-card]')!;
    const content = item.querySelector<HTMLElement>('.ep-edit-item__content')!;
    const col = (grid.current!.clientWidth - GAP * 11) / 12;
    const height = content.getBoundingClientRect().height;
    e.currentTarget.setPointerCapture(e.pointerId);
    setResize({
      card, handle, x: e.clientX, y: e.clientY,
      width: item.getBoundingClientRect().width, height, bar: item.offsetHeight - content.offsetHeight,
      col, left: item.offsetLeft, top: item.offsetTop, colStart: Math.round(item.offsetLeft / (col + GAP)),
      span: spanOf(layout, card), rows: changesHeight(handle) ? heightToRows(height) : null,
    });
  };
  const moveResize = (e: PointerEvent<HTMLSpanElement>) => {
    if (!resize) return;
    const span = changesWidth(resize.handle)
      ? Math.max(MIN_SPAN, Math.min(MAX_SPAN, Math.round((resize.width + e.clientX - resize.x + GAP) / (resize.col + GAP))))
      : resize.span;
    const rows = changesHeight(resize.handle) ? heightToRows(resize.height + e.clientY - resize.y) : null;
    if (span !== resize.span || rows !== resize.rows) setResize({ ...resize, span, rows });
  };
  const endResize = () => {
    if (!resize) return;
    let next = setSpan(layout, resize.card, resize.span);
    if (resize.rows !== null) next = setHeight(next, resize.card, rowsToHeight(resize.rows));
    if (spanOf(next, resize.card) !== spanOf(layout, resize.card) || heightOf(next, resize.card) !== heightOf(layout, resize.card)) onChange(next);
    setResize(null);
  };

  // The preview: the snapped outline at the card's place, and the 12 columns along that row.
  const preview = resize && (() => {
    const width = resize.span * resize.col + (resize.span - 1) * GAP;
    const height = resize.bar + (resize.rows !== null ? rowsToHeight(resize.rows) : resize.height);
    // Wider than what is left of its row: the card wraps to the start of the next row on release.
    const wraps = resize.colStart + resize.span > MAX_SPAN;
    const label = `${resize.span} / 12 columns${resize.rows !== null ? ` · ${resize.rows === 1 ? '1 row' : `${resize.rows} rows`}` : ''}${wraps ? ' · moves to the next row' : ''}`;
    return { width, height, label, wraps };
  })();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, card: string) => {
    if (e.target !== e.currentTarget) return;
    const span = spanOf(layout, card);
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onChange(removeCard(layout, card)); setAnnounce(`${labelOf(card)} removed`); return; }
    if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const content = e.currentTarget.querySelector<HTMLElement>('.ep-edit-item__content');
      const current = heightOf(layout, card) ?? content?.getBoundingClientRect().height ?? 450;
      const next = setHeight(layout, card, current + (e.key === 'ArrowUp' ? -ROW_STEP : ROW_STEP));
      onChange(next);
      setAnnounce(`${labelOf(card)}, ${heightOf(next, card)} pixels high`);
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.key === 'ArrowLeft' ? -1 : 1;
    if (e.shiftKey) {
      const next = setSpan(layout, card, span + step);
      onChange(next);
      setAnnounce(`${labelOf(card)}, ${spanOf(next, card)} of 12 columns`);
    } else {
      const next = stepCard(layout, card, step);
      onChange(next);
      const order = visibleCards(next);
      setAnnounce(`${labelOf(card)}, position ${order.indexOf(card) + 1} of ${order.length}`);
      requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-card="${card}"]`)?.focus());
    }
  };

  // The layout grid behind the cards (Figma's white column slots, "as Zoho has it"): 12 slots per row, each row as
  // tall as the cards that start on it, plus one empty 1-row-card row below the last, where a card can go next.
  const [slotRows, setSlotRows] = useState<Array<{ top: number; height: number }>>([]);
  const measureSlots = () => {
    const el = grid.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const items = [...el.querySelectorAll<HTMLElement>(':scope > .ep-edit-item, :scope > .ep-edit-add')];
    const tops = [...new Set(items.map((i) => Math.round(i.getBoundingClientRect().top - box.top)))].sort((a, b) => a - b);
    const bottom = items.reduce((max, i) => Math.max(max, i.getBoundingClientRect().bottom - box.top), 0);
    const rows = tops.map((top, k) => ({ top, height: (k + 1 < tops.length ? tops[k + 1] - GAP : Math.round(bottom)) - top }));
    rows.push({ top: Math.round(bottom) + GAP, height: SLOT_HEIGHT });
    setSlotRows((prev) => (JSON.stringify(prev) === JSON.stringify(rows) ? prev : rows));
  };
  useLayoutEffect(measureSlots);
  useEffect(() => {
    const el = grid.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => measureSlots());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="ep-edit-grid syn-grid"
      ref={grid}
      style={{ '--grid-gap': `${GAP}px`, '--ep-slot-h': `${SLOT_HEIGHT}px` } as CSSProperties}
    >
      <div className="ep-edit-slots" aria-hidden>
        {slotRows.map((r) => (
          <div key={r.top} className="ep-edit-slots__row" style={{ top: r.top, height: r.height }}>
            {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
          </div>
        ))}
      </div>
      {resize && preview && (
        <div
          className={preview.wraps ? 'ep-edit-preview is-wrapping' : 'ep-edit-preview'}
          style={{
            left: resize.left, top: resize.top,
            width: preview.wraps ? (grid.current?.clientWidth ?? preview.width) - resize.left : preview.width, height: preview.height,
            '--col': `${resize.col}px`, '--gap': `${GAP}px`,
          } as CSSProperties}
          aria-hidden
        >
          <span>{preview.label}</span>
        </div>
      )}
      {drop && (
        <>
          {/* The landing order laid out invisibly, same grid and heights, to measure where the card would go. */}
          <div className="ep-edit-ghost syn-grid" ref={ghost} aria-hidden>
            {visibleCards(drop.layout).map((c) => {
              const sp = spanOf(drop.layout, c);
              return <div key={c} data-ghost={c} className={`syn-grid__item ep-col ep-col--${fitOf(sp)}`} style={{ '--span': sp, height: drop.heights[c] } as CSSProperties} />;
            })}
          </div>
          {dropRect && (
            <div className="ep-edit-preview ep-edit-preview--move" style={{ left: dropRect.left, top: dropRect.top, width: dropRect.width, height: dropRect.height }} aria-hidden>
              <span>{drop.layout.order.join() === layout.order.join() ? 'Current place' : 'Move here'}</span>
            </div>
          )}
        </>
      )}
      {cards.map((card) => {
        const span = spanOf(layout, card);
        const label = labelOf(card);
        const cls = ['ep-edit-item', 'syn-grid__item', 'ep-col', `ep-col--${fitOf(span)}`,
          dragging === card && 'is-dragging', resize?.card === card && 'is-resizing'].filter(Boolean).join(' ');
        return (
          <div
            key={card}
            data-card={card}
            className={cls}
            style={{ '--span': span } as CSSProperties}
            tabIndex={0}
            role="group"
            aria-label={`${label}, ${span} of 12 columns`}
            aria-describedby="ep-edit-help"
            onPointerDown={(e) => onPointerDown(e, card)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={(e) => endDrag(e.currentTarget, false)}
            onKeyDown={(e) => onKeyDown(e, card)}
          >
            <div className="ep-edit-item__bar">
              <span className="ep-edit-grip" aria-hidden><Icon name="dragable" size={16} /></span>
              <div className="ep-edit-sizes" role="group" aria-label={`Width of ${label}`}>
                {SIZES.map((sz) => (
                  <button key={sz.label} type="button" aria-pressed={sizeOf(span) === sz.span} onClick={() => onChange(setSpan(layout, card, sz.span))}>
                    {sz.short ? <><span className="ep-edit-sizes__long">{sz.label}</span><span className="ep-edit-sizes__short">{sz.short}</span></> : sz.label}
                  </button>
                ))}
              </div>
              <CloseButton label={`Remove ${label}`} className="ep-edit-close--bar" onClick={() => onChange(removeCard(layout, card))} />
            </div>
            <div className="ep-edit-item__content" {...{ inert: '' }}>{render(card)}</div>
            {(
              <>
                {HANDLES.map((handle) => (
                  <span
                    key={handle}
                    className={`ep-edit-handle ep-edit-handle--${handle}`}
                    aria-hidden
                    title={HANDLE_LABELS[handle]}
                    onDoubleClick={changesHeight(handle) ? () => onChange(setHeight(layout, card, null)) : undefined}
                    onPointerDown={(e) => startResize(e, card, handle)}
                    onPointerMove={moveResize}
                    onPointerUp={endResize}
                    onPointerCancel={endResize}
                  >
                    {/* The bottom handle says how high the card is: Auto (as designed) or 1, 2 or 3 rows. */}
                    {handle === 's' && (
                      <>
                        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden><path d="M4 1v10M1 3.5 4 1l3 2.5M1 8.5 4 11l3-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {rowsLabel(heightOf(layout, card))}
                      </>
                    )}
                  </span>
                ))}
              </>
            )}
          </div>
        );
      })}
      {/* "Add Widget" is a 1/3 card (3 columns) as high as an edit card. With no widgets left it spans the row
          and says what belongs here. */}
      <button
        type="button"
        className={cards.length ? 'ep-edit-add syn-grid__item ep-col ep-col--half' : 'ep-edit-add is-alone syn-grid__item ep-col ep-col--full'}
        style={{ '--span': cards.length ? 3 : MAX_SPAN } as CSSProperties}
        onClick={onAdd}
      >
        <Icon name="plus-in-circle" size={34} />
        {cards.length ? (
          <span className="syn-title-text">Add Widget</span>
        ) : (
          <>
            <span className="ep-edit-add__title syn-title-text">No widgets on the Overview</span>
            <span className="ep-edit-add__hint">Add widgets to see this machine's location, usage and history at a glance.</span>
            <span className="ep-edit-add__cta">Add Widget</span>
          </>
        )}
      </button>
      <p id="ep-edit-help" className="syn-visually-hidden">
        Drag, or press Arrow Left and Right, to move. Drag the right bar, or press Shift with Arrow Left or Right, to change the width; drag the bottom bar, or press Shift with Arrow Up or Down, to change the height by a row. Delete removes it.
      </p>
      <p className="syn-visually-hidden" aria-live="polite">{announce}</p>
    </div>
  );
}
