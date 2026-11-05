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

/** An open stay or charge is the newest session without an "out" event. */
const isOpen = (sessions: MoveSession[]) => Boolean(sessions[0] && !sessions[0].out);

/** Ends the open session, or starts a new one at `place`. */
function toggle(sessions: MoveSession[], place: string): MoveSession[] {
  const date = stamp();
  if (isOpen(sessions)) return [{ ...sessions[0], out: { kind: 'out', place: sessions[0].in.place, date } }, ...sessions.slice(1)];
  return [{ in: { kind: 'in', place, date } }, ...sessions];
}

/** Figma "List is empty" (16631:8886): the Smoke list area with the empty-state glyph and two muted lines. */
function EmptyList() {
  return (
    <div className="ep-moves-drawer__empty">
      <Icon name="empty-state" size={32} />
      <p>List is empty</p>
      <p>Nothing yet</p>
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
  const [kind, setKind] = useState<keyof typeof checkInTargets>('project');
  const [target, setTarget] = useState(checkInTargets.project[0]);
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
                <Button variant="accent" size="sm" className="ep-moves-drawer__action" onClick={() => onLogs({ ...logs, checkins: toggle(logs.checkins, target) })}>
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
        {sessions.length ? <MovesTable sessions={sessions} view={view} className="ep-moves--drawer" /> : <EmptyList />}
      </div>
    </PanelDrawer>
  );
}
