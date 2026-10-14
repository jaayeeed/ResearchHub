import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PasswordInput } from '../components/FormControls';
import { Spinner } from '../components/Feedback';
import Icon from '../components/Icon';
import AuthShell from './AuthShell';

export default function Login() {
  const { login, sessionMessage } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Please enter your email and password.');
    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
    return null;
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue building your research network."
      footer={<>New to ResearchHub? <Link to="/register">Create an account</Link></>}
    >
      {sessionMessage && !error && (
        <div className="alert alert--info"><Icon name="info" size={16} /> {sessionMessage}</div>
      )}
      {error && (
        <div className="alert alert--error shake" role="alert"><Icon name="alert" size={16} /> {error}</div>
      )}
      <form onSubmit={submit} className="form" noValidate>
        <Field label="Email" htmlFor="email">
          <div className="input-wrap">
            <Icon name="mail" size={17} className="input-wrap__icon" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoFocus
            />
          </div>
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
          {submitting ? <><Spinner light /> Signing in…</> : <>Log in <Icon name="arrow" size={18} /></>}
        </button>
      </form>
    </AuthShell>
  );
}
