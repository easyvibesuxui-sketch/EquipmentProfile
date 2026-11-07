import { IconButton, Segmented, Tooltip } from '@syn/design-system';
import './ProfileTabs.css';

/**
 * Figma "Tabs" on the profile: 24px pills, the current one Eerie Black. Built on Syn Segmented (a tablist
 * with arrow-key movement); the modifier lets each pill take its text width, as Figma does.
 * `onManage` adds the gear that opens "Manage Widgets" at the end of the row.
 */
export function ProfileTabs({ tabs, value, onChange, onManage }: { tabs: string[]; value: string; onChange: (tab: string) => void; onManage?: () => void }) {
  return (
    <div className="ep-profile-tabs-row">
      <Segmented
        className="ep-profile-tabs"
        label="Equipment profile"
        options={tabs.map((t) => ({ value: t, label: t }))}
        value={value}
        onChange={onChange}
      />
      {onManage && (
        <Tooltip content="Edit widgets" placement="left">
          <IconButton icon="settings" label="Edit widgets" size="xs" className="ep-profile-tabs-row__manage" onClick={onManage} />
        </Tooltip>
      )}
    </div>
  );
}
