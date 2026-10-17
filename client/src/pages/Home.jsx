import { useEffect, useState } from 'react';
import { Building2, ShieldCheck, Video, Lock, Stethoscope } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { rupees } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import BookingModal from '../components/BookingModal.jsx';
import { Empty, ErrorNotice, Spinner } from '../components/Notice.jsx';

const SPECIALTIES = ['Addiction', 'Anxiety', 'OCD', 'Personality Disorders', 'Bipolar', 'Schizoaffective Disorders', 'Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction', 'Dual Diagnosis', 'Panic Disorder', 'Geriatric Psychiatry', 'Bipolar Disorder', 'Schizophrenia', 'Depression', 'Female Sexual Disorder', 'Psychosis', 'Dementia', 'Mood disorders', 'CBT', 'DBT', 'ACT', 'ERP', 'Family therapy', 'Marital therapy', 'Mindfulness based therapy', 'Interpersonal therapy', 'Behavioral Therapy'];

export default function Home() {
  const { user, openAuth } = useAuth();
  const [doctors, setDoctors] = useState(null);
  const [specialty, setSpecialty] = useState('');
  const [mode, setMode] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    setDoctors(null);
    const qs = new URLSearchParams({ ...(specialty && { specialty }), ...(mode && { mode }) });
    api.get(`/doctors?${qs}`).then((r) => setDoctors(r.doctors)).catch((e) => { setError(e.message); setDoctors([]); });
  }, [specialty, mode]);

  const book = (d) => (user ? setBooking(d) : openAuth());

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-[#f7faf8]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="eyebrow">Mental healthcare, made accessible</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Talk to a specialist, online or in clinic.</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">Book a confidential consultation in minutes, pay securely, and receive your prescription digitally.</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span className="flex items-center gap-2"><Video size={16} className="text-brand-600" /> Private video consults</span>
            <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" /> Secure payments</span>
            <span className="flex items-center gap-2"><Lock size={16} className="text-brand-600" /> Notes stay confidential</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">Our doctors</h2>
          <div className="flex flex-wrap gap-2">
            <select className="field !w-auto !py-2 text-sm" value={specialty} onChange={(e) => setSpecialty(e.target.value)} aria-label="Specialty">
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="field !w-auto !py-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Consultation type">
              <option value="">Video or in-clinic</option>
              <option value="ONLINE">Video</option>
              <option value="IN_CLINIC">In-clinic</option>
            </select>
          </div>
        </div>
        <ErrorNotice>{error}</ErrorNotice>
        {user && user.role !== 'patient' && <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">You're signed in as a {user.role}. Only patient accounts can book appointments.</p>}

        {doctors === null ? <Spinner /> : doctors.length === 0 ? <Empty>No doctors match these filters yet.</Empty> : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <article key={d._id} className="panel flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={d.user.name} src={d.user.picture} size={52} />
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{d.user.name}</h3>
                    {d.title && <p className="truncate text-xs font-medium text-brand-700">{d.title}</p>}
                    <p className="truncate text-xs text-slate-500">{d.qualifications}{d.experienceYears ? ` · ${d.experienceYears} yrs` : ''}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.specialty.map((s) => <span key={s} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{s}</span>)}
                </div>
                <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-600">{d.bio}</p>
                {d.languages?.length > 0 && <p className="mt-2 text-xs text-slate-500">Languages: {d.languages.join(', ')}</p>}
                {typeof d.rating === 'number' && <p className="mt-2 text-xs font-medium text-amber-700">★ {d.rating.toFixed(2)} <span className="font-normal text-slate-500">({d.reviewsCount ?? 0} reviews · reference listing)</span></p>}
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                  {d.consultationModes.includes('ONLINE') && <span className="flex items-center gap-1"><Video size={13} /> Video</span>}
                  {d.consultationModes.includes('IN_CLINIC') && <span className="flex items-center gap-1"><Building2 size={13} /> Clinic</span>}
                  <span className="flex items-center gap-1"><Stethoscope size={13} /> {d.slotDurationMinutes} min</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-lg font-bold">{rupees(d.consultationFee)}</span>
                  <button className="btn btn-sm" onClick={() => book(d)} disabled={user && user.role !== 'patient'}>Book</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      {booking && <BookingModal doctor={booking} onClose={() => setBooking(null)} />}
    </>
  );
}
