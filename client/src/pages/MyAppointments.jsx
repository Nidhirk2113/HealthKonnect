import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Download, Video, XCircle } from 'lucide-react';
import { api, downloadPrescription } from '../services/api.js';
import { collectPayment, PaymentDismissed } from '../lib/payment.js';
import { fmtDateTime, modeLabel, rupees } from '../lib/format.js';
import Avatar from '../components/Avatar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Empty, ErrorNotice, Spinner, SuccessNotice } from '../components/Notice.jsx';

function HoldCountdown({ until, onExpire }) {
  const [left, setLeft] = useState(Math.max(0, new Date(until) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => {
      const ms = Math.max(0, new Date(until) - Date.now());
      setLeft(ms);
      if (ms === 0) { clearInterval(t); onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [until, onExpire]);
  const s = Math.ceil(left / 1000);
  return <span className="tabular-nums text-amber-700">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')} left to pay</span>;
}

export default function MyAppointments() {
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => api.get('/appointments/mine').then((r) => setItems(r.appointments)).catch((e) => { setMsg({ error: e.message, ok: '' }); setItems([]); }), []);
  useEffect(() => { load(); }, [load]);

  const act = async (id, fn, ok) => {
    setBusyId(id);
    setMsg({ error: '', ok: '' });
    try { setMsg({ error: '', ok: (await fn()) || ok || '' }); }
    catch (e) { setMsg({ error: e.message, ok: '' }); }
    finally { setBusyId(null); load(); }
  };

  const pay = (a) => act(a._id, async () => {
    const { appointment, payment } = await api.post(`/appointments/${a._id}/payment`);
    await collectPayment({ appointment, payment });
    return 'Payment received. Your appointment is confirmed.';
  });
  const cancel = (a) => {
    const paid = a.payment.status === 'PAID';
    if (!window.confirm(paid ? 'Cancel this appointment? Refunds are issued only when you cancel well before the start time.' : 'Release this slot?')) return;
    act(a._id, async () => {
      const r = await api.patch(`/appointments/${a._id}/status`, { status: 'CANCELLED' });
      return paid ? (r.refunded ? 'Appointment cancelled and your payment has been refunded.' : 'Appointment cancelled. It was too close to the start time for an automatic refund.') : 'Slot released.';
    });
  };

  if (items === null) return <Spinner />;
  const now = Date.now();
  const upcoming = items.filter((a) => ['PENDING_PAYMENT', 'BOOKED'].includes(a.status) && new Date(a.slotEnd) > now).reverse();
  const past = items.filter((a) => !upcoming.includes(a));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">My appointments</h1>
      <div className="mt-5 flex gap-2">
        {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-4 space-y-3"><ErrorNotice>{msg.error}</ErrorNotice><SuccessNotice>{msg.ok}</SuccessNotice></div>

      <div className="mt-4 space-y-3">
        {list.length === 0 ? <Empty>{tab === 'upcoming' ? <>Nothing booked yet. <Link className="font-semibold text-brand-700" to="/">Find a doctor</Link></> : 'No past appointments.'}</Empty> : list.map((a) => (
          <article key={a._id} className="panel flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={a.doctor.name} src={a.doctor.picture} />
              <div>
                <div className="font-semibold">{a.doctor.name}</div>
                <div className="text-sm text-slate-500">{fmtDateTime(a.slotStart)} · {modeLabel(a.mode)} · {rupees(a.fee)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge status={a.status} />
                  {a.payment.status !== 'NOT_REQUIRED' && ['PAID', 'REFUNDED', 'REFUND_FAILED'].includes(a.payment.status) && <StatusBadge status={a.payment.status} />}
                  {a.status === 'PENDING_PAYMENT' && <HoldCountdown until={a.holdExpiresAt} onExpire={load} />}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.status === 'PENDING_PAYMENT' && <button className="btn btn-sm" disabled={busyId === a._id} onClick={() => pay(a)}><CreditCard size={15} /> Pay now</button>}
              {a.status === 'BOOKED' && <Link className="btn btn-sm" to={`/consult/${a._id}`}><Video size={15} /> {a.mode === 'ONLINE' ? 'Join video' : 'Details'}</Link>}
              {a.prescriptionReady && (
                <>
                  <Link className="btn-secondary btn-sm" to={`/consult/${a._id}`}>View</Link>
                  <button className="btn-secondary btn-sm" onClick={() => downloadPrescription(a._id).catch((e) => setMsg({ error: e.message, ok: '' }))}><Download size={15} /> Prescription</button>
                </>
              )}
              {['PENDING_PAYMENT', 'BOOKED'].includes(a.status) && new Date(a.slotStart) > now && (
                <button className="btn-danger btn-sm" disabled={busyId === a._id} onClick={() => cancel(a)}><XCircle size={15} /> Cancel</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
