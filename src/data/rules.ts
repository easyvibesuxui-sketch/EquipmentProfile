/**
 * Charging rules (release policy) of Administration → Workflows → Rules (RAM Figma "Rules", "Create Rule Pick up",
 * "Create Rule Return"). A pick-up rule: when the equipment is picked up later than `time`, the pick-up day is not
 * charged. A return rule: when it is returned earlier than `time`, the return day is not charged.
 * The Daily booking job: every day at `time`, a booking that ends today and is still In progress (green in the planner)
 * gets its end date moved to tomorrow: it was not brought back today, so the rental runs one more day. Completed,
 * Planned and Reserved bookings are left alone.
 * Mock data until the API exists.
 */
export type ChargingType = 'pickup' | 'return';
export type RuleType = ChargingType | 'daily';
/** A charging rule (the list) or the Daily booking job (the card). */
export type RuleKind = 'charging' | 'daily';
export const kindOf = (t: RuleType): RuleKind => (t === 'daily' ? 'daily' : 'charging');

export interface ChargingRule {
  id: string;
  type: RuleType;
  /** "HH:MM", 24-hour. */
  time: string;
  enabled: boolean;
  creator: string;
  /** ISO date (YYYY-MM-DD). */
  created: string;
}

export const ruleTypes: Record<RuleType, {
  /** In the list ("Rule" column). */
  name: string;
  /** On the Type switcher of the drawer. */
  option: string;
  /** "Condition" column and the time field's label. */
  condition: string;
  /** Muted line above the time field. */
  hint: string;
}> = {
  pickup: {
    name: 'Pick-up',
    option: 'Pick up',
    condition: 'Later than',
    hint: 'If equipment pick-up happens later than this time the pick up day is not charged',
  },
  return: {
    name: 'Return',
    option: 'Return',
    condition: 'Earlier than',
    hint: 'If equipment is returned earlier than this time, the return day is not charged.',
  },
  daily: {
    name: 'Daily booking job',
    option: 'Daily booking job',
    condition: 'In progress, ending today',
    hint: 'The job runs once a day, at this time.',
  },
};

/** RAM booking statuses (RESERVED, PLANNED, IN_PROGRESS, COMPLETED); the job changes In progress only. */
export const bookingStatuses = [
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'PLANNED', label: 'Planned' },
  { id: 'RESERVED', label: 'Reserved' },
] as const;

export const currentAdmin = 'Max Mustermann';

/** The Daily booking job: one per organization, already running in RAM's admin; it sits in the card above the list. */
export const dailyJob: ChargingRule = { id: 'daily', type: 'daily', time: '23:00', enabled: true, creator: currentAdmin, created: '2027-12-15' };

/** The 15 rows of the Figma "Rules" frame: Pick-up and Return in turn, the 11th disabled. */
export const sampleRules: ChargingRule[] = Array.from({ length: 15 }, (_, i) => {
  const type: ChargingType = i % 2 === 0 ? 'pickup' : 'return';
  return {
    id: `r${i + 1}`,
    type,
    time: type === 'pickup' ? ['12:00', '14:00', '16:00'][i % 3] : ['08:00', '09:00', '10:00'][i % 3],
    enabled: i !== 10,
    creator: currentAdmin,
    created: `2028-01-${String(i + 1).padStart(2, '0')}`,
  };
});

/** Accepts "9", "930", "0930", "9:30", "09:30"; returns "09:30", or null when it is not a time of day. */
export function parseTime(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let h: number;
  let m: number;
  const colon = /^(\d{1,2}):(\d{1,2})$/.exec(s);
  if (colon) { h = Number(colon[1]); m = Number(colon[2]); } else if (/^\d{1,4}$/.test(s)) {
    if (s.length <= 2) { h = Number(s); m = 0; } else { h = Number(s.slice(0, -2)); m = Number(s.slice(-2)); }
  } else return null;
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
