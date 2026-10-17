import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { fmtDateTime, rupees } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { Empty, ErrorNotice, Spinner, SuccessNotice } from '../components/Notice.jsx';

const SPECIALTIES = ['Addiction', 'Anxiety', 'OCD', 'Personality Disorders', 'Bipolar', 'Schizoaffective Disorders', 'Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction', 'Dual Diagnosis', 'Panic Disorder', 'Geriatric Psychiatry', 'Bipolar Disorder', 'Schizophrenia', 'Depression', 'Female Sexual Disorder', 'Psychosis', 'Dementia', 'Mood disorders', 'CBT', 'DBT', 'ACT', 'ERP', 'Family therapy', 'Marital therapy', 'Mindfulness based therapy', 'Interpersonal therapy', 'Behavioral Therapy'];
const Stat = ({ label, value, tone }) => (
  <div className="panel p-5"><div className="text-sm text-slate-500">{label}</div><div className={`mt-1 text-3xl font-extrabold ${tone || ''}`}>{value}</div></div>
);

function Overview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/stats').then(setS).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorNotice>{error}</ErrorNotice>;
  if (!s) return <Spinner />;
  const by = s.appointmentsByStatus;
  return (
    <div className="space-y-4">
      {s.refundIssues > 0 && <ErrorNotice>{s.refundIssues} refund(s) failed at the payment provider. Open the Appointments tab and retry them.</ErrorNotice>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (30 days)" value={rupees(s.revenueLast30Days)} />
        <Stat label="Paid consults (30 days)" value={s.paidAppointmentsLast30Days} />
        <Stat label="Active doctors" value={s.activeDoctors} />
        <Stat label="Patients" value={s.usersByRole.patient || 0} />
      </div>
      <div className="panel p-5">
        <h3 className="mb-3 font-bold">Appointments by status</h3>
        <div className="flex flex-wrap gap-3">{Object.entries(by).map(([k, v]) => <div key={k} className="flex items-center gap-2"><StatusBadge status={k} /><span className="font-semibold">{v}</span></div>)}</div>
      </div>
    </div>
  );
}

function DoctorForm({ onCreated }) {
  const blank = { name: '', email: '', registrationNumber: '', qualifications: '', consultationFee: 1000, slotDurationMinutes: 20, specialty: ['General Psychiatry'], consultationModes: ['ONLINE', 'IN_CLINIC'], bio: '' };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const submit = async (e) => {
    e.preventDefault();
    setMsg({ error: '', ok: '' });
    try {
      await api.post('/admin/doctors', { ...f, consultationFee: Number(f.consultationFee), slotDurationMinutes: Number(f.slotDurationMinutes) });
      setMsg({ error: '', ok: `Added ${f.name}. They claim the account by signing in with Google using ${f.email}.` });
      setF(blank);
      onCreated();
    } catch (err) { setMsg({ error: err.message, ok: '' }); }
  };
  return (
    <form onSubmit={submit} className="panel grid gap-4 p-5 sm:grid-cols-2">
      <h3 className="font-bold sm:col-span-2">Add a doctor</h3>
      <div><label className="label">Full name</label><input className="field" required value={f.name} onChange={set('name')} /></div>
      <div><label className="label">Google email</label><input className="field" type="email" required value={f.email} onChange={set('email')} /></div>
      <div><label className="label">Qualifications</label><input className="field" value={f.qualifications} onChange={set('qualifications')} /></div>
      <div><label className="label">Registration no. (on prescriptions)</label><input className="field" value={f.registrationNumber} onChange={set('registrationNumber')} /></div>
      <div><label className="label">Fee (₹)</label><input className="field" type="number" min="0" required value={f.consultationFee} onChange={set('consultationFee')} /></div>
      <div><label className="label">Slot length</label><select className="field" value={f.slotDurationMinutes} onChange={set('slotDurationMinutes')}>{[20, 30, 45].map((m) => <option key={m} value={m}>{m} min</option>)}</select></div>
      <div className="sm:col-span-2"><span className="label">Specialties</span><div className="flex flex-wrap gap-3">{SPECIALTIES.map((s) => <label key={s} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.specialty.includes(s)} onChange={() => toggle('specialty', s)} /> {s}</label>)}</div></div>
      <div className="sm:col-span-2"><span className="label">Consultation types</span><div className="flex gap-4">{['ONLINE', 'IN_CLINIC'].map((m) => <label key={m} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.consultationModes.includes(m)} onChange={() => toggle('consultationModes', m)} /> {m === 'ONLINE' ? 'Video' : 'In-clinic'}</label>)}</div></div>
      <div className="space-y-3 sm:col-span-2"><ErrorNotice>{msg.error}</ErrorNotice><SuccessNotice>{msg.ok}</SuccessNotice><button className="btn" disabled={!f.specialty.length || !f.consultationModes.length}>Add doctor</button></div>
    </form>
  );
}

