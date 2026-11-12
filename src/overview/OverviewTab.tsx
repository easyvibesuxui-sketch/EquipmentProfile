import type { CSSProperties } from 'react';
import { Button, EmptyState, Grid, GridItem, type GridItemProps } from '@syn/design-system';
import { DependenceWidget } from './widgets';
import { connectedIdOf, widgetById } from '../widgets/registry';
import { CONNECTED, fitOf, heightOf, spanOf, visibleCards, visibleConnected, type WidgetLayout } from '../widgets/layout';
import { EditGrid } from '../widgets/EditMode';
import './Overview.css';

interface Props {
  layout: WidgetLayout;
  /** Edit Mode: the layout is the draft and the grid can be edited. */
  editing?: boolean;
  onChange?: (layout: WidgetLayout) => void;
  /** Opens Edit Mode; from the empty Overview it also opens Manage Widgets. */
  onEdit: () => void;
  onAddWidget?: () => void;
}

/**
 * Overview tab of the equipment profile (Figma "Equipment Profile Home", 13767:3742). The cards, their order,
 * widths and visibility come from the widget layout (Edit Mode and Manage Widgets); the defaults are the Figma
 * page. One 12-column grid with dense flow, so a row closes up when a widget is switched off.
 */
export function OverviewTab({ layout, editing, onChange, onEdit, onAddWidget }: Props) {
  const cards = visibleCards(layout);
  // `fill`: the height the widget gets (Edit Mode: its rows under the bar); else a height set in Edit Mode.
  // With a height the card fills it (lists scroll, maps and slots stretch).
  const render = (card: string, fill?: number) => {
    const node = card === CONNECTED
      ? <DependenceWidget rows={visibleConnected(layout).map(connectedIdOf)} />
      : widgetById.get(card)?.render?.();
    const h = fill ?? heightOf(layout, card);
    return h ? <div className="ep-sized" style={{ '--ep-h': `${h}px` } as CSSProperties}>{node}</div> : node;
  };
  const labelOf = (card: string) => (card === CONNECTED ? 'Dependance' : widgetById.get(card)?.label ?? card);

  if (editing && onChange) {
    return (
      <div className="ep-overview">
        <EditGrid layout={layout} onChange={onChange} render={render} labelOf={labelOf} onAdd={() => onAddWidget?.()} />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="ep-overview ep-overview__empty">
        {/* Zero state: what belongs here, why, and one action (Edit Mode with Manage Widgets open). */}
        <EmptyState action={<Button size="sm" iconStart="plus-in-circle" onClick={onEdit}>Add widgets</Button>}>
          <span className="ep-overview__empty-title">No widgets on the Overview</span>
          <span className="ep-overview__empty-hint">Add widgets to see this machine's location, usage and history at a glance.</span>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="ep-overview">
      <Grid gap={24} className="ep-overview__grid">
        {cards.map((card) => {
          const span = spanOf(layout, card);
          return (
            <GridItem key={card} span={span as GridItemProps['span']} className={`ep-col ep-col--${fitOf(span)}`}>
              {render(card)}
            </GridItem>
          );
        })}
      </Grid>
    </div>
  );
}
