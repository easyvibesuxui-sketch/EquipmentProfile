import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, IconButton } from '@syn/design-system';
import { MONTHS, addDays, sameDay } from './DateRangePicker';
import './forms.css';

/**
 * Form parts of the Upkeep drawers (Figma "General Information Container", "Switcher", "Basic Month / Day / Year",
 * "Drag and drop"). App-level for now; they could move to Syn later.
 */

/** A white field card: the label (Title 5, a Candy Apple * when required) over its control. */
export function FormSection({ label, required, htmlFor, labelId, aside, children, className }: {
  label: ReactNode; required?: boolean; htmlFor?: string; labelId?: string; aside?: ReactNode; children: ReactNode; className?: string;
}) {
  const Label = htmlFor ? 'label' : 'span';
  return (
    <div className={className ? `ep-form-section ${className}` : 'ep-form-section'}>
      <div className="ep-form-section__head">
        <Label className="ep-form-section__label" id={labelId} {...(htmlFor ? { htmlFor } : {})}>
          {label}
          {required && <span className="ep-form-section__req" aria-hidden> *</span>}
        </Label>
        {aside}
      </div>
      {children}
    </div>
  );
}

export interface ChoiceOption<T extends string> { value: T; label: string }

/**
 * Figma "Switcher": 140px options on a Smoke track; the chosen one fills with its tone (Eerie Black, Mantis for
 * Successfully, Honey for Failed). A radio group: the arrow keys move the choice.
 */
