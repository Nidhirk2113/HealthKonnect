import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Stethoscope, UserRound, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { loadScript } from '../lib/loadScript.js';
import { ErrorNotice } from './Notice.jsx';

const HOME = { patient: null, doctor: '/doctor', admin: '/admin' };
const DOCTORS = [
  { name: 'Dr. Gorav Gupta', email: 'gorav.gupta@healthkonnect.com' },
  { name: 'Dr. Anu Yadav', email: 'anu.yadav@healthkonnect.com' },
  { name: 'Dr. Ratnarakshit Ingole', email: 'ratnarakshit.ingole@healthkonnect.com' },
  { name: 'Dr. Ichpreet Singh', email: 'ichpreet.singh@healthkonnect.com' },
  { name: 'Dr. Poorva Gupta', email: 'poorva.gupta@healthkonnect.com' },
  { name: 'Dr. Alisha Nagar', email: 'alisha.nagar@healthkonnect.com' },
  { name: 'Dr. Pooja Sharma', email: 'pooja.sharma@healthkonnect.com' },
  { name: 'Dr. Suravi Das', email: 'suravi.das@healthkonnect.com' },
  { name: 'Ms. Kiran Singh', email: 'kiran.singh@healthkonnect.com' },
  { name: 'Ms. Manju Kumari', email: 'manju.kumari@healthkonnect.com' },
  { name: 'Ms. Aastha Dwivedi', email: 'aastha.dwivedi@healthkonnect.com' },
];

export default function AuthModal() {
  const { authOpen, closeAuth, config, signIn } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [view, setView] = useState('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = (data) => {
    signIn(data);
    closeAuth();
    setView('choose');
    const destination = HOME[data.user.role];
    if (destination) navigate(destination);
  };

  useEffect(() => {
    if (!authOpen || view !== 'patient' || !config.googleClientId) return undefined;
    let cancelled = false;
    setError('');
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        if (cancelled || !btnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async ({ credential }) => {
            setBusy(true);
            setError('');
            try {
              finish(await api.post('/auth/google', { credential }));
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline', size: 'large', width: 300, text: 'continue_with',
        });
      })
      .catch((e) => setError(e.message));
    return () => { cancelled = true; };
  }, [authOpen, view, config.googleClientId]);

  useEffect(() => {
    if (!authOpen) {
      setView('choose');
      setError('');
      setPassword('');
    }
  }, [authOpen]);

  if (!authOpen) return null;

  const doctorLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      finish(await api.post('/auth/doctor-login', { email, password }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const chooseDoctor = (value) => {
    setEmail(value);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onClick={closeAuth}>
      <div className="panel relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6 sm:p-7" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-700" onClick={closeAuth} aria-label="Close" type="button"><X size={18} /></button>

        {view !== 'choose' && (
          <button type="button" onClick={() => { setView('choose'); setError(''); }} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900">
            <ArrowLeft size={15} /> Back
          </button>
        )}

        {view === 'choose' && <>
          <p className="eyebrow">Welcome to Tulasi HealthConnect</p>
          <h2 className="mt-1 text-2xl font-bold">How would you like to sign in?</h2>
          <p className="mt-1 text-sm text-slate-500">Choose the portal that applies to you.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => { setView('patient'); setError(''); }} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><UserRound size={22} /></span>
              <span className="mt-3 block font-semibold text-slate-900">I’m a patient</span>
              <span className="mt-1 block text-xs text-slate-500">Continue securely with Google</span>
            </button>
            <button type="button" disabled={!config.doctorLoginEnabled} onClick={() => { setView('doctor'); setError(''); }} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-800"><Stethoscope size={22} /></span>
              <span className="mt-3 block font-semibold text-slate-900">I’m a doctor</span>
              <span className="mt-1 block text-xs text-slate-500">{config.doctorLoginEnabled ? 'Sign in with your doctor credentials' : 'Doctor sign-in is currently unavailable'}</span>
            </button>
          </div>
        </>}

        {view === 'patient' && <>
          <p className="eyebrow">Patient portal</p>
          <h2 className="mt-1 text-2xl font-bold">Sign in with Google</h2>
          <p className="mt-1 text-sm text-slate-500">Use your Google account to manage appointments.</p>
          <div className="mt-6 flex min-h-[48px] justify-center">
            {config.googleClientId ? <div ref={btnRef} /> : <p className="text-center text-sm text-amber-700">Google sign-in isn’t configured on the server.</p>}
          </div>
        </>}

        {view === 'doctor' && <>
          <p className="eyebrow">Doctor portal</p>
          <h2 className="mt-1 text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in using your HealthConnect doctor account.</p>
          <form className="mt-5 space-y-4" onSubmit={doctorLogin}>
            <div>
              <label htmlFor="doctor-email" className="label">Doctor email</label>
              <input id="doctor-email" type="email" autoComplete="username" required className="field" placeholder="name@healthkonnect.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="doctor-password" className="label">Password</label>
              <div className="relative">
                <input id="doctor-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="field pr-11" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button className="btn w-full" type="submit" disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in as doctor'}</button>
          </form>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">Demo doctor accounts</p>
            <p className="mt-1 text-xs text-slate-500">Select a doctor to fill the email address. Use the shared demo password provided by the project administrator.</p>
            <select className="field mt-3" value={DOCTORS.some((d) => d.email === email) ? email : ''} onChange={(e) => chooseDoctor(e.target.value)} aria-label="Choose demo doctor">
              <option value="">Choose a doctor</option>
              {DOCTORS.map((doctor) => <option key={doctor.email} value={doctor.email}>{doctor.name}</option>)}
            </select>
            <div className="mt-2 max-h-28 overflow-y-auto text-xs text-slate-500">
              {DOCTORS.map((doctor) => <button key={doctor.email} type="button" onClick={() => chooseDoctor(doctor.email)} className="block py-0.5 text-left hover:text-emerald-800">{doctor.email}</button>)}
            </div>
          </div>
        </>}

        <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>
      </div>
    </div>
  );
}
