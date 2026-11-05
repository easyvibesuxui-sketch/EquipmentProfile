import type { ReactNode } from 'react';
import { Drawer } from '@syn/design-system';
import './PanelDrawer.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Syn Drawer at the 640px panel size the profile's Figma drawers use. */
export function PanelDrawer({ open, onClose, title, headerActions, footer, children, className }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      label={title}
      width={640}
      className={className ? `ep-panel-drawer ${className}` : 'ep-panel-drawer'}
      headerStart={<h2 className="ep-panel-drawer__title">{title}</h2>}
      headerActions={headerActions}
      footer={footer}
    >
      {children}
    </Drawer>
  );
}
