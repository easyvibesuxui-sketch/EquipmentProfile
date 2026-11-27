import { useEffect, useState } from 'react';
import { Button, Icon, Switch, TextField } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { ChoiceSwitch } from '../shared/forms';
import { ColorDot } from '../shared/ColorDot';
import {
  bookingStatuses, kindOf, parseTime, ruleTypes, type ChargingRule, type ChargingType, type RuleKind, type RuleType,
} from '../data/rules';

export interface RuleForm { type: RuleType; time: string; enabled: boolean }

const blank = (kind: RuleKind): RuleForm => (kind === 'daily'
  ? { type: 'daily', time: '23:00', enabled: true }
  : { type: 'pickup', time: '', enabled: true });

const chargingTypes: ChargingType[] = ['pickup', 'return'];

/** What the Daily booking job does, drawn as its condition, its action and what it leaves alone. */
function DailyJobScope() {
  const skipped = bookingStatuses.filter((s) => s.id !== 'IN_PROGRESS');
  return (
    <div className="ep-job" role="group" aria-labelledby="ep-job-l">
      <span className="ep-rule-form__heading" id="ep-job-l">What it does</span>
      <ol className="ep-job__steps">
        <li className="ep-job__step">
          <span className="ep-job__label">When a booking</span>
          <span className="ep-job__chips">
            <span className="ep-job__chip"><ColorDot color="success" />is In progress</span>
            <span className="ep-job__chip"><Icon name="calendar" size={16} />ends today</span>
          </span>
        </li>
        <li className="ep-job__step">
          <span className="ep-job__label">Then</span>
          <span className="ep-job__chips">
            <span className="ep-job__chip is-action">End date<Icon name="arrow" size={16} />tomorrow</span>
          </span>
        </li>
        <li className="ep-job__step">
          <span className="ep-job__label">Not changed</span>
          <span className="ep-job__chips">
            {skipped.map((s) => <span key={s.id} className="ep-job__chip is-muted">{s.label}</span>)}
          </span>
        </li>
      </ol>
      <p className="ep-rule-form__hint">
        A booking still In progress on its last day was not brought back, so it runs one more day. It is checked again
        tomorrow.
      </p>
    </div>
  );
}

/**
 * Create / Edit Rule. A charging rule follows Figma "Create Rule Pick up" (10562:37833) and "Create Rule Return"
 * (10563:41093): the Type switcher, the muted explanation, the time ("Later than" / "Earlier than") and the Status
 * box. The Daily booking job keeps the same drawer: what it does, the time it runs every day, and Status.
 */
export function RuleDrawer({ open, kind, rule, onClose, onSubmit }: {
  open: boolean;
  /** Which kind a new rule is; an existing `rule` decides for itself. */
  kind: RuleKind;
  rule: ChargingRule | null;
  onClose: () => void;
  onSubmit: (form: RuleForm) => void;
}) {
  const [form, setForm] = useState<RuleForm>(() => blank(kind));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(rule ? { type: rule.type, time: rule.time, enabled: rule.enabled } : blank(kind));
    setTouched(false);
  }, [open, rule, kind]);

  const set = <K extends keyof RuleForm>(key: K, value: RuleForm[K]) => setForm((f) => ({ ...f, [key]: value }));
  const time = parseTime(form.time);
  const error = touched && form.time.trim() && !time ? 'Enter a time between 00:00 and 23:59' : undefined;
  const changed = !rule || rule.type !== form.type || rule.time !== time || rule.enabled !== form.enabled;
  const daily = kindOf(form.type) === 'daily';
  const type = ruleTypes[form.type];
  const noun = daily ? 'Daily Booking Job' : 'Rule';
  const timeLabel = daily ? 'Runs daily at' : type.condition;

  const submit = () => {
    if (!time) { setTouched(true); return; }
    onSubmit({ ...form, time });
    onClose();
  };

  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      title={`${rule ? 'Edit' : 'Create'} ${noun}`}
      className="ep-rule-drawer"
      footer={(
        <>
          <button type="button" className="ep-form-discard" onClick={onClose}>Discard</button>
          <Button className="ep-panel-drawer__submit" disabled={!time || !changed} onClick={submit}>{rule ? 'Update' : 'Create'}</Button>
        </>
      )}
    >
      <form className="ep-rule-form" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {daily ? (
          <div className="ep-rule-form__type"><DailyJobScope /></div>
        ) : (
          <div className="ep-rule-form__type">
            <span className="ep-rule-form__heading" id="ep-rule-type-l">Type</span>
            <ChoiceSwitch
              labelledBy="ep-rule-type-l" value={form.type as ChargingType} onChange={(v) => set('type', v)}
              options={chargingTypes.map((t) => ({ value: t, label: ruleTypes[t].option }))}
            />
          </div>
        )}

        <div className="ep-rule-form__time">
          <p className="ep-rule-form__hint" id="ep-rule-hint">{type.hint}</p>
          <label className="ep-rule-form__label" htmlFor="ep-rule-time">{timeLabel}</label>
          <TextField
            id="ep-rule-time" label={timeLabel} hideLabel size="md" placeholder="00:00" iconEnd="time"
            inputMode="numeric" autoComplete="off" maxLength={5} aria-describedby="ep-rule-hint"
            value={form.time} error={error}
            onChange={(e) => { set('time', e.currentTarget.value.replace(/[^\d:]/g, '')); }}
            onBlur={() => { setTouched(true); const t = parseTime(form.time); if (t) set('time', t); }}
            className="ep-rule-form__field"
          />
        </div>

        <div className="ep-rule-form__status">
          <div className="ep-rule-status">
            <span className="ep-rule-status__title">Status</span>
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
