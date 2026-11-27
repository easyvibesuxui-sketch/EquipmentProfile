import { useEffect, useState } from 'react';
import { Button, Switch, TextField } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { ChoiceSwitch } from '../shared/forms';
import { parseTime, ruleTypes, type ChargingRule, type RuleType } from '../data/rules';

export interface RuleForm { type: RuleType; time: string; enabled: boolean }

const blank: RuleForm = { type: 'pickup', time: '', enabled: true };

/**
 * Figma "Create Rule Pick up" (10562:37833) and "Create Rule Return" (10563:41093): the Type switcher, the muted
 * explanation, the time field ("Later than" for a pick-up, "Earlier than" for a return) and the Status box with
 * its toggle. `rule` opens it on an existing rule ("Edit Rule", Update).
 */
export function RuleDrawer({ open, rule, onClose, onSubmit }: {
  open: boolean;
  rule: ChargingRule | null;
  onClose: () => void;
  onSubmit: (form: RuleForm) => void;
}) {
  const [form, setForm] = useState<RuleForm>(blank);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(rule ? { type: rule.type, time: rule.time, enabled: rule.enabled } : blank);
    setTouched(false);
  }, [open, rule]);

  const set = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const time = parseTime(form.time);
  const error = touched && form.time.trim() && !time ? 'Enter a time between 00:00 and 23:59' : undefined;
  const changed = !rule || rule.type !== form.type || rule.time !== time || rule.enabled !== form.enabled;
  const type = ruleTypes[form.type];

  const submit = () => {
    if (!time) { setTouched(true); return; }
    onSubmit({ ...form, time });
    onClose();
  };

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      title={rule ? 'Edit Rule' : 'Create Rule'}
      className="ep-rule-drawer"
      footer={(
        <>
          <button type="button" className="ep-form-discard" onClick={onClose}>Discard</button>
          <Button className="ep-panel-drawer__submit" disabled={!time || !changed} onClick={submit}>{rule ? 'Update' : 'Create'}</Button>
        </>
      )}
    >
      <form className="ep-rule-form" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <div className="ep-rule-form__type">
          <span className="ep-rule-form__heading" id="ep-rule-type-l">Type</span>
          <ChoiceSwitch
            labelledBy="ep-rule-type-l" value={form.type} onChange={(v) => set('type', v)}
            options={(Object.keys(ruleTypes) as RuleType[]).map((t) => ({ value: t, label: ruleTypes[t].option }))}
          />
        </div>

        <div className="ep-rule-form__time">
          <p className="ep-rule-form__hint" id="ep-rule-hint">{type.hint}</p>
          <label className="ep-rule-form__label" htmlFor="ep-rule-time">{type.condition}</label>
          <TextField
            id="ep-rule-time" label={type.condition} hideLabel size="md" placeholder="00:00" iconEnd="time"
            inputMode="numeric" autoComplete="off" maxLength={5} aria-describedby="ep-rule-hint"
            value={form.time} error={error}
            onChange={(e) => { set('time', e.currentTarget.value.replace(/[^\d:]/g, '')); }}
            onBlur={() => { setTouched(true); const t = parseTime(form.time); if (t) set('time', t); }}
            className="ep-rule-form__field"
          />
        </div>

        <div className="ep-rule-form__status">
          <div className="ep-rule-status">
            <span className="ep-rule-status__title" id="ep-rule-status-l">Status</span>
            <div className="ep-rule-status__row">
              <span className={form.enabled ? 'ep-rule-status__value' : 'ep-rule-status__value is-off'} aria-hidden>
                {form.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch label="Status: enabled" checked={form.enabled} onChange={(e) => set('enabled', e.currentTarget.checked)} />
            </div>
          </div>
        </div>
        {/* Enter in the time field submits. */}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </PanelDrawer>
  );
}
