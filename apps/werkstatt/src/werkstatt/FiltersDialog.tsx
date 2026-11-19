import { useEffect, useState } from 'react';
import { Button, Dialog, Select } from '@syn/design-system';
import { ChoiceSwitch, DateField, FormSection } from '@sam/shared';
import { people, priorities, type Priority } from '../data/werkstatt';

export interface BoardFilters {
  priority: Priority | '';
  completion: '' | 'open' | 'done';
  assigned: string;
  createdBy: string;
  checkInKind: 'project' | 'warehouse';
  checkIn: string;
  /** ISO day; tasks due on or before it. */
  due: string;
}
export const noFilters: BoardFilters = { priority: '', completion: '', assigned: '', createdBy: '', checkInKind: 'project', checkIn: '', due: '' };
/** How many filters are set (the Check-in kind alone is not a filter). */
export const activeFilters = (f: BoardFilters) => [f.priority, f.completion, f.assigned, f.createdBy, f.checkIn, f.due].filter(Boolean).length;

const places = {
  project: [{ value: 'Halensee Roadworks', label: 'Halensee Roadworks' }],
  warehouse: [{ value: 'Bremen Lagerplatz', label: 'Bremen Lagerplatz' }],
};

/**
 * Figma "Filters pop up" (10909:24466), opened by the filter button of the board: Priority, Completion,
 * Assigned, Created by, Check-in (Project / Warehouse) and Due Date. The main button counts the tasks the
 * choice would show ("58 Results") and applies it; Clear all empties the form.
 */
export function FiltersDialog({ open, value, count, onApply, onClose }: {
  open: boolean;
  value: BoardFilters;
  count: (f: BoardFilters) => number;
  onApply: (f: BoardFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  const set = <K extends keyof BoardFilters>(k: K, v: BoardFilters[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const n = count(draft);
  const choose = 'Choose';

  return (
    <Dialog
      open={open} onClose={onClose} title="Filters" icon={null} className="wk-filters"
      actions={<>
        <Button variant="text" onClick={() => setDraft(noFilters)}>Clear all</Button>
        <Button variant="accent" size="md" className="wk-filters__apply" onClick={() => onApply(draft)}>{n} Result{n === 1 ? '' : 's'}</Button>
      </>}
    >
      <div className="wk-filters__body">
        <FormSection label="Priority" labelId="wk-f-priority">
          <Select label="Priority" size="md" placeholder={choose} value={draft.priority} onChange={(v) => set('priority', v as Priority)} onClear={() => set('priority', '')} options={priorities} />
        </FormSection>
        <FormSection label="Completion" labelId="wk-f-completion">
          <Select label="Completion" size="md" placeholder={choose} value={draft.completion} onChange={(v) => set('completion', v as BoardFilters['completion'])} onClear={() => set('completion', '')} options={[{ value: 'open', label: 'Not done' }, { value: 'done', label: 'Done' }]} />
        </FormSection>
        <FormSection label="Assigned" labelId="wk-f-assigned">
          <Select label="Assigned" size="md" placeholder={choose} value={draft.assigned} onChange={(v) => set('assigned', v)} onClear={() => set('assigned', '')} options={[{ value: 'none', label: 'Not assigned' }, ...people.map((p) => ({ value: p.initials, label: p.name }))]} />
        </FormSection>
        <FormSection label="Created by" labelId="wk-f-created">
          <Select label="Created by" size="md" placeholder={choose} value={draft.createdBy} onChange={(v) => set('createdBy', v)} onClear={() => set('createdBy', '')} options={people.map((p) => ({ value: p.name, label: p.name }))} />
        </FormSection>
        <FormSection label="Check-in" labelId="wk-f-checkin">
          <ChoiceSwitch
            labelledBy="wk-f-checkin" value={draft.checkInKind}
            onChange={(v) => setDraft((d) => ({ ...d, checkInKind: v, checkIn: '' }))}
            options={[{ value: 'project', label: 'Project' }, { value: 'warehouse', label: 'Warehouse' }]}
          />
          <Select label={draft.checkInKind === 'project' ? 'Project' : 'Warehouse'} size="md" placeholder={choose} value={draft.checkIn} onChange={(v) => set('checkIn', v)} onClear={() => set('checkIn', '')} options={places[draft.checkInKind]} />
        </FormSection>
        <FormSection label="Due Date" labelId="wk-f-due">
          <DateField id="wk-f-due-field" labelledBy="wk-f-due" value={draft.due} onChange={(v) => set('due', v)} />
        </FormSection>
      </div>
    </Dialog>
  );
}
