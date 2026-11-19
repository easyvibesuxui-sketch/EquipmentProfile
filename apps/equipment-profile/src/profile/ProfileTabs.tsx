import { useEffect, useRef, useState } from 'react';
import { IconButton, Segmented } from '@syn/design-system';
import './ProfileTabs.css';

/**
 * Figma "Tabs" on the profile: 24px pills, the current one Eerie Black. Built on Syn Segmented (a tablist
 * with arrow-key movement); the modifier lets each pill take its text width, as Figma does.
 * `onManage` adds the gear that opens "Manage Widgets" at the end of the row.
 */
export function ProfileTabs({ tabs, value, onChange, onManage }: { tabs: string[]; value: string; onChange: (tab: string) => void; onManage?: () => void }) {
  // When the tabs scroll sideways, fade the edge that has more tabs behind it.
  const row = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });
  useEffect(() => {
    const list = row.current?.querySelector<HTMLElement>('.ep-profile-tabs');
    if (!list) return undefined;
    const update = () => setMore({ start: list.scrollLeft > 1, end: list.scrollLeft + list.clientWidth < list.scrollWidth - 1 });
    update();
    // The tabs widen once the web font loads, so watch them as well as the list.
    const ro = new ResizeObserver(update);
    ro.observe(list);
    [...list.children].forEach((tab) => ro.observe(tab));
    document.fonts?.ready.then(update).catch(() => undefined);
    list.addEventListener('scroll', update, { passive: true });
    return () => { ro.disconnect(); list.removeEventListener('scroll', update); };
  }, []);
  // Keep the current tab in view (e.g. chosen with the arrow keys or restored on load).
  useEffect(() => {
    row.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);
  return (
    <div ref={row} className={`ep-profile-tabs-row${more.start ? ' has-more-start' : ''}${more.end ? ' has-more-end' : ''}`}>
      <Segmented
        className="ep-profile-tabs"
        label="Equipment profile"
        options={tabs.map((t) => ({ value: t, label: t }))}
        value={value}
        onChange={onChange}
      />
      {onManage && (
        <IconButton icon="settings" label="Edit widgets" size="xs" tooltipPlacement="left" className="ep-profile-tabs-row__manage" onClick={onManage} />
      )}
    </div>
  );
}
