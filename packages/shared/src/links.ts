import type { AppLinks } from './layout/AppShell';

/**
 * The sidebar items that open another app of the monorepo. In development each app runs on its own port
 * (Equipment Profile 5173, Werkstatt 5174); a deployment sets VITE_PROFILE_URL and VITE_WERKSTATT_URL.
 */
export const appLinks: AppLinks = {
  planner: import.meta.env.VITE_PROFILE_URL ?? 'http://localhost:5173/',
  werkstatt: import.meta.env.VITE_WERKSTATT_URL ?? 'http://localhost:5174/',
};
