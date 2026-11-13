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
  /** Panel width; 640 by default (the profile's side panels). */
  width?: number;
}

/** Syn Drawer at the 640px panel size the profile's Figma drawers use. */
export function PanelDrawer({ open, onClose, title, headerActions, footer, children, className, width = 640 }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      label={title}
      width={width}
      className={className ? `ep-panel-drawer ${className}` : 'ep-panel-drawer'}
      headerStart={<h2 className="ep-panel-drawer__title">{title}</h2>}
      headerActions={headerActions}
      footer={footer}
    >
      {children}
    </Drawer>
  );
}
