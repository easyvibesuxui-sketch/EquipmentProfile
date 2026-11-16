import { useEffect, useRef, useState } from 'react';
import { Button, EmptyState, Icon, IconButton, Radio, RadioGroup, Select, TextField } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import './SpecDrawers.css';

/* Edit drawers of the Specifications cards (owner's screenshots): BGL information and Technical specifications.
   Discard drops the changes, Update (Amber) saves them. */

function Footer({ onDiscard, onUpdate, canUpdate = true }: { onDiscard: () => void; onUpdate: () => void; canUpdate?: boolean }) {
  return (
    <>
      <button type="button" className="ep-form-discard" onClick={onDiscard}>Discard</button>
      <Button variant="accent" className="ep-panel-drawer__submit" disabled={!canUpdate} onClick={onUpdate}>Update</Button>
    </>
  );
}

const isNumber = (v: string) => v.trim() !== '' && !Number.isNaN(Number(v.replace(',', '.')));
const stepValue = (v: string, step: number) => {
  const n = Number(v.replace(',', '.')) + step;
  return String(Math.max(0, Math.round(n * 100) / 100));
};

/** A number with its label inside, an optional unit and the up / down arrows on the right (Figma field "Weight 160"). */
function NumberField({ label, value, onChange, unit, hideLabel, className }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; hideLabel?: boolean; className?: string;
}) {
  const steppable = isNumber(value);
  return (
    <TextField
      label={label} hideLabel={hideLabel} persistentLabel={!hideLabel} size="sm" value={value} inputMode="decimal"
      className={className ? `ep-num ${className}` : 'ep-num'}
      onChange={(e) => onChange(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (!steppable || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
        e.preventDefault();
        onChange(stepValue(value, e.key === 'ArrowUp' ? 1 : -1));
      }}
      suffix={unit ? <span className="ep-num__unit">{unit}</span> : undefined}
      endAdornment={(
        <span className="ep-num__steps">
          <button type="button" tabIndex={-1} aria-label={`Increase ${label}`} disabled={!steppable} onClick={() => onChange(stepValue(value, 1))}><Icon name="up" size={12} /></button>
          <button type="button" tabIndex={-1} aria-label={`Decrease ${label}`} disabled={!steppable} onClick={() => onChange(stepValue(value, -1))}><Icon name="down" size={12} /></button>
        </span>
      )}
    />
  );
}

export interface BglValue { year: string; number: string }

/** BGL information: the BGL year (2010, 2015, 2020), the BGL number, and the BGL specifications (none yet). */
export function BglDrawer({ open, value, onClose, onUpdate }: { open: boolean; value: BglValue; onClose: () => void; onUpdate: (v: BglValue) => void }) {
  const [form, setForm] = useState(value);
  useEffect(() => { if (open) setForm(value); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <PanelDrawer
      open={open} onClose={onClose} title="BGL information" className="ep-specd"
      footer={<Footer onDiscard={onClose} onUpdate={() => { onUpdate(form); onClose(); }} />}
    >
      <div className="ep-specd__body">
        <div className="ep-specd__bgl">
          <div className="ep-specd__field">
            <span className="ep-specd__caption" id="ep-bgl-year">Enter BGL Year</span>
            <RadioGroup label="Enter BGL Year" hideLabel inline value={form.year} onChange={(year) => setForm((f) => ({ ...f, year }))}>
              {['2010', '2015', '2020'].map((y) => <Radio key={y} value={y} label={y} />)}
            </RadioGroup>
          </div>
          <div className="ep-specd__field">
            <span className="ep-specd__caption">Type Serial number of equipment</span>
            <TextField label="BGL-No" persistentLabel size="sm" value={form.number} onChange={(e) => { const number = e.currentTarget.value; setForm((f) => ({ ...f, number })); }} />
          </div>
        </div>
        <section className="ep-specd__well" aria-label="BGL Specifications">
          <p className="ep-specd__well-head"><span className="syn-title-text">BGL Specifications</span> <span className="ep-specd__count">Count 0</span></p>
          <EmptyState icon="empty-state">No History yet</EmptyState>
        </section>
      </div>
    </PanelDrawer>
  );
}

export interface SpecParam { id: string; label: string; value: string; unit: string }
export interface Dimensions { weight: string; weightUnit: 'kg' | 't'; length: string; width: string; height: string }

const UNITS = ['kg', 't', 'm', 'mm', 'm³', 'l', 'l/min', 'hp', 'kW', 'km/h', 'rpm', 'bar', 'h', '%'];
const unitOptions = (current: string) => [
  { value: '', label: '—' },
  ...[...new Set([...(current ? [current] : []), ...UNITS])].map((u) => ({ value: u, label: u === 'kg' ? 'Kg' : u === 't' ? 'Ton' : u })),
];
const syncText = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
let seq = 0;

/**
 * Technical specifications: the dimensions (weight in Kg or Ton, length, width and height in m), then every
 * parameter as a card (its value with arrows, its unit, the bin). LECTURA syncs them; + adds a parameter.
 */
export function TechSpecsDrawer({ open, dims, params, onClose, onUpdate }: {
  open: boolean; dims: Dimensions; params: SpecParam[]; onClose: () => void; onUpdate: (d: Dimensions, p: SpecParam[]) => void;
}) {
  const [d, setD] = useState(dims);
  const [list, setList] = useState(params);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: '', value: '', unit: '' });
  const [fresh, setFresh] = useState<string | null>(null);
  const [synced, setSynced] = useState(new Date(2024, 8, 30, 3, 25));
  const [syncing, setSyncing] = useState(false);
  const keyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    setD(dims); setList(params); setAdding(false); setFresh(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (adding) requestAnimationFrame(() => keyRef.current?.querySelector('input')?.focus()); }, [adding]);

  const setParam = (id: string, patch: Partial<SpecParam>) => setList((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const add = () => {
    const id = `new-${++seq}`;
    setList((l) => [{ id, label: draft.label.trim(), value: draft.value.trim(), unit: draft.unit }, ...l]);
    setFresh(id); setAdding(false); setDraft({ label: '', value: '', unit: '' });
  };
  const sync = () => { setSyncing(true); window.setTimeout(() => { setSynced(new Date()); setSyncing(false); }, 900); };
  const canAdd = !!draft.label.trim() && !!draft.value.trim() && !!draft.unit;

  return (
    <PanelDrawer
      open={open} onClose={onClose} title="Technical specifications" className="ep-specd"
      footer={<Footer onDiscard={onClose} onUpdate={() => { onUpdate(d, list); onClose(); }} />}
    >
      <div className="ep-specd__body">
        <div className="ep-specd__dims">
          <span className="ep-specd__caption">Enter Dimensions of equipment</span>
          <div className="ep-specd__weight">
            <NumberField label="Weight" value={d.weight} onChange={(weight) => setD((x) => ({ ...x, weight }))} />
            <div className="ep-specd__units" role="radiogroup" aria-label="Weight unit">
              {(['kg', 't'] as const).map((u) => (
                <button
                  key={u} type="button" role="radio" aria-checked={d.weightUnit === u}
                  // The weight is converted with the unit: 34500 Kg is 34.5 Ton.
                  onClick={() => setD((x) => (x.weightUnit === u ? x : {
                    ...x, weightUnit: u,
                    weight: isNumber(x.weight) ? String(Math.round(Number(x.weight.replace(',', '.')) * (u === 't' ? 0.001 : 1000) * 1000) / 1000) : x.weight,
                  }))}
                >
                  {u === 'kg' ? 'Kg' : 'Ton'}
                </button>
              ))}
            </div>
          </div>
          <div className="ep-specd__lwh">
            <NumberField label="Length" value={d.length} unit="m" onChange={(length) => setD((x) => ({ ...x, length }))} />
            <NumberField label="Width" value={d.width} unit="m" onChange={(width) => setD((x) => ({ ...x, width }))} />
            <NumberField label="Height" value={d.height} unit="m" onChange={(height) => setD((x) => ({ ...x, height }))} />
          </div>
        </div>

        <section className="ep-specd__well" aria-label="Parameters">
          <div className="ep-specd__sync">
            <span className="ep-specd__synced">Last sync date {syncText(synced)}</span>
            <button type="button" className={syncing ? 'ep-specd__lectura is-syncing' : 'ep-specd__lectura'} onClick={sync} disabled={syncing} aria-label={syncing ? 'Syncing with LECTURA' : 'Sync with LECTURA'}>
              <Icon name="refresh-change" size={14} /><span className="ep-specd__lectura-name">LECTURA</span>
            </button>
            <IconButton icon="plus-in-circle" label="Add parameter" size="xs" className="ep-upkeep__add" aria-expanded={adding} onClick={() => setAdding(true)} disabled={adding} />
          </div>

          {adding && (
            <div className="ep-specd__add" role="group" aria-label="Add parameter">
              <p className="ep-specd__add-title">Add parameter</p>
              <div className="ep-specd__add-fields">
                <div className="ep-specd__add-field" ref={keyRef}>
                  <span className="ep-specd__add-label">Key <span className="ep-form-section__req">*</span></span>
                  <TextField label="Key" hideLabel size="sm" placeholder="Enter" value={draft.label} onChange={(e) => { const label = e.currentTarget.value; setDraft((x) => ({ ...x, label })); }} />
                </div>
                <div className="ep-specd__add-field">
                  <span className="ep-specd__add-label">Value <span className="ep-form-section__req">*</span></span>
                  <TextField label="Value" hideLabel size="sm" placeholder="Enter" value={draft.value} onChange={(e) => { const value = e.currentTarget.value; setDraft((x) => ({ ...x, value })); }} />
                </div>
                <div className="ep-specd__add-field">
                  <span className="ep-specd__add-label">Unit <span className="ep-form-section__req">*</span></span>
                  <Select label="Unit" size="sm" placeholder="Enter" options={unitOptions('').slice(1)} value={draft.unit} onChange={(unit) => setDraft((x) => ({ ...x, unit }))} />
                </div>
              </div>
              <div className="ep-specd__add-actions">
                <button type="button" className="ep-form-discard" onClick={() => { setAdding(false); setDraft({ label: '', value: '', unit: '' }); }}>Discard</button>
                <Button size="md" disabled={!canAdd} onClick={add}>Add</Button>
              </div>
            </div>
          )}

          <ul className={adding ? 'ep-specd__params is-behind' : 'ep-specd__params'} {...(adding ? { inert: '' } : {})}>
            {list.map((p) => (
              <li key={p.id} className={p.id === fresh ? 'ep-specd__param is-fresh' : 'ep-specd__param'}>
                <p className="ep-specd__param-name">{p.label}</p>
                <div className="ep-specd__param-row">
                  <NumberField label={p.label} hideLabel value={p.value} onChange={(value) => setParam(p.id, { value })} />
                  <Select label={`${p.label} unit`} size="sm" options={unitOptions(p.unit)} value={p.unit} onChange={(unit) => setParam(p.id, { unit })} className="ep-specd__unit" />
                  <IconButton icon="trash-bin" label={`Remove ${p.label}`} size="xs" tooltipPlacement="left" onClick={() => setList((l) => l.filter((x) => x.id !== p.id))} />
                </div>
              </li>
            ))}
          </ul>
          {!list.length && !adding && <EmptyState icon="empty-state">No parameters yet</EmptyState>}
        </section>
      </div>
    </PanelDrawer>
  );
}
