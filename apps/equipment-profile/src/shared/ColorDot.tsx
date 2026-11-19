import { ColorDot as SynColorDot } from '@syn/design-system';

export type ColorDotColor = 'success' | 'info' | 'violet' | 'rose' | 'orange' | 'brand' | 'idle' | 'amber';

const colors: Record<ColorDotColor, string> = {
  success: 'var(--syn-status-success)',
  info: 'var(--syn-status-info)',
  violet: 'var(--ep-dot-violet)',
  rose: 'var(--ep-dot-rose)',
  orange: 'var(--ep-dot-orange)',
  brand: 'var(--syn-action-brand)',
  idle: 'var(--syn-text-disabled)',
  amber: 'var(--syn-color-secondary-amber)',
};

/** Syn's shared ColorDot (Figma "Color Dot Default") with the app's named colours. `size` gives the plain dot. */
export function ColorDot({ color, size }: { color: ColorDotColor; size?: number }) {
  return <SynColorDot color={colors[color]} variant={size ? 'plain' : 'ring'} size={size} />;
}
