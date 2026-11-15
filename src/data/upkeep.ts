/** Upkeep tab (Figma 14948:43661): technical inspections and maintenance of the equipment. Demo data. */

export interface InspectionType {
  id: string;
  label: string;
  /** The checklist template the inspection is done with (the Past table's Template column). */
  template: string;
}

export const inspectionTypes: InspectionType[] = [
  { id: 'kehr', label: 'Selbstfahrende Kehr- / Kehrsaugmaschinen und Anbaukehrmaschinen', template: 'Innerladerpaletten' },
  { id: 'kehrsaug', label: 'Kehrsaugmaschinen und Anbaukehrmaschinen', template: 'Innerladerpaletten' },
  { id: 'vde', label: 'VDE Prüfung', template: 'Innerladerpaletten' },
  { id: 'uvv', label: 'UVV Prüfung', template: 'Erdbaumaschinen' },
];

/** An inspection that is due: its type and date (ISO), on the Upcoming Technical inspection card. */
export interface UpcomingInspection {
  id: string;
  typeId: string;
  date: string;
}

const daysFromToday = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// The first one ran out three days ago (Figma: "Overdue 3 days").
export const upcomingInspections: UpcomingInspection[] = [
  { id: 'u1', typeId: 'kehr', date: daysFromToday(-3) },
  { id: 'u2', typeId: 'kehrsaug', date: '2028-01-01' },
];

export type InspectionStatus = 'successful' | 'failed';

export interface PastInspection {
  id: string;
  typeId: string;
  status: InspectionStatus;
  date: string;
  examiner: string;
  /** The report, when one was uploaded. */
  file?: { name: string; size: string };
}

export const pastInspections: PastInspection[] = [
  { id: 'p1', typeId: 'kehr', status: 'successful', date: '2022-01-01', examiner: 'Max Mustermann', file: { name: 'Kehrmaschine-Pruefbericht.pdf', size: '1.2 MB' } },
  { id: 'p2', typeId: 'vde', status: 'failed', date: '2022-01-02', examiner: 'Anna Schmidt', file: { name: 'VDE-0701-0702.pdf', size: '640 KB' } },
  { id: 'p3', typeId: 'vde', status: 'successful', date: '2022-01-03', examiner: 'John Doe', file: { name: 'VDE-Wiederholung.pdf', size: '702 KB' } },
  { id: 'p4', typeId: 'vde', status: 'failed', date: '2022-01-04', examiner: 'Maria Garcia', file: { name: 'VDE-Pruefung-04.pdf', size: '588 KB' } },
  { id: 'p5', typeId: 'vde', status: 'successful', date: '2022-01-05', examiner: 'Chen Wei', file: { name: 'VDE-Pruefung-05.pdf', size: '615 KB' } },
  { id: 'p6', typeId: 'vde', status: 'failed', date: '2022-01-06', examiner: 'Fatima Al-Sayed' },
  { id: 'p7', typeId: 'uvv', status: 'successful', date: '2022-01-07', examiner: 'Liam Johnson', file: { name: 'UVV-Pruefung.pdf', size: '930 KB' } },
];

/** What a maintenance interval counts: working hours, kilometres driven or days. */
export type MaintenanceUnit = 'hours' | 'km' | 'days';

export const unitLabels: Record<MaintenanceUnit, { type: string; short: string; long: string }> = {
  hours: { type: 'Working hours', short: 'h', long: 'Working h.' },
  km: { type: 'Km driven', short: 'km', long: 'km' },
  days: { type: 'Days', short: 'days', long: 'Days' },
};

export interface Maintenance {
  id: string;
  name: string;
  unit: MaintenanceUnit;
  interval: number;
  /** How much of the interval is left; 0 with `overdueDays` once it has run out. */
  left: number;
  overdueDays?: number;
  /** Once resolved: how far into the interval, and by whom. */
  resolvedAt?: number;
  resolvedBy?: string;
}

export const upcomingMaintenance: Maintenance[] = [
  { id: 'm1', name: 'Oil Change', unit: 'days', interval: 365, left: 0, overdueDays: 3 },
  { id: 'm2', name: 'Tire Rotation', unit: 'hours', interval: 180, left: 180 },
  { id: 'm3', name: 'Brake Inspection', unit: 'days', interval: 120, left: 120 },
  { id: 'm4', name: 'Battery Check', unit: 'km', interval: 240000, left: 240000 },
  { id: 'm5', name: 'Fluid Top-Up', unit: 'km', interval: 85500, left: 85500 },
  { id: 'm6', name: 'Engine Tune-Up', unit: 'days', interval: 30, left: 30 },
];

export const maintenanceHistory: Maintenance[] = [
  { id: 'h1', name: 'Oil Change', unit: 'days', interval: 365, left: 0, resolvedAt: 120, resolvedBy: 'Max Mustermann' },
  { id: 'h2', name: 'Tire Rotation', unit: 'hours', interval: 180, left: 0, resolvedAt: 180, resolvedBy: 'Anna Schmidt' },
  { id: 'h3', name: 'Brake Inspection', unit: 'days', interval: 120, left: 0, resolvedAt: 120, resolvedBy: 'John Doe' },
  { id: 'h4', name: 'Battery Check', unit: 'km', interval: 240000, left: 0, resolvedAt: 240000, resolvedBy: 'Maria Garcia' },
  { id: 'h5', name: 'Fluid Top-Up', unit: 'km', interval: 85500, left: 0, resolvedAt: 85500, resolvedBy: 'Chen Wei' },
  { id: 'h6', name: 'Engine Tune-Up', unit: 'days', interval: 30, left: 0, resolvedAt: 30, resolvedBy: 'Fatima Al-Sayed' },
];

/** Workshop boards a maintenance reminder can open a ticket on, and their columns. */
export const boards = [
  { value: 'bremen', label: 'Bremen Board' },
  { value: 'hamburg', label: 'Hamburg Board' },
];
export const boardStatuses = [
  { value: 'todo', label: 'To Do', color: 'var(--syn-color-secondary-silver-chalince)' },
  { value: 'progress', label: 'In Progress', color: 'var(--syn-color-secondary-silver-chalince)' },
  { value: 'done', label: 'Done', color: 'var(--syn-color-success-mantis)' },
];

/** The person signed in (the examiner or resolver of what they add). */
export const currentPerson = 'Max Mustermann';
