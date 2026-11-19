import { useEffect, useRef, useState } from 'react';
import { ColorDot, Icon, IconButton, TextField } from '@syn/design-system';
import type { ArchivedItem } from '../data/werkstatt';

/**
 * Figma "Archived" panel (8384:41961, empty 9593:30399): opens under the archive button of the board header.
 * A search over the archived tasks, each with Restore and Delete; "Nothing Archived yet" when the list is empty
 * or the search finds nothing.
 */
export function ArchivePanel({ items, onRestore, onDelete, onClose, anchor }: {
  items: ArchivedItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  anchor: HTMLElement | null;
}) {
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => [i.title, i.ticket, i.equipment, i.by].some((s) => s.toLowerCase().includes(q))) : items;

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
          {shown.map((item) => (
            <li key={item.id} className="wk-archive__item">
              <Icon name="archive" size={64} className="wk-archive__watermark" />
              <div className="wk-archive__head">
                <div>
                  <p className="wk-archive__title syn-title-text">{item.title}</p>
                  <p className="wk-archive__ticket">{item.ticket}</p>
                </div>
                <span className="wk-archive__actions">
                  <IconButton icon="refresh-change" label={`Restore ${item.title}`} variant="outline" onClick={() => onRestore(item.id)} />
                  <IconButton icon="trash-bin" label={`Delete ${item.title}`} variant="outline" onClick={() => onDelete(item.id)} />
                </span>
              </div>
              <div className="wk-archive__info">
                <div>
                  <p className="wk-archive__equipment syn-title-text">{item.equipment}</p>
                  <p className="wk-archive__meta">{item.date} <span className="wk-muted">by</span> {item.by}</p>
                </div>
                <span className="wk-archive__state">
                  <ColorDot color={item.state === 'done' ? 'var(--syn-color-success-mantis)' : 'var(--syn-color-secondary-amber)'} />
                  {item.state === 'done' ? 'Done' : 'Pending'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
