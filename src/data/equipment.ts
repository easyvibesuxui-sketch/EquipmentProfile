/**
 * Mock data for the Overview tab, taken from the Figma design (SAM — Equipment Profile Home).
 * Replace with API data once the backend contract exists.
 */

export type DotColor = 'success' | 'violet' | 'rose' | 'orange' | 'brand';

export interface HeaderFact {
  id: 'status' | 'assigning' | 'garage' | 'operator';
  label: string;
  value: string;
  dot: DotColor;
}

export const equipment = {
  title: '2013 Caterpillar ZX350LC-5N',
  category: 'Heavy Dozer',
  tags: ['Dump Truck', 'Excavator', 'Bulldozer'],
  moreTags: 3,
  inventoryNumber: '45DB48484884',
  facts: [
    { id: 'status', label: 'Status', value: 'Active', dot: 'success' },
    { id: 'assigning', label: 'Assigning', value: 'Bremen Roadworks', dot: 'violet' },
    { id: 'garage', label: 'Assigning', value: 'Bremen Lagerplatz', dot: 'rose' },
    { id: 'operator', label: 'Operator', value: 'Max Musterman', dot: 'orange' },
  ] satisfies HeaderFact[],
  as4uLabel: 'AS4U-Gereteversetsung',
  as4uEnabled: true,
  /** A tracker with a camera (dashcam) gets the player card in the header. */
  tracker: { name: 'syniotec DASHCAM', camera: true, online: true, imei: '56456489454', lastUpdate: '14/05/2025 07:02:59', ago: '8 h ago' },
  /** The same slot with a plain tracker; open the page with #no-camera to see it. */
  plainTracker: { name: 'Link 3', camera: false, online: true, imei: '56456489454', lastUpdate: '14/05/2025 07:02:59', ago: '8 h ago' },
  tag: { name: 'Tag-L', id: '849844214' },
};

export const profileTabs = [
  'Overview', 'Specifications', 'Documents', '?Dependence?', 'Images', 'Utilization', 'Movement', 'Fuel',
  'Telemetry', 'Fault Codes', 'Maintenance', 'History', 'Tacho',
];

export const specifications = {
  rows: [
    ['Displacement', '4'],
    ['Lifting Capacity', '3000'],
    ['Max Lifting Height', '3000'],
    ['Dimensions', '2.41m x 2.44m x 5.3m'],
    ['Max Travel Speed', '32 Km/h'],
    ['Power', '7300 hp'],
  ] as Array<[string, string]>,
  more: 3,
};

/** `null` renders as "--" in the muted colour, as in Figma. */
export const identifications: Array<[string, string | null]> = [
  ['Inventory number', '54564DB8454'],
  ['UEID/TOID', null],
  ['Serial number', null],
  ['Numberplate', null],
  ['VIN', 'JH4DB1542MS007683'],
];

export const dependence = {
  primaryAsset: '2020 Volvo EC950F',
  linkedAssets: 8,
  inventoryList: 8,
  crew: 'Road construction',
  connectedPerson: 'Max Mustermann',
  warehouse: 'Bremen Lagerplatz',
  operator: 'Max Musterman',
  assigning: 'Bremen Roadworks',
  tag: 'Tag-L',
};

export interface CheckEvent {
  kind: 'in' | 'out';
  place: string;
  date: string;
}

export interface HistoryChange {
  label: string;
  from: string;
  to: string;
  /** The new value is highlighted in Candy Apple unless it is a "None". */
  highlight?: boolean;
}

export interface HistoryEntry {
  action: 'Created' | 'Edited' | 'Assigned' | 'Removed';
  subject: string;
  /** Dark Sienna subject, as Figma draws "Clearance request". */
  subjectTone?: 'sienna';
  by: string;
  notes?: Array<{ label: string; value: string; detail?: string }>;
  booking?: { from: [string, string]; to: [string, string] };
  changes?: HistoryChange[];
  date: string;
  time: string;
}

