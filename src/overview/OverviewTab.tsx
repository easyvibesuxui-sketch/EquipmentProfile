import { Grid, GridItem } from '@syn/design-system';
import {
  CheckInsWidget, DependenceWidget, HistoryWidget, IdentificationsWidget, SpecificationsWidget,
} from './widgets';
import { LocationWidget } from './LocationWidget';
import { DistanceWidget, OperatingHoursWidget, OperationByHourWidget } from './charts';
import './Overview.css';

/** Overview tab of the equipment profile (Figma "Equipment Profile Home", 13767:3742). */
export function OverviewTab() {
  return (
    <div className="ep-overview">
      <Grid gap={24}>
        <GridItem span={3} className="ep-col ep-col--half"><SpecificationsWidget /></GridItem>
        <GridItem span={6} className="ep-col ep-col--wide"><LocationWidget /></GridItem>
        <GridItem span={3} className="ep-col ep-col--half"><IdentificationsWidget /></GridItem>
      </Grid>
      <Grid gap={24}>
        <GridItem span={3} className="ep-col ep-col--half"><DependenceWidget /></GridItem>
        <GridItem span={5} className="ep-col ep-col--wide"><CheckInsWidget /></GridItem>
        <GridItem span={4} className="ep-col ep-col--half"><HistoryWidget /></GridItem>
      </Grid>
      <OperatingHoursWidget />
      <OperationByHourWidget />
      <DistanceWidget />
    </div>
  );
}
