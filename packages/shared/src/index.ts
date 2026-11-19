/**
 * @sam/shared: the parts every SAM app uses: the shell (sidebar and top bar), the "..." action menu, the form
 * parts of the drawers and the date range picker. App-level for now; some could move to Syn later.
 * Import '@sam/shared/setup' once in an app's main.tsx.
 */
export * from './layout/AppShell';
export * from './ActionMenu';
export * from './forms';
export * from './DateRangePicker';
export { appLinks } from './links';
