import { PanelDrawer } from '../shared/PanelDrawer';
import type { InfoGroup } from '../data/equipment';
import './Drawers.css';

/**
 * A drawer of labelled values in groups, for the info cards (Technical specifications, Specific machine
 * information). No Figma frame yet; built on the group style of the other profile drawers. `null` values show
 * "--" in the muted colour, as on the cards.
 */
export function InfoDrawer({ open, onClose, title, groups }: { open: boolean; onClose: () => void; title: string; groups: InfoGroup[] }) {
  return (
    <PanelDrawer open={open} onClose={onClose} title={title} className="ep-spec-drawer">
      <div className="ep-spec-drawer__body">
        {groups.map((g) => (
          <section key={g.title} className="ep-drawer-group" aria-label={g.title}>
            <h3 className="ep-drawer-group__head"><span>{g.title}</span><span className="ep-drawer-group__count">{g.rows.length}</span></h3>
            <dl className="ep-drawer-group__list">
              {g.rows.map(([label, value]) => (
                <div key={label} className="ep-drawer-group__row ep-drawer-group__row--spec">
                  <dt className="ep-drawer-group__meta">{label}</dt>
                  <dd className={value === null ? 'ep-drawer-group__name syn-title-text is-empty' : 'ep-drawer-group__name syn-title-text'}>{value ?? '--'}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </PanelDrawer>
  );
}
