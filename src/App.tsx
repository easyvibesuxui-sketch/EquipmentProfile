import { useCallback, useEffect, useRef, useState } from 'react';
import { DASHCAM_PLAY_EVENT } from './shared/dashcamBus';
import { AppShell } from './layout/AppShell';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileTabs } from './profile/ProfileTabs';
import { OverviewTab } from './overview/OverviewTab';
import { TelemetryTab } from './telemetry/TelemetryTab';
import { profileTabs } from './data/equipment';
import {
  currentUser, defaultLayout, effectiveLayout, loadDraft, saveDraft, useViews, type Scope, type Views, type WidgetLayout,
} from './widgets/layout';
import { ManageWidgetsDrawer } from './widgets/ManageWidgetsDrawer';
import { EditBanner, EditBar } from './widgets/EditMode';
// Last, so the breakpoints win over the component stylesheets.
import './styles/responsive.css';

type Draft = { views: Views; scope: Scope };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function App() {
  const [tab, setTab] = useState(profileTabs[0]);
  // The saved Overviews: the organization's (set by a manager) and the person's own, if any.
  const [views, setViews] = useViews();
  // Edit Mode works on a draft of both: Save stores it, Discard drops it.
  // An unsaved Edit Mode draft from an earlier visit reopens Edit Mode with a notice.
  const [restored] = useState(loadDraft);
  const [draft, setDraft] = useState<Draft | null>(restored ? { views: restored.views, scope: restored.scope } : null);
  useEffect(() => { saveDraft(draft); }, [draft]);
  const [managing, setManaging] = useState(false);
  const editing = draft !== null;
  // Undo / Redo: the drafts before each edit, and the ones undone. A drag or resize sends many changes;
  // changes less than 400ms apart count as one edit, so one Undo takes back the whole gesture.
  const [history, setHistory] = useState<Views[]>([]);
  const [future, setFuture] = useState<Views[]>([]);
  const lastChange = useRef(0);
  const draftRef = useRef<Draft | null>(null);
  draftRef.current = draft;
  const historyRef = useRef(history);
  historyRef.current = history;
  const futureRef = useRef(future);
  futureRef.current = future;

  const changeViews = useCallback((next: Views) => {
    const current = draftRef.current;
    if (!current) return;
    const now = Date.now();
    if (now - lastChange.current > 400) setHistory((h) => [...h, current.views]);
    lastChange.current = now;
    const d = { ...current, views: next };
    draftRef.current = d;
    setFuture([]);
    setDraft(d);
  }, []);
  // An edit of the layout in view: the organization's, or the person's own (which starts their own layout).
  const change = useCallback((layout: WidgetLayout) => {
    const current = draftRef.current;
    if (!current) return;
    changeViews(current.scope === 'org' ? { ...current.views, org: layout } : { ...current.views, mine: layout });
  }, [changeViews]);
  const step = (from: Views[], to: (fn: (v: Views[]) => Views[]) => void, setFrom: (v: Views[]) => void) => {
    const current = draftRef.current;
    if (!from.length || !current) return;
    lastChange.current = 0;
    to((v) => [...v, current.views]);
    setFrom(from.slice(0, -1));
    setDraft({ ...current, views: from[from.length - 1] });
  };
  const undo = useCallback(() => step(historyRef.current, setFuture, setHistory), []);
  const redo = useCallback(() => step(futureRef.current, setHistory, setFuture), []);

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

  const clearHistory = () => { setHistory([]); setFuture([]); lastChange.current = 0; };
  // Managers open on the organization's Overview, everyone else on their own.
  const edit = () => { setTab('Overview'); clearHistory(); setDraft({ views, scope: currentUser.isManager ? 'org' : 'mine' }); };
  const save = () => { if (draft) setViews(draft.views); setDraft(null); clearHistory(); setManaging(false); };
  const discard = () => { setDraft(null); clearHistory(); setManaging(false); };

  const scope = draft?.scope ?? 'mine';
  const draftLayout = draft ? (scope === 'org' ? draft.views.org : effectiveLayout(draft.views)) : null;
  const canReset = draft ? (scope === 'org' ? !same(draft.views.org, defaultLayout()) : draft.views.mine !== null) : false;
  const reset = () => {
    if (!draft) return;
    lastChange.current = 0;
    changeViews(scope === 'org' ? { ...draft.views, org: defaultLayout() } : { ...draft.views, mine: null });
  };

  return (
    <AppShell module="Fleet" current="planner">
      <div className={editing ? 'ep-profile is-editing' : 'ep-profile'}>
        <ProfileHeader />
        {draft ? (
          <EditBanner
            scope={scope}
            onScope={currentUser.isManager ? (s) => setDraft((d) => (d ? { ...d, scope: s } : d)) : undefined}
            widgetCount={draftLayout ? draftLayout.order.length - draftLayout.hidden.length : 0}
            onWidgets={() => setManaging(true)}
          />
        ) : (
          <ProfileTabs tabs={profileTabs} value={tab} onChange={setTab} onManage={tab === 'Overview' ? edit : undefined} />
        )}
        <div role="tabpanel" id="ep-tabpanel" aria-label={tab} className="ep-profile__panel">
          {tab === 'Overview' ? (
            <OverviewTab
              // A new view in Edit Mode lays its cards in afresh (a short fade), so the switch reads as a change.
              key={draft ? scope : 'view'}
              layout={draftLayout ?? effectiveLayout(views)} editing={editing} onChange={change}
              onEdit={() => { edit(); setManaging(true); }} onAddWidget={() => setManaging(true)}
            />
          ) : tab === 'Telemetry' ? <TelemetryTab /> : <p className="ep-profile__placeholder">{tab} is not designed yet.</p>}
        </div>
        {editing && (
          <EditBar
            onDiscard={discard} onSave={save}
            onReset={reset} canReset={canReset}
            resetLabel={scope === 'org' ? 'Reset the organization Overview to the default' : 'Reset to the organization Overview'}
          />
        )}
      </div>
      {draft && draftLayout && (
        <ManageWidgetsDrawer
          open={managing} scope={scope} layout={draftLayout} org={draft.views.org} canAddAny={currentUser.isManager}
          onChange={(next) => { lastChange.current = 0; change(next); }} onClose={() => setManaging(false)}
        />
      )}
    </AppShell>
  );
}
