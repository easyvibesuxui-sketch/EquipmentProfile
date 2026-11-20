import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Grid, GridItem, Icon, Property, Select, Tag, TextArea, TextField, type IconName } from '@syn/design-system';
import { Calendar } from '@sam/shared';
import {
  conditions, dottedDateTime, dueState, insuranceLabel, people, personName, priorities, tagCatalog, tagColor,
  type Condition, type Insurance, type Priority, type Task,
} from '../data/werkstatt';
import { ConditionChip, PriorityChip } from './TaskCard';
import { MenuButton } from './MenuButton';

/**
 * The editable head of the ticket drawer: name (Figma 1270:10373) and description (4728:45878) edit in place;
 * Condition (5318:21638), Priority (5318:21685), Insurance case (5318:21713), Due date (5318:21738), Assignee,
 * Collaborators and Tags open a choice on click and show an X on hover that clears them back to "Choose".
 */

/** Hover shows Cultured; a click (or Enter) turns the text into its field; Enter or leaving the field keeps it, Escape drops it. */
function InPlace({ value, label, multiline, required, onChange, readOnly, render }: {
  value: string; label: string; multiline?: boolean; required?: boolean; readOnly?: boolean;
  onChange: (v: string) => void; render: (v: string) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!editing) setText(value); }, [value, editing]);
  useEffect(() => { if (editing) box.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')?.focus(); }, [editing]);
  const commit = () => { const v = text.trim(); if (v || !required) onChange(v); setEditing(false); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setText(value); setEditing(false); }
    if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(); }
  };
  if (readOnly) return <>{render(value)}</>;
  if (!editing) {
    return (
      <button type="button" className={multiline ? 'td-inplace is-multiline' : 'td-inplace'} aria-label={`${label}: ${value || 'empty'}. Edit`} onClick={() => setEditing(true)}>
        {render(value)}
      </button>
    );
  }
  return (
    <div ref={box} className="td-inplace__field" onKeyDown={onKey} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) commit(); }}>
      {multiline
        ? <TextArea label={label} hideLabel={false} size="md" value={text} onChange={(e) => setText(e.target.value)} />
        : <TextField label={label} size="md" persistentLabel value={text} onChange={(e) => setText(e.target.value)} error={required && !text.trim() ? 'Give the ticket a name' : undefined} />}
    </div>
  );
}

/** A value that opens a choice; X on hover (or focus) clears it; empty shows the dashed "Choose". */
function Pick<T extends string>({ label, value, choices, onChange, render, emptyLabel = 'Choose', emptyIcon, readOnly, align, radio }: {
  label: string; value: T | undefined; choices: Array<{ value: T; label: string; icon?: IconName; tone?: string }>; onChange: (v: T | undefined) => void;
  render: (v: T) => ReactNode; emptyLabel?: string; emptyIcon?: 'person'; readOnly?: boolean; align?: 'start' | 'end'; radio?: boolean;
}) {
  if (readOnly) return value ? <>{render(value)}</> : <span className="wk-muted">—</span>;
  const current = choices.find((c) => c.value === value)?.label;
  return (
    <span className={value ? 'td-pick has-value' : 'td-pick'}>
      <MenuButton
        label={value ? `${label}: ${current}. Change` : `${label}: choose`} className={value ? 'td-pick__value' : 'td-pick__empty'}
        choices={choices} value={value ?? ''} onChange={(v) => onChange(v as T)} align={align} check={false} radio={radio} className2="td-pick__menu"
      >
        {value ? render(value) : <>{emptyIcon && <Icon name={emptyIcon} size={14} />}{emptyLabel}</>}
      </MenuButton>
      {value && (
        <button type="button" className="td-pick__clear" aria-label={`Clear ${label}`} onClick={() => onChange(undefined)}>
          <Icon name="close" size={10} />
        </button>
      )}
    </span>
  );
}

/** Opens a small card under its trigger; it closes on a click outside it (a Select's listbox counts as inside) or Escape. */
function usePanel() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('.td-pick__panel [role="combobox"], .td-pick__panel button')?.focus());
    const onDown = (e: PointerEvent) => { const el = e.target as HTMLElement; if (!root.current?.contains(el) && !el.closest('[role="listbox"]')) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);
  const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) { e.stopPropagation(); e.preventDefault(); setOpen(false); } };
  return { open, setOpen, root, onKeyDown };
}

