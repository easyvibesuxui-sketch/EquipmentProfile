/** Mock telemetry for the Telemetry tab, from the Figma frame (SAM — Equipment Accessories / Telemetry). */

export type SensorGlyph = 'engine' | 'info' | 'idle' | 'gps';

export interface Sensor {
  id: string;
  label: string;
  glyph: SensorGlyph;
  /** on / off draw the coloured dot; value shows a reading with its unit. */
  kind: 'on' | 'off' | 'value';
  value?: string;
  unit?: string;
  date: string;
  time: string;
}

const stamp = { date: '16 May 2024', time: '14:05:30' };

export const gauge = { speed: 45, max: 240, unit: 'km/h', engineOn: true, engineHours: 3869 };

export const lastLocation = {
  place: 'Bremen, Germany',
  street: 'Karl-Tauchnitz-Straße 7',
  area: 'Mitte, 04107, Leipzig, DE',
  lastPosition: '31/07/2024 11:13:28 (421d ago)',
  lastSeen: '31/07/2024 11:13:28 (421d ago)',
  operatingHours: 40,
  lat: 53.0793,
  lng: 8.8017,
};

export const statusSensors: Sensor[] = [
  { id: 'power', label: 'Power Voltage', glyph: 'engine', kind: 'on', ...stamp },
  { id: 'idle', label: 'IDLE HOUR', glyph: 'idle', kind: 'value', value: '10.33', unit: 'h', ...stamp },
  { id: 'gps', label: 'GPS SAT NUMBER', glyph: 'gps', kind: 'value', value: '51°13\'24.0"N 8°48\'4.4"E, 0', ...stamp },
  { id: 'battery', label: 'Battery Level', glyph: 'engine', kind: 'value', value: '85%', ...stamp },
];

/** Tracker channels, listed column by column as in Figma. */
export const trackerSensors: { count: number; columns: Sensor[][] } = {
  count: 36,
  columns: [
    [
      { id: 'a1', label: 'Naturally aspirated', glyph: 'info', kind: 'on', ...stamp },
      { id: 'a2', label: 'Naturally aspirated', glyph: 'engine', kind: 'off', ...stamp },
      { id: 'a3', label: 'Naturally aspirated', glyph: 'engine', kind: 'on', ...stamp },
      { id: 'a4', label: 'Naturally aspirated', glyph: 'engine', kind: 'off', ...stamp },
      { id: 'a5', label: 'Distance', glyph: 'engine', kind: 'value', value: '1.110,00', unit: 'km', ...stamp },
      { id: 'a6', label: 'Voltage', glyph: 'engine', kind: 'value', value: '220', unit: 'Volt', ...stamp },
    ],
    [
      { id: 'b1', label: 'Naturally aspirated', glyph: 'engine', kind: 'off', ...stamp },
      { id: 'b2', label: 'Naturally aspirated', glyph: 'engine', kind: 'on', ...stamp },
      { id: 'b3', label: 'Naturally aspirated', glyph: 'engine', kind: 'off', ...stamp },
      { id: 'b4', label: 'Naturally aspirated', glyph: 'engine', kind: 'on', ...stamp },
      { id: 'b5', label: 'Voltage', glyph: 'engine', kind: 'value', value: '220', unit: 'Volt', ...stamp },
      { id: 'b6', label: 'Distance', glyph: 'engine', kind: 'value', value: '1.110,00', unit: 'km', ...stamp },
    ],
  ],
};

export interface DigitalInput { id: string; label: string; channel: string; on: boolean; art: 'key' | 'switch' | 'signal' }

export const digitalInputs: DigitalInput[] = [
  { id: 'ignition', label: 'Ignition Key', channel: 'Din 1', on: false, art: 'key' },
  { id: 'main', label: 'Main switch', channel: 'Din 2', on: true, art: 'switch' },
  { id: 'switch1', label: 'Switch 1', channel: 'Din 3', on: false, art: 'signal' },
  { id: 'switch2', label: 'Switch 2', channel: 'Din 3', on: false, art: 'signal' },
];

export const analogueInputs = [{ id: 'raw', label: 'RAW Data', value: '564564' }];

export const dashcam = {
  name: 'syniotec DASHCAM',
  imei: '56456489454',
  lastUpdate: '14/05/2025 07:02:59',
  ago: '8 h ago',
  cameras: [
    { id: 'front', label: 'Camera 1', online: true },
    { id: 'cab', label: 'Camera 2', online: true },
    { id: 'rear', label: 'Camera 3', online: false },
    { id: 'side', label: 'Camera 4', online: true },
  ],
};
