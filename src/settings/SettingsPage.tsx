import { useState } from 'react';
import { Icon, type IconName } from '@syn/design-system';
import { SecurityTab } from './SecurityTab';
import './Settings.css';

interface SectionItem { id: string; label: string; icon: IconName; beta?: boolean }

/** Figma "Secondary Navigation" of Settings (frame 17974:62558). Figma's icons come from Syn's set here. */
const sections: SectionItem[] = [
  { id: 'organization', label: 'Organization', icon: 'admin', beta: true },
  { id: 'users', label: 'User Management', icon: 'person', beta: true },
  { id: 'resources', label: 'Resources', icon: 'inventory' },
  { id: 'workflows', label: 'Workflows', icon: 'list' },
];
const notificationCenter: SectionItem = { id: 'notifications', label: 'Notification Center', icon: 'settings' };

const organizationTabs = ['Company Details', 'Organizational units', 'Localization', 'Security'] as const;
type OrganizationTab = (typeof organizationTabs)[number];

function SectionLink({ item, current, onSelect }: { item: SectionItem; current: boolean; onSelect: (id: string) => void }) {
  return (
    <li>
      <button type="button" className="ep-settings-nav__item" aria-current={current ? 'page' : undefined} onClick={() => onSelect(item.id)}>
        <Icon name={item.icon} size={24} className="ep-settings-nav__icon" />
        <span className="ep-settings-nav__label">{item.label}</span>
        {item.beta && <span className="ep-settings-nav__beta">Beta</span>}
      </button>
    </li>
  );
}

/** Settings › Organization, with the Security tab (sign-in methods) built out. */
export function SettingsPage() {
  const [section, setSection] = useState('organization');
  const [tab, setTab] = useState<OrganizationTab>('Security');
  const all = [...sections, notificationCenter];
  const current = all.find((s) => s.id === section) ?? sections[0];

  return (
    <div className="ep-settings">
      <nav className="ep-settings-nav" aria-label="Settings">
        <ul className="ep-settings-nav__list">
          {sections.map((s) => <SectionLink key={s.id} item={s} current={s.id === section} onSelect={setSection} />)}
        </ul>
        <ul className="ep-settings-nav__list">
          <SectionLink item={notificationCenter} current={section === notificationCenter.id} onSelect={setSection} />
        </ul>
      </nav>

      <section className="ep-settings__content" aria-label={current.label}>
        {section === 'organization' ? (
          <>
            <div className="ep-settings-tabs" role="tablist" aria-label="Organization">
              {organizationTabs.map((t) => (
                <button
                  key={t} type="button" role="tab" id={`ep-settings-tab-${t}`} aria-selected={t === tab}
                  aria-controls="ep-settings-panel" tabIndex={t === tab ? 0 : -1} className="ep-settings-tabs__tab"
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => {
                    const i = organizationTabs.indexOf(t);
                    const next = e.key === 'ArrowRight' ? (i + 1) % organizationTabs.length : e.key === 'ArrowLeft' ? (i - 1 + organizationTabs.length) % organizationTabs.length : -1;
                    if (next < 0) return;
                    e.preventDefault();
                    setTab(organizationTabs[next]);
                    document.getElementById(`ep-settings-tab-${organizationTabs[next]}`)?.focus();
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="ep-settings__panel" role="tabpanel" id="ep-settings-panel" aria-labelledby={`ep-settings-tab-${tab}`}>
              {tab === 'Security' ? <SecurityTab /> : <p className="ep-settings__placeholder">{tab} is not designed yet.</p>}
            </div>
          </>
        ) : (
          <div className="ep-settings__panel"><p className="ep-settings__placeholder">{current.label} is not designed yet.</p></div>
        )}
      </section>
    </div>
  );
}