/** Assignee (Figma 1024:12998): the blue name tag opens a small card with a "Choose" select of people. */
function AssigneePick({ value, onChange, readOnly }: { value?: string; onChange: (v: string | undefined) => void; readOnly?: boolean }) {
  const { open, setOpen, root, onKeyDown } = usePanel();
  const tag = value ? <Tag color="var(--syn-color-secondary-dodger-blue)" shape="rounded">{personName(value)}</Tag> : null;
  if (readOnly) return tag ?? <span className="wk-muted">—</span>;
  return (
    <span ref={root} className={value ? 'td-pick td-pick--on-color has-value' : 'td-pick'} onKeyDown={onKeyDown}>
      <button type="button" className={value ? 'td-pick__value' : 'td-pick__empty'} aria-expanded={open} aria-label={value ? `Assignee: ${personName(value)}. Change` : 'Assignee: choose'} onClick={() => setOpen(!open)}>
        {tag ?? <><Icon name="person" size={14} />Assign</>}
      </button>
      {value && <button type="button" className="td-pick__clear" aria-label="Clear Assignee" onClick={() => onChange(undefined)}><Icon name="close" size={10} /></button>}
      {open && (
        <span className="td-pick__panel is-end" role="dialog" aria-label="Assignee">
          <Select label="Assignee" size="md" placeholder="Choose" value={value ?? ''} onChange={(v) => { onChange(v); setOpen(false); }} options={personChoices} />
        </span>
      )}
    </span>
  );
}

/** Add tag (Figma 1024:12998): the dashed "Add" opens the same small card with a "Choose" select of the free tags. */
function TagAdd({ options, onAdd }: { options: Array<{ value: string; label: string }>; onAdd: (name: string) => void }) {
  const { open, setOpen, root, onKeyDown } = usePanel();
  return (
    <span ref={root} className="td-pick td-end" onKeyDown={onKeyDown}>
      <button type="button" className="td-pick__empty td-props__add-tag" aria-expanded={open} aria-label="Add tag" onClick={() => setOpen(!open)}>Add</button>
      {open && (
        <span className="td-pick__panel is-end" role="dialog" aria-label="Add tag">
          <Select label="Tag" size="md" placeholder="Choose" value="" onChange={(v) => { if (v) onAdd(v); setOpen(false); }} options={options} />
        </span>
      )}
    </span>
  );
}

function DuePick({ task, onChange, readOnly }: { task: Task; onChange: (iso: string | undefined) => void; readOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const id = useId();
  const overdue = !task.done && dueState(task)?.tone === 'overdue';
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);
  const chip = task.due
    ? <span className={overdue ? 'td-due is-overdue' : 'td-due'}>{dottedDateTime(task.due)}{overdue && <span className="td-due__note">(Overdue)</span>}</span>
    : null;
  if (readOnly) return chip ?? <span className="wk-muted">—</span>;
  return (
    <span ref={root} className={task.due ? 'td-pick has-value' : 'td-pick'} onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); e.preventDefault(); setOpen(false); } }}>
      <button type="button" className={task.due ? 'td-pick__value' : 'td-pick__empty'} aria-expanded={open} aria-controls={open ? id : undefined}
        aria-label={task.due ? `Due date: ${dottedDateTime(task.due)}${overdue ? ', overdue' : ''}. Change` : 'Due date: choose'} onClick={() => setOpen(!open)}>
        {chip ?? 'Choose'}
      </button>
      {task.due && <button type="button" className="td-pick__clear" aria-label="Clear Due date" onClick={() => onChange(undefined)}><Icon name="close" size={10} /></button>}
      {open && (
        <span id={id} className="td-pick__calendar">
          <Calendar
            label="Due date" className="ep-date__panel" value={task.due ? new Date(task.due) : null}
            onPick={(d) => {
              // The day from the calendar, the time kept from the old due date (or the end of the working day).
              const prev = task.due ? new Date(task.due) : null;
              d.setHours(prev ? prev.getHours() : 17, prev ? prev.getMinutes() : 0, 0, 0);
              onChange(d.toISOString()); setOpen(false);
            }}
          />
        </span>
      )}
    </span>
  );
}

/** Figma 986:13778 and 986:13905: each choice with its glyph; priorities from Low to Blocker. */
const conditionChoices: Array<{ value: Condition; label: string; icon: IconName }> = conditions.map((c) => ({
  ...c, icon: ({ 'can-work': 'check-in-circle', 'cant-work': 'cant-work', destroyed: 'stop-in-circle' } as const)[c.value],
}));
const priorityChoices: Array<{ value: Priority; label: string; icon: IconName; tone: string }> = [...priorities].reverse().map((p) => ({
  ...p, icon: ({ low: 'down', medium: 'medium', high: 'up', blocker: 'critical' } as const)[p.value], tone: `is-${p.value}`,
}));
/** Figma 986:14094: Yes, No, Don’t know with radio circles (Don’t know is the cards' "Not relevant"). */
const insuranceChoices: Array<{ value: Insurance; label: string }> = [
  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not-relevant', label: 'Don’t know' },
];
const personChoices = people.map((p) => ({ value: p.initials, label: p.name }));

