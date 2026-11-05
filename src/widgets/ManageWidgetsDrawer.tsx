import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button, Icon, IconButton, Switch } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { widgetById, widgetCategories, type WidgetCategory } from './registry';
import { categoryIds, defaultLayout, moveWithinCategory, setVisible, type WidgetLayout } from './layout';
import './ManageWidgets.css';

interface Props {
  open: boolean;
  layout: WidgetLayout;
  onClose: () => void;
  onSubmit: (layout: WidgetLayout) => void;
}

/**
 * "Manage Widgets", laid out like the Figma "Mail Notifications" drawer (11612:41869): a 640px drawer,
 * a switch for all widgets, then one bordered group per category with a row per widget.
 * Each row has a drag handle (pointer drag, or Arrow Up/Down on the focused handle) and a switch.
 * Changes stay in a draft until Submit; Discard and Close drop them.
 */
export function ManageWidgetsDrawer({ open, layout, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState(layout);
  const [dragging, setDragging] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const lists = useRef<Partial<Record<WidgetCategory, HTMLUListElement | null>>>({});

  // Every opening starts from the saved layout.
  useEffect(() => { if (open) setDraft(layout); }, [open, layout]);

  const hidden = new Set(draft.hidden);
  const allIds = draft.order;
  const allOn = draft.hidden.length === 0;

  const move = (id: string, to: number) => {
    setDraft((d) => {
      const next = moveWithinCategory(d, id, to);
      if (next !== d) {
        const cat = widgetById.get(id)!.category;
        const ids = categoryIds(next, cat);
        setAnnounce(`${widgetById.get(id)!.label}, position ${ids.indexOf(id) + 1} of ${ids.length}`);
      }
      return next;
    });
  };

  // Pointer drag: while the handle holds the pointer, the row moves to the slot under it.
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    setDragging(id);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (dragging !== id) return;
    const cat = widgetById.get(id)!.category;
    const rows = [...(lists.current[cat]?.children ?? [])] as HTMLElement[];
    const from = rows.findIndex((r) => r.dataset.id === id);
    let to = rows.length - 1;
    for (let k = 0; k < rows.length; k++) {
      if (k === from) continue;
      const r = rows[k].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { to = k > from ? k - 1 : k; break; }
    }
    if (to !== from) move(id, to);
  };
  const endDrag = () => setDragging(null);

  const onHandleKey = (e: KeyboardEvent<HTMLButtonElement>, id: string, index: number, count: number) => {
    const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : null;
    if (to === null) return;
    e.preventDefault();
    move(id, to);
    // The row re-renders in its new place; keep the focus on its handle.
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-handle="${id}"]`)?.focus());
  };

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      title="Manage Widgets"
      className="ep-widgets-drawer"
      headerActions={<IconButton icon="refresh-change" label="Reset to default" size="sm" onClick={() => setDraft(defaultLayout())} />}
      footer={(
        <>
          <Button variant="text" onClick={onClose}>Discard</Button>
          <Button className="ep-panel-drawer__submit" onClick={() => onSubmit(draft)}>Submit</Button>
        </>
      )}
    >
      <div className="ep-widgets-drawer__all">
        <span id="ep-widgets-all">All widgets</span>
        <Switch label="All widgets" hideLabel aria-labelledby="ep-widgets-all" size={24} checked={allOn} onChange={(e) => setDraft(setVisible(draft, allIds, e.currentTarget.checked))} />
      </div>

      {widgetCategories.map((cat) => {
        const ids = categoryIds(draft, cat.id);
        const shown = ids.filter((id) => !hidden.has(id)).length;
        const groupLabel = `ep-widgets-${cat.id}`;
        return (
          <section key={cat.id} className="ep-widgets-group" aria-labelledby={groupLabel}>
            <div className="ep-widgets-group__box">
              <h3 id={groupLabel} className="ep-widgets-group__head">
                <span>{cat.label}</span>
                <span className="ep-widgets-group__count">{shown} of {ids.length}</span>
              </h3>
              <ul className="ep-widgets-group__list" ref={(el) => { lists.current[cat.id] = el; }}>
                {ids.map((id, i) => {
                  const w = widgetById.get(id)!;
                  const on = !hidden.has(id);
                  return (
                    <li key={id} data-id={id} className={['ep-widgets-row', dragging === id && 'is-dragging', !on && 'is-off'].filter(Boolean).join(' ')}>
                      <button
                        type="button"
                        className="ep-widgets-row__handle"
                        data-handle={id}
                        aria-label={`Move ${w.label}`}
                        aria-describedby="ep-widgets-help"
                        onPointerDown={(e) => onPointerDown(e, id)}
                        onPointerMove={(e) => onPointerMove(e, id)}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={(e) => onHandleKey(e, id, i, ids.length)}
                      >
                        <Icon name="dragable" size={16} />
                      </button>
                      <span className="ep-widgets-row__label" id={`ep-w-${id}`}>{w.label}</span>
                      <Switch
                        label={w.label}
                        hideLabel
                        aria-labelledby={`ep-w-${id}`}
                        size={24}
                        checked={on}
                        onChange={(e) => setDraft(setVisible(draft, [id], e.currentTarget.checked))}
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="ep-widgets-group__foot">
                <span id={`${groupLabel}-all`}>Show all {cat.label.toLowerCase()}</span>
                <Switch
                  label={`Show all ${cat.label.toLowerCase()}`}
                  hideLabel
                  aria-labelledby={`${groupLabel}-all`}
                  size={24}
                  checked={shown === ids.length}
                  onChange={(e) => setDraft(setVisible(draft, ids, e.currentTarget.checked))}
                />
              </div>
            </div>
          </section>
        );
      })}
      <p id="ep-widgets-help" className="syn-visually-hidden">Drag, or use Arrow Up and Arrow Down, to change the order on the Overview.</p>
      <p className="syn-visually-hidden" aria-live="polite">{announce}</p>
    </PanelDrawer>
  );
}
