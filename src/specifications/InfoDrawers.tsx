import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Button, Checkbox, Icon, Select, TextArea, TextField } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import {
  basisLabels, catalogue, categories, systemTitle,
  type CalcBasis, type Calculation, type EquipmentDetails, type MachineInfo,
} from './infoData';
import './SpecDrawers.css';

/* Edit drawers of the Specifications info cards (owner's screenshots): Equipment Details, Specific machine
   information and Calculation type. Discard drops the changes, Update (Amber) saves them. */

function Footer({ onDiscard, onUpdate, canUpdate = true }: { onDiscard: () => void; onUpdate: () => void; canUpdate?: boolean }) {
  return (
    <>
      <button type="button" className="ep-form-discard" onClick={onDiscard}>Discard</button>
      <Button variant="accent" className="ep-panel-drawer__submit" disabled={!canUpdate} onClick={onUpdate}>Update</Button>
    </>
  );
}

/** A field with its grey caption above (Figma: "Brand of your equipment" over the field). */
function Captioned({ caption, children, className }: { caption: string; children: ReactNode; className?: string }) {
  return (
    <div className={className ? `ep-specd__field ${className}` : 'ep-specd__field'}>
      <span className="ep-specd__caption">{caption}</span>
      {children}
    </div>
  );
}

