import { Button } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { equipment, location } from '../data/equipment';
import './Drawers.css';

const googleMaps = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;

/**
 * "Current Location" drawer: the last reported position, its source and the recent positions. No Figma frame
 * yet; built on the group style of the other profile drawers. Open full map closes it and opens the full map.
 */
export function LocationDrawer({ open, onClose, onFullMap, empty }: { open: boolean; onClose: () => void; onFullMap?: () => void; empty: boolean }) {
  const facts: Array<[string, string]> = [
    ['Address', location.address],
    ['Coordinates', `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`],
    ['Last position update', location.lastUpdate],
    ['Tracker', equipment.tracker.name],
    ['Source', location.source],
  ];
  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      title="Current Location"
      className="ep-spec-drawer"
      footer={empty ? undefined : (
        <>
          <Button variant="text" onClick={() => window.open(googleMaps, '_blank', 'noopener')}>Open in Google Maps</Button>
          {onFullMap && <Button className="ep-panel-drawer__submit" onClick={() => { onClose(); onFullMap(); }}>Open full map</Button>}
        </>
      )}
    >
      <div className="ep-spec-drawer__body">
        {empty ? (
          <section className="ep-drawer-group" aria-label="Position">
            <h3 className="ep-drawer-group__head"><span>Position</span></h3>
            <p className="ep-drawer-group__none syn-title-text">No tracker linked yet</p>
          </section>
        ) : (
          <>
            <section className="ep-drawer-group" aria-label="Position">
              <h3 className="ep-drawer-group__head"><span>Position</span></h3>
              <dl className="ep-drawer-group__list">
                {facts.map(([label, value]) => (
                  <div key={label} className="ep-drawer-group__row ep-drawer-group__row--spec">
                    <dt className="ep-drawer-group__meta">{label}</dt>
                    <dd className="ep-drawer-group__name syn-title-text">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="ep-drawer-group" aria-label="Recent positions">
              <h3 className="ep-drawer-group__head"><span>Recent positions</span><span className="ep-drawer-group__count">{location.recent.length}</span></h3>
              <ol className="ep-drawer-group__list">
                {location.recent.map((p) => (
                  <li key={p.meta} className="ep-drawer-group__row">
                    <span className="ep-drawer-group__name syn-title-text">{p.name}</span>
                    <span className="ep-drawer-group__meta">{p.meta}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </div>
    </PanelDrawer>
  );
}
