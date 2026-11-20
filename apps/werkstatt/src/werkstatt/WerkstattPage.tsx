import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import {
  Button, Icon, IconButton, Notification, Segmented, Select, TextField,
} from '@syn/design-system';
import { notifications, type MenuAction } from '@sam/shared';
import {
  boards as allBoards, incomingTask, initialArchive, initialTasks, personName, priorities,
  blankTask, type ArchivedItem, type Board, type Task,
} from '../data/werkstatt';
import { TaskCard } from './TaskCard';
import { ArchivePanel } from './ArchivePanel';
import { activeFilters, FiltersDialog, noFilters, type BoardFilters } from './FiltersDialog';
import { MenuButton } from './MenuButton';
import { ListView } from './ListView';
import { TaskDrawer } from './TaskDrawer';
import './Werkstatt.css';

/** Figma "Sort by" (963:11801): Creation date or Due date; until one is chosen the cards keep their manual order. */
type Sort = 'manual' | 'created' | 'due';
const sorts: Array<{ value: Sort; label: string; icon: 'sort' }> = [
  { value: 'created', label: 'Creation date', icon: 'sort' },
  { value: 'due', label: 'Due date', icon: 'sort' },
];

function matches(t: Task, f: BoardFilters, search: string, priority: string) {
  const q = search.trim().toLowerCase();
  if (q && ![t.title, t.ticket, t.equipment?.name, t.equipment?.number, t.location?.name].some((s) => s?.toLowerCase().includes(q))) return false;
  const p = priority || f.priority;
  if (p && t.priority !== p) return false;
  if (f.completion && (f.completion === 'done') !== t.done) return false;
  if (f.assigned && (f.assigned === 'none' ? !!t.assignee : t.assignee !== f.assigned)) return false;
  if (f.createdBy && t.createdBy !== f.createdBy) return false;
  if (f.checkIn && (t.location?.kind !== f.checkInKind || t.location.name !== f.checkIn)) return false;
  if (f.due) {
    if (!t.due) return false;
    const end = new Date(`${f.due}T23:59:59`);
    if (new Date(t.due) > end) return false;
  }
  return true;
}

function sortTasks(list: Task[], sort: Sort) {
  if (sort === 'manual') return list;
  const copy = [...list];
  if (sort === 'due') copy.sort((a, b) => (a.due ? Date.parse(a.due) : Infinity) - (b.due ? Date.parse(b.due) : Infinity));
  if (sort === 'created') copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return copy;
}

/** Where a dragged card would land in a column: before the first card whose middle is below the pointer. */
function dropIndex(list: HTMLElement, y: number) {
  const cards = Array.from(list.querySelectorAll<HTMLElement>('.wk-card:not(.is-dragging)'));
  const i = cards.findIndex((c) => { const r = c.getBoundingClientRect(); return y < r.top + r.height / 2; });
  return i === -1 ? cards.length : i;
}

/**
 * The Werkstatt (workshop) board, Figma "Equipment Database" (946:13850), "Werkstatt full" (8757:17722, six
 * columns) and "WK" (17013:52604). Header: the board name with its switcher, Add Task and the Archived panel.
 * Toolbar: Filters, Search, Priority and Sort by. Columns hold the ticket cards; cards drag between and within
 * columns (or Alt + Left/Right). Board / List switches the view. `#empty` shows "No Board Yet" (1459:10561).
 */
