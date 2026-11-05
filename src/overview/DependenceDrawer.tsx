import { PanelDrawer } from '../shared/PanelDrawer';
import { connectedEntities, type ConnectedId } from './widgets';
import { dependenceDetails } from '../data/equipment';
import './Drawers.css';

function Group({ id, empty }: { id: ConnectedId; empty: boolean }) {
  const entity = connectedEntities[id];
  const items = empty ? [] : dependenceDetails[id];
  const labelId = `ep-dep-drawer-${id}`;
  return (
    <section className="ep-drawer-group" aria-labelledby={labelId}>
      <h3 id={labelId} className="ep-drawer-group__head">
        <span>{entity.label}</span>
        {items.length > 1 && <span className="ep-drawer-group__count">{items.length}</span>}
      </h3>
      {items.length ? (
        <ul className="ep-drawer-group__list">
          {items.map((item) => (
            <li key={item.name} className="ep-drawer-group__row">
              <span className="ep-drawer-group__name syn-title-text">{item.name}</span>
              {item.meta && <span className="ep-drawer-group__meta">{item.meta}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ep-drawer-group__none syn-title-text">{entity.empty}</p>
      )}
    </section>
  );
}

/**
 * "Dependance" drawer: every connected entity of the equipment, the ones on the card first (in the card's
 * order), then the rest. No Figma frame yet; built on the panel and group style of the other profile drawers.
 */
export function DependenceDrawer({ open, onClose, rows, empty }: { open: boolean; onClose: () => void; rows: ConnectedId[]; empty: boolean }) {
  // Read at render: widgets.tsx imports this file, so its exports are not ready at module load.
  const others = (Object.keys(connectedEntities) as ConnectedId[]).filter((id) => !rows.includes(id));
  return (
    <PanelDrawer open={open} onClose={onClose} title="Dependance" className="ep-dep-drawer">
      <div className="ep-dep-drawer__body">
        {rows.map((id) => <Group key={id} id={id} empty={empty} />)}
        {others.length > 0 && (
          <>
            <h3 className="ep-dep-drawer__divider">Not shown on the card</h3>
            {others.map((id) => <Group key={id} id={id} empty={empty} />)}
          </>
        )}
      </div>
    </PanelDrawer>
  );
}
