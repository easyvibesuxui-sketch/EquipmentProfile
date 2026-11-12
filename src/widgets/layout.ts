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
/**
 * The row grid of Figma 17107:61363: rows of 213px with the 24px gutter, so a widget of 2 rows is the 450px Overview
 * card, 4 rows 924px and 6 rows 1398px. Heights snap to whole rows.
 */
export const ROW_HEIGHT = 213;
export const ROW_GAP = 24;
export const MIN_ROWS = 1;
export const MAX_ROWS = 6;
export const rowsToHeight = (rows: number) => rows * ROW_HEIGHT + (rows - 1) * ROW_GAP;
export const heightToRows = (height: number) => Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.round((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP))));
const MIN_HEIGHT = rowsToHeight(MIN_ROWS);
const MAX_HEIGHT = rowsToHeight(MAX_ROWS);

/** The person's own layout (it was the only one before the Organization view). */
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

/** The rows a card takes when its height was never changed: its designed height on the row grid. */
export const defaultRows = (card: string) => (card === CONNECTED ? 2 : widgetById.get(card)?.size.rows ?? 2);
/** The rows a card takes on the grid: the height set in Edit Mode, else the designed one. */
export const rowsOf = (layout: WidgetLayout, card: string) => {
  const h = layout.heights[card];
  return h ? heightToRows(h) : defaultRows(card);
};

/** The card's height in px, or undefined for its designed height. */
export const heightOf = (layout: WidgetLayout, card: string): number | undefined => layout.heights[card];

/** Sets the card's height to the nearest whole number of rows (1 to 6); `null` restores the designed height. */
export function setHeight(layout: WidgetLayout, card: string, height: number | null): WidgetLayout {
  const heights = { ...layout.heights };
  if (height === null) delete heights[card];
  else heights[card] = rowsToHeight(heightToRows(height));
  return { ...layout, heights };
}

/** How the card regroups below 1024px (responsive.css): up to 4 columns takes half the row, more the full row. */
export const fitOf = (span: number) => (span >= MAX_SPAN ? 'full' : span >= 5 ? 'wide' : 'half');

/**
 * Two layouts (Figma Edit Mode "View": Organization / You):
 * - `org`: what the manager sets for everyone in the organization: which widgets show, where and how big.
 * - `mine`: the signed-in person's own layout; `null` means it follows the organization's.
 * The Overview shows `mine` if there is one, else `org`. A manager can switch on widgets for themself that the
 * organization does not show; anyone else can only show or hide what the organization offers.
 */
export type Scope = 'org' | 'mine';
export interface Views { org: WidgetLayout; mine: WidgetLayout | null }

/** The prototype's signed-in person ("M.M."): a manager, so Edit Mode offers both views. */
export const currentUser = { isManager: true };

const ORG_KEY = 'ep-overview-widgets-org-v1';

function loadKey(key: string): WidgetLayout | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? normalise(JSON.parse(raw) as Partial<WidgetLayout>) : null;
  } catch {
    return null;
  }
}
function saveKey(key: string, layout: WidgetLayout | null) {
  try {
    if (layout) window.localStorage.setItem(key, JSON.stringify(layout));
    else window.localStorage.removeItem(key);
  } catch {
    /* Private mode or blocked storage: the layout lasts until reload. */
  }
}

/** The layout the Overview shows. */
export const effectiveLayout = (views: Views) => views.mine ?? views.org;

/** The saved layouts, persisted in this browser (the organization's would live on the server). */
export function useViews() {
  const [views, setViews] = useState<Views>(() => ({ org: loadKey(ORG_KEY) ?? defaultLayout(), mine: loadKey(STORAGE_KEY) }));
  const apply = useCallback((next: Views) => {
    setViews(next);
    saveKey(ORG_KEY, next.org);
    saveKey(STORAGE_KEY, next.mine);
  }, []);
  return [views, apply] as const;
}

/**
 * The Edit Mode draft (both layouts and the view being edited), kept in this browser while editing so a refresh or
 * a closed tab loses nothing. It is restored on the next visit (Edit Mode opens again with a notice) and cleared on
 * Save or Discard.
 */
const DRAFT_KEY = 'ep-overview-widgets-draft-v2';

export function loadDraft(): { views: Views; scope: Scope; savedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { views?: { org?: Partial<WidgetLayout>; mine?: Partial<WidgetLayout> | null }; scope?: Scope; savedAt?: number };
    if (!parsed.views?.org || typeof parsed.savedAt !== 'number') return null;
    return {
      views: { org: normalise(parsed.views.org), mine: parsed.views.mine ? normalise(parsed.views.mine) : null },
      scope: parsed.scope === 'mine' || !currentUser.isManager ? 'mine' : 'org',
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: { views: Views; scope: Scope } | null) {
  try {
    if (draft) window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
    else window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* Storage blocked: the draft lasts until the page closes. */
  }
}
