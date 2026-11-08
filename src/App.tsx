import { useCallback, useEffect, useRef, useState } from 'react';
import { DASHCAM_PLAY_EVENT } from './shared/dashcamBus';
import { AppShell } from './layout/AppShell';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileTabs } from './profile/ProfileTabs';
import { OverviewTab } from './overview/OverviewTab';
import { TelemetryTab } from './telemetry/TelemetryTab';
import { profileTabs } from './data/equipment';
import { defaultLayout, loadDraft, saveDraft, useWidgetLayout, type WidgetLayout } from './widgets/layout';
import { ManageWidgetsDrawer } from './widgets/ManageWidgetsDrawer';
import { EditBanner, EditBar } from './widgets/EditMode';
// Last, so the breakpoints win over the component stylesheets.
import './styles/responsive.css';

export function App() {
  const [tab, setTab] = useState(profileTabs[0]);
  const [layout, setLayout] = useWidgetLayout();
  // Edit Mode works on a draft: Save stores it, Discard drops it.
  // An unsaved Edit Mode draft from an earlier visit reopens Edit Mode with a notice.
  const [restored] = useState(loadDraft);
  const [restoredAt, setRestoredAt] = useState<number | null>(restored?.savedAt ?? null);
  const [draft, setDraft] = useState<WidgetLayout | null>(restored?.layout ?? null);
  useEffect(() => { saveDraft(draft); }, [draft]);
  const [managing, setManaging] = useState(false);
  const editing = draft !== null;
  // Undo / Redo: the drafts before each edit, and the ones undone. A drag or resize sends many changes;
  // changes less than 400ms apart count as one edit, so one Undo takes back the whole gesture.
  const [history, setHistory] = useState<WidgetLayout[]>([]);
  const [future, setFuture] = useState<WidgetLayout[]>([]);
  const lastChange = useRef(0);
  const draftRef = useRef<WidgetLayout | null>(null);
  draftRef.current = draft;
  const historyRef = useRef(history);
  historyRef.current = history;
  const futureRef = useRef(future);
  futureRef.current = future;

  const change = useCallback((next: WidgetLayout) => {
    const now = Date.now();
    const current = draftRef.current;
    if (current && now - lastChange.current > 400) setHistory((h) => [...h, current]);
    lastChange.current = now;
    draftRef.current = next;
    setFuture([]);
    setDraft(next);
  }, []);
  const undo = useCallback(() => {
    const h = historyRef.current;
    const current = draftRef.current;
    if (!h.length || !current) return;
    lastChange.current = 0;
    setFuture((f) => [...f, current]);
    setHistory(h.slice(0, -1));
    setDraft(h[h.length - 1]);
  }, []);
  const redo = useCallback(() => {
    const f = futureRef.current;
    const current = draftRef.current;
    if (!f.length || !current) return;
    lastChange.current = 0;
    setHistory((h) => [...h, current]);
    setFuture(f.slice(0, -1));
    setDraft(f[f.length - 1]);
  }, []);

  // Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z and Ctrl+Y redo.
  useEffect(() => {
    if (!editing) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest('input, textarea, dialog')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing, undo, redo]);

  useEffect(() => {
    const open = () => setTab('Telemetry');
    window.addEventListener(DASHCAM_PLAY_EVENT, open);
    return () => window.removeEventListener(DASHCAM_PLAY_EVENT, open);
  }, []);

  const edit = () => { setRestoredAt(null); setTab('Overview'); setHistory([]); setFuture([]); lastChange.current = 0; setDraft(layout); };
  const save = () => { if (draft) setLayout(draft); setRestoredAt(null); setDraft(null); setHistory([]); setFuture([]); setManaging(false); };
  const discard = () => { setRestoredAt(null); setDraft(null); setHistory([]); setFuture([]); setManaging(false); };

  return (
    <AppShell module="Fleet" current="planner">
      <div className={editing ? 'ep-profile is-editing' : 'ep-profile'}>
        <ProfileHeader />
        {editing ? (
          <EditBanner
            onSection={() => setManaging(true)}
            onReset={() => { lastChange.current = 0; change(defaultLayout()); }}
            restoredAt={restoredAt}
            onDiscardRestored={discard}
          />
        ) : (
          <ProfileTabs tabs={profileTabs} value={tab} onChange={setTab} onManage={tab === 'Overview' ? edit : undefined} />
        )}
        <div role="tabpanel" id="ep-tabpanel" aria-label={tab} className="ep-profile__panel">
          {tab === 'Overview' ? (
            <OverviewTab layout={draft ?? layout} editing={editing} onChange={change} onEdit={() => { edit(); setManaging(true); }} onAddWidget={() => setManaging(true)} />
          ) : tab === 'Telemetry' ? <TelemetryTab /> : <p className="ep-profile__placeholder">{tab} is not designed yet.</p>}
        </div>
        {editing && <EditBar onDiscard={discard} onSave={save} onUndo={undo} onRedo={redo} canUndo={history.length > 0} canRedo={future.length > 0} />}
      </div>
      {draft && <ManageWidgetsDrawer open={managing} layout={draft} onChange={(next) => { lastChange.current = 0; change(next); }} onClose={() => setManaging(false)} />}
    </AppShell>
  );
}
