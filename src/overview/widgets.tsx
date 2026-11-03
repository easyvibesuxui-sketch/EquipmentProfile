import { useState, type ReactNode } from 'react';
import { Card, Icon, IconButton, Property, Segmented } from '@syn/design-system';
import { ColorDot } from '../shared/ColorDot';
import {
  checkEvents, dependence, history, identifications, specifications, type HistoryEntry,
} from '../data/equipment';
import mapImage from '../assets/map-bremen.png';
import satelliteImage from '../assets/map-satellite.png';

/** Opens the matching profile tab; Figma draws a 16px chevron at the widget's top right. */
function OpenLink({ label }: { label: string }) {
  return <IconButton icon="next" label={label} className="ep-widget__open" />;
}

function InfoList({ rows }: { rows: Array<[string, string | null]> }) {
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
  return (
    <Card title="Specifications" className="ep-widget">
      <div className="ep-info__body">
        <InfoList rows={specifications.rows} />
        <p className="ep-info__footer">+{specifications.more} Specifications listed</p>
      </div>
    </Card>
  );
}

export function IdentificationsWidget() {
  return (
    <Card title="Identifications" className="ep-widget">
      <div className="ep-info__body">
        <InfoList rows={identifications} />
        <div className="ep-info__stack">
          <span>Specific info</span>
          <span>Not indicated</span>
        </div>
      </div>
    </Card>
  );
}

/** Location: the map with the satellite switch, the layers button and zoom. */
export function LocationWidget() {
  const [view, setView] = useState<'map' | 'satellite'>('map');
  const [zoom, setZoom] = useState(1);
  return (
    <Card className="ep-widget ep-map">
      <div className="ep-map__frame">
        <img
          className="ep-map__image"
          src={mapImage}
          alt="Equipment location: Bremen"
          style={{ transform: `scale(${zoom})`, filter: view === 'satellite' ? 'saturate(0.4) contrast(1.1)' : undefined }}
        />
      </div>
      <button
        type="button"
        className="ep-map__view"
        aria-pressed={view === 'satellite'}
        aria-label="Satellite view"
        onClick={() => setView(view === 'map' ? 'satellite' : 'map')}
      >
        <img src={satelliteImage} alt="" width={56} height={56} />
      </button>
      <div className="ep-map__controls">
        <IconButton icon="expand" label="Full screen map" variant="outline" size="sm" />
        <div className="ep-map__zoom">
          <IconButton icon="plus-in-circle" label="Zoom in" variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(2, z + 0.25))} />
          <IconButton icon="minus-in-circle" label="Zoom out" variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(1, z - 0.25))} />
        </div>
      </div>
    </Card>
  );
}

export function DependenceWidget() {
  const rows: Array<[string, ReactNode]> = [
    ['Primary asset', <span className="ep-dep__strong">{dependence.primaryAsset}</span>],
    ['Linked asset', <span className="ep-dep__count"><span>Count</span>{dependence.linkedAssets}</span>],
    ['Inventory list', <span className="ep-dep__count"><span>Count</span>{dependence.inventoryList}</span>],
    ['Crew', <span className="ep-dep__strong ep-dep__crew"><ColorDot color="brand" size={16} />{dependence.crew}</span>],
    ['Connected Person', <span className="ep-dep__strong">{dependence.connectedPerson}</span>],
  ];
  return (
    <Card title="Dependance" actions={<OpenLink label="Open dependence" />} className="ep-widget">
      <div className="ep-dep">
        {rows.map(([label, value]) => (
          <Property key={label} label={label} variant="tile" className="ep-dep__row">
            <span className="ep-dep__value">{value}</span>
          </Property>
        ))}
      </div>
    </Card>
  );
}

export function CheckInsWidget() {
  const [view, setView] = useState('charging');
  return (
    <Card
      actions={(
        <>
          <Segmented label="Movements" value={view} onChange={setView} options={[{ value: 'checkins', label: 'Check ins' }, { value: 'charging', label: 'Charging' }]} />
          <OpenLink label="Open movements" />
        </>
      )}
      className="ep-widget ep-widget--split"
    >
      <table className="ep-moves">
        <thead>
          <tr><th scope="col">Action</th><th scope="col">Project / Warehouse</th><th scope="col">Date</th></tr>
        </thead>
        {checkEvents.map((pair, i) => (
          <tbody key={i}>
            {pair.map((e, j) => (
              <tr key={j}>
                <td>
                  <Icon
                    name={view === 'charging' ? (e.kind === 'in' ? 'charged' : 'notcharging') : e.kind === 'in' ? 'check-in' : 'check-out'}
                    size={24}
                    title={view === 'charging' ? (e.kind === 'in' ? 'Charging started' : 'Charging ended') : e.kind === 'in' ? 'Checked in' : 'Checked out'}
                  />
                </td>
                <td><span className="ep-moves__place"><Icon name="bmti-warehouyse" size={14} />{e.place}</span></td>
                <td className="ep-moves__date">{e.date}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </Card>
  );
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  return (
    <li className="ep-history__item">
      <Icon name={entry.action === 'Created' ? 'status-created' : 'status-edited'} size={24} />
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
  return (
    <Card title="Recent actions from History" actions={<OpenLink label="Open history" />} className="ep-widget">
      <ol className="ep-history">
        {history.map((e, i) => <HistoryItem key={i} entry={e} />)}
      </ol>
    </Card>
  );
}
