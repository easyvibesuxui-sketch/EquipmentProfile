import { useEffect, useState } from 'react';
import { Notification, Switch } from '@syn/design-system';
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

/**
 * Each method's own mark in the card's 80px Icon Area (the owner asked for icons that match the method):
 * an envelope with password dots, an office building, and the Google and Microsoft logos.
 * Line icons take the text colour; the logos keep their colours and turn grey while the method is off.
 */
function MethodGlyph({ id }: { id: LoginMethodId }) {
  const common = { width: 32, height: 32, 'aria-hidden': true, focusable: false } as const;
  if (id === 'password') {
    return (
      <svg {...common} viewBox="0 0 32 32" fill="none">
        <rect x="3.5" y="7.5" width="25" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m4.5 9 11.5 8.5L27.5 9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="21" cy="27.5" r="1.3" fill="currentColor" /><circle cx="25" cy="27.5" r="1.3" fill="currentColor" /><circle cx="29" cy="27.5" r="1.3" fill="currentColor" />
      </svg>
    );
  }
  if (id === 'corporate') {
    return (
      <svg {...common} viewBox="0 0 32 32" fill="none">
        <path d="M6 28V6.5A1.5 1.5 0 0 1 7.5 5h11A1.5 1.5 0 0 1 20 6.5V28M20 13h5.5a1.5 1.5 0 0 1 1.5 1.5V28M3.5 28h25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 10h2M14 10h2M10 14.5h2M14 14.5h2M10 19h2M14 19h2M23 18h1M23 22h1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M11.5 28v-4h3v4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === 'google') {
    return (
      <svg {...common} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.6C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.6C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 32 32">
      <rect x="3" y="3" width="12.5" height="12.5" fill="#F25022" />
      <rect x="16.5" y="3" width="12.5" height="12.5" fill="#7FBA00" />
      <rect x="3" y="16.5" width="12.5" height="12.5" fill="#00A4EF" />
      <rect x="16.5" y="16.5" width="12.5" height="12.5" fill="#FFB900" />
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
  // The method the admin just tried to turn off while it was the only one on (Figma: the "All off" warning).
  const [blocked, setBlocked] = useState<LoginMethod | null>(null);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)); } catch { /* storage unavailable */ }
  }, [enabled]);

  const onCount = Object.values(enabled).filter(Boolean).length;
  const toggle = (m: LoginMethod, on: boolean) => {
    if (!on && onCount <= 1) { setBlocked(m); return; }
    setBlocked(null);
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
      {blocked && (
        <Notification tone="warning" title="At least one sign-in method has to stay on" className="ep-security__warning" onClose={() => setBlocked(null)}>
          {blocked.name} is the only method on. Without it nobody in your organization could sign in to SAM. Turn on another method first.
        </Notification>
      )}
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
                  label={`${m.name} sign-in`} size={20} checked={on}
                  aria-describedby={locked ? hintId : undefined}
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
              <span className={`ep-login-card__icon ep-login-card__icon--${m.id}`}><MethodGlyph id={m.id} /></span>
            </li>
          );
        })}
      </ul>
      <p className="syn-visually-hidden" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}
