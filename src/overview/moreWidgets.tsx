import { useState, type ReactNode } from 'react';
import { Card, FileItem, StatusBadge, type IconName } from '@syn/design-system';
import { InfoList } from './widgets';
import { InfoDrawer } from './InfoDrawer';
import { OpenLink } from '../shared/OpenLink';
import {
  bglInformation, calculationType, documents, equipmentDetails, maintenance, technicalChecks, workshopOrders,
  type CalcRow, type InfoGroup, type ScheduledItem,
} from '../data/equipment';

/* Widgets that "Manage Widgets" can add to the Overview. They follow the existing 450px Overview cards. */


/** An info card: its rows, and the chevron (shown on hover) that opens them in a drawer. */
export function InfoCard({ title, rows, open, children, className, groups }: {
  title: string; rows: Array<[string, string | null]>; open: string; children?: ReactNode; className?: string; groups?: InfoGroup[];
}) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Card title={title} actions={<OpenLink label={open} onClick={() => setShown(true)} />} className={className ? `ep-widget ${className}` : 'ep-widget'}>
        <div className="ep-info__body">{children ?? <InfoList rows={rows} />}</div>
      </Card>
      <InfoDrawer open={shown} onClose={() => setShown(false)} title={title} groups={groups ?? [{ title, rows }]} />
    </>
  );
}

export const EquipmentDetailsWidget = () => <InfoCard title="Equipment Details" rows={equipmentDetails} open="Open equipment details" />;
export const BglWidget = () => <InfoCard title="BGL Information" rows={bglInformation} open="Open BGL information" className="ep-info-card--short" />;

const calcText = (r: CalcRow) => (r.value === null ? null : r.unit ? `${r.value} ${r.unit}` : r.value);
/** Calculation type (owner's screenshot): the labels in Eerie Black, each value with its unit in Silver Chalice,
    and "Optional" over the optional rows. */
export function CalculationTypeWidget() {
  const row = (r: CalcRow) => (
    <div key={r.label} className="ep-info__row">
      <dt className="is-strong">{r.label}</dt>
      <dd className={r.value === null ? 'is-empty' : undefined}>{r.value ?? '--'}{r.unit && <span className="ep-info__unit"> {r.unit}</span>}</dd>
    </div>
  );
  return (
    <InfoCard
      title="Calculation type" open="Open calculation type"
      rows={[...calculationType.rows, ...calculationType.optional].map((r) => [r.label, calcText(r)] as [string, string | null])}
      groups={[
        { title: 'Calculation type', rows: calculationType.rows.map((r) => [r.label, calcText(r)]) },
        { title: 'Optional', rows: calculationType.optional.map((r) => [r.label, calcText(r)]) },
      ]}
    >
      <dl className="ep-info">
        {calculationType.rows.map(row)}
        <div className="ep-info__row ep-info__heading" role="presentation"><dt>Optional</dt></div>
        {calculationType.optional.map(row)}
      </dl>
    </InfoCard>
  );
}

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
