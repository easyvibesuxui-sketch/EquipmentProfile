import { useState, type CSSProperties } from 'react';
import { Icon } from '@syn/design-system';
import type { MenuAction } from '@sam/shared';
import { ActionMenu } from '@sam/shared';
import { cardDate, personName, type Column, type Task } from '../data/werkstatt';
import { ConditionChip, DoneCheck, PriorityChip } from './TaskCard';

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Figma "Werkshtadt List View" (8757:19037): one collapsible group per status (Color Dot Big, the status name in its
 * colour, "Work items N", the round chevron), each a table of its tickets: Ticket ID, Title, Equipment, Priority,
 * Condition, Reported by, Assigned to, Created Date, Due date, Tags, Recourse total and the "..." menu.
 * The first group opens expanded, as in Figma; a row opens the ticket drawer.
 */
export function ListView({ columns, tasksFor, totalFor, actionsFor, onOpen, onToggleDone }: {
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
                <span className="wk-group__chevron" aria-hidden><Icon name={expanded ? 'up' : 'down'} size={14} /></span>
              </button>
            </h2>
            {expanded && (
              <div id={bodyId} className="wk-group__body">
                {rows.length === 0 ? (
                  <p className="wk-group__empty">{total ? 'No task matches the filters' : 'No tasks'}</p>
                ) : (
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
                                ? <span className="wk-table__tags" aria-label={`${t.tags.length} tags`}>{t.tags.map((c, i) => <span key={`${c}-${i}`} style={{ color: c }}><Icon name="tagbookmark-filled" size={20} /></span>)}</span>
                                : <span className="wk-muted">—</span>}
                            </td>
                            <td>{t.resourceTotal !== undefined ? <>{money(t.resourceTotal)} <span className="wk-muted">Eur</span></> : <span className="wk-muted">—</span>}</td>
                            <td className="wk-table__menu"><ActionMenu label={`${t.title}, ${t.ticket}: actions`} actions={actionsFor(t)} compact /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