export const history: HistoryEntry[] = [
  { action: 'Created', subject: 'Project Request', by: 'Max Mustermann', date: '10.01.2027', time: '16:32' },
  {
    action: 'Created', subject: 'Clearance request', subjectTone: 'sienna', by: 'Max Mustermann',
    notes: [{ label: 'Destination:', value: 'Project KST Saxony', detail: '(Bremen Roadworks)' }],
    booking: { from: ['10.01.2027', '16:32'], to: ['10.01.2027', '16:32'] },
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [
      { label: 'Start date', from: '10.01.2027 16:32', to: '10.01.2027 16:32', highlight: true },
      { label: 'Location', from: 'Bremen, Am wall 146', to: 'Bremen, Am wall 146', highlight: true },
      { label: 'Tags', from: 'Bremen, Am wall 146', to: 'None' },
    ],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'Category', from: 'Scaffolding', to: 'Rollerguste', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'Amount', from: '3', to: '5', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'Weight min:', from: '10 kg', to: 'None', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
];

/** The full list in the "Recent actions from History" drawer (Figma 16127:6470): the widget's entries and older ones. */
export const historyLog: HistoryEntry[] = [
  ...history,
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'Weight min:', from: 'none', to: '1000 kg', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'Tag', from: 'Kassel tag', to: 'Kassel tag, Bremen tag, Hamburg tag', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'End date', from: '19.08.2025 10:00', to: '22.08.2025 12:00', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Edited', subject: 'Request', by: 'Max Mustermann',
    changes: [{ label: 'Additional info', from: 'We need a container also', to: 'We need a container also with an excavator', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Assigned', subject: 'Recourse', by: 'Max Mustermann',
    changes: [{ label: 'Equipment', from: 'None', to: 'Excavator CAT 320D', highlight: true }],
    date: '10.01.2027', time: '16:32',
  },
  {
    action: 'Removed', subject: 'Recourse', by: 'Max Mustermann',
    changes: [{ label: 'Equipment', from: 'Excavator CAT 320D', to: 'None' }],
    date: '10.01.2027', time: '16:32',
  },
];

/** One stay on a project or warehouse, or one charge: the "in" event and, once it ended, the "out" event. */
export interface MoveSession { in: CheckEvent; out?: CheckEvent }

const pair = (): MoveSession => ({
  in: { kind: 'in', place: 'Bremen Warehouse', date: '14.07.2022 14:09' },
  out: { kind: 'out', place: 'Bremen Warehouse', date: '14.07.2022 14:09' },
});

/** Drawer lists (Figma 16625:22238 and 16625:23303): 14 check-in stays and 12 charges. */
export const checkInLog: MoveSession[] = Array.from({ length: 14 }, pair);
export const chargingLog: MoveSession[] = Array.from({ length: 12 }, pair);

/** Targets of the Check in panel. */
export const checkInTargets = {
  project: ['Pipe Damage 2', 'Project KST Saxony', 'Bremen Roadworks'],
  warehouse: ['Bremen Warehouse', 'Bremen Lagerplatz', 'Hamburg Depot'],
};

/** Operating hours: 10 days, six readings a day, in hours (Figma bar heights at 10px per hour). */
export const operatingHours = {
  days: ['19 Aug. Mon', '20 Aug. Tue', '21 Aug. Wed', '22 Aug. Thu', '23 Aug. Fri', '24 Aug. Sat', '25 Aug. Sun', '26 Aug. Mon', '27 Aug. Tue', '28 Aug. Wed'],
  weekend: [5, 6],
  values: [
    6.7, 6.7, 0, 0, 9.1, 0,
    3.2, 7.4, 6.7, 7.0, 4.4, 6.7,
    12.0, 4.2, 6.7, 14.1, 3.8, 6.7,
    5.1, 3.7, 7.0, 6.7, 12.2, 6.7,
    12.2, 5.0, 6.7, 6.2, 5.8, 6.7,
    2.6, 5.8, 6.0, 6.7, 12.2, 6.7,
    12.2, 5.6, 7.4, 6.7, 11.7, 4.2,
    6.7, 14.1, 3.8, 4.2, 6.7, 14.1,
    3.8, 4.2, 6.7, 14.1, 3.8, 4.2,
    6.7, 14.1, 3.8, 0, 0, 0,
  ],
};

/** Distance travelled, monthly view: one bar a day from 19 Aug; long trips drawn in Dark Sienna. */
export const distance = {
  labels: ['19 Aug', '23 Aug', '27 Aug', '1 Sep', '5 Sep', '9 Sep', '13 Sep', '17 Sep', '21 Sep', '25 Sep', '29 Sep', '3 Oct', '8 Oct', '12 Oct'],
  values: [
    6.7, 6.7, 0, 9.1, 0, 3.2, 7.4, 6.7, 7.0, 4.4, 6.7, 12.0, 4.2, 6.7, 14.1, 3.8, 6.7, 5.1, 3.7, 7.0, 6.7,
    12.2, 6.7, 12.2, 5.0, 6.7, 6.2, 5.8, 6.7, 2.6, 5.8, 6.0, 6.7, 12.2, 6.7, 12.2, 5.6, 7.4, 6.7, 11.7, 4.2,
    6.7, 14.1, 3.8, 4.2, 6.7, 14.1, 3.8, 4.2, 6.7, 14.1, 3.8, 4.2, 6.7, 14.1, 3.8,
  ],
  /** Readings above this are long trips. */
  longTrip: 11.5,
};

/** Operation by hour, week KW32: per day, the hours (1–24) the machine ran. */
export interface HourRun { from: number; to: number; joined?: boolean; planned?: boolean }

export const operationByHour = {
  week: 'KW32',
  year: '2026',
  days: [
    { month: 'Aug', day: '08', weekday: 'Mon', runs: [{ from: 5, to: 7, planned: true }] },
    { month: 'Aug', day: '09', weekday: 'Tue', runs: [{ from: 6, to: 12, joined: true }, { from: 13, to: 15 }, { from: 19, to: 19 }] },
    { month: 'Aug', day: '10', weekday: 'Mon', runs: [{ from: 8, to: 10 }] },
    { month: 'Aug', day: '11', weekday: 'Mon', runs: [{ from: 13, to: 18 }] },
    { month: 'Aug', day: '12', weekday: 'Tue', runs: [{ from: 9, to: 12 }] },
    { month: 'Aug', day: '13', weekday: 'Mon', runs: [], upcoming: true },
    { month: 'Aug', day: '14', weekday: 'Mon', runs: [], upcoming: true },
  ] as Array<{ month: string; day: string; weekday: string; runs: HourRun[]; upcoming?: boolean }>,
};

/** Last reported position of the tracker. */
export const location = {
  address: 'Steinhöft 11, 20459 Hamburg, Germany',
  lat: 53.5458,
  lng: 9.9813,
  zoom: 14,
};

/* Widgets that can be added from "Manage Widgets". Not in the Overview Figma yet: placeholder content. */
export const equipmentDetails: Array<[string, string | null]> = [
  ['Manufacturer', 'Caterpillar'],
  ['Model', 'ZX350LC-5N'],
  ['Year of manufacture', '2013'],
  ['Category', 'Heavy Dozer'],
  ['Operating weight', '34 500 kg'],
  ['Purchase date', '12.03.2014'],
];

export const calculationType: Array<[string, string | null]> = [
  ['Calculation type', 'Internal rate'],
  ['Billing unit', 'Day'],
  ['Rate', '420,00 €'],
  ['Cost centre', 'KST 4100'],
  ['Valid from', '01.01.2026'],
];

export const bglInformation: Array<[string, string | null]> = [
  ['BGL number', 'D.1.12.0350'],
  ['Characteristic size', '35 t'],
  ['Average new value', '312 400 €'],
  ['Depreciation and interest', '7 810 € / month'],
  ['Repair costs', '4 060 € / month'],
];

export interface DocumentFile { name: string; meta: string; format: 'pdf' | 'doc' | 'xls' | 'jpg' }

export const documents: Record<'technical' | 'other', { title: string; files: DocumentFile[] }> = {
  technical: {
    title: 'Technical documents',
    files: [
      { name: 'Operating manual.pdf', meta: '4.2 MB', format: 'pdf' },
      { name: 'Spare parts catalogue.pdf', meta: '12.8 MB', format: 'pdf' },
      { name: 'CE declaration.pdf', meta: '320 KB', format: 'pdf' },
      { name: 'Wiring diagram.pdf', meta: '1.1 MB', format: 'pdf' },
    ],
  },
  other: {
    title: 'Other documents',
    files: [
      { name: 'Purchase contract.pdf', meta: '860 KB', format: 'pdf' },
      { name: 'Insurance policy.doc', meta: '210 KB', format: 'doc' },
      { name: 'Cost overview 2026.xls', meta: '95 KB', format: 'xls' },
      { name: 'Delivery photo.jpg', meta: '2.4 MB', format: 'jpg' },
    ],
  },
};

export type CheckTone = 'success' | 'warning' | 'error' | 'neutral';

export interface ScheduledItem { name: string; date: string; status: string; tone: CheckTone }

export const technicalChecks: ScheduledItem[] = [
  { name: 'UVV inspection', date: 'Due 14.09.2026', status: 'Overdue', tone: 'error' },
  { name: 'Crane inspection', date: 'Due 02.12.2026', status: 'Due soon', tone: 'warning' },
  { name: 'Electrical test (DGUV V3)', date: 'Done 10.03.2026', status: 'Passed', tone: 'success' },
  { name: 'Exhaust emission test', date: 'Done 22.01.2026', status: 'Passed', tone: 'success' },
];

export const workshopOrders: ScheduledItem[] = [
  { name: 'Hydraulic hose replaced', date: '28.10.2026', status: 'In progress', tone: 'warning' },
  { name: 'Track tension adjusted', date: '04.10.2026', status: 'Done', tone: 'success' },
  { name: 'Cab air filter', date: '17.09.2026', status: 'Done', tone: 'success' },
];

export const maintenance = {
  next: { name: '500 h service', due: 'in 42 h', at: '7 500 h' },
  items: [
    { name: '250 h service', date: 'Done 02.08.2026', status: 'Done', tone: 'success' },
    { name: 'Engine oil change', date: 'Done 02.08.2026', status: 'Done', tone: 'success' },
    { name: 'Annual service', date: 'Due 15.01.2027', status: 'Planned', tone: 'neutral' },
  ] as ScheduledItem[],
};
