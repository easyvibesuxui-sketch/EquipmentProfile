import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Button, Icon, Tooltip } from '@syn/design-system';
import {
  MAX_ROWS, MAX_SPAN, MIN_ROWS, MIN_SPAN, ROW_GAP, ROW_HEIGHT, fitOf, rowsOf, rowsToHeight, moveCard, removeCard, setHeight, setSpan, spanOf, stepCard, visibleCards,
  type Scope, type WidgetLayout,
} from './layout';
import './EditMode.css';

const GAP = 24;
/** One step of the row grid: a 213px row and the 24px gutter under it. */
const ROW_STEP = ROW_HEIGHT + ROW_GAP;
/** Empty rows of slots below the last card, where cards can grow or go next. */
const SPARE_ROWS = 2;

const SCOPES: Array<{ id: Scope; label: string }> = [
  { id: 'org', label: 'Organization' },
  { id: 'mine', label: 'You' },
];
const HINTS: Record<Scope, string> = {
  org: 'Choose the widgets everyone in your organization sees on the Overview. Drag a widget to move it, drag its edges to resize it.',
  mine: 'Make the Overview comfortable for you: show, move and resize widgets. Only you see these changes.',
};

/**
 * Figma "Switcher" (17107:61363): a Smoke track with a White border, 4px padding; the chosen option Eerie Black.
 * A radio group: arrow keys move between the options. App-level, as Syn has no two-option switcher of this size
 * (it could move to Syn later).
 */
