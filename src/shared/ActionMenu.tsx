import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, IconButton, type IconName } from '@syn/design-system';
import './ActionMenu.css';

export interface MenuAction {
  id: string;
  label: string;
  icon: IconName;
  onSelect?: () => void;
}

/**
 * The "..." actions menu (WAI-ARIA menu button): Enter, Space or Down opens it, Up/Down/Home/End move,
 * Escape or a click outside closes it and returns focus to the button.
 */
export function ActionMenu({ label, actions, note }: { label: string; actions: MenuAction[]; note?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const baseId = `ep-menu-${useId()}`;
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<Array<HTMLButtonElement | null>>([]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    items.current[0]?.focus();
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onMenuKey = (e: KeyboardEvent) => {
    const list = items.current.filter(Boolean) as HTMLButtonElement[];
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | undefined;
    if (e.key === 'ArrowDown') next = (at + 1) % list.length;
    else if (e.key === 'ArrowUp') next = (at - 1 + list.length) % list.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = list.length - 1;
    else if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    else if (e.key === 'Tab') { setOpen(false); return; }
    if (next === undefined) return;
    e.preventDefault();
    list[next].focus();
  };

  return (
    <div ref={root} className="ep-menu">
      <IconButton
        ref={button}
        icon="dotshorizontal"
        label={label}
        variant="outline"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? baseId : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
      />
      {open && (
        <div id={baseId} role="menu" aria-label={label} className="ep-menu__panel" onKeyDown={onMenuKey}>
          {actions.map((a, i) => (
            <button
              key={a.id}
              ref={(el) => { items.current[i] = el; }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="ep-menu__item"
              onClick={() => { a.onSelect?.(); close(); }}
            >
              <span className="ep-menu__icon" aria-hidden><Icon name={a.icon} size={18} /></span>
              <span>{a.label}</span>
            </button>
          ))}
          {note && (
            <p className="ep-menu__note" role="note">
              <Icon name="warning" size={12} />
              <span>{note}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
