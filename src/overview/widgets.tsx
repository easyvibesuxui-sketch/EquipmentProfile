import { useState, type ReactNode } from 'react';
import { Card, Icon, Property, Segmented, type IconName } from '@syn/design-system';
import { CheckInsDrawer } from './CheckInsDrawer';
import { DependenceDrawer } from './DependenceDrawer';
import { InfoDrawer } from './InfoDrawer';
import { HistoryDrawer } from './HistoryDrawer';
import { ColorDot } from '../shared/ColorDot';
import { OpensDrawer } from '../shared/OpensDrawer';
import { OpenLink } from '../shared/OpenLink';
import { useEmptyDemo } from '../shared/useEmptyDemo';
import {
  checkInLog, chargingLog, dependence, history, identificationGroups, identifications, specifications,
  type CheckEvent, type HistoryEntry, type MoveSession,
} from '../data/equipment';

/** Opens the matching profile tab; Figma draws a 16px chevron at the widget's top right. */

export function InfoList({ rows }: { rows: Array<[string, string | null]> }) {
  return (
    <dl className="ep-info">
      {rows.map(([label, value]) => (
        <div key={label} className="ep-info__row">
          <dt>{label}</dt>
          <dd className={value === null ? 'is-empty' : undefined}>{value ?? '--'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SpecificationsWidget() {
  const [open, setOpen] = useState(false);
  return (
    <OpensDrawer onOpen={() => setOpen(true)}>
      <Card title="Technical specifications" className="ep-widget">
        <div className="ep-info__body">
          <InfoList rows={specifications.rows} />
          {/* Figma has no chevron on this card; the footer line is the keyboard way into the drawer. */}
          <button type="button" className="ep-info__footer ep-info__more" onClick={() => setOpen(true)}>
            +{specifications.more} Specifications listed
          </button>
        </div>
      </Card>
      <InfoDrawer open={open} onClose={() => setOpen(false)} title="Technical specifications" groups={specifications.groups} />
    </OpensDrawer>
  );
}

export function IdentificationsWidget() {
  const [open, setOpen] = useState(false);
  return (
    // Figma has no chevron or link on this card, so the card itself is the keyboard way in.
    <OpensDrawer onOpen={() => setOpen(true)} label="Open specific machine information">
      <Card title="Specific machine information" className="ep-widget">
        <div className="ep-info__body">
          <InfoList rows={identifications} />
          <div className="ep-info__stack">
            <span>Specific info</span>
            <span>Not indicated</span>
          </div>
        </div>
      </Card>
      <InfoDrawer open={open} onClose={() => setOpen(false)} title="Specific machine information" groups={identificationGroups} />
    </OpensDrawer>
  );
}

export type ConnectedId = 'primary' | 'linked' | 'warehouse' | 'crew' | 'person' | 'operator' | 'assigning' | 'tag' | 'inventory';

const strong = (text: string, dot?: Parameters<typeof ColorDot>[0]['color']) => (
  <span className={dot ? 'ep-dep__strong ep-dep__crew' : 'ep-dep__strong'}>
    {dot && <ColorDot color={dot} />}<span className="syn-title-text">{text}</span>
  </span>
);
const count = (n: number) => <span className="ep-dep__count"><span>Count</span>{n}</span>;

/** Connected entities: the rows of the Dependance card. Labels and the empty wording follow Figma. */
export const connectedEntities: Record<ConnectedId, { label: string; empty: string; value: () => ReactNode }> = {
  primary: { label: 'Primary asset', empty: 'Not linked yet', value: () => strong(dependence.primaryAsset) },
  linked: { label: 'Linked asset', empty: 'Not linked yet', value: () => count(dependence.linkedAssets) },
  warehouse: { label: 'Warehouse', empty: 'Not linked yet', value: () => strong(dependence.warehouse) },
  crew: { label: 'Crew', empty: 'Not linked yet', value: () => strong(dependence.crew, 'brand') },
  person: { label: 'Connected Person', empty: 'Not linked yet', value: () => strong(dependence.connectedPerson) },
  operator: { label: 'Operator', empty: 'Not linked yet', value: () => strong(dependence.operator, 'orange') },
  assigning: { label: 'Assigning', empty: 'Not linked yet', value: () => strong(dependence.assigning, 'violet') },
  tag: { label: 'Tag', empty: 'Not linked yet', value: () => strong(dependence.tag) },
  inventory: { label: 'Inventory list', empty: 'Not attached yet', value: () => count(dependence.inventoryList) },
};

export function DependenceWidget({ rows = ['primary', 'linked', 'inventory', 'crew', 'person'] }: { rows?: ConnectedId[] }) {
  const empty = useEmptyDemo();
  const [open, setOpen] = useState(false);
  return (
    <OpensDrawer onOpen={() => setOpen(true)}>
      {/* Empty: Figma hides the chevron; the card still opens the drawer, where links will be added. */}
      <Card title="Dependance" actions={empty ? undefined : <OpenLink label="Open dependence" />} className="ep-widget">
        <div className={empty ? 'ep-dep is-empty' : 'ep-dep'}>
          {rows.map((id) => {
            const e = connectedEntities[id];
            return (
              <Property key={id} label={e.label} variant="tile" className="ep-dep__row">
                {empty ? <span className="ep-dep__none syn-title-text">{e.empty}</span> : <span className="ep-dep__value">{e.value()}</span>}
              </Property>
            );
          })}
        </div>
      </Card>
      <DependenceDrawer open={open} onClose={() => setOpen(false)} rows={rows} empty={empty} />
    </OpensDrawer>
  );
}

export type MovesView = 'checkins' | 'charging';

const moveIcon = (view: MovesView, kind: CheckEvent['kind']) => (view === 'charging'
  ? { name: kind === 'in' ? 'charged' : 'notcharging', size: kind === 'in' ? 18 : 24, title: kind === 'in' ? 'Charging started' : 'Charging ended' }
  : { name: kind === 'in' ? 'check-in' : 'check-out', size: 14, title: kind === 'in' ? 'Checked in' : 'Checked out' }) as { name: IconName; size: number; title: string };

/**
 * Check ins or charges, a pair of rows per stay: Charging draws the Amber-ringed plug and the empty ring;
 * Check ins a white arrow in a Candy Apple (in) or Silver Chalice (out) circle, as the Figma drawer does.
 */
export function MovesTable({ sessions, view, className }: { sessions: MoveSession[]; view: MovesView; className?: string }) {
  return (
    <table className={className ? `ep-moves ${className}` : 'ep-moves'}>
      <thead>
        <tr><th scope="col">Action</th><th scope="col">Project / Warehouse</th><th scope="col">Date</th></tr>
      </thead>
      {sessions.map((session, i) => (
        <tbody key={i}>
          {[session.in, session.out].filter((e): e is CheckEvent => Boolean(e)).map((e, j) => {
            const icon = moveIcon(view, e.kind);
            const tone = view === 'charging' ? (e.kind === 'in' ? ' is-in' : '') : e.kind === 'in' ? ' is-check-in' : ' is-check-out';
            return (
              <tr key={j}>
                <td><span className={`ep-moves__action${tone}`}><Icon name={icon.name} size={icon.size} title={icon.title} /></span></td>
                <td><span className="ep-moves__place"><Icon name="bmti-warehouyse" size={14} /><span className="syn-title-text">{e.place}</span></span></td>
                <td className="ep-moves__date">{e.date}</td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </table>
  );
}

export function CheckInsWidget() {
  const [view, setView] = useState<MovesView>('charging');
  const [open, setOpen] = useState(false);
  const empty = useEmptyDemo();
  const [logs, setLogs] = useState<Record<MovesView, MoveSession[]>>(() => (empty ? { checkins: [], charging: [] } : { checkins: checkInLog, charging: chargingLog }));
  return (
    <OpensDrawer onOpen={() => setOpen(true)}>
      <Card
        actions={(
          <>
            <Segmented label="Movements" value={view} onChange={(v) => setView(v as MovesView)} options={[{ value: 'checkins', label: 'Check ins' }, { value: 'charging', label: 'Charging' }]} />
            <OpenLink label="Open check ins and charging" />
          </>
        )}
        className="ep-widget ep-widget--split"
      >
        <MovesTable sessions={logs[view].slice(0, 4)} view={view} />
      </Card>
      <CheckInsDrawer
        open={open}
        onClose={() => setOpen(false)}
        view={view}
        onView={setView}
        logs={logs}
        onLogs={setLogs}
      />
    </OpensDrawer>
  );
}

const historyIcons: Record<HistoryEntry['action'], IconName> = {
  Created: 'status-created', Edited: 'status-edited', Assigned: 'status-created', Removed: 'status-rejected',
};

export function HistoryItem({ entry }: { entry: HistoryEntry }) {
  return (
    <li className="ep-history__item">
      <Icon name={historyIcons[entry.action]} size={24} />
      <div className="ep-history__body">
        <p className="ep-history__title">
          <span className="is-muted">{entry.action}</span>
          <span className={entry.subjectTone === 'sienna' ? 'is-sienna' : undefined}>{entry.subject}</span>
          <span className="is-muted">By</span>
          <span>{entry.by}</span>
        </p>
        {entry.notes?.map((n) => (
          <p key={n.label} className="ep-history__line">
            {n.label} <span className="is-strong">{n.value}</span> {n.detail}
          </p>
        ))}
        {entry.booking && (
          <p className="ep-history__line">
            Booking dates <span className="is-strong">{entry.booking.from[0]}</span> {entry.booking.from[1]}{' '}
            <span className="is-strong">{entry.booking.to[0]}</span> {entry.booking.to[1]}
          </p>
        )}
        {entry.changes?.map((c) => (
          <p key={c.label} className="ep-history__line ep-history__change">
            <span>{c.label}</span>
            <del>{c.from}</del>
            <Icon name="arrow" size={14} title="changed to" />
            <ins className={c.highlight ? 'is-new' : undefined}>{c.to}</ins>
          </p>
        ))}
        <p className="ep-history__line"><time>{entry.date} {entry.time}</time></p>
      </div>
    </li>
  );
}

export function HistoryWidget() {
  const [open, setOpen] = useState(false);
  return (
    <OpensDrawer onOpen={() => setOpen(true)}>
      <Card title="Recent actions from History" actions={<OpenLink label="Open history" />} className="ep-widget">
        <ol className="ep-history">
          {history.map((e, i) => <HistoryItem key={i} entry={e} />)}
        </ol>
      </Card>
      <HistoryDrawer open={open} onClose={() => setOpen(false)} />
    </OpensDrawer>
  );
}
