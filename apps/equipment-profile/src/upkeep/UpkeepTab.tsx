import { useState } from 'react';
import { Card, EmptyState, Icon, IconButton, Segmented } from '@syn/design-system';
import { ActionMenu } from '@sam/shared';
import { dotted, dateOf } from '@sam/shared';
import { useEmptyDemo } from '../shared/useEmptyDemo';
import {
  currentPerson, inspectionTypes, maintenanceHistory, pastInspections, unitLabels, upcomingInspections, upcomingMaintenance,
  type Maintenance, type PastInspection, type UpcomingInspection,
} from '../data/upkeep';
import { AddInspectionDrawer, EditInspectionDrawer, MaintenanceDrawer, ResolveDialog, type MaintenanceForm, type NewInspection } from './UpkeepDrawers';
import './Upkeep.css';

const typeLabel = (id: string) => inspectionTypes.find((t) => t.id === id)?.label ?? id;
const templateOf = (id: string) => inspectionTypes.find((t) => t.id === id)?.template ?? '';
const fmt = (n: number) => String(n);
let seq = 0;
const newId = (p: string) => `${p}-new-${++seq}`;

/** Days a date lies in the past (0 when it is today or later). */
function overdueDays(iso: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - dateOf(iso).getTime()) / 86_400_000));
}

/** Figma date chip: Cultured edge; Honey with a warning sign and "Overdue n days" once the date has passed. */
function DueChip({ iso }: { iso: string }) {
  const late = overdueDays(iso);
  return (
    <span className={late ? 'ep-due is-late' : 'ep-due'}>
      {late > 0 && <Icon name="warning" size={12} className="ep-due__icon" />}
      <span>{dotted(iso)}</span>
      {late > 0 && <span className="ep-due__late">Overdue {late} {late === 1 ? 'day' : 'days'}</span>}
    </span>
  );
}

function OverdueChip({ days }: { days: number }) {
  return (
    <span className="ep-due is-late is-bare">
      <Icon name="warning" size={12} className="ep-due__icon" />
      <span className="ep-due__late">Overdue {days} {days === 1 ? 'day' : 'days'}</span>
    </span>
  );
}

/** A count and its unit in Silver Chalice ("365 Days"). */
function Amount({ value, unit }: { value: number; unit: string }) {
  return <span className="ep-amount">{fmt(value)} <span className="ep-amount__unit">{unit}</span></span>;
}

/** Figma "Upcoming Technical inspection" item: the type (Title 3), the actions, Date and its chip, the checklist art. */
function UpcomingItem({ item, onEdit, onDelete }: { item: UpcomingInspection; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className="ep-upcoming__item">
      <div className="ep-upcoming__top">
        <p className="ep-upcoming__name">{typeLabel(item.typeId)}</p>
        <ActionMenu
          label={`Actions for ${typeLabel(item.typeId)}`}
          actions={[{ id: 'edit', label: 'Edit', icon: 'edit', onSelect: onEdit }, { id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: onDelete }]}
        />
      </div>
      <div className="ep-upcoming__date">
        <span className="ep-upcoming__label">Date</span>
        <DueChip iso={item.date} />
      </div>
      <Icon name="teckcheck" size={40} className="ep-upcoming__art" />
    </li>
  );
}

function StatusCell({ status }: { status: PastInspection['status'] }) {
  return status === 'successful'
    ? <span className="ep-status is-ok"><Icon name="check-in-circle" size={14} />Successful</span>
    : <span className="ep-status is-failed"><Icon name="x-in-circle" size={14} />Failed</span>;
}

/**
 * Upkeep tab (Figma 14948:43661 Upcoming and 14966:65592 History): Workshop, the upcoming and past technical
 * inspections, and the maintenance plan with its history.
 */
