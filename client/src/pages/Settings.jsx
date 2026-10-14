import { useState } from 'react';
import { ProfileAPI, errorMessage, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PasswordInput, PasswordStrength, passwordChecks } from '../components/FormControls';
import { Spinner } from '../components/Feedback';
import Icon from '../components/Icon';

function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <span className={`toggle ${checked ? 'is-on' : ''}`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
        <span className="toggle__knob" />
      </span>
    </label>
  );
}

export default function Settings() {
  const { user, setUser, changePassword } = useAuth();
  const toast = useToast();
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const updateSetting = async (key, value) => {
    setSavingPrivacy(true);
    try {
      const data = await ProfileAPI.update({ settings: { [key]: value } });
      setUser(data.user);
      toast.success('Privacy settings saved');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPrivacy(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Enter your current password';
    if (!passwordChecks(pw.newPassword).every((c) => c.ok)) errs.newPassword = 'New password does not meet the requirements';
    if (pw.newPassword !== pw.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed. Other sessions have been signed out.');
    } catch (err) {
      setPwErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page-head fade-up">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p className="muted">Manage your privacy and account security.</p>
        </div>
      </div>

      <section className="card section fade-up">
        <h2 className="section__title"><Icon name="shield" size={18} /> Privacy</h2>
        <Toggle
          label="Show my email on my profile"
          description="When off, other researchers can see your profile but not your email address."
          checked={!!user.settings?.showEmail}
          onChange={(v) => updateSetting('showEmail', v)}
          disabled={savingPrivacy}
        />
        <Toggle
          label="Open to collaboration"
          description="Shows a badge on your profile and keeps you prominent in recommendations."
          checked={user.settings?.openToCollaborate !== false}
          onChange={(v) => updateSetting('openToCollaborate', v)}
          disabled={savingPrivacy}
        />
      </section>

      <section className="card section fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="section__title"><Icon name="lock" size={18} /> Change password</h2>
        <form className="form" onSubmit={submitPassword} noValidate>
          <Field label="Current password" htmlFor="currentPassword" error={pwErrors.currentPassword}>
            <PasswordInput id="currentPassword" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={pwErrors.newPassword}>
            <PasswordInput id="newPassword" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </Field>
          <PasswordStrength password={pw.newPassword} />
          <Field label="Confirm new password" htmlFor="confirmPw" error={pwErrors.confirm}>
            <PasswordInput id="confirmPw" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <div>
            <button type="submit" className="btn btn--primary" disabled={savingPw}>
              {savingPw ? <><Spinner light /> Updating…</> : 'Update password'}
            </button>
          </div>
        </form>
      </section>

      <section className="card section fade-up" style={{ animationDelay: '140ms' }}>
        <h2 className="section__title"><Icon name="mail" size={18} /> Account</h2>
        <p className="muted">Signed in as <strong>{user.email}</strong></p>
      </section>
    </div>
  );
}
