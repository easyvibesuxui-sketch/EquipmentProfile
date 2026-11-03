import { Button, EmptyState, Grid, GridItem } from '@syn/design-system';
import { DependenceWidget } from './widgets';
import { connectedIdOf, widgetById } from '../widgets/registry';
import type { WidgetLayout } from '../widgets/layout';
import './Overview.css';

/**
 * Overview tab of the equipment profile (Figma "Equipment Profile Home", 13767:3742). The widgets, their
 * order and visibility come from "Manage Widgets"; the defaults are the Figma page. One 12-column grid
 * with dense flow, so a row closes up when a widget is switched off.
 */
export function OverviewTab({ layout, onManage }: { layout: WidgetLayout; onManage: () => void }) {
  const hidden = new Set(layout.hidden);
  const visible = layout.order.filter((id) => !hidden.has(id));
  // Connected entities are rows of one Dependance card, placed where the first of them sits.
  const connected = visible.filter((id) => widgetById.get(id)?.category === 'connected');

  if (visible.length === 0) {
    return (
      <div className="ep-overview ep-overview__empty">
        <EmptyState action={<Button variant="secondary" size="sm" iconStart="settings" onClick={onManage}>Manage Widgets</Button>}>
          No widgets on the Overview
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="ep-overview">
      <Grid gap={24} className="ep-overview__grid">
        {visible.map((id) => {
          const w = widgetById.get(id)!;
          if (w.category === 'connected') {
            if (id !== connected[0]) return null;
            return (
              <GridItem key="dependance" span={w.size.span} className="ep-col ep-col--half">
                <DependenceWidget rows={connected.map(connectedIdOf)} />
              </GridItem>
            );
          }
          return (
            <GridItem key={id} span={w.size.span} className={`ep-col ep-col--${w.size.fit}`}>
              {w.render?.()}
            </GridItem>
          );
        })}
      </Grid>
    </div>
  );
}
