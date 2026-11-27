import { useMemo, useState } from 'react';
import { Button, ColorDot, Icon, TextField } from '@syn/design-system';
import { ActionMenu } from '../shared/ActionMenu';
import { dotted } from '../shared/forms';
import { currentAdmin, ruleTypes, sampleRules, type ChargingRule } from '../data/rules';
import { RuleDrawer, type RuleForm } from './RuleDrawer';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
let nextId = 100;

const condition = (r: ChargingRule) => `${ruleTypes[r.type].condition} ${r.time}`;
const status = (r: ChargingRule) => (r.enabled ? 'Enabled' : 'Disabled');

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
 * Administration → Workflows → Rules: Figma "Rules" (10562:37464) and its empty state (10552:7519).
 * The keyword search filters the list; "Rule" opens the Create Rule drawer; each row's "..." edits, enables or
 * disables, or deletes the rule.
 */
export function RulesPage({ startEmpty }: { startEmpty?: boolean }) {
  const [rules, setRules] = useState<ChargingRule[]>(() => (startEmpty ? [] : sampleRules));
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
    if (editing) setRules((rs) => rs.map((r) => (r.id === editing.id ? { ...r, ...f } : r)));
    else setRules((rs) => [...rs, { id: `r${nextId++}`, ...f, creator: currentAdmin, created: todayIso() }]);
  };
  const toggle = (id: string) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  const remove = (id: string) => setRules((rs) => rs.filter((r) => r.id !== id));

  return (
    <section className="ep-rules" aria-labelledby="ep-rules-title">
      <h2 id="ep-rules-title" className="ep-sr">Rules</h2>
      <div className="ep-rules__bar">
        <TextField
          label="Search rules" hideLabel size="sm" iconStart="search" placeholder="By Keyword" value={query}
          onChange={(e) => setQuery(e.currentTarget.value)} onClear={() => setQuery('')} className="ep-rules__search"
        />
        <Button variant="secondary" size="sm" iconStart="plus-in-circle" className="ep-rules__add" onClick={() => setDrawer({ rule: null })}>
          Rule
        </Button>
      </div>

      <div className={rules.length ? 'ep-rules__list' : 'ep-rules__list is-empty'} role="region" aria-label="Rules list" tabIndex={shown.length ? 0 : -1}>
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
                  <td>{condition(r)}</td>
                  <td><RuleStatus enabled={r.enabled} /></td>
                  <td>{r.creator}</td>
                  <td>{dotted(r.created)}</td>
                  <td className="ep-rules-table__actions">
                    <ActionMenu
                      label={`${ruleTypes[r.type].name} rule actions, ${dotted(r.created)}`}
                      actions={[
                        { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setDrawer({ rule: r }) },
                        { id: 'toggle', label: r.enabled ? 'Disable' : 'Enable', icon: 'status-change', onSelect: () => toggle(r.id) },
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

      <RuleDrawer open={drawer !== null} rule={drawer?.rule ?? null} onClose={() => setDrawer(null)} onSubmit={save} />
    </section>
  );
}
