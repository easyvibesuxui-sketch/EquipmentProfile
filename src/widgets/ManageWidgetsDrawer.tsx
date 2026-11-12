import { useState } from 'react';
import { Icon, Switch } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { widgetById, widgetCategories, type WidgetCategory } from './registry';
import { categoryIds, setVisible, type Scope, type WidgetLayout } from './layout';
import './ManageWidgets.css';

interface Props {
  open: boolean;
  /** The Overview being edited: the organization's or the person's own. */
  scope: Scope;
  layout: WidgetLayout;
  /** The organization's Overview: in the You view, the widgets it does not show are marked (or locked). */
  org: WidgetLayout;
  /** Managers may switch on, for themselves, widgets the organization does not show. */
  canAddAny: boolean;
  /** Called on every switch; in Edit Mode this is the page draft, which Save or Discard settles. */
  onChange: (layout: WidgetLayout) => void;
  onClose: () => void;
}

/** Figma names the first group "Overview Custom Widgets". */
const groupTitle = (id: WidgetCategory, label: string) => (id === 'overview' ? 'Overview Custom Widgets' : label);

/**
 * "Manage Widgets" (Figma 17064:71031), opened from Edit Mode's "Section" button and "Add Widget": a 640px
 * drawer with a collapsible group per category and a switch per widget. A widget switched on is added at the
 * end of the page, where it can be moved and resized; switched off, it leaves the page.
 */
export function ManageWidgetsDrawer({ open, scope, layout, org, canAddAny, onChange, onClose }: Props) {
  const [collapsed, setCollapsed] = useState<Set<WidgetCategory>>(new Set());
  const hidden = new Set(layout.hidden);
  const orgHidden = new Set(org.hidden);

  const toggleGroup = (id: WidgetCategory) => setCollapsed((c) => {
    const next = new Set(c);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // A widget switched on goes to the end of the order, so it appears last on the page, next to "Add Widget".
  const setOn = (id: string, on: boolean) => {
    const next = setVisible(layout, [id], on);
    onChange(on ? { ...next, order: [...next.order.filter((x) => x !== id && !next.hidden.includes(x)), id, ...next.order.filter((x) => next.hidden.includes(x))] } : next);
  };

  return (
    <PanelDrawer open={open} onClose={onClose} title="Manage Widgets" className="ep-widgets-drawer">
      <p className="ep-widgets-scope">
        <span className="ep-widgets-scope__badge">{scope === 'org' ? 'Organization' : 'You'}</span>
        {scope === 'org' ? 'Everyone in your organization sees these widgets.' : 'Only you see these changes.'}
      </p>
      {widgetCategories.map((cat) => {
        const ids = categoryIds(layout, cat.id);
        const isOpen = !collapsed.has(cat.id);
        const panelId = `ep-widgets-${cat.id}`;
        return (
          <section key={cat.id} className="ep-widgets-group" aria-label={groupTitle(cat.id, cat.label)}>
            <h3 className="ep-widgets-group__title">
              <button type="button" className="ep-widgets-group__head" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggleGroup(cat.id)}>
                <span className="syn-title-text">{groupTitle(cat.id, cat.label)}</span>
                <Icon name={isOpen ? 'up' : 'down'} size={24} />
              </button>
            </h3>
            {isOpen && (
              <ul id={panelId} className="ep-widgets-group__list">
                {ids.map((id) => {
                  const w = widgetById.get(id)!;
                  // In the You view, a widget the organization does not show: a manager can still add it for
                  // themself; anyone else cannot.
                  const notInOrg = scope === 'mine' && orgHidden.has(id);
                  const locked = notInOrg && !canAddAny && hidden.has(id);
                  return (
                    <li key={id} className="ep-widgets-row">
                      <span className="ep-widgets-row__label syn-title-text" id={`ep-w-${id}`}>
                        {w.label}
                        {notInOrg && <span className="ep-widgets-row__note" id={`ep-wn-${id}`}>{canAddAny ? 'Only for you' : 'Not shown in your organization'}</span>}
                      </span>
                      <Switch
                        label={w.label} hideLabel aria-labelledby={`ep-w-${id}`} size={24} disabled={locked}
                        checked={!hidden.has(id)} onChange={(e) => setOn(id, e.currentTarget.checked)}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </PanelDrawer>
  );
}
