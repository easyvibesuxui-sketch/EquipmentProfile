import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Tooltip } from '@syn/design-system';
import expandIcon from '../assets/icons/nav-expand.png';
import plannerIcon from '../assets/icons/nav-planner.png';
import rentalsIcon from '../assets/icons/nav-rentals.png';
import clientsIcon from '../assets/icons/nav-clients.png';
import warehousesIcon from '../assets/icons/nav-warehouses.png';
import equipmentIcon from '../assets/icons/nav-equipment.png';
import productsIcon from '../assets/icons/nav-products.png';
import invoicingIcon from '../assets/icons/nav-invoicing.png';
import reportsIcon from '../assets/icons/nav-reports.png';
import settingsIcon from '../assets/icons/nav-settings.png';
import bellIcon from '../assets/icons/bell.png';
import './AppShell.css';

/** An icon cropped from the Figma frame, drawn as a mask so it takes the text colour. */
export function MaskIcon({ src, size, className }: { src: string; size: number | [number, number]; className?: string }) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const style = { '--mask': `url("${src}")`, width: w, height: h } as CSSProperties;
  return <span aria-hidden className={['ep-mask-icon', className].filter(Boolean).join(' ')} style={style} />;
}

interface NavItem { id: string; label: string; hint: string; icon: string }

const mainNav: NavItem[] = [
  { id: 'planner', label: 'Planner', hint: 'Planner listing', icon: plannerIcon },
  { id: 'rentals', label: 'Rentals', hint: 'Rental listing', icon: rentalsIcon },
  { id: 'clients', label: 'Clients', hint: 'Client listing', icon: clientsIcon },
  { id: 'warehouses', label: 'Warehouses', hint: 'Warehouse listing', icon: warehousesIcon },
  { id: 'equipment', label: 'Equipments', hint: 'Equipment Database', icon: equipmentIcon },
  { id: 'products', label: 'Products', hint: 'Products and services listing', icon: productsIcon },
];
const moneyNav: NavItem[] = [
  { id: 'invoicing', label: 'Invoicing', hint: 'All invoices', icon: invoicingIcon },
  { id: 'reports', label: 'Reports', hint: 'All reports', icon: reportsIcon },
];

function NavButton({ item, current }: { item: NavItem; current: boolean }) {
  return (
    <li>
      <Tooltip placement="right" content={<span className="ep-nav__tooltip"><strong>{item.label}</strong>{item.hint}</span>}>
        <a href={`#${item.id}`} className="ep-nav__item" aria-label={item.label} aria-current={current ? 'page' : undefined}>
          <MaskIcon src={item.icon} size={26} />
        </a>
      </Tooltip>
    </li>
  );
}

/** Figma "Side bar" (closed, 64px) with the "Planner" item selected, as in the Equipment Profile frame. */
function Sidebar({ current }: { current: string }) {
  return (
    <nav className="ep-nav" aria-label="Main">
      <button type="button" className="ep-nav__opener" aria-label="Open navigation" aria-expanded={false}>
        <MaskIcon src={expandIcon} size={26} />
      </button>
      <ul className="ep-nav__list">
        {mainNav.map((item) => <NavButton key={item.id} item={item} current={item.id === current} />)}
      </ul>
      <hr className="ep-nav__separator" />
      <ul className="ep-nav__list">
        {moneyNav.map((item) => <NavButton key={item.id} item={item} current={item.id === current} />)}
      </ul>
      <ul className="ep-nav__list ep-nav__list--end">
        <li>
          <button type="button" className="ep-nav__item ep-nav__lang" aria-label="Language: Deutsch. Click to change"><span className="syn-title-text">DE</span></button>
        </li>
        <NavButton item={{ id: 'settings', label: 'Settings', hint: 'Settings', icon: settingsIcon }} current={current === 'settings'} />
      </ul>
    </nav>
  );
}

/** Figma "TopNavigation": module name, the SAM wordmark, Create, notifications and the profile button. */
function TopBar({ module }: { module: string }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header className="ep-topbar">
      <p className="ep-topbar__module">{module}</p>
      <p className="ep-topbar__brand" aria-hidden>SAM</p>
      <div className="ep-topbar__actions">
        <Button variant="secondary" size="sm" iconStart="plus-in-circle" className="ep-topbar__create">Create</Button>
        <button type="button" className="ep-topbar__bell" aria-label="Notifications">
          <MaskIcon src={bellIcon} size={[16, 18]} />
        </button>
        <button
          type="button"
          className="ep-topbar__profile"
          aria-label="Profile: Max Mustermann"
          aria-expanded={profileOpen}
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <span className="syn-title-text">M.M.</span>
        </button>
      </div>
    </header>
  );
}

export function AppShell({ module, current, children }: { module: string; current: string; children: ReactNode }) {
  return (
    <div className="ep-shell syn-root">
      <Sidebar current={current} />
      <div className="ep-shell__body">
        <TopBar module={module} />
        <main className="ep-shell__main">{children}</main>
      </div>
    </div>
  );
}
