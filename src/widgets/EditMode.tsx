import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Button, Icon, IconButton, Tooltip } from '@syn/design-system';
import {
  MAX_SPAN, ROW_GAP, ROW_HEIGHT, fitOf, heightToRows, heightOf, moveCard, removeCard, setHeight, setSpan, spanOf, stepCard, visibleCards, type WidgetLayout,
} from './layout';
import './EditMode.css';

const GAP = 24;
const SIZES = [
  { label: '1/3', span: 4 },
  { label: '2/3', span: 8 },
  { label: 'Full width', span: MAX_SPAN },
];
/** The size button that shows as current: the nearest of 1/3, 2/3 and Full width. */
const sizeOf = (span: number) => (span <= 4 ? 4 : span <= 8 ? 8 : MAX_SPAN);

/** Figma "Edit Mode" banner (17118:62279): in place of the tabs while editing. */
export function EditBanner({ onSection, onReset }: { onSection: () => void; onReset: () => void }) {
  return (
    <section className="ep-edit-banner" aria-labelledby="ep-edit-title">
      <div className="ep-edit-banner__text">
        <h2 id="ep-edit-title" className="ep-edit-banner__title">Edit Mode</h2>
        <p className="ep-edit-banner__hint">make overview page more comfortable for you. Replace or remove Widgets, change Widget size, change position.</p>
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
      <Button variant="secondary" size="sm" iconStart="refresh-change" className="ep-edit-banner__reset" onClick={onReset}>Reset to default</Button>
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
}

export function EditBar({ onDiscard, onSave, onUndo, onRedo, canUndo, canRedo }: EditBarProps) {
  return (
    <div className="ep-edit-bar" role="region" aria-label="Edit Mode actions">
      <Button variant="secondary" size="md" className="ep-edit-bar__button" onClick={onDiscard}>Discard</Button>
      {/* Not in Figma: icon-only Undo and Redo between Discard and Save, named by their tooltips. */}
      <div className="ep-edit-bar__history" role="group" aria-label="History">
        <Tooltip content="Undo (Ctrl+Z)">
          <IconButton icon="undo" label="Undo" size="md" variant="outline" disabled={!canUndo} onClick={onUndo} />
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Shift+Z)">
          {/* Syn has no redo glyph: the undo glyph, mirrored. */}
          <IconButton icon="undo" label="Redo" size="md" variant="outline" className="ep-edit-bar__redo" disabled={!canRedo} onClick={onRedo} />
        </Tooltip>
      </div>
      <Button size="md" className="ep-edit-bar__button" onClick={onSave}>Save</Button>
    </div>
  );
}

function CloseButton({ label, onClick, className }: { label: string; onClick: () => void; className: string }) {
  return (
    <button type="button" className={`ep-edit-close ${className}`} aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <Icon name="close" size={14} />
    </button>
  );
}

interface GridProps {
  layout: WidgetLayout;
  onChange: (layout: WidgetLayout) => void;
  render: (card: string) => ReactNode;
  labelOf: (card: string) => string;
  onAdd: () => void;
}

