import { useState } from 'react';
import { AppShell } from './layout/AppShell';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileTabs } from './profile/ProfileTabs';
import { OverviewTab } from './overview/OverviewTab';
import { TelemetryTab } from './telemetry/TelemetryTab';
import { profileTabs } from './data/equipment';
// Last, so the breakpoints win over the component stylesheets.
import './styles/responsive.css';

export function App() {
  const [tab, setTab] = useState(profileTabs[0]);
  return (
    <AppShell module="Fleet" current="planner">
      <div className="ep-profile">
        <ProfileHeader />
        <ProfileTabs tabs={profileTabs} value={tab} onChange={setTab} />
        <div role="tabpanel" id="ep-tabpanel" aria-label={tab} className="ep-profile__panel">
          {tab === 'Overview' ? <OverviewTab /> : tab === 'Telemetry' ? <TelemetryTab /> : <p className="ep-profile__placeholder">{tab} is not designed yet.</p>}
        </div>
      </div>
    </AppShell>
  );
}
