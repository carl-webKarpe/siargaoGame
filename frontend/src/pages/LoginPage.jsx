import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.login.trim() || !form.password) return setError('Enter your username/email and password.');
    setBusy(true);
    try {
      const p = await login(form.login.trim(), form.password);
      navigate(location.state?.from || (p.accountType === 'admin' ? '/admin' : '/play'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="🔑 Login">
      {location.state?.message && <p className="mb-3 rounded-xl bg-ocean/10 p-3 text-sm font-semibold">{location.state.message}</p>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="login">Username or email</label>
          <input id="login" className="input" autoComplete="username" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm font-semibold text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        New to the island? <Link to="/register" state={location.state} className="font-bold text-ocean underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}
