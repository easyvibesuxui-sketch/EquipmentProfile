import { useEffect, useState } from 'react';
import { DASHCAM_PLAY_EVENT } from './shared/dashcamBus';
import { AppShell } from './layout/AppShell';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileTabs } from './profile/ProfileTabs';
import { OverviewTab } from './overview/OverviewTab';
import { TelemetryTab } from './telemetry/TelemetryTab';
import { profileTabs } from './data/equipment';
import { useWidgetLayout, type WidgetLayout } from './widgets/layout';
import { ManageWidgetsDrawer } from './widgets/ManageWidgetsDrawer';
import { EditBanner, EditBar } from './widgets/EditMode';
// Last, so the breakpoints win over the component stylesheets.
import './styles/responsive.css';

export function App() {
  const [tab, setTab] = useState(profileTabs[0]);
  const [layout, setLayout] = useWidgetLayout();
  // Edit Mode works on a draft: Save stores it, Discard drops it.
  const [draft, setDraft] = useState<WidgetLayout | null>(null);
  const [managing, setManaging] = useState(false);
  const editing = draft !== null;

  useEffect(() => {
    const open = () => setTab('Telemetry');
    window.addEventListener(DASHCAM_PLAY_EVENT, open);
    return () => window.removeEventListener(DASHCAM_PLAY_EVENT, open);
  }, []);

  const edit = () => { setTab('Overview'); setDraft(layout); };
  const save = () => { if (draft) setLayout(draft); setDraft(null); setManaging(false); };
  const discard = () => { setDraft(null); setManaging(false); };

  return (
    <AppShell module="Fleet" current="planner">
      <div className={editing ? 'ep-profile is-editing' : 'ep-profile'}>
        <ProfileHeader />
        {editing ? (
          <EditBanner onSection={() => setManaging(true)} />
        ) : (
          <ProfileTabs tabs={profileTabs} value={tab} onChange={setTab} onManage={tab === 'Overview' ? edit : undefined} />
        )}
        <div role="tabpanel" id="ep-tabpanel" aria-label={tab} className="ep-profile__panel">
          {tab === 'Overview' ? (
            <OverviewTab layout={draft ?? layout} editing={editing} onChange={setDraft} onEdit={edit} onAddWidget={() => setManaging(true)} />
          ) : tab === 'Telemetry' ? <TelemetryTab /> : <p className="ep-profile__placeholder">{tab} is not designed yet.</p>}
        </div>
        {editing && <EditBar onDiscard={discard} onSave={save} />}
      </div>
      {draft && <ManageWidgetsDrawer open={managing} layout={draft} onChange={setDraft} onClose={() => setManaging(false)} />}
    </AppShell>
  );
}
