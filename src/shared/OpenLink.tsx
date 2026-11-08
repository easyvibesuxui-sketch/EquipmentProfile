import { IconButton, Tooltip } from '@syn/design-system';

/**
 * A card's "open" chevron (Figma: 16px at the widget's top right; shown on hover per the Syn rule). It carries a
 * real tooltip with its label; Syn's IconButton native `title` is turned off so the two do not double up.
 */
export function OpenLink({ label }: { label: string }) {
  return (
    <Tooltip content={label} placement="left">
      <IconButton icon="next" label={label} title={undefined} className="ep-widget__open syn-card__open" />
    </Tooltip>
  );
}
