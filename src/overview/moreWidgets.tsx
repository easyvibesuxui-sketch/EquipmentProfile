import { Card, FileItem, IconButton, StatusBadge, type IconName } from '@syn/design-system';
import { InfoList } from './widgets';
import {
  bglInformation, calculationType, documents, equipmentDetails, maintenance, technicalChecks, workshopOrders, type ScheduledItem,
} from '../data/equipment';

/* Widgets that "Manage Widgets" can add to the Overview. They follow the existing 450px Overview cards. */

const OpenLink = ({ label }: { label: string }) => <IconButton icon="next" label={label} className="ep-widget__open" />;

function InfoCard({ title, rows, open }: { title: string; rows: Array<[string, string | null]>; open: string }) {
  return (
    <Card title={title} actions={<OpenLink label={open} />} className="ep-widget">
      <div className="ep-info__body"><InfoList rows={rows} /></div>
    </Card>
  );
}

export const EquipmentDetailsWidget = () => <InfoCard title="Equipment Details" rows={equipmentDetails} open="Open equipment details" />;
export const CalculationTypeWidget = () => <InfoCard title="Calculation type" rows={calculationType} open="Open calculation" />;
export const BglWidget = () => <InfoCard title="BGL Information" rows={bglInformation} open="Open BGL information" />;

export function FilesWidget({ kind }: { kind: keyof typeof documents }) {
  const { title, files } = documents[kind];
  return (
    <Card title={title} actions={<OpenLink label={`Open ${title.toLowerCase()}`} />} className="ep-widget">
      <ul className="ep-files">
        {files.map((f) => (
          <li key={f.name}><FileItem name={f.name} meta={f.meta} icon={`file-formats-${f.format}` as IconName} /></li>
        ))}
      </ul>
    </Card>
  );
}

function ScheduleList({ items }: { items: ScheduledItem[] }) {
  return (
    <ul className="ep-schedule">
      {items.map((it) => (
        <li key={it.name} className="ep-schedule__row">
          <span className="ep-schedule__text">
            <span className="ep-schedule__name syn-title-text">{it.name}</span>
            <span className="ep-schedule__date">{it.date}</span>
          </span>
          <StatusBadge tone={it.tone}>{it.status}</StatusBadge>
        </li>
      ))}
    </ul>
  );
}

export function TechnicalChecksWidget() {
  return (
    <Card title="Technical Checks" actions={<OpenLink label="Open technical checks" />} className="ep-widget">
      <ScheduleList items={technicalChecks} />
    </Card>
  );
}

export function WorkshopWidget() {
  return (
    <Card title="Workshop" actions={<OpenLink label="Open workshop" />} className="ep-widget">
      <ScheduleList items={workshopOrders} />
    </Card>
  );
}

export function MaintenanceWidget() {
  const { next, items } = maintenance;
  return (
    <Card title="Maintenance" actions={<OpenLink label="Open maintenance" />} className="ep-widget">
      <div className="ep-maint">
        <div className="ep-maint__next">
          <span className="ep-schedule__date">Next service</span>
          <span className="ep-maint__name syn-title-text">{next.name}</span>
          <span className="ep-schedule__date">{next.due} · at {next.at}</span>
        </div>
        <ScheduleList items={items} />
      </div>
    </Card>
  );
}