export function WerkstattPage({ startEmpty }: { startEmpty?: boolean }) {
  const [boards, setBoards] = useState<Board[]>(startEmpty ? [] : allBoards);
  const [boardId, setBoardId] = useState(allBoards[0].id);
  const board = boards.find((b) => b.id === boardId) ?? boards[0];
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [archive, setArchive] = useState<ArchivedItem[]>(initialArchive);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState<Sort>('manual');
  const [filters, setFilters] = useState<BoardFilters>(noFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveButton = useRef<HTMLButtonElement>(null);
  const [openId, setOpenIdState] = useState<string | null>(null);
  // The drawer: an open ticket of the board, an archived one (read only) or a new one being created.
  const [drawerMode, setDrawerMode] = useState<'edit' | 'archived' | 'create'>('edit');
  const [newTask, setNewTask] = useState<Task | null>(null);
  const setOpenId = (id: string | null) => { setDrawerMode('edit'); setNewTask(null); setOpenIdState(id); };
  const today = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const [toast, setToast] = useState<{ title: string; by: string; at: string; ticket: string } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ column: string; index: number } | null>(null);
  const [announce, setAnnounce] = useState('');

  // A colleague adds a ticket a moment after the board opens: it lands in Initial and the toast tells who.
  useEffect(() => {
    if (!board) return undefined;
    const t = window.setTimeout(() => {
      setTasks((list) => (list.some((x) => x.id === incomingTask.id) ? list : [incomingTask, ...list]));
      setToast({ title: incomingTask.title, by: incomingTask.createdBy, at: incomingTask.createdAt, ticket: incomingTask.ticket });
      notifications.add({ verb: 'Added', title: incomingTask.title, board: board.name, ticket: incomingTask.ticket, by: incomingTask.createdBy, at: incomingTask.createdAt });
    }, 1500);
    return () => window.clearTimeout(t);
  }, [board]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const visible = useCallback((t: Task) => matches(t, filters, search, priority), [filters, search, priority]);
  const byColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    board?.columns.forEach((c) => map.set(c.id, sortTasks(tasks.filter((t) => t.column === c.id && visible(t)), sort)));
    return map;
  }, [board, tasks, visible, sort]);
  const filterCount = activeFilters(filters);

  const update = (id: string, patch: Partial<Task>) => setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const columnOf = (id: string) => board?.columns.find((c) => c.id === id);

  /** Moves a card to a column (at an index among that column's cards); a done column ticks it. */
  const move = (id: string, column: string, index?: number) => {
    setTasks((list) => {
      const task = list.find((t) => t.id === id);
      if (!task) return list;
      const col = columnOf(column);
      const moved = { ...task, column, done: col?.done ? true : column === task.column ? task.done : false };
      const rest = list.filter((t) => t.id !== id);
      const inColumn = rest.filter((t) => t.column === column);
      const before = index === undefined || index >= inColumn.length ? null : inColumn[index];
      const at = before ? rest.indexOf(before) : (inColumn.length ? rest.indexOf(inColumn[inColumn.length - 1]) + 1 : rest.length);
      rest.splice(at, 0, moved);
      return rest;
    });
    const col = columnOf(column);
    if (col) setAnnounce(`Moved to ${col.label}`);
  };
  const step = (task: Task, dir: -1 | 1) => {
    if (!board) return;
    const i = board.columns.findIndex((c) => c.id === task.column);
    const next = board.columns[i + dir];
    if (!next) return;
    move(task.id, next.id);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-task="${task.id}"]`)?.focus());
  };
  const archiveTask = (task: Task) => {
    setTasks((list) => list.filter((t) => t.id !== task.id));
    setArchive((a) => [{ task, by: personName('M.M'), at: today() }, ...a]);
    setAnnounce(`${task.title} archived`);
  };
  const restore = (id: string) => {
    const item = archive.find((a) => a.task.id === id);
    if (!item) return;
    setArchive((a) => a.filter((x) => x.task.id !== id));
    const column = board?.columns.some((c) => c.id === item.task.column) ? item.task.column : board?.columns[0].id ?? 'initial';
    setTasks((list) => [...list, { ...item.task, column }]);
    setAnnounce(`${item.task.title} restored`);
  };
  const deleteArchived = (id: string) => setArchive((a) => a.filter((x) => x.task.id !== id));
  const openArchived = (id: string) => { setArchiveOpen(false); setNewTask(null); setDrawerMode('archived'); setOpenIdState(id); };
  // Add Task (or a column's own "Add task") opens the empty ticket (Figma 946:12390); Submit puts it on the board.
  const addTask = (column?: string) => {
    setOpenIdState(null);
    setDrawerMode('create');
    setNewTask(blankTask(`t-${Date.now()}`, `DR-${12458 + tasks.length + archive.length}`, column ?? board?.columns[0].id ?? 'initial'));
  };
  const submitTask = (task: Task) => {
    setTasks((list) => [task, ...list]);
    setNewTask(null);
    setToast({ title: task.title, by: task.createdBy, at: task.createdAt, ticket: task.ticket });
    setAnnounce(`${task.title} added`);
  };
  const createBoard = () => { setBoards(allBoards); setBoardId(allBoards[0].id); };

  const actionsFor = (task: Task): MenuAction[] => {
    const i = board ? board.columns.findIndex((c) => c.id === task.column) : -1;
    const next = board?.columns[i + 1];
    return [
      { id: 'open', label: 'Open', icon: 'expand', onSelect: () => setOpenId(task.id) },
      ...(next ? [{ id: 'next', label: `Move to ${next.label}`, icon: 'arrow' as const, onSelect: () => move(task.id, next.id) }] : []),
      { id: 'archive', label: 'Archive', icon: 'archive', onSelect: () => archiveTask(task) },
    ];
  };

  const onDragOver = (e: DragEvent<HTMLElement>, column: string) => {
    if (!dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const index = dropIndex(e.currentTarget, e.clientY);
    if (dropAt?.column !== column || dropAt.index !== index) setDropAt({ column, index });
  };
  const onDrop = (e: DragEvent<HTMLElement>, column: string) => {
    e.preventDefault();
    if (dragId) move(dragId, column, dropIndex(e.currentTarget, e.clientY));
    setDragId(null); setDropAt(null);
  };

  const archivedOpen = drawerMode === 'archived' ? archive.find((a) => a.task.id === openId) : undefined;
  const openTask = drawerMode === 'create' ? newTask : drawerMode === 'archived' ? archivedOpen?.task ?? null : tasks.find((t) => t.id === openId) ?? null;

  if (!board) {
    // Figma 1459:10561: the board, greyed under the page veil, with the message in the middle.
    return (
      <div className="wk-page is-empty">
        <div className="wk-empty__backdrop" aria-hidden>
          <div className="wk-head">
            <span className="wk-head__name">Boardname</span>
            <span className="wk-head__actions"><Button size="xs" iconStart="plus-in-circle" tabIndex={-1}>Add Task</Button></span>
          </div>
          <div className="wk-toolbar">
            <span className="wk-toolbar__filters">
              {['Search', 'Priority', 'Completed', 'Assigned', 'Created by', 'Due date'].map((l) => <span key={l} className="wk-empty__field">{l}</span>)}
            </span>
          </div>
          <div className="wk-columns" style={{ '--wk-columns': allBoards[0].columns.length } as CSSProperties}>
            {allBoards[0].columns.map((c, i) => (
              <div key={c.id} className="wk-column">
                {i < 3 ? (
                  <div className="wk-column__label">
                    <span className="wk-column__status"><span className="wk-column__dot" style={{ '--wk-dot': c.color } as CSSProperties} /><span className="wk-column__name">{c.label}</span></span>
                  </div>
                ) : <div className="wk-column__label" />}
              </div>
            ))}
          </div>
        </div>
        <div className="wk-empty" role="region" aria-label="No board yet">
          <Icon name="kanban" size={72} className="wk-empty__icon" />
          <h1 className="wk-empty__title">No Board Yet</h1>
          <p className="wk-empty__text">For beginning Create Board</p>
          <Button variant="secondary" size="sm" className="wk-empty__button" onClick={createBoard}>Create Board</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="wk-page">
      <div className="wk-head">
        <div className="wk-head__board">
          <h1 className="wk-head__name">{board.name}</h1>
          <MenuButton
            label={`Switch board, current ${board.name}`} className="wk-head__switch"
            choices={boards.map((b) => ({ value: b.id, label: b.name }))} value={board.id} onChange={setBoardId}
          >
            <Icon name="werkstatt" size={16} /><Icon name="down" size={14} />
          </MenuButton>
        </div>
        <div className="wk-head__actions">
          <Button size="xs" iconStart="plus-in-circle" className="wk-head__add" onClick={() => addTask()}>Add Task</Button>
          <div className="wk-archive-anchor">
            <button
              ref={archiveButton} type="button" className="wk-head__archive" aria-label="Archived tasks" aria-expanded={archiveOpen}
              onClick={() => setArchiveOpen((o) => !o)}
            >
              <Icon name="archive" size={16} />
            </button>
            {archiveOpen && (
              <ArchivePanel
                items={archive} anchor={archiveButton.current}
                onRestore={restore} onDelete={deleteArchived} onOpen={openArchived}
                onClose={() => setArchiveOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="wk-board-frame">
        <div className="wk-toolbar">
          <div className="wk-toolbar__filters">
            <span className="wk-toolbar__filter">
              <IconButton icon="filter" label={filterCount ? `Filters, ${filterCount} set` : 'Filters'} variant="outline" size="sm" onClick={() => setFiltersOpen(true)} />
              {filterCount > 0 && <span className="wk-toolbar__badge" aria-hidden>{filterCount}</span>}
            </span>
            <span className="wk-toolbar__divider" aria-hidden />
            <TextField label="Search tasks" hideLabel size="sm" iconStart="search" placeholder="Search" className="wk-toolbar__search" value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
            <Select label="Priority" placeholder="Priority" size="sm" className="wk-toolbar__select" value={priority} onChange={setPriority} onClear={() => setPriority('')} options={priorities} />
            {(filterCount > 0 || search || priority) && (
              <Button variant="text" size="sm" iconStart="x-in-circle" className="wk-toolbar__reset" onClick={() => { setFilters(noFilters); setSearch(''); setPriority(''); }}>Reset filters</Button>
            )}
          </div>
          <MenuButton label={sort === 'manual' ? 'Sort by' : `Sort by: ${sorts.find((s) => s.value === sort)?.label}`} className="wk-toolbar__sort" choices={sorts} value={sort} onChange={(v) => setSort(v as Sort)} align="end" check={false}>
            <span>{sort === 'manual' ? 'Sort by' : sorts.find((s) => s.value === sort)?.label}</span><Icon name="down" size={14} />
          </MenuButton>
        </div>

        {view === 'board' ? (
          <div className="wk-columns" style={{ '--wk-columns': board.columns.length } as CSSProperties}>
            {board.columns.map((col) => {
              const list = byColumn.get(col.id) ?? [];
              const total = tasks.filter((t) => t.column === col.id).length;
              return (
                <section key={col.id} className="wk-column" aria-labelledby={`wk-col-${col.id}`}>
                  <header className="wk-column__label">
                    <span className="wk-column__status">
                      <span className="wk-column__dot" style={{ '--wk-dot': col.color } as CSSProperties} aria-hidden />
                      <h2 id={`wk-col-${col.id}`} className="wk-column__name syn-title-text">{col.label}</h2>
                    </span>
                    <span className="wk-column__count syn-title-text" aria-label={list.length === total ? `${total} tasks` : `${list.length} of ${total} tasks shown`}>{list.length}</span>
                  </header>
                  <div
                    className={['wk-column__cards', dropAt?.column === col.id && 'is-over'].filter(Boolean).join(' ')}
                    onDragOver={(e) => onDragOver(e, col.id)}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropAt(null); }}
                    onDrop={(e) => onDrop(e, col.id)}
                  >
                    {list.map((task, i) => (
                      <div key={task.id} className="wk-slot">
                        {dropAt?.column === col.id && dropAt.index === i && <span className="wk-drop" aria-hidden />}
                        <TaskCard
                          task={task}
                          actions={actionsFor(task)}
                          dragging={dragId === task.id}
                          onOpen={() => setOpenId(task.id)}
                          onToggleDone={() => update(task.id, { done: !task.done })}
                          onDragStart={(e) => { setDragId(task.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id); }}
                          onDragEnd={() => { setDragId(null); setDropAt(null); }}
                          onKeyMove={(dir) => step(task, dir)}
                        />
                      </div>
                    ))}
                    {dropAt?.column === col.id && dropAt.index >= list.length && <span className="wk-drop" aria-hidden />}
                    {list.length === 0 && !dropAt && <p className="wk-column__empty">{total ? 'No task matches the filters' : 'No tasks'}</p>}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <ListView
            columns={board.columns}
            tasksFor={(id) => byColumn.get(id) ?? []}
            totalFor={(id) => tasks.filter((t) => t.column === id).length}
            actionsFor={actionsFor}
            onOpen={setOpenId}
            onToggleDone={(t) => update(t.id, { done: !t.done })}
            archived={archive} onOpenArchived={openArchived} onRestore={restore} onAddTask={addTask}
          />
        )}
      </div>

      <div className="wk-view-toggle">
        <Segmented
          label="View" value={view} onChange={(v) => setView(v as 'board' | 'list')}
          options={[
            { value: 'board', label: <span className="wk-view-toggle__option"><Icon name="kanban" size={16} />Board</span> },
            { value: 'list', label: <span className="wk-view-toggle__option"><Icon name="list" size={16} />List</span> },
          ]}
        />
      </div>

      {toast && (
        <div className="wk-toast">
          <Notification
            variant="toast" tone="info"
            title={<><span className="wk-toast__verb">Added</span> {toast.title}</>}
            timestamp={<span className="wk-toast__meta">{toast.by} <span className="wk-muted">◦</span> {new Date(toast.at).toLocaleDateString('de-DE')} <span className="wk-muted">{new Date(toast.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span></span>}
            onClose={() => setToast(null)}
          >
            <span className="wk-toast__meta"><Icon name="werkstatt" size={12} />{board.name} <span className="wk-muted">◦</span> <Icon name="settings" size={12} />{toast.ticket}</span>
          </Notification>
        </div>
      )}

      <p id="wk-card-help" className="wk-sr">Enter opens the ticket. Alt and the left or right arrow move it to the previous or next column.</p>
      <p className="wk-sr" role="status" aria-live="polite">{announce}</p>

      <FiltersDialog
        open={filtersOpen} value={filters}
        count={(f) => tasks.filter((t) => matches(t, f, search, priority)).length}
        onApply={(f) => { setFilters(f); setFiltersOpen(false); }}
        onClose={() => setFiltersOpen(false)}
      />
      <TaskDrawer
        task={openTask} columns={board.columns} mode={drawerMode}
        archived={archivedOpen ? { by: archivedOpen.by, at: archivedOpen.at } : undefined}
        onClose={() => setOpenId(null)}
        onRestore={() => { if (openId) restore(openId); setOpenId(null); }}
        onSave={(t) => {
          if (drawerMode === 'create') submitTask(t);
          else setTasks((list) => list.map((x) => (x.id === t.id ? t : x)));
          setOpenId(null);
        }}
      />
    </div>
  );
}
