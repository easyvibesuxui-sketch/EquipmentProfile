import { useRef, type KeyboardEvent, type ReactNode } from 'react';

/**
 * A widget the whole of which opens its drawer, as the Figma prototype does. Clicks on the widget's own
 * controls (view switch, map buttons, links), inside the open drawer, or at the end of a drag (panning a map)
 * do not count; the chevron (`.ep-widget__open`) does. With `label` (a card with no control of its own) the
 * card is focusable and opens on Enter or Space. `disabled` turns it off, e.g. while the map is full screen.
 */
export function OpensDrawer({ onOpen, label, disabled, children }: { onOpen: () => void; label?: string; disabled?: boolean; children: ReactNode }) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const keyboard = label && !disabled
    ? {
      role: 'button', tabIndex: 0, 'aria-label': label,
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        onOpen();
      },
    }
    : {};
  return (
    <div
      className={disabled ? 'ep-widget-link is-disabled' : 'ep-widget-link'}
      {...keyboard}
      onPointerDown={(e) => { down.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        if (disabled) return;
        const t = e.target as Element;
        if (t.closest('dialog') || (t.closest('button, a, input, select, label, [role="tab"]') && !t.closest('.ep-widget__open'))) return;
        const from = down.current;
        if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > 5) return;
        onOpen();
      }}
    >
      {children}
    </div>
  );
}