/** Name and description (create: the two required fields), and for an archived ticket who archived it and when. */
export function TicketTitle({ task, onChange, mode, archived }: {
  task: Task;
  onChange: (t: Task) => void;
  mode: 'create' | 'edit' | 'archived';
  archived?: { by: string; at: string };
}) {
  const set = (patch: Partial<Task>) => onChange({ ...task, ...patch });
  const ro = mode === 'archived';
  return (
    <div className="td-title__main">
      {mode === 'create' ? (
        <div className="td-create">
          <TextField label="Name *" size="md" persistentLabel placeholder="E.G. John Doe" value={task.title} onChange={(e) => set({ title: e.target.value })} autoFocus />
          <TextArea label="Additional information *" hideLabel={false} size="md" value={task.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
        </div>
      ) : (
        <>
          <InPlace value={task.title} label="Name" required readOnly={ro} onChange={(v) => set({ title: v })} render={(v) => <h2 className="td-title__text">{v}</h2>} />
          <InPlace value={task.description ?? ''} label="Additional information" multiline readOnly={ro} onChange={(v) => set({ description: v })} render={(v) => <p className="td-title__lead">{v || 'Add a description'}</p>} />
          {archived && (
            <dl className="td-archived">
              <div><dt>Archived by</dt><dd>{archived.by}</dd></div>
              <div><dt>Archived Date</dt><dd>{archived.at}</dd></div>
            </dl>
          )}
        </>
      )}
    </div>
  );
}

/** Condition, Priority, Insurance case, Due date and Assignee, then the Collaborators and Tags lines. */
export function TicketProps({ task, onChange, readOnly }: { task: Task; onChange: (t: Task) => void; readOnly?: boolean }) {
  return <PropertiesRow task={task} set={(patch) => onChange({ ...task, ...patch })} ro={!!readOnly} collaborators={task.collaborators ?? []} tags={task.tags ?? []} />;
}

function PropertiesRow({ task, set, ro, collaborators, tags }: {
  task: Task; set: (p: Partial<Task>) => void; ro: boolean; collaborators: string[]; tags: string[];
}) {
  const freePeople = personChoices.filter((p) => p.value !== task.assignee && !collaborators.includes(p.value));
  const freeTags = tagCatalog.filter((t) => !tags.includes(t.name)).map((t) => ({ value: t.name, label: t.name }));
  return (
    <div className="td-props">
      <div className="td-props__row">
        <Grid gap={24} className="td-props__grid">
          <GridItem span={3} spanSm={6}><Property label="Condition" icon="maintenance"><Pick label="Condition" readOnly={ro} value={task.condition} choices={conditionChoices} onChange={(v) => set({ condition: v })} render={(v) => <ConditionChip value={v} />} /></Property></GridItem>
          <GridItem span={3} spanSm={6}><Property label="Priority" icon="up"><Pick label="Priority" readOnly={ro} value={task.priority} choices={priorityChoices} onChange={(v) => set({ priority: v })} render={(v) => <PriorityChip value={v} />} /></Property></GridItem>
          <GridItem span={3} spanSm={6}><Property label="Insurance case" icon="insurance"><Pick label="Insurance case" readOnly={ro} value={task.insurance} choices={insuranceChoices} radio onChange={(v) => set({ insurance: v })} render={(v) => <strong className="td-strong">{insuranceLabel[v]}</strong>} /></Property></GridItem>
          <GridItem span={3} spanSm={6}><Property label="Due date" icon="calendar"><DuePick task={task} readOnly={ro} onChange={(v) => set({ due: v })} /></Property></GridItem>
        </Grid>
        <Property label="Assignee" icon="person" className="td-end">
          <AssigneePick
            readOnly={ro} value={task.assignee}
            onChange={(v) => set({ assignee: v, collaborators: collaborators.filter((c) => c !== v) })}
          />
        </Property>
      </div>
      <div className="td-props__line">
        <span className="td-props__label"><Icon name="person" size={16} />Collaborators</span>
        <span className="td-props__values">
          {collaborators.map((c) => (
            ro ? <Tag key={c}>{c}</Tag>
              : <Tag key={c} removeIcon="x-in-circle" removeLabel={`Remove ${personName(c)}`} onRemove={() => set({ collaborators: collaborators.filter((x) => x !== c) })}>{c}</Tag>
          ))}
        </span>
        {!ro && freePeople.length > 0 && (
          <MenuButton label="Add collaborator" className="td-props__add-person" choices={freePeople} value="" align="end" onChange={(v) => set({ collaborators: [...collaborators, v] })}>
            <Icon name="adduser" size={16} />
          </MenuButton>
        )}
      </div>
      <div className="td-props__line">
        <span className="td-props__label"><Icon name="tag" size={16} />Tags</span>
        <span className="td-props__values">
          {tags.map((name) => (
            ro ? <Tag key={name} color={tagColor(name)}>{name}</Tag>
              : <Tag key={name} color={tagColor(name)} onRemove={() => set({ tags: tags.filter((x) => x !== name) })} removeLabel={`Remove ${name}`}>{name}</Tag>
          ))}
        </span>
        {!ro && freeTags.length > 0 && (
          <TagAdd options={freeTags} onAdd={(v) => set({ tags: [...tags, v] })} />
        )}
      </div>
    </div>
  );
}
