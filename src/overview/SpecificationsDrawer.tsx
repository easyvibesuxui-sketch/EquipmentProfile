import { PanelDrawer } from '../shared/PanelDrawer';
import { specifications } from '../data/equipment';
import './Drawers.css';

/**
 * "Technical specifications" drawer: all specifications (the card shows six and "+3 Specifications listed"),
 * grouped. No Figma frame yet; built on the group style of the other profile drawers.
 */
export function SpecificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <PanelDrawer open={open} onClose={onClose} title="Technical specifications" className="ep-spec-drawer">
      <div className="ep-spec-drawer__body">
        {specifications.groups.map((g) => (
          <section key={g.title} className="ep-drawer-group" aria-label={g.title}>
            <h3 className="ep-drawer-group__head"><span>{g.title}</span><span className="ep-drawer-group__count">{g.rows.length}</span></h3>
            <dl className="ep-drawer-group__list">
              {g.rows.map(([label, value]) => (
                <div key={label} className="ep-drawer-group__row ep-drawer-group__row--spec">
                  <dt className="ep-drawer-group__meta">{label}</dt>
                  <dd className="ep-drawer-group__name syn-title-text">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </PanelDrawer>
  );
}
