import { Icon } from '@syn/design-system';
import { RulesPage } from './RulesPage';
import './Admin.css';

interface NavGroup { label: string; items: Array<{ id: string; label: string }> }

/** Figma "Secondary Navigation" of Administration (10569:13765). */
const groups: NavGroup[] = [
  { label: 'Organization Setting', items: [
    { id: 'company', label: 'Company Details' },
    { id: 'units', label: 'Organizational Units' },
    { id: 'localization', label: 'Localization' },
  ] },
  { label: 'User management', items: [
    { id: 'users', label: 'Users' },
    { id: 'roles', label: 'Roles & Permissions' },
  ] },
  { label: 'Workflows', items: [
    { id: 'rules', label: 'Rules' },
    { id: 'templates', label: 'Template Builder' },
  ] },
  { label: 'Integrations', items: [
    { id: 'webhooks', label: 'Webhooks' },
  ] },
];
const allItems = groups.flatMap((g) => g.items);

export const adminSections = allItems.map((i) => i.id);

function NavLink({ id, label, current }: { id: string; label: string; current: boolean }) {
  return (
    <a href={`#settings/${id}`} className="ep-subnav__item" aria-current={current ? 'page' : undefined}>
      <Icon name="secondary-navigation-icons" size={18} />
      <span className="syn-title-text">{label}</span>
    </a>
  );
}

/**
 * The Administration page of RAM: the secondary navigation on the left and the chosen section. Only Rules is
 * designed; the other sections say so.
 */
export function AdministrationPage({ section, empty }: { section: string; empty?: boolean }) {
  const current = allItems.find((i) => i.id === section) ?? allItems.find((i) => i.id === 'rules')!;
  return (
    <div className="ep-admin">
      <nav className="ep-subnav" aria-label="Administration">
        <div className="ep-subnav__groups">
          {groups.map((g) => (
            <div key={g.label} className="ep-subnav__group">
              <p className="ep-subnav__label syn-title-text" id={`ep-subnav-${g.label}`}>{g.label}</p>
              <ul className="ep-subnav__list" aria-labelledby={`ep-subnav-${g.label}`}>
                {g.items.map((i) => <li key={i.id}><NavLink {...i} current={i.id === current.id} /></li>)}
              </ul>
            </div>
          ))}
        </div>
        {/* Figma pins "Automatic Jobs /Rules" at the bottom, filled like the current item. */}
        <a href="#settings/rules" className="ep-subnav__item ep-subnav__item--pinned">
          <Icon name="secondary-navigation-icons" size={18} />
          <span className="syn-title-text">Automatic Jobs / Rules</span>
        </a>
      </nav>
      <div className="ep-admin__content">
        {current.id === 'rules'
          ? <RulesPage key={empty ? 'empty' : 'rules'} startEmpty={empty} />
          : <p className="ep-admin__placeholder">{current.label} is not designed yet.</p>}
      </div>
    </div>
  );
}
