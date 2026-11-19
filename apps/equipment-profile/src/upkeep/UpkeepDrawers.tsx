import { useEffect, useState } from 'react';
import { Button, Dialog, Icon, Select, TextField } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { ChoiceSwitch, DateField, FormSection, UploadField, type PickedFile } from '@sam/shared';
import {
  boardStatuses, boards, inspectionTypes, unitLabels, type InspectionStatus, type Maintenance, type MaintenanceUnit,
} from '../data/upkeep';

const typeOptions = inspectionTypes.map((t) => ({ value: t.id, label: t.label }));

function Footer({ onDiscard, onSubmit, canSubmit }: { onDiscard: () => void; onSubmit: () => void; canSubmit: boolean }) {
  return (
    <>
      <button type="button" className="ep-form-discard" onClick={onDiscard}>Discard</button>
      <Button className="ep-panel-drawer__submit" disabled={!canSubmit} onClick={onSubmit}>Submit</Button>
    </>
  );
}

export interface NewInspection {
  typeId: string;
  status: InspectionStatus;
  last: string;
  next: string;
  file: PickedFile | null;
}

/**
 * Figma "Add technical inspection" (14982:67637, 15585:51983, 15327:35826, 15585:52076): the type, Successfully /
 * Failed, the date it was done, the next one, and the report. Submit adds it to Past Technical inspection and the
 * next date to Upcoming.
 */
