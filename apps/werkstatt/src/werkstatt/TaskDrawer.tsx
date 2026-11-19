import { useEffect, useState, type ReactNode } from 'react';
import {
  Button, Card, Checklist, ChecklistItem, ColorDot, Comment, CommentEditor, CommentReply, Drawer, DrawerRow, EmptyState,
  FileItem, Grid, GridItem, Icon, IconButton, ProgressBar, Property, Section, Segmented, Select, Table, Tag, TextField,
  Thumbnail, Value, type IconName,
} from '@syn/design-system';
import { ActionMenu } from '@sam/shared';
import { dottedDateTime, insuranceLabel, people, personName, type Column, type Task } from '../data/werkstatt';
import { ConditionChip, PriorityChip } from './TaskCard';
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

const tagColors: Array<[string, string]> = [
  ['Caterpillar 6090', '#459af7'], ['Komatsu PC8000', '#591ea1'], ['Hitachi EX8000', '#f74583'],
  ['P&H 4100XPC', '#41a619'], ['Liebherr R9800', '#d46c2b'],
];
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

/**
 * The ticket drawer of the Werkstatt board, Figma "Edit Ticket" (17013:50919). It follows Syn's record drawer
 * reference (playground/RecordDrawer.tsx) and adds the equipment card and Working Hours from the Figma frame.
 * Status moves the card between the board's columns; Update keeps the change, Discard drops it.
 */
export function TaskDrawer({ task, columns, onClose, onSave }: {
  task: Task | null;
  columns: Column[];
  onClose: () => void;
  onSave: (t: Task) => void;
}) {
  const [draft, setDraft] = useState<Task | null>(task);
  const [tags, setTags] = useState(tagColors);
  const [collaborators, setCollaborators] = useState(['M.M', 'N.N', 'O.O', 'P.P', 'Q.Q'].map((name, id) => ({ id, name })));
  const [view, setView] = useState('comments');
  const [comment, setComment] = useState('');
  const [items, setItems] = useState([false, true, false]);
  useEffect(() => { if (task) setDraft(task); }, [task]);
  const t = draft ?? task;
  const done = items.filter(Boolean).length;
  if (!t) return <Drawer open={false} onClose={onClose} label="Ticket" />;
  const column = columns.find((c) => c.id === t.column);

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      label={t.title}
      className="td-drawer"
      headerStart={<>
        {t.done
          ? <Tag color="var(--syn-color-success-mantis)" icon="dublecheck">Completed</Tag>
          : <Tag color={column?.id === 'progress' ? 'var(--syn-color-secondary-amber)' : 'var(--syn-color-secondary-silver-chalince)'}>{column?.label ?? 'Open'}</Tag>}
        <span className="td-id"><Icon name="settings" size={16} />{t.ticket}</span>
      </>}
      headerActions={<>
        <IconButton icon="share" label="Share" size="sm" />
        <IconButton icon="dotshorizontal" label="More actions" size="sm" />
      </>}
      footer={<>
        <Button variant="text" onClick={onClose}>Discard</Button>
        <Button size="md" className="td-update" onClick={() => onSave(t)}>Update</Button>
      </>}
    >
      <DrawerRow>
        <div className="td-title">
          <div>
            <h2 className="td-title__text">{t.title}</h2>
            <p className="td-title__lead">{lorem} {lorem}</p>
          </div>
          <Select
            label="Status" size="xs" value={t.column}
            onChange={(v) => setDraft({ ...t, column: v, done: columns.find((c) => c.id === v)?.done ?? t.done })}
            options={columns.map((c) => ({ value: c.id, label: c.label }))}
          />
        </div>
      </DrawerRow>

      <DrawerRow end={<Property label="Assignee" icon="person" className="td-end">{t.assignee ? <Tag color="var(--syn-color-secondary-dodger-blue)" shape="rounded">{personName(t.assignee)}</Tag> : <Tag variant="dashed" onClick={() => setDraft({ ...t, assignee: 'M.M' })}>Assign</Tag>}</Property>}>
        <Grid gap={24}>
          <GridItem span={3} spanSm={6}><Property label="Condition" icon="maintenance">{t.condition ? <ConditionChip value={t.condition} /> : <span className="wk-muted">—</span>}</Property></GridItem>
          <GridItem span={3} spanSm={6}><Property label="Priority" icon="up">{t.priority ? <PriorityChip value={t.priority} /> : <span className="wk-muted">—</span>}</Property></GridItem>
          <GridItem span={3} spanSm={6}><Property label="Insurance case" icon="insurance"><strong className="td-strong">{t.insurance ? insuranceLabel[t.insurance] : '—'}</strong></Property></GridItem>
          <GridItem span={3} spanSm={6}><Property label="Due date" icon="calendar">{t.due ? <Tag variant="soft">{dottedDateTime(t.due)}</Tag> : <span className="wk-muted">—</span>}</Property></GridItem>
        </Grid>
      </DrawerRow>

      <DrawerRow label="Collaborators" icon="person" end={<IconButton icon="adduser" label="Add collaborator" size="xs" variant="outline" />}>
        {collaborators.map((c) => (
          <Tag key={c.id} removeIcon="x-in-circle" removeLabel={`Remove ${c.name}`} onRemove={() => setCollaborators(collaborators.filter((x) => x.id !== c.id))}>{c.name}</Tag>
        ))}
      </DrawerRow>

      <DrawerRow label="Tags" icon="tag" end={<Tag variant="dashed" onClick={none}>Add</Tag>}>
        {tags.map(([name, color]) => <Tag key={name} color={color} onRemove={() => setTags(tags.filter(([n]) => n !== name))}>{name}</Tag>)}
      </DrawerRow>

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
          <ProgressBar label={`${done}/${items.length}`} value={(done / items.length) * 100} title="Checklist progress" />
          <Checklist>
            {items.map((checked, i) => (
              <ChecklistItem
                key={i}
                checked={checked}
                onCheckedChange={(v) => setItems(items.map((x, j) => (j === i ? v : x)))}
                actions={<More label="Task actions" />}
                assignee={<Tag variant="soft" muted icon="person">Project Manager</Tag>}
                due={<Tag variant="soft" icon="calendar">Next Month</Tag>}
                extra={i === 2 ? crew.map(([n, c], k) => <Tag key={`${n}-${k}`} color={c} shape="rounded">{n}</Tag>) : undefined}
              >
                Conducting a roofing material assessment involves evaluating the condition and suitability of various materials. It is essential for making informed decisions on repairs or replacements, maintaining safety and functionality.
              </ChecklistItem>
            ))}
          </Checklist>
        </Card>
      </Section>

      <WorkingHours initial={t.hours ?? 8} />

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
    </Drawer>
  );
}
