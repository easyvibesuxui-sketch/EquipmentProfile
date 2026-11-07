import { useCallback, useState } from 'react';
import { widgetById, widgets, type WidgetCategory } from './registry';

/**
 * Which widgets the Overview shows, in what order and how wide. `order` always lists every widget; `spans`
 * holds the widths changed in Edit Mode (12-column grid), keyed by card (see `CONNECTED`).
 */
export interface WidgetLayout {
  order: string[];
  hidden: string[];
  spans: Record<string, number>;
  /** Card heights in px set in Edit Mode; a card without one keeps its designed height. */
  heights: Record<string, number>;
}

/** The connected entities share one card (Dependance); on the page they move and resize as this one card. */
export const CONNECTED = 'connected';
export const MIN_SPAN = 3;
export const MAX_SPAN = 12;
/** Heights snap to rows of the 450px Overview card, with the 24px gutter between rows: 450, 924, 1398. */
export const ROW_HEIGHT = 450;
export const ROW_GAP = 24;
export const MAX_ROWS = 3;
export const rowsToHeight = (rows: number) => rows * ROW_HEIGHT + (rows - 1) * ROW_GAP;
export const heightToRows = (height: number) => Math.max(1, Math.min(MAX_ROWS, Math.round((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP))));
const MIN_HEIGHT = rowsToHeight(1);
const MAX_HEIGHT = rowsToHeight(MAX_ROWS);

const STORAGE_KEY = 'ep-overview-widgets-v1';

export const defaultLayout = (): WidgetLayout => ({
  order: widgets.map((w) => w.id),
  hidden: widgets.filter((w) => !w.defaultOn).map((w) => w.id),
  spans: {},
  heights: {},
});

/** Drops ids that no longer exist and appends new widgets (with their default visibility). */
function normalise(saved: Partial<WidgetLayout> | null): WidgetLayout {
  const base = defaultLayout();
  if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.hidden)) return base;
  const known = saved.order.filter((id) => widgetById.has(id));
  const added = base.order.filter((id) => !known.includes(id));
  const spans: Record<string, number> = {};
  Object.entries(saved.spans ?? {}).forEach(([k, v]) => {
    if (typeof v === 'number' && v >= MIN_SPAN && v <= MAX_SPAN) spans[k] = Math.round(v);
  });
  const heights: Record<string, number> = {};
  Object.entries(saved.heights ?? {}).forEach(([k, v]) => {
    if (typeof v === 'number' && v >= MIN_HEIGHT && v <= MAX_HEIGHT) heights[k] = rowsToHeight(heightToRows(v));
  });
  return {
    heights,
    order: [...new Set([...known, ...added])],
    hidden: [...saved.hidden.filter((id) => widgetById.has(id)), ...added.filter((id) => base.hidden.includes(id))],
    spans,
  };
}

function load(): WidgetLayout {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalise(raw ? (JSON.parse(raw) as Partial<WidgetLayout>) : null);
  } catch {
    return defaultLayout();
  }
}

function save(layout: WidgetLayout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    /* Private mode or blocked storage: the layout lasts until reload. */
  }
}

/** The widgets of one category, in page order. */
export const categoryIds = (layout: WidgetLayout, category: WidgetCategory) =>
  layout.order.filter((id) => widgetById.get(id)?.category === category);

export function setVisible(layout: WidgetLayout, ids: string[], visible: boolean): WidgetLayout {
  const hidden = new Set(layout.hidden);
  ids.forEach((id) => (visible ? hidden.delete(id) : hidden.add(id)));
  return { ...layout, hidden: layout.order.filter((id) => hidden.has(id)) };
}

const isConnected = (id: string) => widgetById.get(id)?.category === 'connected';

/** The cards on the page, in order: one per visible widget, the connected entities as one `CONNECTED` card. */
export function visibleCards(layout: WidgetLayout): string[] {
  const hidden = new Set(layout.hidden);
  const cards: string[] = [];
  layout.order.forEach((id) => {
    if (hidden.has(id)) return;
    const card = isConnected(id) ? CONNECTED : id;
    if (!cards.includes(card)) cards.push(card);
  });
  return cards;
}

/** The visible connected entities, in order: the rows of the Dependance card. */
export const visibleConnected = (layout: WidgetLayout) => layout.order.filter((id) => isConnected(id) && !layout.hidden.includes(id));

/** Moves a card next to another one on the page. Hidden widgets keep their order after the visible ones. */
export function moveCard(layout: WidgetLayout, card: string, target: string, after: boolean): WidgetLayout {
  if (card === target) return layout;
  const cards = visibleCards(layout).filter((c) => c !== card);
  const at = cards.indexOf(target);
  if (at < 0) return layout;
  cards.splice(after ? at + 1 : at, 0, card);
  const connected = visibleConnected(layout);
  const shown = cards.flatMap((c) => (c === CONNECTED ? connected : [c]));
  return { ...layout, order: [...shown, ...layout.order.filter((id) => !shown.includes(id))] };
}

/** Moves a card one place earlier or later (keyboard). */
export function stepCard(layout: WidgetLayout, card: string, step: -1 | 1): WidgetLayout {
  const cards = visibleCards(layout);
  const i = cards.indexOf(card);
  const target = cards[i + step];
  return target ? moveCard(layout, card, target, step > 0) : layout;
}

/** Hides a card: a widget, or every connected entity for the Dependance card. */
export const removeCard = (layout: WidgetLayout, card: string) =>
  setVisible(layout, card === CONNECTED ? layout.order.filter(isConnected) : [card], false);

/** The card's width in columns: the Edit Mode width, else the registry default (Dependance: 3). */
export const spanOf = (layout: WidgetLayout, card: string) =>
  layout.spans[card] ?? (card === CONNECTED ? 3 : widgetById.get(card)?.size.span ?? MAX_SPAN);

export const setSpan = (layout: WidgetLayout, card: string, span: number): WidgetLayout => ({
  ...layout,
  spans: { ...layout.spans, [card]: Math.max(MIN_SPAN, Math.min(MAX_SPAN, Math.round(span))) },
});

/** The card's height in px, or undefined for its designed height. */
export const heightOf = (layout: WidgetLayout, card: string): number | undefined => layout.heights[card];

/** Sets the card's height to the nearest of 1, 2 or 3 rows; `null` restores the designed height. */
export function setHeight(layout: WidgetLayout, card: string, height: number | null): WidgetLayout {
  const heights = { ...layout.heights };
  if (height === null) delete heights[card];
  else heights[card] = rowsToHeight(heightToRows(height));
  return { ...layout, heights };
}

/** How the card regroups below 1600px (responsive.css): up to 4 columns takes half the row, more the full row. */
export const fitOf = (span: number) => (span >= MAX_SPAN ? 'full' : span >= 5 ? 'wide' : 'half');

/** The saved layout, persisted in this browser. */
export function useWidgetLayout() {
  const [layout, setLayout] = useState<WidgetLayout>(load);
  const apply = useCallback((next: WidgetLayout) => {
    setLayout(next);
    save(next);
  }, []);
  return [layout, apply] as const;
}
