import { useSyncExternalStore } from 'react';

/**
 * The top bar's notifications (Figma 13147:57773 list, 13207:36438 empty, 17097:18601, 16686:65458 and 15926:55884
 * kinds). One store for the page: any app adds to it (Werkstatt when a colleague adds a ticket) and the bell reads it.
 * Mock data until the API exists.
 */
export interface SamNotification {
  id: string;
  /** Muted lead: "Updated", "Deleted", "Edited", "Added", "Technical inspection Created", … */
  verb: string;
  title: string;
  /** "(4 Equipment)" under the title (group transportation). */
  subtitle?: string;
  board?: string;
  ticket?: string;
  transporter?: string;
  by: string;
  /** ISO date and time. */
  at: string;
  read: boolean;
}

const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d.toISOString();
};

let items: SamNotification[] = [
  { id: 'n1', verb: 'Updated', title: 'Tire Rotation Problem', board: 'Bremen Board', ticket: 'DR-12457', by: 'Anna Schmidt', at: at(0, 9, 45), read: false },
  { id: 'n2', verb: 'Deleted', title: 'Brake System Check', board: 'Bremen Board', ticket: 'BR-98765', by: 'John Doe', at: at(0, 10, 30), read: false },
  { id: 'n3', verb: 'Technical inspection Created', title: 'Caterpillar 407f', board: 'Bremen Board', ticket: 'DR-12457', by: 'Anna Schmidt', at: at(1, 9, 45), read: true },
  { id: 'n4', verb: 'Group Transportation Confirmed', title: 'Group name', subtitle: '(4 Equipment)', transporter: 'ABC Transporter', by: 'Anna Schmidt', at: at(1, 9, 45), read: true },
  { id: 'n5', verb: 'Transportation Created', title: 'Caterpillar 407f', transporter: 'ABC Transporter', by: 'Anna Schmidt', at: at(1, 9, 45), read: true },
  { id: 'n6', verb: 'Edited', title: 'Oil Change', board: 'Bremen Board', ticket: 'OC-54321', by: 'Lisa Müller', at: at(2, 11, 15), read: true },
];
let enabled = true;
const listeners = new Set<() => void>();
const emit = () => { snapshot = { items, enabled }; listeners.forEach((l) => l()); };
let snapshot = { items, enabled };

export const notifications = {
  add(n: Omit<SamNotification, 'id' | 'read'>) { items = [{ ...n, id: `n-${Date.now()}`, read: false }, ...items]; emit(); },
  markRead(id: string) { items = items.map((n) => (n.id === id ? { ...n, read: true } : n)); emit(); },
  markAllRead() { items = items.map((n) => ({ ...n, read: true })); emit(); },
  setEnabled(on: boolean) { enabled = on; emit(); },
  clear() { items = []; emit(); },
};

export function useNotifications() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => snapshot,
  );
}
