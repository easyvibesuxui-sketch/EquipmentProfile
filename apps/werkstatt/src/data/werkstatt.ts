import damage1 from '../assets/werkstatt/damage-1.jpg';
import damage2 from '../assets/werkstatt/damage-2.jpg';
import damage3 from '../assets/werkstatt/damage-3.jpg';

/**
 * Mock data for the Werkstatt (workshop) board, taken from the Figma frames "Equipment Database" (946:13850),
 * "Werkstatt full" (8757:17722), "WK" (17013:52604) and the "Archived" panel (8384:41961).
 * To be replaced by the API.
 */

export type Priority = 'blocker' | 'high' | 'medium' | 'low';
export type Condition = 'can-work' | 'cant-work' | 'destroyed';
export type Insurance = 'yes' | 'no' | 'not-relevant';

export interface Column {
  id: string;
  label: string;
  /** Status dot fill. */
  color: string;
  /** A task dropped here counts as done (its round checkbox turns green). */
  done?: boolean;
}

export interface Task {
  id: string;
  title: string;
  ticket: string;
  column: string;
  done: boolean;
  equipment?: { name: string; number: string; photo: string };
  /** ISO date and time. */
  due?: string;
  /** Done tasks show how long they took instead of how far the due date is. */
  tookDays?: number;
  location?: { name: string; city: string; kind: 'project' | 'warehouse' };
  insurance?: Insurance;
  hours?: number;
  priority?: Priority;
  condition?: Condition;
  /** Tag names (see `tagCatalog` for their colours); the card shows one bookmark per tag. */
  tags?: string[];
  /** Initials of the people working with the assignee (the card stacks them after the assignee). */
  collaborators?: string[];
  description?: string;
  /** The board the ticket is on (Bremen when not set). */
  board?: string;
  /** Initials of the assignee; none shows the dashed "assign" circle. */
  assignee?: string;
  attachments: number;
  comments: number;
  createdBy: string;
  createdAt: string;
  /** Sum of the ticket's Resources table, in Eur (List view "Recourse total"). */
  resourceTotal?: number;
}

export interface Board { id: string; name: string; columns: Column[] }