function Doctors() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api.get('/admin/doctors').then((r) => setDocs(r.doctors)).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const patch = (id, body) => api.patch(`/admin/doctors/${id}`, body).then(load).catch((e) => setError(e.message));
  const editFee = (d) => {
    const v = window.prompt(`New consultation fee for ${d.user.name} (₹)`, d.consultationFee);
    if (v !== null && v.trim() !== '' && !Number.isNaN(Number(v))) patch(d._id, { consultationFee: Number(v) });
  };
  return (
    <div className="space-y-5">
      <DoctorForm onCreated={load} />
      <ErrorNotice>{error}</ErrorNotice>
      {!docs ? <Spinner /> : docs.length === 0 ? <Empty>No doctors yet.</Empty> : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">Doctor</th><th className="p-3">Fee</th><th className="p-3">Signed in</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d._id} className="border-b border-slate-50 last:border-0">
                  <td className="p-3"><div className="font-semibold">{d.user.name}</div><div className="text-xs text-slate-500">{d.user.email}</div></td>
                  <td className="p-3">{rupees(d.consultationFee)}</td>
                  <td className="p-3 text-slate-500">{d.user.lastLoginAt ? fmtDateTime(d.user.lastLoginAt) : 'Not yet'}</td>
                  <td className="p-3"><span className={d.isActive ? 'text-emerald-700' : 'text-slate-400'}>{d.isActive ? 'Listed' : 'Hidden'}</span></td>
                  <td className="space-x-2 p-3 text-right"><button className="btn-secondary btn-sm" onClick={() => editFee(d)}>Fee</button><button className="btn-secondary btn-sm" onClick={() => patch(d._id, { isActive: !d.isActive })}>{d.isActive ? 'Hide' : 'List'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Appointments() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const load = useCallback(() => api.get(`/admin/appointments?page=${page}${status ? `&status=${status}` : ''}`).then(setData).catch((e) => setMsg({ error: e.message, ok: '' })), [page, status]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { setMsg({ error: '', ok: '' }); try { await fn(); setMsg({ error: '', ok }); load(); } catch (e) { setMsg({ error: e.message, ok: '' }); } };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <select className="field !w-auto !py-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {['PENDING_PAYMENT', 'BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {data && <span className="text-sm text-slate-500">{data.total} total</span>}
      </div>
      <ErrorNotice>{msg.error}</ErrorNotice><SuccessNotice>{msg.ok}</SuccessNotice>
      {!data ? <Spinner /> : data.appointments.length === 0 ? <Empty>No appointments found.</Empty> : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">When</th><th className="p-3">Patient</th><th className="p-3">Doctor</th><th className="p-3">Status</th><th className="p-3">Payment</th><th className="p-3" /></tr></thead>
            <tbody>
              {data.appointments.map((a) => (
                <tr key={a._id} className="border-b border-slate-50 last:border-0">
                  <td className="p-3">{fmtDateTime(a.slotStart)}</td>
                  <td className="p-3">{a.patient?.name}</td>
                  <td className="p-3">{a.doctor?.name}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3">{a.payment.status === 'NOT_REQUIRED' ? '—' : <StatusBadge status={a.payment.status === 'PENDING' ? 'PENDING_PAYMENT' : a.payment.status} />}</td>
                  <td className="space-x-2 p-3 text-right">
                    {a.payment.status === 'REFUND_FAILED' && <button className="btn btn-sm" onClick={() => run(() => api.post(`/admin/appointments/${a._id}/retry-refund`), 'Refund retried')}>Retry refund</button>}
                    {['BOOKED', 'PENDING_PAYMENT'].includes(a.status) && <button className="btn-danger btn-sm" onClick={() => window.confirm('Cancel and refund in full?') && run(() => api.patch(`/appointments/${a._id}/status`, { status: 'CANCELLED' }), 'Appointment cancelled')}>Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {data.pages}</span>
          <button className="btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function Audit() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/audit-logs').then((r) => setLogs(r.logs)).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorNotice>{error}</ErrorNotice>;
  if (!logs) return <Spinner />;
  return (
    <div className="panel divide-y divide-slate-50">
      {logs.length === 0 ? <p className="p-6 text-center text-slate-500">No activity yet.</p> : logs.map((l) => (
        <div key={l._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <div><span className="font-semibold">{l.action.replaceAll('_', ' ').toLowerCase()}</span><span className="text-slate-500"> · {l.performedBy ? `${l.performedBy.name} (${l.performedBy.role})` : 'system'}</span></div>
          <span className="text-xs text-slate-400">{fmtDateTime(l.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const views = { overview: <Overview />, doctors: <Doctors />, appointments: <Appointments />, audit: <Audit /> };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {[['overview', 'Overview'], ['doctors', 'Doctors'], ['appointments', 'Appointments'], ['audit', 'Audit log']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-5">{views[tab]}</div>
    </div>
  );
}
