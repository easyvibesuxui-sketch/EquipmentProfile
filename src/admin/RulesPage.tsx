import { useMemo, useState } from 'react';
import { Button, Card, ColorDot, Icon, Property, TextField } from '@syn/design-system';
import { ActionMenu, type MenuAction } from '../shared/ActionMenu';
import { dotted } from '../shared/forms';
import { currentAdmin, dailyJob, ruleTypes, sampleRules, type ChargingRule } from '../data/rules';
import { RuleDrawer, type RuleForm } from './RuleDrawer';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
let nextId = 100;

const condition = (r: ChargingRule) => `${ruleTypes[r.type].condition} ${r.time}`;
const status = (r: ChargingRule) => (r.enabled ? 'Enabled' : 'Disabled');

/** As in the SAM Notification Center: Disable is the stop circle, Activate the check circle. */
const toggleAction = (enabled: boolean, onSelect: () => void): MenuAction => (enabled
  ? { id: 'disable', label: 'Disable', icon: 'stop-in-circle', onSelect }
  : { id: 'activate', label: 'Activate', icon: 'check-in-circle', onSelect });

/** Figma "Text indicator names": a Silver Chalice pill with the ringed Mantis dot; Gray X when disabled. */
function RuleStatus({ enabled }: { enabled: boolean }) {
  return (
    <span className={enabled ? 'ep-rule-pill' : 'ep-rule-pill is-off'}>
      <ColorDot color={enabled ? 'var(--syn-status-success)' : 'var(--syn-text-disabled)'} />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  );
}

/**
 * The Daily booking job in the summary place of the general layout (Design system library "Settings templates",
 * 7966:19001), drawn with the SAM / RAM parts: a Syn Card (the SAM widget card) titled "Daily booking job", the RAM
 * status pill and "..." in its header, and Property tiles for what it does. One per organization, so not a row.
 */
function DailyJobCard({ job, onEdit, onToggle }: { job: ChargingRule; onEdit: () => void; onToggle: () => void }) {
  return (
    <Card
      title={ruleTypes.daily.name}
      className={job.enabled ? 'ep-job-card' : 'ep-job-card is-off'}
      actions={(
        <>
          <RuleStatus enabled={job.enabled} />
          <ActionMenu
            label="Daily booking job actions"
            actions={[{ id: 'edit', label: 'Edit', icon: 'edit', onSelect: onEdit }, toggleAction(job.enabled, onToggle)]}
          />
        </>
      )}
    >
      <div className="ep-job-card__tiles">
        <Property variant="tile" label="When a booking">
          <span className="ep-job-card__line"><ColorDot color={job.enabled ? 'var(--syn-status-success)' : 'var(--syn-text-disabled)'} />is In progress and ends today</span>
        </Property>
        <Property variant="tile" label="Then">
          <span className="ep-job-card__line">End date<Icon name="arrow" size={16} />tomorrow</span>
        </Property>
        <Property variant="tile" label="Not changed">
          <span className="ep-job-card__line">Completed, Planned, Reserved</span>
        </Property>
        <Property variant="tile" label="Runs daily at" icon="time">
          <span className="ep-job-card__line">{job.time}</span>
        </Property>
      </div>
    </Card>
  );
}

/**
 * Administration → Workflows → Rules on the general layout (Design system library "Settings templates", 7966:19001):
 * the page label, then on Cultured the Daily booking job card and the list card: search and Rule over
 * the charging rules (RAM Figma "Rules", 10562:37464, and its empty state, 10552:7519), with the count in the footer.
 * Each row's "..." edits, disables or activates, or deletes the rule.
 */
export function RulesPage({ startEmpty }: { startEmpty?: boolean }) {
  const [rules, setRules] = useState<ChargingRule[]>(() => (startEmpty ? [] : sampleRules));
  const [job, setJob] = useState<ChargingRule>(dailyJob);
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState<{ rule: ChargingRule | null } | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => [ruleTypes[r.type].name, condition(r), status(r), r.creator, dotted(r.created)]
      .some((v) => v.toLowerCase().includes(q)));
  }, [rules, query]);

  const save = (f: RuleForm) => {
    const editing = drawer?.rule;
    if (editing?.type === 'daily') setJob((j) => ({ ...j, ...f }));
    else if (editing) setRules((rs) => rs.map((r) => (r.id === editing.id ? { ...r, ...f } : r)));
    else setRules((rs) => [...rs, { id: `r${nextId++}`, ...f, creator: currentAdmin, created: todayIso() }]);
  };
  const toggle = (id: string) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  const remove = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

  return (
    <section className="ep-rules" aria-labelledby="ep-rules-title">
      {/* "If there is no tab, instead of tab must be page label." */}
      <header className="ep-rules__label">
        <h2 id="ep-rules-title" className="ep-rules__title syn-title-text">Rules</h2>
      </header>

      <div className="ep-rules__frame">
        <DailyJobCard job={job} onEdit={() => setDrawer({ rule: job })} onToggle={() => setJob((j) => ({ ...j, enabled: !j.enabled }))} />

        <div className="ep-rules__body">
          <div className="ep-rules__bar">
            <TextField
              label="Search rules" hideLabel size="sm" iconStart="search" placeholder="Search" value={query}
              onChange={(e) => setQuery(e.currentTarget.value)} onClear={() => setQuery('')} className="ep-rules__search"
            />
            <Button size="sm" iconStart="plus-in-circle" className="ep-rules__add" onClick={() => setDrawer({ rule: null })}>
              Rule
            </Button>
          </div>

          <div className="ep-rules__list" role="region" aria-label="Charging rules" tabIndex={shown.length ? 0 : -1}>
            <table className="ep-rules-table">
              <thead>
                <tr>
                  <th scope="col"><span>Rule</span></th>
                  <th scope="col"><span>Condition</span></th>
                  <th scope="col"><span>Status</span></th>
                  <th scope="col"><span>Creator</span></th>
                  <th scope="col"><span>Creation date</span></th>
                  <th scope="col" className="ep-rules-table__actions"><span><span className="ep-sr">Actions</span></span></th>
                </tr>
              </thead>
              {shown.length > 0 && (
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className={r.enabled ? undefined : 'is-off'}>
                      <td className="ep-rules-table__rule"><span className="syn-title-text">{ruleTypes[r.type].name}</span></td>
                      <td title={condition(r)}>{condition(r)}</td>
                      <td><RuleStatus enabled={r.enabled} /></td>
                      <td>{r.creator}</td>
                      <td>{dotted(r.created)}</td>
                      <td className="ep-rules-table__actions">
                        <ActionMenu
                          label={`${ruleTypes[r.type].name} actions, ${dotted(r.created)}`}
                          actions={[
                            { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setDrawer({ rule: r }) },
                            toggleAction(r.enabled, () => toggle(r.id)),
                            { id: 'delete', label: 'Delete', icon: 'trash-bin', onSelect: () => remove(r.id) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            {!shown.length && (
              <div className="ep-rules__empty" role="status">
                <Icon name="empty-state" size={38} />
                <p className="ep-rules__empty-text">{rules.length ? `No rules match “${query.trim()}”` : 'List is empty'}</p>
              </div>
            )}
          </div>

          <footer className="ep-rules__foot" aria-live="polite">
            <span>Count</span><span>{shown.length}</span>
          </footer>
        </div>
      </div>

      <RuleDrawer
        open={drawer !== null} kind={drawer?.rule?.type === 'daily' ? 'daily' : 'charging'} rule={drawer?.rule ?? null}
        onClose={() => setDrawer(null)} onSubmit={save}
      />
    </section>
  );
}
