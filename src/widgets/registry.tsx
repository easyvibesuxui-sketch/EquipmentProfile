import type { ReactNode } from 'react';
import {
  CheckInsWidget, HistoryWidget, IdentificationsWidget, SpecificationsWidget, type ConnectedId,
} from '../overview/widgets';
import { LocationWidget } from '../overview/LocationWidget';
import { DistanceWidget, OperatingHoursWidget, OperationByHourWidget } from '../overview/charts';
import {
  BglWidget, CalculationTypeWidget, EquipmentDetailsWidget, FilesWidget, MaintenanceWidget, TechnicalChecksWidget, WorkshopWidget,
} from '../overview/moreWidgets';
import { TelemetryHero, TrackerWidget } from '../telemetry/TelemetryTab';

export type WidgetCategory = 'overview' | 'specifications' | 'documents' | 'connected' | 'telemetry';

export const widgetCategories: Array<{ id: WidgetCategory; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'documents', label: 'Documents' },
  { id: 'connected', label: 'Connected entities' },
  { id: 'telemetry', label: 'Telemetry' },
];

/**
 * Width on the 12-column grid. Below 1024px "half" takes 6 columns and "wide" and "full" take 12;
 * below 640px every widget is full width (see responsive.css).
 */
export type WidgetSize = {
  span: 3 | 4 | 5 | 6 | 8 | 12;
  fit: 'half' | 'wide' | 'full';
  /** Rows on the 213px row grid as designed (2 = the 450px card); 2 when left out. */
  rows?: number;
};

export interface WidgetDef {
  id: string;
  category: WidgetCategory;
  label: string;
  size: WidgetSize;
  /** Shown when nothing is saved yet. The defaults are the Figma Overview. */
  defaultOn: boolean;
  /** Connected entities have no card of their own: they are the rows of the Dependance card. */
  render?: () => ReactNode;
  /** Manage Widgets preview (Overview widgets, Figma 17386:59329): what the widget shows, and its minimum size. */
  description?: string;
  minSize?: string;
}

const half3: WidgetSize = { span: 3, fit: 'half' };
const full: WidgetSize = { span: 12, fit: 'full' };

/** Drawer labels from the Figma "Manage Widgets" list (17064:71031); the card keeps its own row labels. */
const connectedLabels: Record<ConnectedId, string> = {
  primary: 'Primary asset', linked: 'Linked assets', warehouse: 'Warehouse', crew: 'Crew', person: 'Connected person',
  operator: 'Operator', assigning: 'Assigning', tag: 'Tag', inventory: 'Inventory',
};

const connectedOrder: ConnectedId[] = ['primary', 'linked', 'inventory', 'crew', 'person', 'warehouse', 'operator', 'assigning', 'tag'];
const connectedOn = new Set<ConnectedId>(['primary', 'linked', 'inventory', 'crew', 'person']);

/** Every widget the Overview can show, in the default order of the page. */
export const widgets: WidgetDef[] = [
  { id: 'technical-specifications', category: 'specifications', label: 'Technical specifications', size: half3, defaultOn: true, description: 'Key technical data: displacement, lifting capacity and height, dimensions, speed and power.', render: () => <SpecificationsWidget /> },
  { id: 'current-location', category: 'overview', label: 'Current location', size: { span: 6, fit: 'wide' }, defaultOn: true, description: 'Map with the last known position of the equipment.', minSize: '2/1 box', render: () => <LocationWidget /> },
  { id: 'specific-machine-information', category: 'specifications', label: 'Specific machine information', size: half3, defaultOn: true, description: 'Identifiers of this machine: inventory number, UEID, serial number, number plate and VIN.', render: () => <IdentificationsWidget /> },
  ...connectedOrder.map((id): WidgetDef => ({
    id: `connected-${id}`, category: 'connected', label: connectedLabels[id], size: half3, defaultOn: connectedOn.has(id),
    description: `The ${connectedLabels[id].toLowerCase()} row of the Dependance card.`,
  })),
  { id: 'checkins-charging', category: 'overview', label: 'Checkins and charging', size: { span: 5, fit: 'wide' }, defaultOn: true, description: 'Check-ins to projects and warehouses, and charging sessions.', render: () => <CheckInsWidget /> },
  { id: 'recent-actions', category: 'overview', label: 'Recent actions from History', size: { span: 4, fit: 'half' }, defaultOn: true, description: 'The latest changes to this equipment: what changed, who changed it and when.', render: () => <HistoryWidget /> },
  { id: 'operating-hours', category: 'overview', label: 'Operating Hours', size: full, defaultOn: true, description: 'Hours the equipment ran each day, with its idle hours.', render: () => <OperatingHoursWidget /> },
  { id: 'operation-hours-by-hour', category: 'overview', label: 'Operation Hours by hour', size: { ...full, rows: 3 }, defaultOn: true, description: 'The hours worked each day of the week, hour by hour.', render: () => <OperationByHourWidget /> },
  { id: 'distance-travelled', category: 'overview', label: 'Distance travelled', size: full, defaultOn: true, description: 'Distance travelled each day; long trips stand out.', render: () => <DistanceWidget /> },
  { id: 'equipment-details', category: 'specifications', label: 'Equipment Details', size: half3, defaultOn: false, description: 'General details of the equipment: type, manufacturer, model and year.', render: () => <EquipmentDetailsWidget /> },
  { id: 'calculation-type', category: 'specifications', label: 'Calculation type', size: half3, defaultOn: false, description: 'How the equipment is charged: the calculation type and its rates.', render: () => <CalculationTypeWidget /> },
  { id: 'bgl-information', category: 'specifications', label: 'BGL Information', size: half3, defaultOn: false, description: 'The BGL (construction equipment list) classification of this machine.', render: () => <BglWidget /> },
  { id: 'technical-documents', category: 'documents', label: 'Technical documents', size: half3, defaultOn: false, description: 'Technical documents of the equipment: manuals, certificates and drawings.', render: () => <FilesWidget kind="technical" /> },
  { id: 'other-documents', category: 'documents', label: 'Other documents', size: half3, defaultOn: false, description: 'Other files attached to the equipment.', render: () => <FilesWidget kind="other" /> },
  { id: 'technical-checks', category: 'documents', label: 'Technical Checks', size: half3, defaultOn: false, description: 'Technical checks: what was inspected, when, and the result.', render: () => <TechnicalChecksWidget /> },
  { id: 'workshop', category: 'documents', label: 'Workshop', size: half3, defaultOn: false, description: 'Workshop orders and repairs of this equipment.', render: () => <WorkshopWidget /> },
  { id: 'maintenance', category: 'documents', label: 'Maintenance', size: half3, defaultOn: false, description: 'Planned and past maintenance, with what is due next.', render: () => <MaintenanceWidget /> },
  { id: 'telemetry-dashboard', category: 'telemetry', label: 'Telemetry dashboard', size: full, defaultOn: false, description: 'Live telemetry at a glance: speed, engine state and engine hours.', render: () => <div className="ep-telemetry"><TelemetryHero /></div> },
  { id: 'telemetry', category: 'telemetry', label: 'Telemetry', size: { span: 8, fit: 'wide' }, defaultOn: false, description: 'The tracker on this equipment and its latest data.', render: () => <div className="ep-telemetry"><TrackerWidget /></div> },
];

export const widgetById = new Map(widgets.map((w) => [w.id, w]));

/** "connected-crew" → "crew" */
export const connectedIdOf = (id: string) => id.replace(/^connected-/, '') as ConnectedId;