export function ChoiceSwitch<T extends string>({ options, value, onChange, labelledBy, tones }: {
  options: Array<ChoiceOption<T>>; value: T; onChange: (v: T) => void; labelledBy: string; tones?: Partial<Record<T, 'success' | 'pending'>>;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className="ep-choice" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className={`ep-choice__option${tones?.[o.value] ? ` is-${tones[o.value]}` : ''}`}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dateOf = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
/** 01.01.2028, as the Upkeep tables write dates. */
export const dotted = (iso: string) => { const d = dateOf(iso); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; };
/** 01/01/2028, as the date fields do. */
const slashed = (iso: string) => { const d = dateOf(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * The one-month calendar of the date fields (drawn like the Syn range picker: Eerie Black chosen day, Candy Apple ring
 * for today). Arrow keys move the day, Enter or a click picks it. `className` places the panel.
 */
export function Calendar({ value, onPick, className = 'ep-date__panel', label = 'Choose a date' }: {
  value: Date | null; onPick: (d: Date) => void; className?: string; label?: string;
}) {
  const start = value ?? new Date();
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [focusDay, setFocusDay] = useState(start);
  const root = useRef<HTMLDivElement>(null);
  const today = new Date();
  useEffect(() => {
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('.ep-date__day[tabindex="0"]')?.focus());
  }, []);
  const move = (d: Date) => {
    setFocusDay(d);
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-day="${d.toDateString()}"]`)?.focus());
  };
  const onDayKey = (e: KeyboardEvent, d: Date) => {
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
    if (step) { e.preventDefault(); move(addDays(d, step)); }
  };
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i - first.getDay()));
  return (
    <div ref={root} className={className} role="dialog" aria-label={label}>
      <div className="ep-date__head">
        <button type="button" className="ep-date__nav" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><Icon name="back" size={16} /></button>
        <span className="ep-date__title">{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
        <button type="button" className="ep-date__nav" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><Icon name="next" size={16} /></button>
      </div>
      <div role="grid" className="ep-date__grid" aria-label={`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}>
        <div role="row" className="ep-date__week">{WEEKDAYS.map((w) => <span key={w} role="columnheader" className="ep-date__wd">{w}</span>)}</div>
        {Array.from({ length: 6 }, (_, w) => (
          <div role="row" key={w} className="ep-date__week">
            {days.slice(w * 7, w * 7 + 7).map((d) => (d.getMonth() !== month.getMonth()
              ? <span key={d.toISOString()} role="gridcell" className="ep-date__out" aria-hidden>{d.getDate()}</span>
              : (
                <span key={d.toISOString()} role="gridcell">
                  <button
                    type="button" data-day={d.toDateString()}
                    className={['ep-date__day', sameDay(d, today) && 'is-today', value && sameDay(d, value) && 'is-chosen'].filter(Boolean).join(' ')}
                    tabIndex={sameDay(d, focusDay) ? 0 : -1}
                    aria-pressed={!!value && sameDay(d, value)}
                    aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    onClick={() => onPick(d)} onKeyDown={(e) => onDayKey(e, d)}
                  >
                    {d.getDate()}
                  </button>
                </span>
              )))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Figma "Basic Month / Day / Year": a 36px field with "Select date" and the calendar icon. It opens the one-month
 * Calendar under it.
 */
export function DateField({ id, value, onChange, labelledBy }: { id: string; value: string; onChange: (iso: string) => void; labelledBy: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  const close = () => { setOpen(false); root.current?.querySelector<HTMLButtonElement>('.ep-date__field')?.focus(); };
  return (
    <div
      ref={root}
      className="ep-date"
      onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); e.preventDefault(); close(); } }}
    >
      <button
        type="button" id={id} className={value ? 'ep-date__field has-value' : 'ep-date__field'}
        aria-haspopup="dialog" aria-expanded={open} aria-labelledby={`${labelledBy} ${id}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{value ? slashed(value) : 'Select date'}</span>
        <Icon name="calendar" size={16} />
      </button>
      {open && <Calendar value={value ? dateOf(value) : null} onPick={(d) => { onChange(isoOf(d)); close(); }} />}
    </div>
  );
}

export interface PickedFile { name: string; size: string }
const sizeOf = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Figma "Drag and drop" with a file: the PDF icon, its name and size, and the bin. */
export function FileRow({ file, onRemove, className }: { file: PickedFile; onRemove?: () => void; className?: string }) {
  return (
    <div className={className ? `ep-file ${className}` : 'ep-file'}>
      <Icon name="file-formats-pdf" size={24} className="ep-file__icon" />
      <span className="ep-file__text">
        <span className="ep-file__name">{file.name}</span>
        <span className="ep-file__size">{file.size}</span>
      </span>
      {onRemove && <IconButton icon="trash-bin" label={`Remove ${file.name}`} size="xs" tooltipPlacement="left" onClick={onRemove} className="ep-file__remove" />}
    </div>
  );
}

/**
 * Figma "Drag and drop" (Default, Hover, Clicked): a dashed slot with "Upload file" and a hint. Click or drop a
 * file; the slot then shows the file with a bin to take it away.
 */
export function UploadField({ file, onChange, hint = 'PDF, JPG or PNG', label = 'Upload file', className, labelledBy }: {
  file: PickedFile | null; onChange: (f: PickedFile | null) => void; hint?: string; label?: string; className?: string; labelledBy?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const inputId = useId();
  if (file) return <FileRow file={file} onRemove={() => onChange(null)} className={className ? `ep-file--slot ${className}` : 'ep-file--slot'} />;
  const take = (f?: File | null) => { if (f) onChange({ name: f.name, size: sizeOf(f.size) }); };
  return (
    <div
      className={['ep-upload', over && 'is-over', className].filter(Boolean).join(' ')}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}
    >
      <input ref={input} id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png" className="ep-upload__input" onChange={(e) => take(e.currentTarget.files?.[0])} tabIndex={-1} />
      <button type="button" className="ep-upload__button" aria-labelledby={labelledBy ? `${labelledBy} ${inputId}-t` : undefined} onClick={() => input.current?.click()}>
        <Icon name="file-upload" size={20} className="ep-upload__icon" />
        <span className="ep-upload__text" id={`${inputId}-t`}>
          <span className="ep-upload__label">{label}</span>
          <span className="ep-upload__hint">{hint}</span>
        </span>
      </button>
    </div>
  );
}
