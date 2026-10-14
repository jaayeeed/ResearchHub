import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage, fieldErrors } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PasswordInput, PasswordStrength, passwordChecks } from '../components/FormControls';
import { Spinner } from '../components/Feedback';
import Icon from '../components/Icon';
import { ROLE_OPTIONS } from '../utils/format';
import AuthShell from './AuthShell';

const ROLE_ICONS = { student: 'book', thesis_student: 'graduation', researcher: 'flask', professor: 'users' };

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student', institution: '', department: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!passwordChecks(form.password).every((c) => c.ok)) errs.password = 'Password does not meet the requirements';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const { confirm, ...payload } = form;
      const user = await register(payload);
      toast.success(`Welcome to ResearchHub, ${user.name.split(' ')[0]}!`);
      navigate('/research-profile', { replace: true, state: { onboarding: true } });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the network and get matched with collaborators."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      {error && (
        <div className="alert alert--error shake" role="alert"><Icon name="alert" size={16} /> {error}</div>
      )}
      <form onSubmit={submit} className="form" noValidate>
        <fieldset className="role-picker">
          <legend>I am a…</legend>
          {ROLE_OPTIONS.map((r) => (
            <label key={r.value} className={`role-option ${form.role === r.value ? 'is-selected' : ''}`}>
              <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} />
              <Icon name={ROLE_ICONS[r.value]} size={18} />
              <span>{r.label.replace(' / Supervisor', '')}</span>
            </label>
          ))}
        </fieldset>

        <Field label="Full name" htmlFor="name" error={errors.name} required>
          <div className="input-wrap">
            <Icon name="user" size={17} className="input-wrap__icon" />
            <input id="name" autoComplete="name" placeholder="e.g. Khaphia Sultana" value={form.name} onChange={set('name')} />
          </div>
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email} required>
          <div className="input-wrap">
            <Icon name="mail" size={17} className="input-wrap__icon" />
            <input id="email" type="email" autoComplete="email" placeholder="you@university.edu" value={form.email} onChange={set('email')} />
          </div>
        </Field>
        <div className="form-grid-2">
          <Field label="Institution" htmlFor="institution" error={errors.institution}>
            <input id="institution" placeholder="Daffodil International University" value={form.institution} onChange={set('institution')} />
          </Field>
          <Field label="Department" htmlFor="department" error={errors.department}>
            <input id="department" placeholder="Software Engineering" value={form.department} onChange={set('department')} />
          </Field>
        </div>
        <Field label="Password" htmlFor="password" error={errors.password} required>
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
        </Field>
        <PasswordStrength password={form.password} />
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm} required>
          <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        </Field>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? <><Spinner light /> Creating account…</> : <>Create account <Icon name="arrow" size={18} /></>}
        </button>
      </form>
    </AuthShell>
  );
}