export const priorities: Array<{ value: Priority; label: string }> = [
  { value: 'blocker', label: 'Blocker' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
export const conditions: Array<{ value: Condition; label: string }> = [
  { value: 'can-work', label: 'Can work' },
  { value: 'cant-work', label: 'Can’t work' },
  { value: 'destroyed', label: 'Destroyed' },
];
export const insuranceLabel: Record<Insurance, string> = { yes: 'Yes', no: 'No', 'not-relevant': 'Not relevant' };

/** The tags a ticket can carry, with their colours (cards show them as bookmarks, the drawer as named tags). */
export const tagCatalog: Array<{ name: string; color: string }> = [
  { name: 'Caterpillar 6090', color: '#a200ff' },
  { name: 'Komatsu PC8000', color: 'var(--syn-color-secondary-dodger-blue)' },
  { name: 'Hitachi EX8000', color: 'var(--syn-color-secondary-xanthous)' },
  { name: 'P&H 4100XPC', color: '#41a619' },
  { name: 'Liebherr R9800', color: '#d46c2b' },
];
export const tagColor = (name: string) => tagCatalog.find((t) => t.name === name)?.color ?? 'var(--syn-color-secondary-silver-chalince)';
const allTags = ['Caterpillar 6090', 'Komatsu PC8000', 'Hitachi EX8000'];

export const people = [
  { initials: 'M.M', name: 'Max Mustermann' },
  { initials: 'A.S', name: 'Anna Schmidt' },
  { initials: 'L.M', name: 'Lukas Müller' },
  { initials: 'J.D', name: 'Jane Doe' },
  { initials: 'J.S', name: 'John Smith' },
  { initials: 'E.J', name: 'Emma Johnson' },
];
export const personName = (initials?: string) => people.find((p) => p.initials === initials)?.name ?? initials ?? '';

const columns: Column[] = [
  { id: 'initial', label: 'Initial', color: 'var(--syn-color-secondary-silver-chalince)' },
  { id: 'progress', label: 'In Progress', color: 'var(--syn-color-secondary-amber)' },
  { id: 'done', label: 'Done', color: 'var(--syn-color-success-mantis)', done: true },
  { id: 'finished', label: 'Finished', color: 'var(--syn-color-white-white)', done: true },
];

export const boards: Board[] = [
  { id: 'bremen', name: 'Bremen Board', columns },
  { id: 'berlin', name: 'Berlin Board', columns },
];

/** A date `days` from today at 16:45, so the due labels (Tomorrow, Due Today, Overdue …) stay live. */
const at = (days: number, h = 16, m = 45) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const volvo = (photo: string) => ({ name: 'Volvo F509', number: '118874455', photo });
const halensee = { name: 'Halensee Roadworks', city: 'Bremen', kind: 'project' as const };
const lagerplatz = { name: 'Bremen Lagerplatz', city: 'Bremen', kind: 'warehouse' as const };
const lorem = 'A thorough damage investigation is essential for accurate claims processing. It generally outlines: Characteristics of the item';
const base = { description: `${lorem} ${lorem}`, ticket: 'DR-12457', attachments: 2, comments: 8, createdBy: 'Max Mustermann', createdAt: at(-14, 9, 30), resourceTotal: 440 };

export const initialTasks: Task[] = [
  { ...base, id: 't1', title: 'inventorysation', column: 'initial', done: false, hours: 8, priority: 'blocker' },
  {
    ...base, id: 't2', title: 'Engine check', column: 'initial', done: false, due: at(2), location: halensee,
    insurance: 'not-relevant', priority: 'blocker', condition: 'cant-work', tags: allTags,
  },
  {
    ...base, id: 't3', title: 'Engine check', column: 'progress', done: false, equipment: volvo(damage1), due: at(1),
    location: halensee, insurance: 'no', hours: 8, priority: 'low', condition: 'can-work', assignee: 'M.M',
  },
  {
    ...base, id: 't4', title: 'Engine check', column: 'progress', done: true, equipment: volvo(damage2), due: at(0, 18, 0),
    location: lagerplatz, insurance: 'no', hours: 8, priority: 'medium', condition: 'can-work', assignee: 'M.M',
  },
  {
    ...base, id: 't5', title: 'Engine check', column: 'progress', done: true, equipment: volvo(damage3), due: at(-3),
    location: halensee, insurance: 'yes', hours: 8, priority: 'high', condition: 'destroyed', tags: allTags,
  },
  {
    ...base, id: 't6', title: 'Engine check', column: 'done', done: true, equipment: volvo(damage1), due: at(-13), tookDays: 13,
    location: halensee, insurance: 'no', hours: 8, priority: 'medium', condition: 'can-work', tags: allTags, assignee: 'M.M', collaborators: ['A.S', 'L.M'],
  },
  {
    ...base, id: 't7', title: 'Engine check', column: 'finished', done: true, equipment: volvo(damage2), due: at(-13), tookDays: 13,
    location: halensee, insurance: 'no', hours: 8, priority: 'medium', condition: 'can-work', tags: allTags, assignee: 'M.M',
  },
];

/** The task a colleague adds while the board is open (Figma toast "Added Tire Rotation Problem"). */
export const incomingTask: Task = {
  ...base, id: 't-incoming', title: 'Tire Rotation Problem', column: 'initial', done: false, due: at(4),
  location: lagerplatz, insurance: 'no', priority: 'medium', condition: 'can-work', createdBy: 'Anna Schmidt', createdAt: new Date().toISOString(),
};

/** The empty ticket of "Create ticket" (946:12390). */
export const blankTask = (id: string, ticket: string, column: string): Task => ({
  id, title: '', description: '', ticket, column, done: false, attachments: 0, comments: 0,
  createdBy: 'Max Mustermann', createdAt: new Date().toISOString(),
});

/** An archived ticket: the ticket as it was, who archived it and when (Figma 8378:31073). */
export interface ArchivedItem { task: Task; by: string; at: string }

const archivedTask = (id: string, title: string, ticket: string, equipment: string, done: boolean): Task => ({
  ...base, id, title, ticket, column: done ? 'done' : 'progress', done, equipment: { name: equipment, number: '118874455', photo: damage1 },
  due: at(-20), location: halensee, insurance: 'yes', priority: 'blocker', condition: 'cant-work', tags: allTags, assignee: 'M.M',
});

export const initialArchive: ArchivedItem[] = [
  { task: archivedTask('a1', 'Tire Title Rotation', 'TR-67890', 'Honda Accord', true), by: 'Max Mustermann', at: '01.01.2029' },
  { task: archivedTask('a2', 'Brake Pad Replacement', 'BP-12345', 'Toyota Camry', false), by: 'Jane Doe', at: '02.15.2029' },
  { task: archivedTask('a3', 'Oil Change', 'OC-98765', 'Ford Fusion', true), by: 'John Smith', at: '03.10.2029' },
  { task: archivedTask('a4', 'Battery Check', 'BC-54321', 'Nissan Altima', true), by: 'Emma Johnson', at: '04.05.2029' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "Mon,Feb 12 16:45", as the cards write it. */
export const cardDate = (iso: string) => {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]},${MONTHS[d.getMonth()]} ${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
/** "01.02.2026 14:48", as the drawer writes it. */
export const dottedDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export type DueTone = 'today' | 'soon' | 'later' | 'overdue' | 'took';

/** How a card words its due date: Due Today, (Tomorrow), (Due 2 day), (Overdue), or the days a done task took. */
export function dueState(task: Task, now = new Date()): { tone: DueTone; note: string } | null {
  if (!task.due) return null;
  if (task.done && task.tookDays !== undefined) return { tone: 'took', note: `( ${task.tookDays} days)` };
  const due = new Date(task.due);
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(due) - day(now)) / 86400000);
  if (diff === 0) return { tone: 'today', note: 'Due Today' };
  if (diff < 0) return { tone: 'overdue', note: '(Overdue)' };
  if (diff === 1) return { tone: 'soon', note: '(Tomorrow)' };
  return { tone: 'later', note: `(Due ${diff} day${diff === 1 ? '' : 's'})` };
}
