import type { CSSProperties } from 'react';
import './ColorDot.css';

export type ColorDotColor = 'success' | 'info' | 'violet' | 'rose' | 'orange' | 'brand';

const colors: Record<ColorDotColor, string> = {
  success: 'var(--syn-status-success)',
  info: 'var(--syn-status-info)',
  violet: 'var(--ep-dot-violet)',
  rose: 'var(--ep-dot-rose)',
  orange: 'var(--ep-dot-orange)',
  brand: 'var(--syn-action-brand)',
};

/**
 * Figma "Color Dot Default": a 16px white ring with a Silver Chalice border around a 12px colour dot.
 * With `size`, a plain dot of that size (the tag cards' 10px Dodger Blue dot).
 */
export function ColorDot({ color, size }: { color: ColorDotColor; size?: number }) {
  const style = { '--dot': colors[color], ...(size ? { width: size, height: size } : {}) } as CSSProperties;
  return <span aria-hidden className={size ? 'ep-dot ep-dot--plain' : 'ep-dot'} style={style} />;
}
