import type { DragEvent, KeyboardEvent } from 'react';
import { Icon, type IconName } from '@syn/design-system';
import { ActionMenu, type MenuAction } from '@sam/shared';
import {
  cardDate, conditions, dueState, insuranceLabel, personName, priorities, tagColor, type Condition, type Priority, type Task,
} from '../data/werkstatt';

const priorityIcon: Record<Priority, IconName> = { blocker: 'critical', high: 'up', medium: 'medium', low: 'down' };
const conditionIcon: Partial<Record<Condition, IconName>> = { 'cant-work': 'cant-work', destroyed: 'warning' };

/** Figma "Priority": 24px chip, 8px corners, Title 6. Blocker Candy Apple, High Misty Rose, Medium Cultured, Low outlined. */
export function PriorityChip({ value }: { value: Priority }) {
  return (
    <span className={`wk-chip wk-priority is-${value}`}>
      <Icon name={priorityIcon[value]} size={value === 'blocker' ? 14 : 12} />
      <span className="syn-title-text">{priorities.find((p) => p.value === value)?.label}</span>
    </span>
  );
}

/** Figma "Condition": Can work outlined Cultured, Can't work outlined Silver Chalice, Destroyed Eerie Black with Honey. */
export function ConditionChip({ value }: { value: Condition }) {
  const icon = conditionIcon[value];
  return (
    <span className={`wk-chip wk-condition is-${value}`}>
      {icon && <Icon name={icon} size={14} />}
      <span className="syn-title-text">{conditions.find((c) => c.value === value)?.label}</span>
    </span>
  );
}

/** The round checkbox of the card name: dashed while open, Mantis with a check once done. */
export function DoneCheck({ done, title, onToggle }: { done: boolean; title: string; onToggle: () => void }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={done}
      aria-label={done ? `${title}: done. Mark as not done` : `${title}: mark as done`}
      className={done ? 'wk-check is-done' : 'wk-check'}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
    >
      {done && <Icon name="dublecheck" size={14} />}
    </button>
  );
}

/**
 * Figma "Assign user" (943:1044): the dashed circle when nobody is assigned, the Misty Rose initials of the assignee,
 * and the collaborators stacked after it (Cultured, overlapping by 8px; "+N" past three).
 */
export function Assignee({ initials, others = [] }: { initials?: string; others?: string[] }) {
  if (!initials && !others.length) {
    return <span className="wk-assignee is-empty"><Icon name="person" size={14} /><span className="wk-sr">Not assigned</span></span>;
  }
  const people = [initials, ...others].filter(Boolean) as string[];
  const shown = people.slice(0, 3);
  return (
    <span className="wk-assignees" title={people.map(personName).join(', ')}>
      {shown.map((p, i) => <span key={p} className={i === 0 && initials ? 'wk-assignee' : 'wk-assignee is-other'} aria-hidden><span className="syn-text-crisp">{p}</span></span>)}
      {people.length > 3 && <span className="wk-assignee is-other" aria-hidden>+{people.length - 3}</span>}
      <span className="wk-sr">{initials ? `Assigned to ${personName(initials)}` : 'Not assigned'}{others.length ? `, with ${others.map(personName).join(', ')}` : ''}</span>
    </span>
  );
}

interface Props {
  task: Task;
  actions: MenuAction[];
  onOpen: () => void;
  onToggleDone: () => void;
  dragging?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: () => void;
  onKeyMove?: (dir: -1 | 1) => void;
}

/**
 * Figma "Card" of the Werkstatt board: name row (round checkbox, title, "..." menu), the body (equipment,
 * due date, location, insurance, hours, priority and condition chips, tag bookmarks) and the footer (assignee,
 * ticket id, attachments and comments). Every part is optional: a card shows what the task has.
 */
