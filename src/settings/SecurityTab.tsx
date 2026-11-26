import { useEffect, useState } from 'react';
import { Switch } from '@syn/design-system';
import { MaskIcon } from '../layout/AppShell';
import illustration from '../assets/settings/login-security.svg';

export type LoginMethodId = 'password' | 'corporate' | 'google' | 'microsoft';

interface LoginMethod { id: LoginMethodId; name: string; how: string }

/** The four cards of Figma "Log in options" (17976:65061), in the same order. */
export const loginMethods: LoginMethod[] = [
  { id: 'password', name: 'Email and password', how: 'People sign in with their email address and a SAM password.' },
  { id: 'corporate', name: 'Corporate account (SSO)', how: "Single sign-on through your company's identity provider (SAML or OpenID Connect)." },
  { id: 'google', name: 'Google', how: 'People sign in with their Google or Google Workspace account.' },
  { id: 'microsoft', name: 'Microsoft', how: 'People sign in with their Microsoft 365 or Microsoft Entra ID account.' },
];

type Enabled = Record<LoginMethodId, boolean>;
const STORAGE_KEY = 'sam.settings.loginMethods';
const defaults: Enabled = { password: true, corporate: false, google: false, microsoft: false };

/** Mock store until the API exists: the organization's choice, kept in this browser. */
function load(): Enabled {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Enabled> | null;
    const merged = { ...defaults, ...saved };
    return Object.values(merged).some(Boolean) ? merged : defaults;
  } catch { return defaults; }
}

/** Figma "shield" (32px) in the card's 80px Icon Area. Drawn here: Figma's asset could not be downloaded. */
function ShieldGlyph() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden focusable="false">
      <path d="M16 4.5 6.5 8v7.2c0 5.9 4 10.6 9.5 12.3 5.5-1.7 9.5-6.4 9.5-12.3V8L16 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Settings › Organization › Security: the administrator turns each sign-in method on or off.
 * A change applies at once; at least one method always stays on, so nobody is locked out.
 */
export function SecurityTab() {
  const [enabled, setEnabled] = useState<Enabled>(load);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)); } catch { /* storage unavailable */ }
  }, [enabled]);

  const onCount = Object.values(enabled).filter(Boolean).length;
  const toggle = (m: LoginMethod, on: boolean) => {
    if (!on && onCount <= 1) return;
    setEnabled((e) => ({ ...e, [m.id]: on }));
    setAnnouncement(`${m.name} sign-in turned ${on ? 'on' : 'off'}.`);
  };

  return (
    <div className="ep-security">
      <header className="ep-security__head">
        <MaskIcon src={illustration} size={[436, 405]} className="ep-security__illustration" />
        <p className="ep-security__intro">
          Choose how people in your organization can sign in to SAM. A method that is off no longer shows on the sign-in page.
        </p>
        <h2 className="ep-security__title">Log in options</h2>
        <p className="ep-security__count">{onCount} of {loginMethods.length} methods on</p>
      </header>
      <ul className="ep-security__grid">
        {loginMethods.map((m) => {
          const on = enabled[m.id];
          const locked = on && onCount === 1;
          const hintId = `ep-login-${m.id}-hint`;
          return (
            <li key={m.id} className={on ? 'ep-login-card is-on' : 'ep-login-card'}>
              <div className="ep-login-card__head">
                <h3 className="ep-login-card__name">{m.name}</h3>
                <Switch
                  label={`${m.name} sign-in`} size={24} indicator checked={on}
                  aria-describedby={locked ? hintId : undefined}
                  disabled={locked}
                  onChange={(e) => toggle(m, e.target.checked)}
                />
              </div>
              <dl className="ep-login-card__body">
                <div className="ep-login-card__field">
                  <dt>How it works</dt>
                  <dd>{m.how}</dd>
                </div>
                <div className="ep-login-card__field">
                  <dt>Status</dt>
                  <dd>{on ? 'On, shown on the sign-in page' : 'Off'}</dd>
                </div>
              </dl>
              {locked && <p id={hintId} className="ep-login-card__hint">At least one sign-in method has to stay on.</p>}
              <span className="ep-login-card__icon"><ShieldGlyph /></span>
            </li>
          );
        })}
      </ul>
      <p className="syn-visually-hidden" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}
