import { IconButton } from '@syn/design-system';

/**
 * A card's "open" chevron (Figma: 16px at the widget's top right; shown on hover per the Syn rule). Its label is
 * the built-in Syn tooltip, to the left so it stays inside the card.
 */
export function OpenLink({ label }: { label: string }) {
  return <IconButton icon="next" label={label} tooltipPlacement="left" className="ep-widget__open syn-card__open" />;
}
