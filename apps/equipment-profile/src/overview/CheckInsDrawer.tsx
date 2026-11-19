import { useState } from 'react';
import { Button, Icon, Segmented, Select, Tabs } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { MovesTable, type MovesView } from './widgets';
import { checkInTargets, type MoveSession } from '../data/equipment';
import './Drawers.css';

interface Props {
  open: boolean;
  onClose: () => void;
  view: MovesView;
  onView: (view: MovesView) => void;
  logs: Record<MovesView, MoveSession[]>;
  onLogs: (logs: Record<MovesView, MoveSession[]>) => void;
}

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const TARGET_KEY = 'ep-checkin-target-v1';
function lastTarget(): { kind: keyof typeof checkInTargets; target: string } | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(TARGET_KEY) ?? 'null') as { kind?: string; target?: string } | null;
    if (v && (v.kind === 'project' || v.kind === 'warehouse') && checkInTargets[v.kind].includes(v.target ?? '')) return { kind: v.kind, target: v.target! };
  } catch { /* storage blocked */ }
  return null;
}
function rememberTarget(kind: keyof typeof checkInTargets, target: string) {
  try { window.localStorage.setItem(TARGET_KEY, JSON.stringify({ kind, target })); } catch { /* storage blocked */ }
}

/** An open stay or charge is the newest session without an "out" event. */
const isOpen = (sessions: MoveSession[]) => Boolean(sessions[0] && !sessions[0].out);

/** Ends the open session, or starts a new one at `place`. */
function toggle(sessions: MoveSession[], place: string): MoveSession[] {
  const date = stamp();
  if (isOpen(sessions)) return [{ ...sessions[0], out: { kind: 'out', place: sessions[0].in.place, date } }, ...sessions.slice(1)];
  return [{ in: { kind: 'in', place, date } }, ...sessions];
}

/** Figma "List is empty" (16631:8886): the Smoke list area with the empty-state glyph and two muted lines. */
function EmptyList({ view }: { view: MovesView }) {
  // The action is the panel right above (Check in, or Continue charging), so the copy points to it.
  return (
    <div className="ep-moves-drawer__empty">
      <Icon name="empty-state" size={32} />
      <p className="ep-moves-drawer__empty-title">{view === 'checkins' ? 'No check-ins yet' : 'No charging sessions yet'}</p>
      <p>{view === 'checkins'
        ? 'Check this machine in to a project or warehouse above to keep a record of where it works.'
        : 'Charging sessions appear here when the tracker reports them, or when you continue charging above.'}</p>
    </div>
  );
}

/**
 * "Check ins and charging" (Figma 16631:8886, 16625:22238, 16625:23303, 16631:9378). Two 220px tabs; under
 * Check in a Smoke panel with Project / Warehouse, the target and the Amber Check in (Check out while checked
 * in); under Charging "Pause or continue Charging" with Continue and Stop, the current one Amber. The list
 * below is the full log; the Overview widget shows its first four stays.
 */
export function CheckInsDrawer({ open, onClose, view, onView, logs, onLogs }: Props) {
  // Defaults to the last project or warehouse used in this browser, else the first project.
  const [kind, setKind] = useState<keyof typeof checkInTargets>(() => lastTarget()?.kind ?? 'project');
  const [target, setTarget] = useState(() => lastTarget()?.target ?? checkInTargets.project[0]);
  const checkedIn = isOpen(logs.checkins);
  const charging = isOpen(logs.charging);
  const sessions = logs[view];

  const setCharging = (on: boolean) => {
    if (on !== charging) onLogs({ ...logs, charging: toggle(logs.charging, logs.checkins[0]?.in.place ?? checkInTargets.warehouse[0]) });
  };

  return (
    // Figma titles this drawer "Dummy text Details"; the build uses the widget's name.
    <PanelDrawer open={open} onClose={onClose} title="Check ins and charging" className="ep-moves-drawer">
      <div className="ep-moves-drawer__body">
        <div className="ep-moves-drawer__controls">
          <Tabs
            label="Check ins and charging"
            size="md"
            className="ep-moves-drawer__tabs"
            items={[{ id: 'checkins', label: 'Check in' }, { id: 'charging', label: 'Charging' }]}
            value={view}
            onChange={(id) => onView(id as MovesView)}
          />
          {view === 'checkins' ? (
            <div className="ep-moves-drawer__panel">
              <Segmented
                label="Check in to"
                className="ep-moves-drawer__kind"
                options={[{ value: 'project', label: 'Project' }, { value: 'warehouse', label: 'Warehouse' }]}
                value={kind}
                onChange={(v) => { const k = v as keyof typeof checkInTargets; setKind(k); setTarget(checkInTargets[k][0]); }}
              />
              <div className="ep-moves-drawer__row">
                <div className="ep-moves-drawer__field">
                  <span className="ep-moves-drawer__label" aria-hidden>{kind === 'project' ? 'Project' : 'Warehouse'}</span>
                  <Select
                    label={kind === 'project' ? 'Project' : 'Warehouse'}
                    size="sm"
                    options={checkInTargets[kind].map((t) => ({ value: t, label: t }))}
                    value={checkedIn ? undefined : target}
                    placeholder={checkedIn ? logs.checkins[0].in.place : undefined}
                    onChange={setTarget}
                    disabled={checkedIn}
                  />
                </div>
                <Button variant="accent" size="sm" className="ep-moves-drawer__action" onClick={() => { if (!checkedIn) rememberTarget(kind, target); onLogs({ ...logs, checkins: toggle(logs.checkins, target) }); }}>
                  {checkedIn ? 'Check out' : 'Check in'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="ep-moves-drawer__panel">
              <p className="ep-moves-drawer__hint" id="ep-charging-hint">Pause or continue Charging</p>
              <div className="ep-moves-drawer__charge" role="group" aria-labelledby="ep-charging-hint">
                <button type="button" aria-pressed={charging} className={charging ? 'is-current' : undefined} onClick={() => setCharging(true)}>
                  <Icon name="play" size={16} />Continue charging
                </button>
                <button type="button" aria-pressed={!charging} className={charging ? undefined : 'is-current'} onClick={() => setCharging(false)}>
                  <Icon name="pause" size={16} />Stop charging
                </button>
              </div>
            </div>
          )}
        </div>
        {sessions.length ? <MovesTable sessions={sessions} view={view} className="ep-moves--drawer" /> : <EmptyList view={view} />}
      </div>
    </PanelDrawer>
  );
}
