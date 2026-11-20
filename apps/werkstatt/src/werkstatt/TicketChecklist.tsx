import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Button, Checklist, ChecklistItem, ProgressBar, Tag } from '@syn/design-system';
import { ActionMenu } from '@sam/shared';

export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
  due?: string;
  people?: Array<[string, string]>;
}

/**
 * The ticket's checklist (Figma 13018:12956 states, 13018:12992 menu): white rows that take an Eerie Black border on
 * hover; a click on the text edits it in place (Enter or leaving keeps it, Escape drops it, an empty one goes away);
 * "..." duplicates or deletes; Add New starts an empty row in edit. The checkbox ticks it.
 */
export function TicketChecklist({ initial, title }: { initial: CheckItem[]; title?: string }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const done = items.filter((i) => i.done).length;

  useEffect(() => {
    if (editing) requestAnimationFrame(() => root.current?.querySelector<HTMLTextAreaElement>('.is-editing textarea')?.focus());
  }, [editing]);

  const startEdit = (item: CheckItem) => { setEditing(item.id); setText(item.text); };
  const commit = () => {
    if (!editing) return;
    const v = text.trim();
    setItems((list) => (v ? list.map((i) => (i.id === editing ? { ...i, text: v } : i)) : list.filter((i) => i.id !== editing)));
    setEditing(null);
  };
  const cancel = () => {
    setItems((list) => list.filter((i) => i.id !== editing || i.text));
    setEditing(null);
  };
  const add = () => {
    const id = `c-${Date.now()}`;
    setItems((list) => [...list, { id, text: '', done: false }]);
    setEditing(id); setText('');
  };
  // A click on the text (not on the box) edits it; the native label would otherwise tick the box.
  const itemOf = (el: EventTarget | null) => {
    const li = (el as HTMLElement | null)?.closest?.('.td-check__item');
    return items.find((i) => li?.classList.contains(`td-check-${i.id}`));
  };
  // Syn's checkbox input covers the whole row, so the click's position tells the box (tick) from the text (edit).
  const onClickCapture = (e: MouseEvent) => {
    const item = itemOf(e.target);
    if (!item || editing === item.id || !(e.target as HTMLElement).closest('.syn-choice')) return;
    const box = (e.target as HTMLElement).closest('.syn-choice')?.querySelector('.syn-choice__box')?.getBoundingClientRect();
    if (box && e.clientX > box.right + 4) { e.preventDefault(); startEdit(item); }
  };

  return (
    <div
      ref={root} className="td-check" onClickCapture={onClickCapture}
      onKeyDown={(e) => {
        // Enter on a row's checkbox edits its text (Space still ticks it).
        if (!editing && e.key === 'Enter' && (e.target as HTMLElement).matches('.syn-choice__input')) {
          const item = itemOf(e.target); if (item) { e.preventDefault(); startEdit(item); } return;
        }
        if (!editing) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
        if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName === 'TEXTAREA') { e.preventDefault(); commit(); }
      }}
      onBlur={(e) => {
        const li = root.current?.querySelector('.is-editing');
        if (editing && li && !li.contains(e.relatedTarget as Node)) commit();
      }}
    >
      {title && <h4 className="td-check__title">{title}</h4>}
      {items.length > 0 && <ProgressBar label={`${done}/${items.length}`} value={(done / items.length) * 100} title="Checklist progress" />}
      {items.length === 0 ? (
        <p className="td-check__empty">No List added</p>
      ) : (
        <Checklist className="td-check__list">
          {items.map((item) => (
              <ChecklistItem
                key={item.id}
                className={`td-check__item td-check-${item.id}`}
                label={item.text || 'New task'}
                checked={item.done}
                onCheckedChange={(v) => setItems((list) => list.map((i) => (i.id === item.id ? { ...i, done: v } : i)))}
                editing={editing === item.id}
                editValue={text}
                onEditChange={setText}
                placeholder="Enter Text"
                actions={<ActionMenu label={`${item.text || 'New task'}: actions`} compact actions={[
                  { id: 'duplicate', label: 'Duplicate', icon: 'copy', onSelect: () => setItems((list) => { const at = list.findIndex((i) => i.id === item.id); const copy = { ...item, id: `c-${Date.now()}` }; return [...list.slice(0, at + 1), copy, ...list.slice(at + 1)]; }) },
                  { id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => setItems((list) => list.filter((i) => i.id !== item.id)) },
                ]} />}
                assignee={<Tag variant="soft" muted icon="person">Assignee</Tag>}
                due={<Tag variant="soft" muted={!item.due} icon="calendar">Due Date{item.due && <span className="td-check__date">{item.due}</span>}</Tag>}
                extra={item.people?.length ? item.people.map(([n, c], k) => <Tag key={`${n}-${k}`} color={c} shape="rounded">{n}</Tag>) : undefined}
              >
                {item.text}
              </ChecklistItem>
          ))}
        </Checklist>
      )}
      <div className="td-check__add"><Button variant="secondary" size="sm" iconStart="plus" className="td-add-new" onClick={add}>Add New</Button></div>
    </div>
  );
}