export function UpkeepTab() {
  const noTracker = useEmptyDemo();
  const [upcoming, setUpcoming] = useState(upcomingInspections);
  const [past, setPast] = useState(pastInspections);
  const [plan, setPlan] = useState(upcomingMaintenance);
  const [done, setDone] = useState(maintenanceHistory);
  const [view, setView] = useState<'upcoming' | 'history'>('upcoming');
  const [mail, setMail] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UpcomingInspection | null>(null);
  const [maintOpen, setMaintOpen] = useState(false);
  const [maintEdit, setMaintEdit] = useState<Maintenance | null>(null);
  const [resolving, setResolving] = useState<Maintenance | null>(null);

  const addInspection = (i: NewInspection) => {
    setPast((p) => [{ id: newId('p'), typeId: i.typeId, status: i.status, date: i.last, examiner: currentPerson, file: i.file ?? undefined }, ...p]);
    if (i.next) setUpcoming((u) => [...u, { id: newId('u'), typeId: i.typeId, date: i.next }].sort((a, b) => a.date.localeCompare(b.date)));
  };
  const saveMaintenance = (f: MaintenanceForm) => {
    const interval = Number(f.interval);
    if (maintEdit) {
      setPlan((p) => p.map((m) => (m.id === maintEdit.id ? { ...m, name: f.name.trim(), unit: f.unit, interval, left: Math.min(m.left, interval) } : m)));
    } else {
      setPlan((p) => [...p, { id: newId('m'), name: f.name.trim(), unit: f.unit, interval, left: f.once ? Number(f.once) || interval : interval }]);
    }
  };
  const resolve = (m: Maintenance, next: number | null) => {
    setDone((d) => [{ ...m, id: newId('h'), resolvedAt: m.interval - m.left + (m.unit === 'days' ? m.overdueDays ?? 0 : 0), resolvedBy: currentPerson }, ...d]);
    setPlan((p) => {
      const rest = p.filter((x) => x.id !== m.id);
      return next ? [...rest, { id: newId('m'), name: m.name, unit: m.unit, interval: next, left: next }] : rest;
    });
  };

  return (
    <div className="ep-upkeep">
      <Card title="Workshop" className="ep-upkeep-card ep-upkeep__workshop">
        <div className="ep-upkeep__well">
          <EmptyState icon="empty-state">List is empty</EmptyState>
        </div>
      </Card>

      <div className="ep-upkeep__inspections">
        <Card
          title="Upcoming Technical inspection"
          className="ep-upkeep-card ep-upcoming"
          actions={(
            <>
              <IconButton
                icon="mail" label="Email reminders" size="xs" variant="outline" aria-pressed={mail}
                className={mail ? 'ep-upkeep__mail is-on' : 'ep-upkeep__mail'} onClick={() => setMail((m) => !m)}
                tooltip={mail ? 'Email reminders are on' : 'Email reminders are off'}
              />
              <IconButton icon="plus-in-circle" label="Add technical inspection" size="xs" className="ep-upkeep__add" onClick={() => setAdding(true)} />
            </>
          )}
        >
          <div className="ep-upkeep__well ep-upcoming__well">
            {upcoming.length ? (
              <ul className="ep-upcoming__list">
                {upcoming.map((u) => (
                  <UpcomingItem key={u.id} item={u} onEdit={() => setEditing(u)} onDelete={() => setUpcoming((x) => x.filter((y) => y.id !== u.id))} />
                ))}
              </ul>
            ) : <EmptyState icon="teckcheck">No inspections planned</EmptyState>}
          </div>
        </Card>

        <Card title="Past Technical inspection" className="ep-upkeep-card ep-past">
          <div className="ep-table-wrap" tabIndex={0} role="region" aria-label="Past technical inspections">
            <table className="ep-table ep-past__table">
              <thead>
                <tr>
                  <th scope="col">Type</th><th scope="col">Template</th><th scope="col" className="w-120">Status</th>
                  <th scope="col" className="w-120">Date</th><th scope="col" className="w-220">Examiner</th>
                  <th scope="col" className="w-120">File</th><th scope="col" className="w-64"><span className="ep-sr">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {past.map((p) => (
                  <tr key={p.id}>
                    <td><span className="ep-cell-clip" title={typeLabel(p.typeId)}>{typeLabel(p.typeId)}</span></td>
                    <td>{templateOf(p.typeId)}</td>
                    <td><StatusCell status={p.status} /></td>
                    <td>{dotted(p.date)}</td>
                    <td>{p.examiner}</td>
                    <td>
                      {p.file
                        ? <a className="ep-pdf" href="#" onClick={(e) => e.preventDefault()} title={`${p.file.name} (${p.file.size})`}>PDF</a>
                        : (
                          <label className="ep-pdf-add" title="Upload the report">
                            <Icon name="plus-in-circle" size={16} />
                            <input
                              type="file" accept=".pdf" className="ep-sr" aria-label={`Upload the report for ${typeLabel(p.typeId)}, ${dotted(p.date)}`}
                              onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) setPast((x) => x.map((y) => (y.id === p.id ? { ...y, file: { name: f.name, size: `${Math.round(f.size / 1024)} KB` } } : y))); }}
                            />
                          </label>
                        )}
                    </td>
                    <td className="ep-table__actions">
                      <ActionMenu label={`Actions for ${typeLabel(p.typeId)}, ${dotted(p.date)}`} actions={[{ id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => setPast((x) => x.filter((y) => y.id !== p.id)) }]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card
        title="Maintenance"
        className="ep-upkeep-card ep-maint"
        actions={<IconButton icon="plus-in-circle" label="Add maintenance" size="xs" className="ep-upkeep__add" onClick={() => { setMaintEdit(null); setMaintOpen(true); }} />}
      >
        <Segmented
          label="Maintenance" className="ep-switcher" value={view} onChange={(v) => setView(v as typeof view)}
          options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'history', label: 'History' }]}
        />
        <div className="ep-table-wrap" tabIndex={0} role="region" aria-label={view === 'upcoming' ? 'Upcoming maintenance' : 'Maintenance history'}>
          <table className="ep-table ep-maint__table">
            <thead>
              {view === 'upcoming' ? (
                <tr><th scope="col">Name</th><th scope="col">interval</th><th scope="col">Left</th><th scope="col" className="w-64"><span className="ep-sr">Actions</span></th></tr>
              ) : (
                <tr><th scope="col">Name</th><th scope="col">interval</th><th scope="col">Resolved at</th><th scope="col">Resolved by</th><th scope="col" className="w-64"><span className="ep-sr">Actions</span></th></tr>
              )}
            </thead>
            <tbody>
              {view === 'upcoming' ? plan.map((m) => (
                <tr key={m.id} className={m.overdueDays ? 'is-late' : undefined}>
                  <td>
                    <span className="ep-maint__name">
                      <button type="button" className="ep-resolve-check" aria-label={`Resolve ${m.name}`} onClick={() => setResolving(m)}>
                        <Icon name="check" size={12} />
                      </button>
                      {m.name}
                    </span>
                  </td>
                  <td><Amount value={m.interval} unit={unitLabels[m.unit].long} /></td>
                  <td>
                    {m.overdueDays
                      ? <span className="ep-maint__left">0 <OverdueChip days={m.overdueDays} /></span>
                      : <Amount value={m.left} unit={unitLabels[m.unit].long} />}
                  </td>
                  <td className="ep-table__actions">
                    <ActionMenu
                      label={`Actions for ${m.name}`}
                      actions={[
                        { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => { setMaintEdit(m); setMaintOpen(true); } },
                        { id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => setPlan((p) => p.filter((x) => x.id !== m.id)) },
                      ]}
                    />
                  </td>
                </tr>
              )) : done.map((m) => (
                <tr key={m.id}>
                  <td><span className="ep-maint__name"><span className="ep-resolved-check" aria-hidden><Icon name="check" size={12} /></span>{m.name}</span></td>
                  <td><Amount value={m.interval} unit={unitLabels[m.unit].long} /></td>
                  <td><Amount value={m.resolvedAt ?? 0} unit={unitLabels[m.unit].long} /></td>
                  <td>{m.resolvedBy}</td>
                  <td className="ep-table__actions">
                    <ActionMenu label={`Actions for ${m.name}`} actions={[{ id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => setDone((d) => d.filter((x) => x.id !== m.id)) }]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddInspectionDrawer open={adding} onClose={() => setAdding(false)} onSubmit={addInspection} />
      <EditInspectionDrawer
        value={editing ? { typeId: editing.typeId, date: editing.date } : null}
        onClose={() => setEditing(null)}
        onSubmit={(v) => { const e = editing; if (e) setUpcoming((u) => u.map((x) => (x.id === e.id ? { ...x, ...v } : x)).sort((a, b) => a.date.localeCompare(b.date))); }}
      />
      <MaintenanceDrawer open={maintOpen} edit={maintEdit} hasTracker={!noTracker} onClose={() => setMaintOpen(false)} onSubmit={saveMaintenance} />
      <ResolveDialog item={resolving} onClose={() => setResolving(null)} onResolve={resolve} />
    </div>
  );
}
