import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Button, Icon, Switch, TextField } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { widgetById, widgetCategories, widgets, type WidgetCategory, type WidgetDef } from './registry';
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
  /** Submit: the switches made here go into the Edit Mode draft (which Save or Discard settles). */
  onChange: (layout: WidgetLayout) => void;
  onClose: () => void;
}

/** Figma names the first group "Overview Custom Widgets". */
const groupTitle = (id: WidgetCategory, label: string) => (id === 'overview' ? 'Overview Custom Widgets' : label);
/** Type filter labels (Figma: Overview, Specifications, Documents, Connected Entities, Telemetry). */
const typeLabel = (id: WidgetCategory, label: string) => (id === 'connected' ? 'Connected Entities' : label);
const countOf = (id: WidgetCategory) => widgets.filter((w) => w.category === id).length;

/** A widget switched on goes to the end of the order, so it appears last on the page. */
function turn(layout: WidgetLayout, id: string, on: boolean): WidgetLayout {
  const next = setVisible(layout, [id], on);
  if (!on) return next;
  return { ...next, order: [...next.order.filter((x) => x !== id && !next.hidden.includes(x)), id, ...next.order.filter((x) => next.hidden.includes(x))] };
}

/**
 * Figma "Manage Organization Widgets" (17386:48732, rows 17386:59329): a 1280px drawer with a search, a Type
 * filter (All and each group, with counts), the groups with a switch per widget, and Discard / Submit. The
 * switches work on a copy: Submit puts them into the Edit Mode draft, Discard (or closing) drops them.
 * Overview widgets open a preview: the live widget, what it shows and its minimum size.
 */
export function ManageWidgetsDrawer({ open, scope, layout, org, canAddAny, onChange, onClose }: Props) {
  const [draft, setDraft] = useState(layout);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<WidgetCategory | 'all'>('all');
  const [collapsed, setCollapsed] = useState<Set<WidgetCategory>>(new Set());
  const [preview, setPreview] = useState<string | null>(null);

  // Each opening starts from the page as it is.
  useEffect(() => {
    if (!open) return;
    setDraft(layout); setQuery(''); setType('all'); setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hidden = new Set(draft.hidden);
  const orgHidden = new Set(org.hidden);
  const q = query.trim().toLowerCase();
  const matches = (w: WidgetDef) => !q || w.label.toLowerCase().includes(q);
  const groups = useMemo(
    () => widgetCategories
      .filter((c) => type === 'all' || c.id === type)
      .map((c) => ({ ...c, ids: categoryIds(draft, c.id).filter((id) => matches(widgetById.get(id)!)) }))
      .filter((g) => g.ids.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, type, q],
  );

  const toggleGroup = (id: WidgetCategory) => setCollapsed((c) => {
    const next = new Set(c);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const discard = () => { setDraft(layout); onClose(); };
  const submit = () => { onChange(draft); onClose(); };

  const title = scope === 'org' ? 'Manage Organization Widgets' : 'Manage Your Widgets';

  return (
    <PanelDrawer
      open={open}
      onClose={discard}
      title={title}
      width={1280}
      className="ep-widgets-drawer"
      footer={(
        <>
          <button type="button" className="ep-widgets-discard" onClick={discard}>Discard</button>
          <Button className="ep-panel-drawer__submit" onClick={submit}>Submit</Button>
        </>
      )}
    >
      <div className="ep-widgets-tools">
        <TextField
          label="Search widgets" hideLabel placeholder="Search" size="sm" iconStart="search"
          value={query} onChange={(e) => setQuery(e.currentTarget.value)} className="ep-widgets-search"
        />
        <div className="ep-widgets-type">
          <span className="ep-widgets-type__label" id="ep-widgets-type">Type</span>
          <div className="ep-widgets-filter" role="radiogroup" aria-labelledby="ep-widgets-type">
            {[{ id: 'all' as const, label: 'All', count: widgets.length }, ...widgetCategories.map((c) => ({ id: c.id, label: typeLabel(c.id, c.label), count: countOf(c.id) }))].map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={type === f.id}
                className="ep-widgets-filter__option"
                onClick={() => setType(f.id)}
              >
                {f.label}
                <span className="ep-widgets-filter__count" aria-label={`${f.count} widgets`}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="ep-widgets-empty" role="status">
          <p className="ep-widgets-empty__title">No widgets match “{query.trim()}”</p>
          <p className="ep-widgets-empty__hint">Check the spelling, or search all types.</p>
          <Button variant="secondary" size="sm" onClick={() => { setQuery(''); setType('all'); }}>Clear search</Button>
        </div>
      )}

      {groups.map((cat) => {
        const isOpen = !collapsed.has(cat.id) || !!q;
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
                {cat.ids.map((id) => {
                  const w = widgetById.get(id)!;
                  // In the You view, a widget the organization does not show: a manager can still add it for
                  // themself; anyone else cannot.
                  const notInOrg = scope === 'mine' && orgHidden.has(id);
                  const locked = notInOrg && !canAddAny && hidden.has(id);
                  const canPreview = cat.id === 'overview' && !!w.render;
                  const expanded = preview === id;
                  const previewId = `ep-wp-${id}`;
                  return (
                    <li key={id} className={expanded ? 'ep-widgets-row is-expanded' : 'ep-widgets-row'}>
                      <div className="ep-widgets-row__line">
                        <span className="ep-widgets-row__label" id={`ep-w-${id}`}>
                          {w.label}
                          {notInOrg && <span className="ep-widgets-row__note">{canAddAny ? 'Only for you' : 'Not shown in your organization'}</span>}
                        </span>
                        <span className="ep-widgets-row__controls">
                          {canPreview && (
                            <button
                              type="button"
                              className="ep-widgets-row__more"
                              aria-expanded={expanded}
                              aria-controls={previewId}
                              aria-label={`${expanded ? 'Hide' : 'Show'} preview of ${w.label}`}
                              onClick={() => setPreview(expanded ? null : id)}
                            >
                              <Icon name={expanded ? 'up' : 'down'} size={24} />
                            </button>
                          )}
                          <Switch
                            label={w.label} hideLabel aria-labelledby={`ep-w-${id}`} size={24} disabled={locked}
                            checked={!hidden.has(id)}
                            onChange={(e) => {
                              const on = e.currentTarget.checked;
                              setDraft(turn(draft, id, on));
                              // Switched on: the preview opens below (Figma "Selected"); switched off: it closes.
                              if (canPreview) setPreview(on ? id : preview === id ? null : preview);
                            }}
                          />
                        </span>
                      </div>
                      {expanded && (
                        <div className="ep-widgets-preview" id={previewId}>
                          <div className="ep-widgets-preview__stage">
                            <div className="ep-widgets-preview__card" {...{ inert: '' }}>
                              <div className="ep-sized" style={{ '--ep-h': '296px' } as CSSProperties}>{w.render!()}</div>
                            </div>
                          </div>
                          <div className="ep-widgets-preview__foot">
                            <span>{w.description}</span>
                            {w.minSize && <span className="ep-widgets-preview__min">Min Size {w.minSize}</span>}
                          </div>
                        </div>
                      )}
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
