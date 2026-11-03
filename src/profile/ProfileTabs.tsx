import { Segmented } from '@syn/design-system';
import './ProfileTabs.css';

/**
 * Figma "Tabs" on the profile: 24px pills, the current one Eerie Black. Built on Syn Segmented (a tablist
 * with arrow-key movement); the modifier lets each pill take its text width, as Figma does.
 */
export function ProfileTabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (tab: string) => void }) {
  return (
    <Segmented
      className="ep-profile-tabs"
      label="Equipment profile"
      options={tabs.map((t) => ({ value: t, label: t }))}
      value={value}
      onChange={onChange}
    />
  );
}
