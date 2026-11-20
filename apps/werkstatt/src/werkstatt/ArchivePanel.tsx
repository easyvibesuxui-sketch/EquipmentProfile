import { useEffect, useRef, useState } from 'react';
import { ColorDot, Icon, IconButton, TextField } from '@syn/design-system';
import type { ArchivedItem } from '../data/werkstatt';

/**
 * Figma "Archived" panel (8384:41961, empty 9593:30399): opens under the archive button of the board header.
 * A search over the archived tasks, each with Restore and Delete; "Nothing Archived yet" when the list is empty
 * or the search finds nothing.
 */
export function ArchivePanel({ items, onRestore, onDelete, onOpen, onClose, anchor }: {
  items: ArchivedItem[];
  onOpen: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  anchor: HTMLElement | null;
}) {
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => [i.task.title, i.task.ticket, i.task.equipment?.name ?? '', i.by].some((s) => s.toLowerCase().includes(q))) : items;

  useEffect(() => {
    root.current?.querySelector('input')?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !anchor?.contains(t)) onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [anchor, onClose]);

  return (
    <div
      ref={root} className="wk-archive" role="dialog" aria-label="Archived tasks"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); anchor?.focus(); } }}
    >
      <p className="wk-archive__label">Archived</p>
      <TextField label="Search archived tasks" hideLabel size="sm" iconStart="search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} />
      {shown.length === 0 ? (
        <div className="wk-archive__empty">
          <Icon name="archive" size={32} />
          <span>{items.length === 0 ? 'Nothing Archived yet' : 'No archived task matches'}</span>
        </div>
      ) : (
        <ul className="wk-archive__list">
          {shown.map(({ task, by, at }) => (
            <li key={task.id} className="wk-archive__item">
              <Icon name="archive" size={64} className="wk-archive__watermark" />
              <div className="wk-archive__head">
                <button type="button" className="wk-archive__open" onClick={() => onOpen(task.id)} aria-label={`Open ${task.title}, ${task.ticket}`}>
                  <span className="wk-archive__title syn-title-text">{task.title}</span>
                  <span className="wk-archive__ticket">{task.ticket}</span>
                </button>
                <span className="wk-archive__actions">
                  <IconButton icon="refresh-change" label={`Restore ${task.title}`} variant="outline" tooltipPlacement="left" onClick={() => onRestore(task.id)} />
                  <IconButton icon="trash-bin" label={`Delete ${task.title}`} variant="outline" tooltipPlacement="left" onClick={() => onDelete(task.id)} />
                </span>
              </div>
              <div className="wk-archive__info">
                <div>
                  <p className="wk-archive__equipment syn-title-text">{task.equipment?.name ?? 'Nothing Assigned'}</p>
                  <p className="wk-archive__meta">{at} <span className="wk-muted">by</span> {by}</p>
                </div>
                <span className="wk-archive__state">
                  <ColorDot color={task.done ? 'var(--syn-color-success-mantis)' : 'var(--syn-color-secondary-amber)'} />
                  {task.done ? 'Done' : 'Pending'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
