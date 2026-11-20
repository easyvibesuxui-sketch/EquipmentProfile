import { useEffect, useId, useRef, useState } from 'react';
import { Icon, Switch } from '@syn/design-system';
import { notifications, useNotifications, type SamNotification } from '../notifications';
import { MaskIcon } from './MaskIcon';
import bellIcon from '../assets/icons/bell.png';
import './NotificationsBell.css';

const pad = (n: number) => String(n).padStart(2, '0');
const date = (iso: string) => { const d = new Date(iso); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; };
const time = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/** One notification (Figma "Notification - High Contrast - Toast" in the list): unread ones are Snow with a red dot. */
function Item({ n }: { n: SamNotification }) {
  return (
    <li>
      <button type="button" className={n.read ? 'ep-notice' : 'ep-notice is-unread'} onClick={() => notifications.markRead(n.id)} aria-label={`${n.verb}: ${n.title}${n.read ? '' : ', unread. Mark as read'}`}>
        <span className="ep-notice__head"><span className="ep-notice__verb">{n.verb}</span> <span className="ep-notice__title">{n.title}</span></span>
        {n.subtitle && <span className="ep-notice__sub">{n.subtitle}</span>}
        {n.board && (
          <span className="ep-notice__line">
            <Icon name="werkstatt" size={14} />{n.board}
            {n.ticket && <><span className="ep-notice__sep" aria-hidden>◦</span><Icon name="settings" size={14} />{n.ticket}</>}
          </span>
        )}
        {n.transporter && <span className="ep-notice__line"><span className="ep-notice__muted">Transporter</span>{n.transporter}</span>}
        <span className="ep-notice__line">
          <Icon name="person" size={14} className="ep-notice__person" />{n.by}<span className="ep-notice__sep" aria-hidden>◦</span>{date(n.at)} <span className="ep-notice__muted">{time(n.at)}</span>
        </span>
        {!n.read && <span className="ep-notice__dot" aria-hidden />}
      </button>
    </li>
  );
}

/**
 * The top bar bell and its Notifications panel (Figma 13147:57773, empty 13207:36438): the switch turns them on or off,
 * a click marks one as read, "Mark all as read" all of them; the bell shows a red dot while any is unread.
 */
export function NotificationsBell() {
  const { items, enabled } = useNotifications();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const unread = enabled ? items.filter((n) => !n.read).length : 0;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  return (
    <div ref={root} className="ep-bell" onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); button.current?.focus(); } }}>
      <button
        ref={button} type="button" className="ep-topbar__bell" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} onClick={() => setOpen(!open)}
      >
        <MaskIcon src={bellIcon} size={[16, 18]} />
        {unread > 0 && <span className="ep-bell__dot" aria-hidden />}
      </button>
      {open && (
        <div id={id} role="dialog" aria-label="Notifications" className="ep-bell__panel">
          <div className="ep-bell__head">
            <h2 className="ep-bell__title">Notifications</h2>
            <Switch size={24} label="Receive notifications" checked={enabled} onChange={(e) => notifications.setEnabled(e.target.checked)} />
          </div>
          {!enabled ? (
            <div className="ep-bell__empty"><MaskIcon src={bellIcon} size={[28, 32]} /><span>Notifications are off</span></div>
          ) : items.length === 0 ? (
            <div className="ep-bell__empty"><MaskIcon src={bellIcon} size={[28, 32]} /><span>No Notifications yet</span></div>
          ) : (
            <ul className="ep-bell__list">{items.map((n) => <Item key={n.id} n={n} />)}</ul>
          )}
          <button type="button" className="ep-bell__all" disabled={!unread} onClick={() => notifications.markAllRead()}>Mark all as read</button>
        </div>
      )}
    </div>
  );
}
