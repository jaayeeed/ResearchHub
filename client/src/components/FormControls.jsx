import { useState } from 'react';
import Icon from './Icon';

export function Field({ label, error, hint, children, htmlFor, required }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && <span className="req" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          <Icon name="alert" size={13} /> {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete = 'current-password', placeholder = '••••••••', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <Icon name="lock" size={17} className="input-wrap__icon" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        {...rest}
      />
      <button type="button" className="input-wrap__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eye-off' : 'eye'} size={17} />
      </button>
    </div>
  );
}

export const passwordChecks = (pw = '') => [
  { ok: pw.length >= 8, text: '8+ characters' },
  { ok: /[A-Z]/.test(pw), text: 'Uppercase letter' },
  { ok: /[a-z]/.test(pw), text: 'Lowercase letter' },
  { ok: /\d/.test(pw), text: 'Number' },
];

export function PasswordStrength({ password }) {
  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.ok).length + (password.length >= 12 ? 1 : 0);
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return (
    <div className="pw-strength" aria-live="polite">
      <div className="pw-strength__bar">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={i < score ? `is-on lvl-${score}` : ''} />
        ))}
      </div>
      <div className="pw-strength__meta">
        <span>{password ? labels[score] : 'Password strength'}</span>
        <ul>
          {checks.map((c) => (
            <li key={c.text} className={c.ok ? 'ok' : ''}>
              <Icon name={c.ok ? 'check' : 'x'} size={12} strokeWidth={2.4} /> {c.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
