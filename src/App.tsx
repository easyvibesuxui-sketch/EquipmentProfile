import { useEffect, useState } from 'react';
import { DASHCAM_PLAY_EVENT } from './shared/dashcamBus';
import { AppShell } from './layout/AppShell';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileTabs } from './profile/ProfileTabs';
import { OverviewTab } from './overview/OverviewTab';
import { TelemetryTab } from './telemetry/TelemetryTab';
import { profileTabs } from './data/equipment';
import { useWidgetLayout } from './widgets/layout';
import { ManageWidgetsDrawer } from './widgets/ManageWidgetsDrawer';
// Last, so the breakpoints win over the component stylesheets.
import './styles/responsive.css';

export function App() {
  const [tab, setTab] = useState(profileTabs[0]);
  const [layout, setLayout] = useWidgetLayout();
  const [managing, setManaging] = useState(false);
  useEffect(() => {
    const open = () => setTab('Telemetry');
    window.addEventListener(DASHCAM_PLAY_EVENT, open);
    return () => window.removeEventListener(DASHCAM_PLAY_EVENT, open);
  }, []);
  return (
    <AppShell module="Fleet" current="planner">
      <div className="ep-profile">
        <ProfileHeader />
        <ProfileTabs tabs={profileTabs} value={tab} onChange={setTab} onManage={tab === 'Overview' ? () => setManaging(true) : undefined} />
        <div role="tabpanel" id="ep-tabpanel" aria-label={tab} className="ep-profile__panel">
          {tab === 'Overview' ? <OverviewTab layout={layout} onManage={() => setManaging(true)} /> : tab === 'Telemetry' ? <TelemetryTab /> : <p className="ep-profile__placeholder">{tab} is not designed yet.</p>}
        </div>
      </div>
      <ManageWidgetsDrawer
        open={managing}
        layout={layout}
        onClose={() => setManaging(false)}
        onSubmit={(next) => { setLayout(next); setManaging(false); }}
      />
    </AppShell>
  );
}