export function AddInspectionDrawer({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (i: NewInspection) => void }) {
  const empty: NewInspection = { typeId: '', status: 'successful', last: '', next: '', file: null };
  const [form, setForm] = useState(empty);
  useEffect(() => { if (open) setForm(empty); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof NewInspection>(k: K, v: NewInspection[K]) => setForm((f) => ({ ...f, [k]: v }));
  const ok = !!form.typeId && !!form.last && !!form.next;
  return (
    <PanelDrawer
      open={open} onClose={onClose} title="Add technical inspection" className="ep-upkeep-drawer"
      footer={<Footer onDiscard={onClose} canSubmit={ok} onSubmit={() => { onSubmit(form); onClose(); }} />}
    >
      <div className="ep-form">
        <FormSection label="Tech inspection type" required labelId="ep-ti-type-l">
          <Select label="Tech inspection type" size="sm" options={typeOptions} value={form.typeId} placeholder="Choose a type" onChange={(v) => set('typeId', v)} className="ep-field-320" />
        </FormSection>
        <FormSection label="Status" labelId="ep-ti-status-l">
          <ChoiceSwitch
            labelledBy="ep-ti-status-l" value={form.status} onChange={(v) => set('status', v)}
            options={[{ value: 'successful', label: 'Successfully' }, { value: 'failed', label: 'Failed' }]}
            tones={{ successful: 'success', failed: 'pending' }}
          />
        </FormSection>
        <FormSection label="Last tech inspection" required labelId="ep-ti-last-l">
          <DateField id="ep-ti-last" labelledBy="ep-ti-last-l" value={form.last} onChange={(v) => set('last', v)} />
        </FormSection>
        <FormSection label="Next tech inspection" required labelId="ep-ti-next-l">
          <DateField id="ep-ti-next" labelledBy="ep-ti-next-l" value={form.next} onChange={(v) => set('next', v)} />
        </FormSection>
        <FormSection label="File" labelId="ep-ti-file-l">
          <UploadField file={form.file} onChange={(f) => set('file', f)} className="ep-field-320" labelledBy="ep-ti-file-l" />
        </FormSection>
      </div>
    </PanelDrawer>
  );
}

/** Figma "Edit technical inspection" (15366:48773): the type and the next date of an upcoming inspection. */
export function EditInspectionDrawer({ value, onClose, onSubmit }: {
  value: { typeId: string; date: string } | null; onClose: () => void; onSubmit: (v: { typeId: string; date: string }) => void;
}) {
  const [form, setForm] = useState({ typeId: '', date: '' });
  useEffect(() => { if (value) setForm(value); }, [value]);
  const changed = !!value && (form.typeId !== value.typeId || form.date !== value.date);
  return (
    <PanelDrawer
      open={!!value} onClose={onClose} title="Edit technical inspection" className="ep-upkeep-drawer"
      footer={<Footer onDiscard={onClose} canSubmit={changed && !!form.typeId && !!form.date} onSubmit={() => { onSubmit(form); onClose(); }} />}
    >
      <div className="ep-form">
        <FormSection label="Tech inspection type" required>
          <Select label="Tech inspection type" size="sm" options={typeOptions} value={form.typeId} onChange={(v) => setForm((f) => ({ ...f, typeId: v }))} className="ep-field-320" />
        </FormSection>
        <FormSection label="Next tech inspection" required labelId="ep-te-next-l">
          <DateField id="ep-te-next" labelledBy="ep-te-next-l" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
        </FormSection>
      </div>
    </PanelDrawer>
  );
}

/** A count with its unit at the end (Figma: "Count … h"). */
function CountField({ label, value, onChange, unit, className }: { label: string; value: string; onChange: (v: string) => void; unit: string; className?: string }) {
  return (
    <TextField
      label={label} hideLabel size="sm" inputMode="numeric" placeholder="Count" value={value}
      onChange={(e) => onChange(e.currentTarget.value.replace(/[^\d]/g, ''))}
      suffix={<span className="ep-count-unit">{unit}</span>} className={className ? `ep-count ${className}` : 'ep-count'}
    />
  );
}

export interface MaintenanceForm {
  name: string;
  unit: MaintenanceUnit;
  interval: string;
  /** "Add one time rule": a different interval for the next time only. */
  once: string | null;
  notify: string;
  board: string;
  status: string;
}

/**
 * Figma "Add Maintenance" (16267:80797, 16267:80482, 16330:7955, 16267:80597): name, what the interval counts,
 * the interval, an optional one-time rule. With a tracker, "For …" sets the reminder (notify me before, the board
 * and column of the workshop ticket). Without one, the No Telematic Device banner says what is not automatic.
 */
export function MaintenanceDrawer({ open, edit, hasTracker, onClose, onSubmit }: {
  open: boolean; edit?: Maintenance | null; hasTracker: boolean; onClose: () => void; onSubmit: (m: MaintenanceForm) => void;
}) {
  const empty: MaintenanceForm = { name: '', unit: 'hours', interval: '', once: null, notify: '', board: 'bremen', status: 'progress' };
  const [form, setForm] = useState(empty);
  useEffect(() => {
    if (!open) return;
    setForm(edit ? { ...empty, name: edit.name, unit: edit.unit, interval: String(edit.interval) } : empty);
  }, [open, edit]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof MaintenanceForm>(k: K, v: MaintenanceForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const unit = unitLabels[form.unit];
  const ok = !!form.name.trim() && !!form.interval;
  return (
    <PanelDrawer
      open={open} onClose={onClose} title={edit ? 'Edit Maintenance' : 'Add Maintenance'} className="ep-upkeep-drawer"
      footer={<Footer onDiscard={onClose} canSubmit={ok} onSubmit={() => { onSubmit(form); onClose(); }} />}
    >
      <div className="ep-form">
        {!hasTracker && (
          <div className="ep-notel" role="note">
            <div className="ep-notel__top">
              <span className="ep-notel__art"><Icon name="no-connection" size={36} /></span>
              <div className="ep-notel__text">
                <p className="ep-notel__title">No Telematic Device Attached</p>
                <p className="ep-notel__body">This equipment does not have a tracker device attached. While you can still manually add maintenance records, automated features are unavailable.</p>
              </div>
            </div>
            <div className="ep-notel__bottom">
              <p className="ep-notel__fact"><Icon name="info-circle" size={16} /> Working Hours and Kilometers driven maintenances won’t be calculated automatically.</p>
              <div className="ep-notel__action">
                <Button size="sm" variant="brand" iconStart="plus-in-circle">Request Device</Button>
              </div>
            </div>
          </div>
        )}
        <FormSection label="Name" required htmlFor="ep-mt-name">
          <TextField id="ep-mt-name" label="Name" hideLabel size="sm" placeholder="E.g. Oil Change" value={form.name} onChange={(e) => set('name', e.currentTarget.value)} />
        </FormSection>
        <FormSection label="Type" labelId="ep-mt-type-l">
          <ChoiceSwitch
            labelledBy="ep-mt-type-l" value={form.unit} onChange={(v) => set('unit', v)}
            options={(Object.keys(unitLabels) as MaintenanceUnit[]).map((u) => ({ value: u, label: unitLabels[u].type }))}
          />
        </FormSection>
        <FormSection label="Interval" required>
          <CountField label="Interval" value={form.interval} onChange={(v) => set('interval', v)} unit={unit.short} className="ep-field-320" />
        </FormSection>
        {hasTracker && (
          <div className="ep-notify">
            <p className="ep-notify__head">For {unit.type}</p>
            <div className="ep-notify__body">
              <div className="ep-notify__field">
                <span className="ep-notify__label">Notify me before</span>
                <CountField label="Notify me before" value={form.notify} onChange={(v) => set('notify', v)} unit={unit.short} />
              </div>
              <div className="ep-notify__pair">
                <div className="ep-notify__field">
                  <span className="ep-notify__label">Board</span>
                  <Select label="Board" size="sm" options={boards} value={form.board} onChange={(v) => set('board', v)} />
                </div>
                <div className="ep-notify__field">
                  <span className="ep-notify__label">Board Status</span>
                  <Select label="Board Status" size="sm" options={boardStatuses} value={form.status} onChange={(v) => set('status', v)} />
                </div>
              </div>
            </div>
          </div>
        )}
        {form.once === null ? (
          <button type="button" className="ep-add-rule" onClick={() => set('once', '')}>
            <Icon name="plus" size={14} /> Add one time rule
          </button>
        ) : (
          <FormSection
            label={<>One time interval <span className="ep-form-section__muted">(Next)</span></>}
            aside={<button type="button" className="ep-rule-remove" aria-label="Remove the one time rule" onClick={() => set('once', null)}><Icon name="trash-bin" size={16} /></button>}
          >
            <CountField label="One time interval (Next)" value={form.once} onChange={(v) => set('once', v)} unit={unit.short} className="ep-field-320" />
          </FormSection>
        )}
      </div>
    </PanelDrawer>
  );
}

/**
 * Figma "Resolve Maintenance" (16267:83506): resolving starts the next one with the interval shown (editable), or
 * only resolves this one.
 */
export function ResolveDialog({ item, onClose, onResolve }: {
  item: Maintenance | null; onClose: () => void; onResolve: (item: Maintenance, nextInterval: number | null) => void;
}) {
  const [interval, setInterval] = useState('');
  useEffect(() => { if (item) setInterval(String(item.interval)); }, [item]);
  return (
    <Dialog
      open={!!item} onClose={onClose} title="Resolve Maintenance" icon={null} className="ep-resolve"
      actions={item && (
        <div className="ep-resolve__actions">
          <Button size="lg" variant="brand" fullWidth disabled={!interval} onClick={() => { onResolve(item, Number(interval)); onClose(); }}>Resolve and create new</Button>
          <Button size="lg" variant="secondary" fullWidth onClick={() => { onResolve(item, null); onClose(); }}>Only resolve this, and don’t create new</Button>
        </div>
      )}
    >
      {item && (
        <div className="ep-resolve__body">
          <p className="ep-resolve__text">Resolving this maintenance will create new one</p>
          <FormSection label="Interval" htmlFor="ep-resolve-interval">
            <TextField
              id="ep-resolve-interval" label="Interval" hideLabel size="sm" inputMode="numeric" value={interval}
              onChange={(e) => setInterval(e.currentTarget.value.replace(/[^\d]/g, ''))}
              suffix={<span className="ep-count-unit">{unitLabels[item.unit].short}</span>} className="ep-count"
            />
          </FormSection>
        </div>
      )}
    </Dialog>
  );
}
