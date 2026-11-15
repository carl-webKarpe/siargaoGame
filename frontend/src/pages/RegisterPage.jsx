import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const ROLES = [
  {
    key: 'local_resident',
    icon: '🏡',
    title: 'Local Resident (Siargao-nun)',
    color: '#2e8b57',
    text: 'I am a resident of Siargao. I want to help my community, maintain the cleanliness of our tourist destinations, protect marine life, and enjoy island activities.',
    focus: ['Community cleanup missions', 'Maintaining Cloud 9 & public areas', 'Helping local residents & businesses'],
  },
  {
    key: 'tourist',
    icon: '🎒',
    title: 'Tourist / Visitor',
    color: '#00b4d8',
    text: "I am visiting Siargao. I want to explore tourist destinations, experience surfing, learn about Siargao's environment, and help protect the island.",
    focus: ['Responsible tourism missions', 'Exploring 9 destinations', 'Earning the Responsible Tourist Certificate'],
  },
];

function validate(f) {
  const e = {};
  if (!/^[A-Za-z0-9_]{3,32}$/.test(f.username)) e.username = '3–32 letters, numbers or underscores.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email.';
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) e.password = 'At least 8 characters with a letter and a number.';
  if (f.password !== f.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  return e;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const next = (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (!Object.keys(v).length) setStep(2);
  };

  const submit = async () => {
    if (!form.role) return setServerError('Please choose your role.');
    setBusy(true);
    setServerError(null);
    try {
      await register(form);
      navigate(location.state?.from || '/play', { replace: true });
    } catch (err) {
      setServerError(err.message);
      if (err.status === 409 || err.status === 400) setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const field = (k, label, type = 'text', auto) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} type={type} className="input" autoComplete={auto} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
      {errors[k] && <p className="mt-1 text-xs font-semibold text-red-600">{errors[k]}</p>}
    </div>
  );

  return (
    <AuthCard title={step === 1 ? '🌴 Create Account' : '🧭 Choose Your Role'} wide={step === 2}>
      <div className="mb-4 flex items-center gap-2 text-xs font-bold text-navy/60">
        <span className={`rounded-full px-2 py-0.5 ${step === 1 ? 'bg-ocean text-white' : 'bg-navy/10'}`}>1 Account</span>
        <span>→</span>
        <span className={`rounded-full px-2 py-0.5 ${step === 2 ? 'bg-ocean text-white' : 'bg-navy/10'}`}>2 Role</span>
      </div>
      {serverError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-2 text-sm font-semibold text-red-600">{serverError}</p>}
      {step === 1 ? (
        <form onSubmit={next} className="space-y-3" noValidate>
          {field('username', 'Username', 'text', 'username')}
          {field('email', 'Email', 'email', 'email')}
          {field('password', 'Password', 'password', 'new-password')}
          {field('confirmPassword', 'Confirm password', 'password', 'new-password')}
          <button className="btn-primary w-full">Next: choose role ▸</button>
          <p className="text-center text-sm">
            Already have an account? <Link to="/login" state={location.state} className="font-bold text-ocean underline">Login</Link>
          </p>
        </form>
      ) : (
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setForm({ ...form, role: r.key })}
                className={`rounded-2xl border-4 p-4 text-left transition ${form.role === r.key ? 'scale-[1.02] shadow-xl' : 'border-navy/10 hover:border-navy/30'}`}
                style={form.role === r.key ? { borderColor: r.color, background: `${r.color}15` } : {}}
                aria-pressed={form.role === r.key}
              >
                <div className="text-5xl">{r.icon}</div>
                <div className="mt-2 font-display text-xl font-bold">{r.title}</div>
                <p className="mt-1 text-sm italic text-navy/80">“{r.text}”</p>
                <ul className="mt-2 space-y-0.5 text-xs font-bold" style={{ color: r.color }}>
                  {r.focus.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-navy/60">Both roles can surf, explore, learn and join cleanups. Your role shapes your recommended missions.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn flex-1 border-2 border-navy/20" onClick={() => setStep(1)}>◂ Back</button>
            <button className="btn-primary flex-[2]" disabled={!form.role || busy} onClick={submit}>{busy ? 'Creating…' : 'Create account & play'}</button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