/** Resize handles: the side bars change the width, the bottom bar the height, the corner grip both. */
type Handle = 'e' | 'w' | 's' | 'se';
const HANDLES: Handle[] = ['w', 'e', 's', 'se'];
const changesWidth = (h: Handle) => h !== 's';
const changesHeight = (h: Handle) => h === 's' || h === 'se';
const HANDLE_LABELS: Record<Handle, string> = {
  w: 'Drag to change the width', e: 'Drag to change the width',
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

type Resize = { card: string; handle: Handle; x: number; y: number; width: number; height: number; col: number };

/**
 * The Overview in Edit Mode (Figma 17068:71648, 17107:58944, 17107:61363). Every card is in its edit outline
 * at once, no click needed: the dashed border, a bar with the move grip, 1/3, 2/3, Full width and remove, and
 * the resize handles. Drag a side bar to resize on the 12 columns, shown as Smoke slots while resizing; the
 * bottom bar changes the height in 450px rows (double-click restores it) and the corner grip both. Drag the card
 * anywhere to move it: it follows the pointer and the other cards make room.
 * Keyboard: Arrow Left/Right moves the focused card, Shift+Left/Right its width, Shift+Up/Down its height,
 * Delete removes it.
 * The widgets themselves are inert while editing, so maps and drawers do not take the pointer.
 */
export function EditGrid({ layout, onChange, render, labelOf, onAdd }: GridProps) {
  const grid = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resize, setResize] = useState<Resize | null>(null);
  const [guide, setGuide] = useState<{ top: number; height: number } | null>(null);
  // The pressed card: where the pointer went down, where it holds the card, and how far the card is shifted.
  const press = useRef<{ card: string; x: number; y: number; grabX: number; grabY: number; tx: number; ty: number; moved: boolean } | null>(null);
  const [announce, setAnnounce] = useState('');
  const cards = visibleCards(layout);

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
    if (!p.moved) { p.moved = true; setDragging(p.card); }
    // The card follows the pointer; its place in the grid (where it drops) moves as the other cards make room.
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
    if (next.order.join() !== layout.order.join()) onChange(next);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    press.current = null;
    e.currentTarget.style.transform = '';
    setDragging(null);
  };

  const startResize = (e: PointerEvent<HTMLSpanElement>, card: string, handle: Handle) => {
    e.stopPropagation();
    e.preventDefault();
    const item = e.currentTarget.closest<HTMLElement>('[data-card]')!;
    const content = item.querySelector<HTMLElement>('.ep-edit-item__content')!;
    const width = grid.current!.clientWidth;
    e.currentTarget.setPointerCapture(e.pointerId);
    setResize({
      card, handle, x: e.clientX, y: e.clientY,
      width: item.getBoundingClientRect().width, height: content.getBoundingClientRect().height, col: (width - GAP * 11) / 12,
    });
    if (changesWidth(handle)) setGuide({ top: item.offsetTop, height: item.offsetHeight });
  };
  const moveResize = (e: PointerEvent<HTMLSpanElement>) => {
    if (!resize) return;
    let next = layout;
    if (changesWidth(resize.handle)) {
      const dx = (e.clientX - resize.x) * (resize.handle === 'w' ? -1 : 1);
      next = setSpan(next, resize.card, Math.round((resize.width + dx + GAP) / (resize.col + GAP)));
    }
    if (changesHeight(resize.handle)) next = setHeight(next, resize.card, resize.height + e.clientY - resize.y);
    if (spanOf(next, resize.card) !== spanOf(layout, resize.card) || heightOf(next, resize.card) !== heightOf(layout, resize.card)) {
      onChange(next);
      const item = grid.current?.querySelector<HTMLElement>(`[data-card="${resize.card}"]`);
      if (item && changesWidth(resize.handle)) setGuide({ top: item.offsetTop, height: item.offsetHeight });
    }
  };
  const endResize = () => { setResize(null); setGuide(null); };

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

  return (
    <div
      className="ep-edit-grid syn-grid"
      ref={grid}
      style={{ '--grid-gap': `${GAP}px` } as CSSProperties}
    >
      {guide && (
        <div className="ep-edit-guide" style={{ top: guide.top, height: guide.height }} aria-hidden>
          {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
        </div>
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
            onPointerCancel={(e) => { press.current = null; e.currentTarget.style.transform = ''; setDragging(null); }}
            onKeyDown={(e) => onKeyDown(e, card)}
          >
            <div className="ep-edit-item__bar">
              <span className="ep-edit-grip" title="Drag to move" aria-hidden><Icon name="dragable" size={16} /></span>
              <div className="ep-edit-sizes" role="group" aria-label={`Width of ${label}`}>
                {SIZES.map((sz) => (
                  <button key={sz.label} type="button" aria-pressed={sizeOf(span) === sz.span} onClick={() => onChange(setSpan(layout, card, sz.span))}>{sz.label}</button>
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
      <button type="button" className="ep-edit-add syn-grid__item ep-col ep-col--half" style={{ '--span': 3 } as CSSProperties} onClick={onAdd}>
        <Icon name="plus-in-circle" size={34} />
        <span className="syn-title-text">Add Widget</span>
      </button>
      <p id="ep-edit-help" className="syn-visually-hidden">
        Drag, or press Arrow Left and Right, to move. Drag a side bar, or press Shift with Arrow Left or Right, to change the width; drag the bottom bar, or press Shift with Arrow Up or Down, to change the height by a row. Delete removes it.
      </p>
      <p className="syn-visually-hidden" aria-live="polite">{announce}</p>
    </div>
  );
}
