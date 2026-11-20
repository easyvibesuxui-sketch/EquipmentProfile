import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Button, Card, ColorDot, Comment, CommentEditor, CommentReply, Drawer, DrawerRow, EmptyState,
  FileItem, Grid, GridItem, Icon, IconButton, Property, Section, Segmented, Select, Table, Tag, TextField,
  Thumbnail, Value, type IconName,
} from '@syn/design-system';
import { ActionMenu } from '@sam/shared';
import { people, personName, type Board, type Column, type Task } from '../data/werkstatt';
import { MenuButton } from './MenuButton';
import { TicketProps, TicketTitle } from './TicketFields';
import { TicketChecklist } from './TicketChecklist';
import photo1 from '../assets/werkstatt/damage-1.jpg';
import photo2 from '../assets/werkstatt/damage-2.jpg';
import photo3 from '../assets/werkstatt/damage-3.jpg';
import photo4 from '../assets/werkstatt/damage-4.jpg';
import cover from '../assets/werkstatt/damage-cover.jpg';
import noImage from '../assets/werkstatt/no-image-equipment.svg';
import './TaskDrawer.css';

const photos = [photo1, photo2, photo3, photo4];
const none = () => {};
const lorem = 'A thorough damage investigation is essential for accurate claims processing. It generally outlines: Characteristics of the item';

const crew: Array<[string, string]> = [
  ['Max Mustermann', '#459af7'], ['Erika Mustermann', '#fe7d00'], ['John Doe', '#f4b642'], ['Jane Smith', '#a200ff'],
  ['Emily Davis', '#fe7d00'], ['Michael Johnson', '#a200ff'], ['Chris Lee', '#a200ff'], ['Sarah Brown', '#ff1900'],
  ['David Wilson', '#a200ff'], ['Maria Schneider', '#a200ff'], ['Alex Johnson', '#71c562'], ['Tina Müller', '#71c562'],
];
const resources = [
  { date: '01.01.2016', name: 'Pipe', amount: 12, unit: 'Meter', price: 20, file: false },
  { date: '02.01.2016', name: 'Cable', amount: 15, unit: 'Meter', price: 25, file: true },
  { date: '03.01.2016', name: 'Duct', amount: 10, unit: 'Meter', price: 30, file: true },
  { date: '04.01.2016', name: 'Connector', amount: 8, unit: 'Unit', price: 50, file: true },
];

function Photos({ side }: { side: string }) {
  return <span className="td-photos">{photos.map((src, i) => <Thumbnail key={src} src={src} alt={`${side}, photo ${i + 1}`} onClick={none} />)}</span>;
}
function More({ label }: { label: string }) {
  return <ActionMenu label={label} compact actions={[{ id: 'edit', label: 'Edit', icon: 'edit' }, { id: 'delete', label: 'Delete', icon: 'trash-bin' }]} />;
}

