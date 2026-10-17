
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { loadScript } from '../lib/loadScript.js';
import { ErrorNotice } from './Notice.jsx';

const HOME = { patient: null, doctor: '/doctor', admin: '/admin' };

// Existing seeded practitioner accounts. These emails must match server/scripts/seed.js.
const DOCTORS = [
  { name: 'Dr. Gorav Gupta', email: 'dr.gorav.gupta@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Anu Yadav', email: 'dr.anu.yadav@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Ratnarakshit Ingole', email: 'dr.ratnarakshit.ingole@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Ichpreet Singh', email: 'dr.ichpreet.singh@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Poorva Gupta', email: 'dr.poorva.gupta@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Alisha Nagar', email: 'dr.alisha.nagar@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Pooja Sharma', email: 'dr.pooja.sharma@placeholder.tulasihealthcare.test' },
  { name: 'Dr. Suravi Das', email: 'dr.suravi.das@placeholder.tulasihealthcare.test' },
  { name: 'Ms. Kiran Singh', email: 'ms.kiran.singh@placeholder.tulasihealthcare.test' },
  { name: 'Ms. Manju Kumari', email: 'ms.manju.kumari@placeholder.tulasihealthcare.test' },
  { name: 'Ms. Aastha Dwivedi', email: 'ms.aastha.dwivedi@placeholder.tulasihealthcare.test' },
];

export default function AuthModal() {
  const { authOpen, closeAuth, config, signIn } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0].email);

  const finish = (data) => {
    signIn(data);
    closeAuth();

    const destination = HOME[data.user.role];
    if (destination) navigate(destination);
  };

  useEffect(() => {
    if (!authOpen || !config.googleClientId) return undefined;

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
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'continue_with',
        });
      })
      .catch((e) => setError(e.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authOpen, config.googleClientId]);

  if (!authOpen) return null;

  const doctorLogin = async () => {
    setBusy(true);
    setError('');

    try {
      const data = await api.post('/auth/dev-doctor-login', {
        email: selectedDoctor,
      });

      finish(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
      onClick={closeAuth}
    >
      <div
        className="panel relative w-full max-w-sm p-7"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in"
      >
        <button
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          onClick={closeAuth}
          aria-label="Close"
          type="button"
        >
          <X size={18} />
        </button>

        <p className="eyebrow">Welcome</p>
        <h2 className="mt-1 text-2xl font-bold">
          Sign in to continue
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Use your Google account. We never see your password.
        </p>

        <div className="mt-6 flex min-h-[44px] justify-center">
          {config.googleClientId ? (
            <div ref={btnRef} />
          ) : (
            <p className="text-center text-sm text-amber-700">
              Google sign-in isn't configured yet (set GOOGLE_CLIENT_ID on the server).
            </p>
          )}
        </div>

        <div className="mt-4">
          <ErrorNotice>{error}</ErrorNotice>
        </div>

        {config.devAuth && (
          <div className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Developer tools
            </p>

            <p className="mt-2 text-sm text-slate-600">
              Sign in as an existing practitioner to demonstrate the doctor dashboard.
            </p>

            <label
              htmlFor="demo-doctor"
              className="mt-3 block text-sm font-medium text-slate-700"
            >
              Choose practitioner
            </label>

            <select
              id="demo-doctor"
              className="field mt-1 w-full"
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              disabled={busy}
            >
              {DOCTORS.map((doctor) => (
                <option key={doctor.email} value={doctor.email}>
                  {doctor.name}
                </option>
              ))}
            </select>

            <button
              className="btn mt-3 w-full"
              type="button"
              disabled={busy || !selectedDoctor}
              onClick={doctorLogin}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Stethoscope size={16} />
                {busy ? 'Signing in…' : 'Continue as doctor'}
              </span>
            </button>

            <p className="mt-2 text-xs text-slate-500">
              Development demo only. Not available in production.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
