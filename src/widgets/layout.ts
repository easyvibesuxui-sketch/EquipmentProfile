import { useCallback, useState } from 'react';
import { widgetById, widgets, type WidgetCategory } from './registry';

/** Which widgets the Overview shows, and in what order. `order` always lists every widget. */
export interface WidgetLayout {
  order: string[];
  hidden: string[];
}

const STORAGE_KEY = 'ep-overview-widgets-v1';

export const defaultLayout = (): WidgetLayout => ({
  order: widgets.map((w) => w.id),
  hidden: widgets.filter((w) => !w.defaultOn).map((w) => w.id),
});

/** Drops ids that no longer exist and appends new widgets (with their default visibility). */
function normalise(saved: Partial<WidgetLayout> | null): WidgetLayout {
  const base = defaultLayout();
  if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.hidden)) return base;
  const known = saved.order.filter((id) => widgetById.has(id));
  const added = base.order.filter((id) => !known.includes(id));
  return {
    order: [...new Set([...known, ...added])],
    hidden: [...saved.hidden.filter((id) => widgetById.has(id)), ...added.filter((id) => base.hidden.includes(id))],
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

/**
 * Moves a widget within its category. The category keeps the same slots in the page order, so a
 * reorder never moves a widget past one from another category.
 */
export function moveWithinCategory(layout: WidgetLayout, id: string, to: number): WidgetLayout {
  const category = widgetById.get(id)?.category;
  if (!category) return layout;
  const ids = categoryIds(layout, category);
  const from = ids.indexOf(id);
  const target = Math.max(0, Math.min(ids.length - 1, to));
  if (from < 0 || from === target) return layout;
  ids.splice(from, 1);
  ids.splice(target, 0, id);
  let next = 0;
  return { ...layout, order: layout.order.map((x) => (widgetById.get(x)?.category === category ? ids[next++] : x)) };
}

export function setVisible(layout: WidgetLayout, ids: string[], visible: boolean): WidgetLayout {
  const hidden = new Set(layout.hidden);
  ids.forEach((id) => (visible ? hidden.delete(id) : hidden.add(id)));
  return { ...layout, hidden: layout.order.filter((id) => hidden.has(id)) };
}

/** The saved layout, persisted in this browser. */
export function useWidgetLayout() {
  const [layout, setLayout] = useState<WidgetLayout>(load);
  const apply = useCallback((next: WidgetLayout) => {
    setLayout(next);
    save(next);
  }, []);
  return [layout, apply] as const;
}