/** Figma "Equipment Container" (17013:51030): the equipment the ticket is about, with its key facts in one line. */
function EquipmentCard({ task }: { task: Task }) {
  if (!task.equipment) {
    return (
      <div className="td-equipment">
        <div className="td-inline"><span className="td-muted-title">Equipment</span><Tag variant="dashed" onClick={none}>Add</Tag></div>
        <EmptyState icon="equipment">Nothing assigned</EmptyState>
      </div>
    );
  }
  const facts: Array<{ icon: IconName; label: string; value: ReactNode }> = [
    { icon: 'info-circle', label: 'Status', value: <span className="td-equipment__status"><ColorDot color="var(--syn-color-success-mantis)" />Active</span> },
    { icon: 'id', label: 'IN', value: '1245IB88' },
    { icon: 'nav-crew', label: 'Assigning', value: 'Bremen' },
    { icon: 'pin-nadal', label: 'Current Warehouse', value: <>Bremen Lagerplatz<span className="wk-muted">(Halensee Roadworks)</span></> },
    { icon: 'bmti-warehouyse', label: 'Warehouse', value: 'Bremen' },
    { icon: 'person', label: 'Operator', value: personName('M.M') },
    { icon: 'nav-person', label: 'Crew', value: 'Dream Team' },
  ];
  return (
    <div className="td-equipment">
      <span className="td-muted-title">Equipment</span>
      <div className="td-equipment__card">
        <img src={task.equipment?.photo ?? noImage} alt="" className="td-equipment__photo" />
        <div className="td-equipment__main">
          <div className="td-equipment__head">
            <h4 className="td-equipment__name">2013 {task.equipment?.name ?? 'Caterpillar ZX350LC-5N'} <span className="wk-muted">({task.equipment ? task.equipment.number : 'Cat xz350'})</span></h4>
            <span className="td-equipment__kind">Heavy crawler Excavator</span>
          </div>
          <div className="td-equipment__facts">
            <dl>
              {facts.map((f) => (
                <div key={f.label} className="td-equipment__fact">
                  <dt><Icon name={f.icon} size={16} />{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            <IconButton icon="gps-location-default" label="Show on map" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface Hours { id: number; user: string; hours: number }

/** Figma "Working Hours" (17028:16890): who spent how long, a row to add more, and the total. */
function WorkingHours({ initial }: { initial: number }) {
  const [rows, setRows] = useState<Hours[]>([{ id: 1, user: 'M.M', hours: initial }, { id: 2, user: 'A.S', hours: 4 }]);
  const [adding, setAdding] = useState(true);
  const [user, setUser] = useState('M.M');
  const [hours, setHours] = useState('8');
  const total = rows.reduce((s, r) => s + r.hours, 0);
  const save = () => {
    const h = Number(hours.replace(',', '.'));
    if (!user || !Number.isFinite(h) || h <= 0) return;
    setRows((r) => [...r, { id: Date.now(), user, hours: h }]);
    setHours('8'); setAdding(false);
  };
  return (
    <Section
      title="Working Hours" collapsible className="td-hours"
      actions={<IconButton icon="plus-in-circle" label="Add working hours" className="td-add" onClick={() => setAdding(true)} />}
    >
      <ul className="td-hours__list">
        {rows.map((r) => (
          <li key={r.id} className="td-hours__row">
            <Property label="User">{personName(r.user)}</Property>
            <Property label="Spend Hours">{r.hours} H</Property>
            <ActionMenu label={`${personName(r.user)}, ${r.hours} hours: actions`} compact actions={[{ id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => setRows((x) => x.filter((y) => y.id !== r.id)) }]} />
          </li>
        ))}
        {adding && (
          <li className="td-hours__row is-form">
            <label className="td-hours__field"><span className="td-hours__label">User</span>
              <Select label="User" size="sm" value={user} onChange={setUser} options={people.map((p) => ({ value: p.initials, label: p.name }))} />
            </label>
            <label className="td-hours__field"><span className="td-hours__label">Spend Hours</span>
              <TextField label="Spend hours" hideLabel size="sm" iconStart="time" suffix="h" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
            </label>
            <span className="td-hours__buttons">
              <Button variant="accent" size="sm" iconStart="check-in-circle" onClick={save}>Save</Button>
              <Button variant="secondary" size="sm" iconStart="x-in-circle" onClick={() => setAdding(false)}>Discard</Button>
            </span>
          </li>
        )}
      </ul>
      <p className="td-total">Total Working hours <strong>{total}</strong> Hours</p>
    </Section>
  );
}

/** Figma "Mark complete" (946:15885): a dashed round box and the label; done, the Mantis "Completed" pill. */
function CompleteToggle({ done, onToggle, disabled }: { done: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={done ? 'td-complete is-done' : 'td-complete'} aria-pressed={done} disabled={disabled} onClick={onToggle}>
      {done ? <Icon name="dublecheck" size={14} /> : <span className="td-complete__box" aria-hidden />}
      <span className="td-complete__label">{done ? 'Completed' : 'Mark complete'}</span>
    </button>
  );
}

export type DrawerMode = 'create' | 'edit' | 'archived';

/**
 * The ticket drawer of the Werkstatt board, Figma "Edit Ticket" (17013:50919), "Create ticket" (946:12390) and the
 * archived ticket (8378:31073). It follows Syn's record drawer reference (playground/RecordDrawer.tsx) and adds the
 * equipment card and Working Hours. Edit: every field of the head edits in place, Status moves the card, Update keeps
 * the changes and Discard drops them. Create: the empty form, Submit adds the ticket. Archived: read only, with who
 * archived it and when; Restore puts it back on the board.
 */
/**
 * Figma "Move" (5318:31096): opens to the left of the "..." menu; Move to Board and Column / Status, then Move.
 */
function MovePanel({ task, boards, onMove, onClose }: {
  task: Task; boards: Board[]; onMove: (board: string, column: string) => void; onClose: () => void;
}) {
  const [boardId, setBoardId] = useState(task.board ?? 'bremen');
  const board = boards.find((b) => b.id === boardId) ?? boards[0];
  const [column, setColumn] = useState(board.columns.some((c) => c.id === task.column) ? task.column : board.columns[0].id);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>('button')?.focus();
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node) && !(e.target as HTMLElement).closest('[role="listbox"]')) onClose(); };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [onClose]);
  return (
    <div ref={root} className="td-move" role="dialog" aria-label={`Move ${task.title}`} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose(); } }}>
      <label className="td-move__field"><span className="td-move__label">Move to Board</span>
        <Select label="Move to Board" size="md" value={boardId} onChange={(v) => { setBoardId(v); const b = boards.find((x) => x.id === v); if (b && !b.columns.some((c) => c.id === column)) setColumn(b.columns[0].id); }} options={boards.map((b) => ({ value: b.id, label: b.name }))} />
      </label>
      <label className="td-move__field"><span className="td-move__label">Column/ Status</span>
        <Select label="Column / Status" size="md" value={column} onChange={setColumn} options={board.columns.map((c) => ({ value: c.id, label: c.label }))} />
      </label>
      <Button variant="accent" size="sm" className="td-move__go" onClick={() => onMove(boardId, column)}>Move</Button>
    </div>
  );
}