export function TaskCard({ task, actions, onOpen, onToggleDone, dragging, onDragStart, onDragEnd, onKeyMove }: Props) {
  const due = dueState(task);
  const onKey = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
    // Alt + Left/Right moves the card to the previous or next column.
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); onKeyMove?.(e.key === 'ArrowLeft' ? -1 : 1); }
  };
  return (
    <article
      className={['wk-card', task.done && 'is-done', dragging && 'is-dragging'].filter(Boolean).join(' ')}
      tabIndex={0}
      aria-label={`${task.title}, ${task.ticket}${task.done ? ', done' : ''}`}
      aria-describedby="wk-card-help"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menu"]')) onOpen(); }}
      onKeyDown={onKey}
      data-task={task.id}
    >
      <header className="wk-card__name">
        <DoneCheck done={task.done} title={task.title} onToggle={onToggleDone} />
        <h3 className="wk-card__title syn-title-text">{task.title}</h3>
        <ActionMenu label={`${task.title} actions`} actions={actions} compact />
      </header>

      <div className="wk-card__body">
        {task.equipment ? (
          <div className="wk-card__equipment">
            <img src={task.equipment.photo} alt="" className="wk-card__photo" />
            <div className="wk-card__equipment-text">
              <span className="wk-card__equipment-name syn-title-text">{task.equipment.name}</span>
              <span className="wk-muted">({task.equipment.number})</span>
            </div>
          </div>
        ) : (
          <div className="wk-card__equipment is-none">
            <span className="wk-card__photo is-none" aria-hidden><Icon name="equipment" size={20} /></span>
            <span className="wk-card__equipment-name syn-title-text wk-muted">Nothing Assigned</span>
          </div>
        )}
        {due && task.due && (
          <p className={`wk-line wk-due is-${due.tone}`}>
            <Icon name="calendar" size={14} />
            {due.tone === 'today'
              ? <span className="wk-due__date syn-title-text">{due.note}</span>
              : <><span className="wk-due__date syn-title-text">{cardDate(task.due)}</span><span className="wk-due__note">{due.note}</span></>}
          </p>
        )}
        {task.location && (
          <p className="wk-line">
            <Icon name={task.location.kind === 'warehouse' ? 'bmti-warehouyse' : 'nav-project'} size={14} />
            <span className="wk-line__text">{task.location.name}</span>
            <span className="wk-muted wk-ellipsis">{task.location.city}</span>
          </p>
        )}
        {task.insurance && (
          <p className={task.insurance === 'yes' ? 'wk-line' : 'wk-line is-muted'}>
            <Icon name="insurance" size={14} />
            <span className={task.insurance === 'not-relevant' ? '' : 'syn-title-text wk-line__title'}>{insuranceLabel[task.insurance]}</span>
            <span className="wk-sr"> insurance case</span>
          </p>
        )}
        {task.hours !== undefined && (
          <p className="wk-line">
            <Icon name="time" size={14} />
            <span className="wk-line__text">{task.hours}h</span>
            <span className="wk-sr"> worked</span>
          </p>
        )}
        {(task.priority || task.condition) && (
          <div className="wk-card__chips">
            {task.priority && <PriorityChip value={task.priority} />}
            {task.condition && <ConditionChip value={task.condition} />}
          </div>
        )}
        {task.tags && task.tags.length > 0 && (
          <ul className="wk-card__tags" aria-label="Tags">
            {task.tags.map((name) => <li key={name} style={{ color: tagColor(name) }} title={name}><Icon name="tagbookmark-filled" size={20} /><span className="wk-sr">{name}</span></li>)}
          </ul>
        )}
      </div>

      <footer className="wk-card__footer">
        <Assignee initials={task.assignee} others={task.collaborators} />
        <span className="wk-card__ticket"><Icon name="settings" size={16} />{task.ticket}</span>
        <span className="wk-card__counts">
          <span><Icon name="attach" size={16} />{task.attachments}<span className="wk-sr"> attachments</span></span>
          <span><Icon name="comment" size={16} />{task.comments}<span className="wk-sr"> comments</span></span>
        </span>
      </footer>
    </article>
  );
}
