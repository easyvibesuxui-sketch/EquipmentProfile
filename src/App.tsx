import { useCallback, useEffect, useRef, useState } from 'react';
import { DASHCAM_PLAY_EVENT } from './shared/dashcamBus';
import { AppShell } from './layout/AppShell';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileTabs } from './profile/ProfileTabs';
import { OverviewTab } from './overview/OverviewTab';
import { TelemetryTab } from './telemetry/TelemetryTab';
import { profileTabs } from './data/equipment';
import { defaultLayout, useWidgetLayout, type WidgetLayout } from './widgets/layout';
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
  // Undo: the drafts before each edit. A drag or resize sends many changes; changes less than 400ms apart
  // count as one edit, so one Undo takes back the whole gesture.
  const [history, setHistory] = useState<WidgetLayout[]>([]);
  const lastChange = useRef(0);
  const draftRef = useRef<WidgetLayout | null>(null);
  draftRef.current = draft;
  const change = useCallback((next: WidgetLayout) => {
    const now = Date.now();
    const current = draftRef.current;
    if (current && now - lastChange.current > 400) setHistory((h) => [...h, current]);
    lastChange.current = now;
    draftRef.current = next;
    setDraft(next);
  }, []);
  const historyRef = useRef(history);
  historyRef.current = history;
  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.length) return;
    lastChange.current = 0;
    setDraft(h[h.length - 1]);
    setHistory(h.slice(0, -1));
  }, []);

  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !target.closest('input, textarea, dialog')) {
        e.preventDefault();
        undo();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing, undo]);

  useEffect(() => {
    const open = () => setTab('Telemetry');
    window.addEventListener(DASHCAM_PLAY_EVENT, open);
    return () => window.removeEventListener(DASHCAM_PLAY_EVENT, open);
  }, []);

  const edit = () => { setTab('Overview'); setHistory([]); lastChange.current = 0; setDraft(layout); };
  const save = () => { if (draft) setLayout(draft); setDraft(null); setHistory([]); setManaging(false); };
  const discard = () => { setDraft(null); setHistory([]); setManaging(false); };

  return (
    <AppShell module="Fleet" current="planner">
      <div className={editing ? 'ep-profile is-editing' : 'ep-profile'}>
        <ProfileHeader />
        {editing ? (
          <EditBanner onSection={() => setManaging(true)} onReset={() => { lastChange.current = 0; change(defaultLayout()); }} />
        ) : (
          <ProfileTabs tabs={profileTabs} value={tab} onChange={setTab} onManage={tab === 'Overview' ? edit : undefined} />
        )}
        <div role="tabpanel" id="ep-tabpanel" aria-label={tab} className="ep-profile__panel">
          {tab === 'Overview' ? (
            <OverviewTab layout={draft ?? layout} editing={editing} onChange={change} onEdit={edit} onAddWidget={() => setManaging(true)} />
          ) : tab === 'Telemetry' ? <TelemetryTab /> : <p className="ep-profile__placeholder">{tab} is not designed yet.</p>}
        </div>
        {editing && <EditBar onDiscard={discard} onSave={save} onUndo={undo} canUndo={history.length > 0} />}
      </div>
      {draft && <ManageWidgetsDrawer open={managing} layout={draft} onChange={(next) => { lastChange.current = 0; change(next); }} onClose={() => setManaging(false)} />}
    </AppShell>
  );
}