export function TaskDrawer({ task, mode = 'edit', archived, columns, onClose, onSave, onRestore, boards = [], onArchive, onDuplicate, onMove, onDelete }: {
  boards?: Board[];
  onArchive?: (t: Task) => void;
  onDuplicate?: (t: Task) => void;
  onMove?: (t: Task, board: string, column: string) => void;
  onDelete?: (t: Task) => void;
  task: Task | null;
  mode?: DrawerMode;
  archived?: { by: string; at: string };
  columns: Column[];
  onClose: () => void;
  onSave: (t: Task) => void;
  onRestore?: () => void;
}) {
  const [draft, setDraft] = useState<Task | null>(task);
  const [view, setView] = useState('comments');
  const [comment, setComment] = useState('');
  const [tried, setTried] = useState(false);
  const [moving, setMoving] = useState(false);
  useEffect(() => { if (task) { setDraft(task); setTried(false); setMoving(false); } }, [task]);
  const t = draft ?? task;
  if (!t) return <Drawer open={false} onClose={onClose} label="Ticket" />;
  const creating = mode === 'create';
  const ro = mode === 'archived';
  const missing = creating && !t.title.trim();
  const submit = () => { setTried(true); if (!missing) onSave({ ...t, title: t.title.trim() }); };

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      label={creating ? 'New ticket' : t.title}
      className={ro ? 'td-drawer is-archived' : 'td-drawer'}
      headerStart={<>
        {/* Figma 3140:10483: the statuses with their dots, always in the header's left corner; Archived archives the ticket. */}
        <MenuButton
          label={`Status: ${ro ? 'Archived' : columns.find((c) => c.id === t.column)?.label}. Change`} className={`td-status is-${ro ? 'archived' : t.column}`}
          align="start" check={false} className2="td-pick__menu"
          choices={[...columns.map((c) => ({ value: c.id, label: c.label, dot: c.color })), ...(creating ? [] : [{ value: 'archived', label: 'Archived', dot: 'var(--syn-color-white-white)' }])]}
          value={ro ? 'archived' : t.column}
          onChange={(v) => {
            if (ro) return;
            if (v === 'archived') { onArchive?.(t); return; }
            setDraft({ ...t, column: v, done: columns.find((c) => c.id === v)?.done ?? t.done });
          }}
        >
          <span className="td-status__dot" style={{ background: ro ? 'var(--syn-color-white-white)' : columns.find((c) => c.id === t.column)?.color }} aria-hidden />
          {ro ? 'Archived' : columns.find((c) => c.id === t.column)?.label}<Icon name="down" size={12} />
        </MenuButton>
        <CompleteToggle done={t.done} disabled={ro} onToggle={() => setDraft({ ...t, done: !t.done })} />
        {!creating && <span className="td-id"><Icon name="settings" size={16} />{t.ticket}</span>}
      </>}
      headerActions={creating ? undefined : <>
        <IconButton icon="share" label="Share" size="sm" />
        <span className="td-more">
          {/* Figma 966:5957 (archived 9478:9893): Archive or Restore, Duplicate, Move, Delete. */}
          <ActionMenu
            label="More actions"
            actions={[
              ro ? { id: 'restore', label: 'Restore', icon: 'refresh-change' as const, onSelect: () => onRestore?.() }
                : { id: 'archive', label: 'Archive', icon: 'archive' as const, onSelect: () => onArchive?.(t) },
              { id: 'duplicate', label: 'Duplicate', icon: 'copy', onSelect: () => onDuplicate?.(t) },
              { id: 'move', label: 'Move', icon: 'arrow', onSelect: () => setMoving(true) },
              { id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => onDelete?.(t) },
            ]}
          />
          {moving && <MovePanel task={t} boards={boards} onClose={() => setMoving(false)} onMove={(b, c) => { setMoving(false); onMove?.(t, b, c); }} />}
        </span>
      </>}
      footer={<>
        <Button variant="text" onClick={onClose}>{ro ? 'Close' : 'Discard'}</Button>
        {ro
          ? <Button size="md" className="td-update" iconStart="refresh-change" onClick={onRestore}>Restore</Button>
          : <Button size="md" className="td-update" onClick={creating ? submit : () => onSave(t)}>{creating ? 'Submit' : 'Update'}</Button>}
      </>}
    >
      {ro && <Icon name="archive" size={96} className="td-watermark" />}
      <DrawerRow>
        <div className="td-title">
          <TicketTitle task={t} mode={mode} archived={archived} onChange={setDraft} />
        </div>
        {tried && missing && <p className="td-error" role="alert">Give the ticket a name to submit it.</p>}
      </DrawerRow>
      <div className="td-props-row"><TicketProps task={t} readOnly={ro} onChange={setDraft} /></div>

      {creating ? (
        <>
      <Section title="Details" collapsible>
        <div className="td-inline"><span className="td-muted-title">Equipment</span><Tag variant="dashed" onClick={none}>Add</Tag></div>
        <EmptyState icon="equipment">Nothing assigned</EmptyState>
        <Card title="Template" className="td-empty-card"><p className="td-nothing">Nothing attached</p></Card>
      </Section>
      <Section title="Custom fields" collapsible><p className="td-nothing">Nothing yet</p></Section>
      <Section title="Checklist" collapsible>
        <TicketChecklist initial={[]} />
      </Section>
      <Section title="Recources" collapsible actions={<IconButton icon="plus-in-circle" label="Add resource" className="td-add" />}>
        <div className="td-resources-head">
          <Property label="Reparation Start Date" icon="calendar" className="td-inline-prop"><Tag variant="soft">01.02.2026 14:48</Tag></Property>
          <Property label="Reparation End Date" icon="calendar" className="td-inline-prop"><Tag variant="soft">01.02.2026 14:48</Tag></Property>
        </div>
        <div className="td-empty-table">
          <div className="td-empty-table__head" aria-hidden>{['Date', 'Name', 'Amount', 'Unit Price', 'Total', 'File'].map((h) => <span key={h}>{h}</span>)}</div>
          <p className="td-nothing">Nothing yet</p>
        </div>
      </Section>
        </>
      ) : (
        <>
      <Section title="Details">
        <EquipmentCard task={t} />
        <Section title="Protocol" size="lg" collapsible>
          <div className="td-protocol-head">
            <h4 className="td-protocol-title">Pipe Damage</h4>
            <FileItem name="Manuals and Document (DE)" meta="256 MB" href="#" />
          </div>
          <Card title="Main Loss">
            <Grid gap={20}>
              <GridItem span={4}><Property variant="tile" label="What is Damaged">Back Side<p className="td-tile-text">{lorem} {lorem}</p></Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Secondary Affected Area">Front Side</Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Affected Area">Front Side<Photos side="Front side" /><p className="td-tile-text">A damage report is provided by a repairer to help us understand the background to a claim.</p></Property></GridItem>
            </Grid>
          </Card>
          <Card title="Secondary Loss">
            <Grid gap={20}>
              <GridItem span={4}><Property variant="tile" label="What is Damaged">Back Side</Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Secondary Affected Area">Front Side</Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Secondary Affected Area">Front Side</Property></GridItem>
            </Grid>
          </Card>
          <Card title="Overall Damage">
            <Grid gap={20}>
              <GridItem span={4}><Property variant="tile" label="What is Damaged">Left Side</Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Secondary Affected Area">Right Side</Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Secondary Affected Area">Left Side</Property></GridItem>
              <GridItem span={4}><Property variant="tile" label="Affected Area" className="td-tile-row">Right Side<Photos side="Right side" /></Property></GridItem>
            </Grid>
          </Card>
          <Card title="Attachments" className="td-attachments">
            <FileItem name="Manuals and Document (DE)" meta="256 MB" preview={cover} previewAlt="Damaged car, front left" onRemove={none} />
          </Card>
        </Section>
      </Section>

      <Section title="Custom fields" collapsible>
        <Grid>
          <GridItem span={4} spanSm={12}><Property label="Dropdown">Back Side<p className="td-tile-text">{lorem}</p></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Range"><span><span className="wk-muted">From</span> 12 <span className="wk-muted">%</span> <span className="wk-muted">To</span> 12 <span className="wk-muted">%</span></span></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="File"><span><Tag color="var(--syn-color-secondary-amber)" onClick={none}>File Name.PDF</Tag></span></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Photo upload"><span><Thumbnail src={photo1} alt="Uploaded photo" onClick={none} /></span></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Counter"><Value unit="kg">36</Value></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Photo upload"><Photos side="Uploaded" /></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Slider"><Value unit="%">40</Value></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Date">01.01.2029</Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Time">16:48</Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Rating"><span className="td-rating"><Icon name="star" size={16} />4</span></Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Toggle">Answer 1</Property></GridItem>
          <GridItem span={4} spanSm={12}><Property label="Single Choice">Answer 1</Property></GridItem>
        </Grid>
      </Section>

      <Section title="Checklist" collapsible actions={<IconButton icon="plus-in-circle" label="Add checklist" className="td-add" />}>
        <Card title="Roofing material assessment" actions={<More label="Checklist actions" />} className="td-checklist">
          <TicketChecklist initial={[
            { id: 'c1', text: 'A checklist is an organized list of tasks, steps, or items you need to do, verify, or remember. It acts as an easy-to-read guide to make sure you complete a job perfectly and do not forget any important', done: false },
            { id: 'c2', text: 'Conducting a roofing material assessment involves evaluating the condition and suitability of various materials. It is essential for making informed decisions on repairs or replacements, maintaining safety and functionality.', done: true, due: '01.01.2048' },
            { id: 'c3', text: 'Conducting a roofing material assessment involves evaluating the condition and suitability of various materials.', done: false, due: '01.01.2048', people: crew },
          ]} />
        </Card>
      </Section>

      {!ro && <WorkingHours initial={t.hours ?? 8} />}

      <Section title="Resources" collapsible>
        <div className="td-resources-head">
          <Property label="Reparation Start Date" icon="calendar" className="td-inline-prop"><Tag variant="soft">01.02.2026 14:48</Tag></Property>
          <Property label="Reparation End Date" icon="calendar" className="td-inline-prop"><Tag variant="soft">01.02.2026 14:48</Tag></Property>
          <IconButton icon="plus-in-circle" label="Add resource" variant="outline" className="td-add td-add--end" />
        </div>
        <Table
          caption="Resources"
          rows={resources}
          rowKey={(r) => r.name}
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'name', header: 'Name' },
            { key: 'amount', header: 'Amount', render: (r) => <Value unit={r.unit}>{r.amount}</Value> },
            { key: 'price', header: 'Unit Price', render: (r) => <Value unit="Eur" muted={r.file}>{r.price}</Value> },
            { key: 'total', header: 'Total', render: (r) => <Value unit="Eur">{r.amount * r.price}</Value> },
            { key: 'file', header: 'File', render: (r) => (r.file ? <Tag color="var(--syn-color-secondary-amber)" onClick={none}>PDF</Tag> : <IconButton icon="plus-in-circle" label={`Add file to ${r.name}`} className="td-add-file" />) },
          ]}
          rowActions={(r) => <More label={`${r.name} actions`} />}
          footer={<span className="td-cost"><span aria-hidden>€</span> Total cost <strong>{resources.reduce((s, r) => s + r.amount * r.price, 0)}</strong> Eur</span>}
        />
      </Section>

      <div className="td-activity">
        <Segmented label="Show" value={view} onChange={setView} options={[{ value: 'comments', label: 'Comments' }, { value: 'activity', label: 'Activity' }]} />
        {view === 'comments' ? (
          <div className="td-comments">
            <Comment
              author={personName('M.M')} date="11.01.2025" time="12:23"
              actions={<IconButton icon="attach" label="Attach a file" variant="outline" />}
              editor={<CommentEditor label="Write a comment" value={comment} onChange={(e) => setComment(e.target.value)} onDiscard={() => setComment('')} onSave={() => setComment('')} autoFocus={false} />}
            />
            <Comment
              author={personName('M.M')} date="11.01.2025" time="12:23" actions={<More label="Comment actions" />}
              footer={<><Tag color="var(--syn-color-secondary-amber)">PDF</Tag><Button size="xs" shape="pill" className="td-reply">Reply</Button></>}
            >
              “The only way to solve the problem is to code for the hardware directly—just make sure that it's clearly commented”
            </Comment>
            <Comment
              author="Anna Schmidt" date="12.01.2025" time="09:45" actions={<More label="Comment actions" />}
              footer={<Button size="xs" shape="pill" className="td-reply">Reply</Button>}
              replies={<CommentReply end={<Tag variant="soft" onClick={none}>12 Replies</Tag>}>The only way to solve the problem is to …</CommentReply>}
            >
              “Iterating through the data structure helps in optimizing the retrieval process—efficiency is key”
            </Comment>
            <Comment
              author="Lukas Müller" date="13.01.2025" time="14:15"
              footer={<><Tag color="var(--syn-color-secondary-amber)">PDF</Tag><Button size="xs" shape="pill" className="td-reply">Reply</Button></>}
            >
              “User feedback is crucial for the next version—listening to the audience shapes our direction”
            </Comment>
          </div>
        ) : (
          <EmptyState icon="history">No activity yet</EmptyState>
        )}
      </div>
        </>
      )}
    </Drawer>
  );
}
