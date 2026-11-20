import type { CSSProperties } from 'react';

/** An icon cropped from the Figma frame, drawn as a mask so it takes the text colour. */
export function MaskIcon({ src, size, className }: { src: string; size: number | [number, number]; className?: string }) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const style = { '--mask': `url("${src}")`, width: w, height: h } as CSSProperties;
  return <span aria-hidden className={['ep-mask-icon', className].filter(Boolean).join(' ')} style={style} />;
}
