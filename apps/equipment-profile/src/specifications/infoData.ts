/* Editable data of the Specifications info cards (owner's screenshots of the edit drawers). Demo values. */

export interface EquipmentDetails {
  manufacturer: string | null;
  model: string | null;
  year: string | null;
  title: string;
  category: string;
  subtitle: string | null;
}

/** Manufacturers and their models ("name (years built)"), for the Equipment Details dropdowns. */
export const catalogue: Record<string, string[]> = {
  Caterpillar: ['ZX350LC-5N', '336 (2013 -2020)', '349 (2015 -2024)', 'CAT 3512 TA (1996 -2000)'],
  Liebherr: ['R 9800 G6', 'LTM 1225-A', 'R 936 (2016 -2024)'],
  Komatsu: ['PC360LC-11', 'PC490LC-11'],
  Volvo: ['EC950F', 'EC380E'],
  Hitachi: ['ZX350LC-6', 'ZX490LCH-7'],
};
export const categories = ['Heavy Dozer', 'Excavator', 'Bulldozer', 'Dump Truck', 'Crane', 'Earthroamer'];

/** The listing title the brand and model make, unless the person changes it. */
export const systemTitle = (d: Pick<EquipmentDetails, 'manufacturer' | 'model'>) =>
  [d.manufacturer, d.model?.replace(/\s*\(.*\)$/, '')].filter(Boolean).join(' ');

export const initialDetails: EquipmentDetails = {
  manufacturer: 'Caterpillar', model: 'ZX350LC-5N', year: '2013', title: '2013 Caterpillar ZX350LC-5N', category: 'Heavy Dozer', subtitle: null,
};

export interface MachineInfo {
  inventory: string;
  ueid: string;
  sameAsInventory: boolean;
  serial: string;
  special: string;
  numberplate: string;
  vin: string;
  notes: string;
}

export const initialMachineInfo: MachineInfo = {
  inventory: '54564DB8454', ueid: '', sameAsInventory: false, serial: '', special: '', numberplate: '', vin: 'JH4DB1542MS007683', notes: '',
};

export type CalcBasis = 'hours' | 'daily' | 'combined';
export const basisLabels: Record<CalcBasis, string> = { hours: 'Working hours', daily: 'Daily price', combined: 'Combined' };
export interface Calculation {
  basis: CalcBasis | null;
  hourPrice: string;
  dailyPrice: string;
  /** Optional rule: below this many hours, charge this much (kept from the card; not in the drawer). */
  lessThan: string;
  chargeWith: string;
}
export const initialCalculation: Calculation = { basis: 'hours', hourPrice: '52', dailyPrice: '420', lessThan: '4', chargeWith: '210' };

/** A BGL specification line: EDV short name, long text, standard. */
export interface BglSpec { short: string; long: string; standard: string }

const BGL_ITEMS: Array<[string, string, string]> = [
  ['PLATTENBAND', 'Plattenbandfahrwerk', 'Geeignet für Korngrößen über 300 mm'],
  ['TIEFLÖFFEL', 'Tieflöffel 1,6 m³', 'Schneidenbreite 1 500 mm'],
  ['GRABENLÖFFEL', 'Grabenräumlöffel 2 000 mm', 'Hydraulisch schwenkbar'],
  ['SCHNELLWECHS', 'Hydraulischer Schnellwechsler', 'Nach DIN EN 474-5'],
  ['HAMMER', 'Hydraulikhammer 3 000 kg', 'Für Abbruch und Fels'],
  ['SORTIERGREIF', 'Sortiergreifer', 'Drehbar 360°'],
  ['MONOAUSLEG', 'Monoausleger 6,45 m', 'Standardausrüstung'],
  ['STIEL', 'Löffelstiel 3,2 m', 'Standardausrüstung'],
  ['KLIMA', 'Klimaanlage', 'Kabine nach ROPS/FOPS'],
  ['ZENTRALSCHM', 'Zentralschmieranlage', 'Automatisch'],
];

/** The BGL lines for a BGL number and year (demo: 50 lines, the same for any number). */
export const bglLookup = (number: string, year: string): BglSpec[] => (!number.trim() || !year ? [] : Array.from({ length: 50 }, (_, i) => {
  const [short, long, standard] = BGL_ITEMS[i % BGL_ITEMS.length];
  return { short: i < BGL_ITEMS.length ? short : `${short} ${Math.floor(i / BGL_ITEMS.length) + 1}`, long, standard };
}));