const YEARS_PER_PAGE = 12;
/** Production year: the year with the calendar icon; it opens a grid of years (Syn "Years"), twelve a page. */
function YearField({ label, value, onChange, disabled }: { label: string; value: string | null; onChange: (y: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const thisYear = new Date().getFullYear();
  const [last, setLast] = useState(thisYear);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const v = Number(value) || thisYear;
    setLast(Math.min(thisYear, v + 5));
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('.ep-year__opt[aria-pressed="true"], .ep-year__opt')?.focus());
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => last - YEARS_PER_PAGE + 1 + i);
  return (
    <div ref={root} className="ep-year" onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); e.preventDefault(); setOpen(false); } }}>
      <button type="button" className="ep-year__field" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ep-year__text">
          <span className="ep-year__label">{label} <span className="ep-form-section__req">*</span></span>
          <span className="ep-year__value">{value ?? (disabled ? 'Unknown' : 'Select year')}</span>
        </span>
        <Icon name="calendar" size={16} />
      </button>
      {open && (
        <div className="ep-year__panel" role="dialog" aria-label="Choose a year">
          <div className="ep-date__head">
            <button type="button" className="ep-date__nav" aria-label="Earlier years" onClick={() => setLast((l) => l - YEARS_PER_PAGE)}><Icon name="back" size={16} /></button>
            <span className="ep-date__title">{years[0]} – {years[years.length - 1]}</span>
            <button type="button" className="ep-date__nav" aria-label="Later years" disabled={last >= thisYear} onClick={() => setLast((l) => Math.min(thisYear, l + YEARS_PER_PAGE))}><Icon name="next" size={16} /></button>
          </div>
          <div className="ep-year__grid">
            {years.map((y) => (
              <button
                key={y} type="button" className="ep-year__opt" aria-pressed={String(y) === value}
                onClick={() => { onChange(String(y)); setOpen(false); }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Equipment Details: manufacturer, model and production year (each may be "Information is unknown"), the listing
 * title (brand and model by default) and the category, with a preview of the listing.
 */
export function EquipmentDetailsDrawer({ open, value, onClose, onUpdate }: {
  open: boolean; value: EquipmentDetails; onClose: () => void; onUpdate: (v: EquipmentDetails) => void;
}) {
  const [f, setF] = useState(value);
  const [titleEdited, setTitleEdited] = useState(true);
  useEffect(() => { if (open) { setF(value); setTitleEdited(value.title !== systemTitle(value)); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch: Partial<EquipmentDetails>) => setF((x) => {
    const next = { ...x, ...patch };
    // Until the person changes it, the title follows the brand and model.
    return titleEdited || 'title' in patch ? next : { ...next, title: systemTitle(next) };
  });
  const models = f.manufacturer ? catalogue[f.manufacturer] ?? [] : Object.values(catalogue).flat();
  const ok = !!f.title.trim() && (f.model !== '' ) && (f.year !== '');
  return (
    <PanelDrawer
      open={open} onClose={onClose} title="Equipment Details" className="ep-specd"
      footer={<Footer onDiscard={onClose} canUpdate={ok} onUpdate={() => { onUpdate({ ...f, title: f.title.trim() }); onClose(); }} />}
    >
      <div className="ep-specd__body">
        <div className="ep-specd__three">
          <Captioned caption="Brand of your equipment">
            <Select
              label="Equipment manufacturer" hideLabel={false} size="sm" placeholder="Choose" disabled={f.manufacturer === null}
              options={Object.keys(catalogue).map((m) => ({ value: m, label: m }))}
              value={f.manufacturer ?? ''} onChange={(manufacturer) => set({ manufacturer, model: (catalogue[manufacturer] ?? []).includes(f.model ?? '') ? f.model : '' })}
            />
            <Checkbox label="Information is unknown" checked={f.manufacturer === null} onChange={(e) => { const unknown = e.currentTarget.checked; set({ manufacturer: unknown ? null : '' }); }} />
          </Captioned>
          <Captioned caption="Select the Model of your equipment">
            <Select
              label="Model name *" hideLabel={false} size="sm" placeholder="Choose" disabled={f.model === null}
              options={models.map((m) => ({ value: m, label: m }))} value={f.model ?? ''} onChange={(model) => set({ model })}
            />
            <Checkbox label="Information is unknown" checked={f.model === null} onChange={(e) => { const unknown = e.currentTarget.checked; set({ model: unknown ? null : '' }); }} />
          </Captioned>
          <Captioned caption="Select year your equipment was made in">
            <YearField label="Production year" value={f.year} disabled={f.year === null} onChange={(year) => set({ year })} />
            <Checkbox label="Information is unknown" checked={f.year === null} onChange={(e) => { const unknown = e.currentTarget.checked; set({ year: unknown ? null : '' }); }} />
          </Captioned>
        </div>
        <hr className="ep-specd__rule" />
        <div className="ep-specd__two">
          <Captioned caption="By default, the brand and model will be the system name of your equipment. You can change it if necessary" className="ep-specd__span2">
            <div className="ep-specd__two">
              <TextField
                label="Listing title *" persistentLabel size="sm" value={f.title}
                onChange={(e) => { const title = e.currentTarget.value; setTitleEdited(true); set({ title }); }}
              />
              <Select label="Category" hideLabel={false} size="sm" options={categories.map((c) => ({ value: c, label: c }))} value={f.category} onChange={(category) => set({ category })} />
            </div>
          </Captioned>
        </div>
        <div className="ep-specd__preview" aria-label="Listing preview">
          <span className="ep-specd__preview-img"><Icon name="image" size={56} /></span>
          <div className="ep-specd__preview-text">
            <span className={f.title ? 'is-set ep-specd__preview-title' : 'ep-specd__preview-title'}>{f.title || 'Title'}</span>
            <span className={f.category ? 'is-set' : undefined}>{f.category || 'Category'}</span>
            <span className="ep-specd__preview-pair">
              <span className={f.manufacturer ? 'is-set' : undefined}>{f.manufacturer || 'Manufacturer'}</span>
              <span className="ep-specd__dot" aria-hidden />
              <span className={f.model ? 'is-set' : undefined}>{f.model || 'Model'}</span>
            </span>
            <span className={f.year ? 'is-set' : undefined}>{f.year || 'Indicate Year'}</span>
          </div>
        </div>
      </div>
    </PanelDrawer>
  );
}

/** Specific machine information: the identifiers (UEID/TOID may be the inventory number), and free notes. */
export function MachineInfoDrawer({ open, value, onClose, onUpdate }: {
  open: boolean; value: MachineInfo; onClose: () => void; onUpdate: (v: MachineInfo) => void;
}) {
  const [f, setF] = useState(value);
  useEffect(() => { if (open) setF(value); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const field = (key: keyof MachineInfo) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.currentTarget.value;
    setF((x) => ({ ...x, [key]: v, ...(key === 'inventory' && x.sameAsInventory ? { ueid: v } : {}) }));
  };
  return (
    <PanelDrawer
      open={open} onClose={onClose} title="Specific machine information" className="ep-specd"
      footer={<Footer onDiscard={onClose} canUpdate={!!f.inventory.trim()} onUpdate={() => { onUpdate(f); onClose(); }} />}
    >
      <div className="ep-specd__body">
        <div className="ep-specd__three">
          <Captioned caption="Type Unique Identifier Number">
            <TextField label="Inventory No. *" persistentLabel size="sm" value={f.inventory} onChange={field('inventory')} />
          </Captioned>
          <Captioned caption="Type Unique Entity ID or TOID">
            <TextField label="UEID/TOID" persistentLabel size="sm" value={f.sameAsInventory ? f.inventory : f.ueid} disabled={f.sameAsInventory} onChange={field('ueid')} />
            <Checkbox
              label="Same as Inventory No" checked={f.sameAsInventory}
              onChange={(e) => { const same = e.currentTarget.checked; setF((x) => ({ ...x, sameAsInventory: same, ueid: same ? x.inventory : x.ueid })); }}
            />
          </Captioned>
          <Captioned caption="Type Serial number of equipment">
            <TextField label="Serial number" hideLabel size="sm" placeholder="Serial number" value={f.serial} onChange={field('serial')} />
          </Captioned>
          <Captioned caption="Type Equipments special equipment number">
            <TextField label="Special equipment number" hideLabel size="sm" placeholder="Special equipment number" value={f.special} onChange={field('special')} />
          </Captioned>
          <Captioned caption="Type Equipments Numberplate">
            <TextField label="Numberplate" hideLabel size="sm" placeholder="Numberplate" value={f.numberplate} onChange={field('numberplate')} />
          </Captioned>
          <Captioned caption="Type Equipments VIN Number">
            <TextField label="VIN Number" hideLabel size="sm" placeholder="VIN Number" value={f.vin} onChange={field('vin')} />
          </Captioned>
        </div>
        <Captioned caption="Specific machine information">
          <TextArea label="Specific machine information" placeholder="Enter information" rows={4} value={f.notes} onChange={field('notes')} />
        </Captioned>
      </div>
    </PanelDrawer>
  );
}

/** Calculation type: by working hours, by daily price, or combined; each with its price in Euro. */
export function CalculationDrawer({ open, value, onClose, onUpdate }: {
  open: boolean; value: Calculation; onClose: () => void; onUpdate: (v: Calculation) => void;
}) {
  const [f, setF] = useState(value);
  useEffect(() => { if (open) setF(value); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const price = (key: 'hourPrice' | 'dailyPrice', label: string) => (
    <TextField
      label={label} hideLabel size="sm" placeholder="Enter Price" inputMode="decimal" value={f[key]}
      suffix={<span className="ep-num__unit">Eur</span>} className="ep-specd__price"
      onChange={(e) => { const v = e.currentTarget.value.replace(/[^\d.,]/g, ''); setF((x) => ({ ...x, [key]: v })); }}
    />
  );
  const option = (basis: CalcBasis) => (
    <label className="ep-specd__radio">
      <input type="radio" name="ep-calc-basis" checked={f.basis === basis} onChange={() => setF((x) => ({ ...x, basis }))} />
      <span className="ep-specd__radio-dot" aria-hidden />
      <span>{basisLabels[basis]}</span>
    </label>
  );
  const ok = f.basis === 'hours' ? !!f.hourPrice : f.basis === 'daily' ? !!f.dailyPrice : f.basis === 'combined' ? !!f.hourPrice && !!f.dailyPrice : false;
  return (
    <PanelDrawer
      open={open} onClose={onClose} title="Calculation type" className="ep-specd"
      footer={<Footer onDiscard={onClose} canUpdate={ok} onUpdate={() => { onUpdate(f); onClose(); }} />}
    >
      <div className="ep-specd__body ep-specd__calc" role="radiogroup" aria-label="Calculation basis">
        <div className="ep-specd__two">
          <div className={f.basis === 'hours' ? 'ep-specd__opt is-on' : 'ep-specd__opt'}>{option('hours')}{price('hourPrice', 'Working hours price')}</div>
          <div className={f.basis === 'daily' ? 'ep-specd__opt is-on' : 'ep-specd__opt'}>{option('daily')}{price('dailyPrice', 'Daily price')}</div>
        </div>
        <div className={f.basis === 'combined' ? 'ep-specd__opt ep-specd__opt--wide is-on' : 'ep-specd__opt ep-specd__opt--wide'}>
          {option('combined')}
          <span className="ep-specd__sub">Working hours</span>{price('hourPrice', 'Combined: working hours price')}
          <span className="ep-specd__sub">Daily price</span>{price('dailyPrice', 'Combined: daily price')}
        </div>
      </div>
    </PanelDrawer>
  );
}