function ScopeSwitcher({ value, onChange }: { value: Scope; onChange: (scope: Scope) => void }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + SCOPES.length) % SCOPES.length;
    onChange(SCOPES[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className="ep-scope" role="radiogroup" aria-labelledby="ep-scope-label" style={{ '--at': SCOPES.findIndex((s) => s.id === value) } as CSSProperties}>
      {/* The Eerie Black thumb slides under the chosen option. */}
      <span className="ep-scope__thumb" aria-hidden />
      {SCOPES.map((s, i) => (
        <button
          key={s.id}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={value === s.id}
          tabIndex={value === s.id ? 0 : -1}
          className="ep-scope__option"
          onClick={() => onChange(s.id)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/** Figma "Edit Mode" banner (17107:61461): in place of the tabs while editing. */
interface EditBannerProps {
  scope: Scope;
  /** Managers choose between the organization's Overview and their own; everyone else edits only their own. */
  onScope?: (scope: Scope) => void;
  /** In the You view: there is no own layout yet, the Overview follows the organization's. */
  following?: boolean;
  onWidgets: () => void;
}

export function EditBanner({ scope, onScope, following, onWidgets }: EditBannerProps) {
  return (
    <section className="ep-edit-banner" aria-labelledby="ep-edit-title">
      <div className="ep-edit-banner__text">
        <h2 id="ep-edit-title" className="ep-edit-banner__title">Edit Mode</h2>
        <p className="ep-edit-banner__hint">{HINTS[scope]}</p>
        {onScope && (
          <div className="ep-edit-banner__status">
            <span id="ep-scope-label" className="ep-edit-banner__label">View</span>
            <ScopeSwitcher value={scope} onChange={onScope} />
            {scope === 'mine' && (
              <span className={following ? 'ep-edit-banner__chip' : 'ep-edit-banner__chip is-own'} role="status">
                {following ? 'Following the organization' : 'Your own Overview'}
              </span>
            )}
          </div>
        )}
        {scope === 'mine' && following && (
          <p className="ep-edit-banner__note">Any change here starts your own Overview; the organization's stays as it is.</p>
        )}
      </div>
      {/* Figma: a 116px Dodger Blue line drawing of a widget and a pencil. */}
      <svg className="ep-edit-banner__art" width="116" height="116" viewBox="0 0 80 80" fill="none" aria-hidden>
        <rect x="20.5" y="20.5" width="39" height="11" rx="3" />
        <rect x="20.5" y="38.5" width="15" height="21" rx="3" />
        <path d="M44 59.5h-3.5V56l11-11a2.5 2.5 0 0 1 3.5 0v0a2.5 2.5 0 0 1 0 3.5l-11 11Z" />
        <path d="m49.5 47.5 3.5 3.5" />
      </svg>
      <button type="button" className="ep-edit-banner__widgets" onClick={onWidgets}>
        <Icon name="plus-in-circle" size={14} />
        Widgets
      </button>
    </section>
  );
}

/** Figma "Bottom Line" (17107:61363): Discard, Reset in the middle, Save; kept in view at the bottom while editing. */
interface EditBarProps {
  onDiscard: () => void;
  onSave: () => void;
  /** Organization: back to the default Overview; You: back to following the organization (undoable). */
  onReset: () => void;
  canReset: boolean;
  resetLabel: string;
}

export function EditBar({ onDiscard, onSave, onReset, canReset, resetLabel }: EditBarProps) {
  return (
    <div className="ep-edit-bar" role="region" aria-label="Edit Mode actions">
      <Button variant="secondary" size="md" className="ep-edit-bar__button" onClick={onDiscard}>Discard</Button>
      {/* Reset in the middle, as in Figma. Undo / Redo have no buttons; Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z still work. */}
      <Button variant="secondary" size="md" iconStart="refresh-change" className="ep-edit-bar__reset" aria-label={resetLabel} title={resetLabel} disabled={!canReset} onClick={onReset}>Reset</Button>
      <Button size="md" className="ep-edit-bar__button" onClick={onSave}>Save</Button>
    </div>
  );
}

/** Remove: a 28px circle (Figma) with a 44px hit area and a tooltip below it naming the widget (Delete still removes). */
function CloseButton({ label, onClick, className }: { label: string; onClick: () => void; className: string }) {
  return (
    <Tooltip content={label} placement="bottom" className="ep-edit-close-tip">
      <button type="button" className={`ep-edit-close ${className}`} aria-label={label} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <Icon name="close" size={14} />
      </button>
    </Tooltip>
  );
}

interface GridProps {
  layout: WidgetLayout;
  onChange: (layout: WidgetLayout) => void;
  render: (card: string, height: number) => ReactNode;
  labelOf: (card: string) => string;
  onAdd: () => void;
}

/** Resize handles (Figma "Witget With Slot"): the right pill changes the width, the bottom pill the height, the
    Enlarge corner both. */
type Handle = 'e' | 's' | 'se';
const HANDLES: Handle[] = ['e', 's', 'se'];
const changesWidth = (h: Handle) => h !== 's';
const changesHeight = (h: Handle) => h !== 'e';
const HANDLE_LABELS: Record<Handle, string> = {
  e: 'Drag to change the width',
  s: 'Drag to change the height; double-click to restore it',
  se: 'Drag to change the width and height; double-click to restore the height',
};
const rowsText = (rows: number) => (rows === 1 ? '1 row' : `${rows} rows`);

/**
 * A resize in progress: the card follows the pointer freely, and a Dodger Blue outline on the background grid
 * shows the columns and rows it snaps to on release.
 */
type Resize = {
  card: string; handle: Handle; x: number; y: number;
  /** The card's size when the drag started, the pointer's offset now, the column width and the card's place. */
  width: number; height: number; dx: number; dy: number;
  col: number; left: number; top: number; colStart: number;
  span: number; rows: number;
};

/**
 * The Overview in Edit Mode (Figma 17107:61363). The page is a grid of 12 columns and 213px rows, drawn behind the
 * cards as White slots everywhere: between, under and below the cards (two spare rows), as Zoho has it. Every card
 * is in its edit outline at once: the bar with the move grip and remove, the widget below, and the resize handles.
 * Drag the right pill to change the width and the bottom pill to change the height, freely; the corner does both.
 * The card follows the pointer and an outline shows the columns and rows it will take; release applies them.
 * Drag the card anywhere to move it: an outline shows where it will land, and the move applies on release.
 * Keyboard: Arrow Left/Right moves the focused card, Shift+Left/Right its width, Shift+Up/Down its height,
 * Delete removes it. The widgets themselves are inert while editing, so maps and drawers do not take the pointer.
 */
export function EditGrid({ layout, onChange, render, labelOf, onAdd }: GridProps) {
  const grid = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resize, setResize] = useState<Resize | null>(null);
  // The pressed card: where the pointer went down, where it holds the card, and how far the card is shifted.
  const press = useRef<{ card: string; x: number; y: number; grabX: number; grabY: number; tx: number; ty: number; moved: boolean } | null>(null);
  const [announce, setAnnounce] = useState('');
  const cards = visibleCards(layout);
  // A move in progress. Nothing reflows while dragging: `drop` is the order the card would land in, laid out in a
  // hidden copy of the grid to find where the outline goes.
  const [drop, setDrop] = useState<{ card: string; layout: WidgetLayout } | null>(null);
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
      setDrop({ card: p.card, layout });
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
    const col = (grid.current!.clientWidth - GAP * 11) / 12;
    e.currentTarget.setPointerCapture(e.pointerId);
    setResize({
      card, handle, x: e.clientX, y: e.clientY,
      width: item.offsetWidth, height: item.offsetHeight, dx: 0, dy: 0,
      col, left: item.offsetLeft, top: item.offsetTop, colStart: Math.round(item.offsetLeft / (col + GAP)),
      span: spanOf(layout, card), rows: rowsOf(layout, card),
    });
  };
  const moveResize = (e: PointerEvent<HTMLSpanElement>) => {
    if (!resize) return;
    const dx = changesWidth(resize.handle) ? e.clientX - resize.x : 0;
    const dy = changesHeight(resize.handle) ? e.clientY - resize.y : 0;
    const span = Math.max(MIN_SPAN, Math.min(MAX_SPAN, Math.round((resize.width + dx + GAP) / (resize.col + GAP))));
    const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.round((resize.height + dy + ROW_GAP) / ROW_STEP)));
    setResize({ ...resize, dx, dy, span, rows });
  };
  const endResize = () => {
    if (!resize) return;
    let next = setSpan(layout, resize.card, resize.span);
    if (resize.rows !== rowsOf(layout, resize.card)) next = setHeight(next, resize.card, rowsToHeight(resize.rows));
    if (spanOf(next, resize.card) !== spanOf(layout, resize.card) || rowsOf(next, resize.card) !== rowsOf(layout, resize.card)) onChange(next);
    setResize(null);
  };

  // The preview: the snapped outline at the card's place on the background grid.
  const preview = resize && (() => {
    const width = resize.span * resize.col + (resize.span - 1) * GAP;
    const height = rowsToHeight(resize.rows);
    // Wider than what is left of its row: the card wraps to the start of the next row on release.
    const wraps = resize.colStart + resize.span > MAX_SPAN;
    const label = `${resize.span} / 12 columns · ${rowsText(resize.rows)}${wraps ? ' · moves to the next row' : ''}`;
    return { width, height, label, wraps };
  })();

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, card: string) => {
    if (e.target !== e.currentTarget) return;
    const span = spanOf(layout, card);
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onChange(removeCard(layout, card)); setAnnounce(`${labelOf(card)} removed`); return; }
    if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, rowsOf(layout, card) + (e.key === 'ArrowUp' ? -1 : 1)));
      const next = setHeight(layout, card, rowsToHeight(rows));
      onChange(next);
      setAnnounce(`${labelOf(card)}, ${rowsText(rows)} high`);
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

  // The background grid: as many 213px rows as the cards take, plus the spare rows (the grid's bottom padding).
  const [slotRows, setSlotRows] = useState(SPARE_ROWS + 2);
  useLayoutEffect(() => {
    const el = grid.current;
    if (!el) return undefined;
    const measure = () => {
      const n = Math.max(1, Math.round((el.clientHeight + ROW_GAP) / ROW_STEP));
      setSlotRows((prev) => (prev === n ? prev : n));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={cards.length ? 'ep-edit-grid syn-grid' : 'ep-edit-grid is-empty syn-grid'}
      ref={grid}
      style={{ '--grid-gap': `${GAP}px`, '--ep-row': `${ROW_HEIGHT}px`, '--ep-row-gap': `${ROW_GAP}px`, '--ep-spare': SPARE_ROWS } as CSSProperties}
    >
      {/* Free slots are a mouse shortcut to Widgets (the banner's Widgets button is the keyboard way). */}
      <div className="ep-edit-slots" aria-hidden onClick={(e) => { if ((e.target as Element).tagName === 'SPAN') onAdd(); }}>
        {Array.from({ length: slotRows * 12 }, (_, i) => <span key={i} />)}
      </div>
      {resize && preview && (
        <div
          className={preview.wraps ? 'ep-edit-preview is-wrapping' : 'ep-edit-preview'}
          style={{
            left: resize.left, top: resize.top,
            width: preview.wraps ? (grid.current?.clientWidth ?? preview.width) - resize.left : preview.width, height: preview.height,
          } as CSSProperties}
          aria-hidden
        >
          <span>{preview.label}</span>
        </div>
      )}
      {drop && (
        <>
          {/* The landing order laid out invisibly on the same grid, to measure where the card would go. */}
          <div className="ep-edit-ghost syn-grid" ref={ghost} aria-hidden>
            {visibleCards(drop.layout).map((c) => {
              const sp = spanOf(drop.layout, c);
              return <div key={c} data-ghost={c} className={`syn-grid__item ep-col ep-col--${fitOf(sp)}`} style={{ '--span': sp, '--rows': rowsOf(drop.layout, c) } as CSSProperties} />;
            })}
          </div>
          {dropRect && (
            <div className="ep-edit-preview ep-edit-preview--move" style={{ left: dropRect.left, top: dropRect.top, width: dropRect.width, height: dropRect.height }} aria-hidden>
              <span>{drop.layout.order.join() === layout.order.join() ? 'Current place' : 'Move here'}</span>
            </div>
          )}
        </>
      )}
      {cards.map((card, index) => {
        const span = spanOf(layout, card);
        const rows = rowsOf(layout, card);
        const label = labelOf(card);
        const isResizing = resize?.card === card;
        const cls = ['ep-edit-item', 'syn-grid__item', 'ep-col', `ep-col--${fitOf(span)}`,
          dragging === card && 'is-dragging', isResizing && 'is-resizing'].filter(Boolean).join(' ');
        // While resizing, the card follows the pointer (at least one column and one row).
        const live = isResizing ? {
          width: Math.max(resize.col, resize.width + resize.dx),
          height: Math.max(ROW_HEIGHT, resize.height + resize.dy),
        } : undefined;
        return (
          <div
            key={card}
            data-card={card}
            className={cls}
            style={{ '--span': span, '--rows': rows, '--i': index, ...live } as CSSProperties}
            tabIndex={0}
            role="group"
            aria-label={`${label}, ${span} of 12 columns, ${rowsText(rows)}`}
            aria-describedby="ep-edit-help"
            onPointerDown={(e) => onPointerDown(e, card)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={(e) => endDrag(e.currentTarget, false)}
            onKeyDown={(e) => onKeyDown(e, card)}
          >
            <div className="ep-edit-item__bar">
              <span className="ep-edit-grip" aria-hidden><Icon name="dragable" size={20} /></span>
              <CloseButton label={`Remove ${label}`} className="ep-edit-close--bar" onClick={() => onChange(removeCard(layout, card))} />
            </div>
            {/* The widget fills the card under its 52px bar (and inside the 1px borders). */}
            <div className="ep-edit-item__content" {...{ inert: '' }}>{render(card, rowsToHeight(rows) - 54)}</div>
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
                {/* Three diagonal lines, the resize grip of a text field (the arrows read as expand, four arrows as move). */}
                {handle === 'se' && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M12.5 3.5l-9 9M12.5 7l-5.5 5.5M12.5 10.5l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        );
      })}
      {/* With no widgets left, the grid says what belongs here and opens Widgets. */}
      {!cards.length && (
        <button type="button" className="ep-edit-add is-alone syn-grid__item ep-col ep-col--full" style={{ '--span': MAX_SPAN, '--rows': 2 } as CSSProperties} onClick={onAdd}>
          <Icon name="plus-in-circle" size={34} />
          <span className="ep-edit-add__title syn-title-text">No widgets on the Overview</span>
          <span className="ep-edit-add__hint">Add widgets to see this machine's location, usage and history at a glance.</span>
          <span className="ep-edit-add__cta">Add Widget</span>
        </button>
      )}
      <p id="ep-edit-help" className="syn-visually-hidden">
        Drag, or press Arrow Left and Right, to move. Drag the right edge, or press Shift with Arrow Left or Right, to change the width; drag the bottom edge, or press Shift with Arrow Up or Down, to change the height by a row. Delete removes it.
      </p>
      <p className="syn-visually-hidden" aria-live="polite">{announce}</p>
    </div>
  );
}
