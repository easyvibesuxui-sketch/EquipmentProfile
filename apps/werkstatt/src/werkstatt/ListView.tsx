import { useState, type CSSProperties } from 'react';
import { Icon } from '@syn/design-system';
import type { MenuAction } from '@sam/shared';
import { ActionMenu } from '@sam/shared';
import { cardDate, personName, tagColor, type ArchivedItem, type Column, type Task } from '../data/werkstatt';
import { ConditionChip, DoneCheck, PriorityChip } from './TaskCard';

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Figma "Werkshtadt List View" (8757:19037): one collapsible group per status (Color Dot Big, the status name in its
 * colour, "Work items N", the round chevron), each a table of its tickets: Ticket ID, Title, Equipment, Priority,
 * Condition, Reported by, Assigned to, Created Date, Due date, Tags, Recourse total and the "..." menu.
 * The first group opens expanded, as in Figma; a row opens the ticket drawer.
 */
export function ListView({ columns, tasksFor, totalFor, actionsFor, onOpen, onToggleDone, archived, onOpenArchived, onRestore, onAddTask }: {
  archived: ArchivedItem[];
  onOpenArchived: (id: string) => void;
  onRestore: (id: string) => void;
  onAddTask: (column: string) => void;
  columns: Column[];
  tasksFor: (column: string) => Task[];
  totalFor: (column: string) => number;
  actionsFor: (t: Task) => MenuAction[];
  onOpen: (id: string) => void;
  onToggleDone: (t: Task) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({ [columns[0]?.id]: true }));

  return (
    <div className="wk-list">
      {columns.map((col) => {
        const rows = tasksFor(col.id);
        const total = totalFor(col.id);
        const expanded = !!open[col.id];
        const bodyId = `wk-group-${col.id}`;
        return (
          <section key={col.id} className={expanded ? 'wk-group is-open' : 'wk-group'} aria-labelledby={`${bodyId}-title`}>
            <h2 className="wk-group__head">
              <button
                type="button" className="wk-group__toggle" aria-expanded={expanded} aria-controls={bodyId}
                onClick={() => setOpen((o) => ({ ...o, [col.id]: !o[col.id] }))}
              >
                <span className="wk-group__dot" style={{ '--wk-dot': col.color } as CSSProperties} aria-hidden />
                <span id={`${bodyId}-title`} className={`wk-group__name is-${col.id}`}>{col.label}</span>
                <span className="wk-group__count">Work items {rows.length === total ? total : `${rows.length} of ${total}`}</span>
              </button>
              <span className="wk-group__tools">
                <ActionMenu label={`${col.label} actions`} compact actions={[{ id: 'add', label: `Add task to ${col.label}`, icon: 'plus-in-circle', onSelect: () => onAddTask(col.id) }]} />
                <button type="button" className="wk-group__chevron" aria-label={expanded ? `Collapse ${col.label}` : `Expand ${col.label}`} aria-expanded={expanded} aria-controls={bodyId} onClick={() => setOpen((o) => ({ ...o, [col.id]: !o[col.id] }))}>
                  <Icon name={expanded ? 'up' : 'down'} size={14} />
                </button>
              </span>
            </h2>
            {expanded && (
              <div id={bodyId} className="wk-group__body">
                <div className="wk-group__scroll">
                    <table className="wk-table">
                      <caption className="wk-sr">{col.label} tickets</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="wk-table__check"><span className="wk-sr">Done</span></th>
                          <th scope="col">Ticket ID</th>
                          <th scope="col">Title</th>
                          <th scope="col">Equipment</th>
                          <th scope="col">Priority</th>
                          <th scope="col">Condition</th>
                          <th scope="col">Reported by</th>
                          <th scope="col">Assigned to</th>
                          <th scope="col">Created Date</th>
                          <th scope="col">Due date</th>
                          <th scope="col">Tags</th>
                          <th scope="col">Recourse total</th>
                          <th scope="col" className="wk-table__menu"><span className="wk-sr">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 && (
                          <tr className="wk-table__nothing"><td colSpan={13}><Icon name="archive" size={40} /><span>{total ? 'No task matches the filters' : 'Nothing yet'}</span></td></tr>
                        )}
                        {rows.map((t) => (
                          <tr
                            key={t.id} className={t.done ? 'is-done' : undefined} data-task={t.id}
                            onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menu"]')) onOpen(t.id); }}
                          >
                            <td className="wk-table__check"><DoneCheck done={t.done} title={t.title} onToggle={() => onToggleDone(t)} /></td>
                            <td>{t.ticket}</td>
                            <td><button type="button" className="wk-table__open" onClick={() => onOpen(t.id)}>{t.title}</button></td>
                            <td>{t.equipment ? t.equipment.name : <span className="wk-muted">Nothing Assigned</span>}</td>
                            <td>{t.priority ? <PriorityChip value={t.priority} /> : <span className="wk-muted">—</span>}</td>
                            <td>{t.condition ? <ConditionChip value={t.condition} /> : <span className="wk-muted">—</span>}</td>
                            <td>{t.createdBy}</td>
                            <td>{t.assignee ? personName(t.assignee) : <span className="wk-muted">Nothing Assigned</span>}</td>
                            <td>{cardDate(t.createdAt)}</td>
                            <td>{t.due ? cardDate(t.due) : <span className="wk-muted">—</span>}</td>
                            <td>
                              {t.tags?.length
                                ? <span className="wk-table__tags" aria-label={`${t.tags.length} tags`}>{t.tags.map((name) => <span key={name} style={{ color: tagColor(name) }} title={name}><Icon name="tagbookmark-filled" size={20} /></span>)}</span>
                                : <span className="wk-muted">—</span>}
                            </td>
                            <td>{t.resourceTotal !== undefined ? <>{money(t.resourceTotal)} <span className="wk-muted">Eur</span></> : <span className="wk-muted">—</span>}</td>
                            <td className="wk-table__menu"><ActionMenu label={`${t.title}, ${t.ticket}: actions`} actions={actionsFor(t)} compact /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            )}
          </section>
        );
      })}
      <ArchivedGroup items={archived} onOpen={onOpenArchived} onRestore={onRestore} />
    </div>
  );
}

/** Figma 7877:29034: the Archived line closes the list; open, it lists the archived tickets (a row opens one, read only). */
function ArchivedGroup({ items, onOpen, onRestore }: { items: ArchivedItem[]; onOpen: (id: string) => void; onRestore: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className={expanded ? 'wk-group is-archived is-open' : 'wk-group is-archived'} aria-labelledby="wk-group-archived-title">
      <h2 className="wk-group__head">
        <button type="button" className="wk-group__toggle" aria-expanded={expanded} aria-controls="wk-group-archived" onClick={() => setExpanded(!expanded)}>
          <span className="wk-group__dot" style={{ '--wk-dot': 'var(--syn-color-white-white)' } as CSSProperties} aria-hidden />
          <span id="wk-group-archived-title" className="wk-group__name">Archived</span>
          <span className="wk-group__count">Items {items.length}</span>
        </button>
        <span className="wk-group__tools">
          <span className="wk-group__archive-icon" aria-hidden><Icon name="archive" size={16} /></span>
          <button type="button" className="wk-group__chevron" aria-label={expanded ? 'Collapse Archived' : 'Expand Archived'} aria-expanded={expanded} aria-controls="wk-group-archived" onClick={() => setExpanded(!expanded)}>
            <Icon name={expanded ? 'up' : 'down'} size={14} />
          </button>
        </span>
      </h2>
      {expanded && (
        <div id="wk-group-archived" className="wk-group__body">
          <div className="wk-group__scroll">
            <table className="wk-table is-archived">
              <caption className="wk-sr">Archived tickets</caption>
              <thead><tr><th scope="col">Ticket ID</th><th scope="col">Title</th><th scope="col">Equipment</th><th scope="col">Status</th><th scope="col">Archived by</th><th scope="col">Archived Date</th><th scope="col" className="wk-table__menu"><span className="wk-sr">Actions</span></th></tr></thead>
              <tbody>
                {items.length === 0 && <tr className="wk-table__nothing"><td colSpan={7}><Icon name="archive" size={40} /><span>Nothing Archived yet</span></td></tr>}
                {items.map(({ task, by, at }) => (
                  <tr key={task.id} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, [role="menu"]')) onOpen(task.id); }}>
                    <td>{task.ticket}</td>
                    <td><button type="button" className="wk-table__open" onClick={() => onOpen(task.id)}>{task.title}</button></td>
                    <td>{task.equipment?.name ?? <span className="wk-muted">Nothing Assigned</span>}</td>
                    <td>{task.done ? 'Done' : 'Pending'}</td>
                    <td>{by}</td>
                    <td>{at}</td>
                    <td className="wk-table__menu"><ActionMenu label={`${task.title}: actions`} compact actions={[{ id: 'open', label: 'Open', icon: 'expand', onSelect: () => onOpen(task.id) }, { id: 'restore', label: 'Restore', icon: 'refresh-change', onSelect: () => onRestore(task.id) }]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
