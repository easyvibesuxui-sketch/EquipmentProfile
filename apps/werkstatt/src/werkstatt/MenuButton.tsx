import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '@syn/design-system';

export interface MenuChoice { value: string; label: string; icon?: IconName }

/**
 * A button that opens a list of choices (WAI-ARIA menu with menuitemradio): the board switcher and Sort by.
 * Enter, Space or Down opens it; Up/Down/Home/End move; Escape or a click outside closes it.
 */
export function MenuButton({ label, choices, value, onChange, className, children, footer, align = 'start', check = true }: {
  label: string;
  choices: MenuChoice[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  children: ReactNode;
  footer?: { label: string; icon: 'plus-in-circle'; onSelect: () => void };
  align?: 'start' | 'end';
  /** The chosen item shows a check (off for Sort by, which marks it by weight). */
  check?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = `wk-menu-${useId()}`;
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const items = root.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]');
    (root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]') ?? items?.[0])?.focus();
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  const close = () => { setOpen(false); button.current?.focus(); };
  const onKey = (e: KeyboardEvent) => {
    const list = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]') ?? []);
    const at = list.indexOf(document.activeElement as HTMLButtonElement);
    const next = ({ ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 } as Record<string, number>)[e.key];
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    if (next === undefined) return;
    e.preventDefault();
    list[(next + list.length) % list.length]?.focus();
  };

  return (
    <div ref={root} className="wk-menu">
      <button
        ref={button} type="button" className={className} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-label={label}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}
      >
        {children}
      </button>
      {open && (
        <div id={id} role="menu" aria-label={label} className={`wk-menu__panel is-${align}`} onKeyDown={onKey}>
          {choices.map((c) => (
            <button
              key={c.value} type="button" role="menuitemradio" aria-checked={c.value === value} tabIndex={-1}
              className="wk-menu__item" onClick={() => { onChange(c.value); close(); }}
            >
              {c.icon && <Icon name={c.icon} size={16} className="wk-menu__icon" />}
              <span className="wk-menu__label">{c.label}</span>
              {check && c.value === value && <Icon name="check" size={14} />}
            </button>
          ))}
          {footer && (
            <button type="button" role="menuitem" tabIndex={-1} className="wk-menu__item is-footer" onClick={() => { footer.onSelect(); close(); }}>
              <Icon name={footer.icon} size={16} /><span>{footer.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
