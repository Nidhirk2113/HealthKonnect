import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Video, Building2, X } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { collectPayment, PaymentDismissed } from '../lib/payment.js';
import { dayChip, fmtDateTime, fmtTime, nextDays, rupees } from '../lib/format.js';
import { ErrorNotice } from './Notice.jsx';

const DAYS = nextDays(14);

export default function BookingModal({ doctor, onClose }) {
  const { user, setUser, config } = useAuth();
  const [date, setDate] = useState(DAYS[0]);
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState(null);
  const [mode, setMode] = useState(doctor.consultationModes[0]);
  const [reason, setReason] = useState('');
  const [phone, setPhone] = useState(user.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    let alive = true;
    setSlots(null);
    setSlot(null);
    api.get(`/doctors/${doctor.user._id}/slots?date=${date}`)
      .then((r) => alive && setSlots(r.slots))
      .catch((e) => alive && (setError(e.message), setSlots([])));
    return () => { alive = false; };
  }, [date, doctor.user._id]);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (phone && phone !== user.phone) setUser((await api.patch('/auth/me', { phone })).user);
      const { appointment, payment } = await api.post('/appointments', { doctorId: doctor.user._id, slotStartIso: slot.startIso, mode, reason });
      setDone(payment.required ? await collectPayment({ appointment, payment }) : appointment);
    } catch (e) {
      setError(e.message);
      // A failed/closed payment leaves the slot held; refresh availability so the UI stays truthful.
      if (!(e instanceof PaymentDismissed)) setSlot(null);
      api.get(`/doctors/${doctor.user._id}/slots?date=${date}`).then((r) => setSlots(r.slots)).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const open = slots?.filter((s) => s.isAvailable) || [];

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-900/40 p-4" onClick={onClose}>
      <div className="panel relative my-8 w-full max-w-xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="absolute right-5 top-5 text-slate-400 hover:text-slate-700" onClick={onClose} aria-label="Close"><X size={18} /></button>

        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto text-brand-600" size={48} />
            <h2 className="mt-3 text-2xl font-bold">You're booked</h2>
            <p className="mt-2 text-slate-600">{doctor.user.name} · {fmtDateTime(done.slotStart)}</p>
            <p className="mt-1 text-sm text-slate-500">{done.mode === 'ONLINE' ? 'The video room opens 10 minutes before your slot, from My appointments.' : 'Please arrive 10 minutes early at the clinic.'}</p>
            <button className="btn mt-6" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p className="eyebrow">Book appointment</p>
            <h2 className="mt-1 text-2xl font-bold">{doctor.user.name}</h2>
            <p className="text-sm text-slate-500">{doctor.specialty.join(' · ')} · {doctor.slotDurationMinutes}-minute consult · {rupees(doctor.consultationFee)}</p>

            <div className="mt-6">
              <span className="label">Choose a date</span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {DAYS.map((d) => {
                  const c = dayChip(d);
                  return (
                    <button key={d} onClick={() => setDate(d)} className={`min-w-[64px] rounded-xl border px-2 py-2 text-center text-sm ${d === date ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <div className="text-xs opacity-80">{c.weekday}</div><div className="font-semibold">{c.day}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <span className="label">Available times (IST)</span>
              {slots === null ? <p className="text-sm text-slate-400">Loading…</p> : open.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">No open slots on this day. Try another date.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button key={s.startIso} disabled={!s.isAvailable} onClick={() => setSlot(s)}
                      className={`rounded-lg border px-2 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 disabled:line-through ${slot?.startIso === s.startIso ? 'border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-slate-200 hover:bg-slate-50'}`}>
                      {fmtTime(s.startIso)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="label">Consultation type</span>
                <div className="flex gap-2">
                  {doctor.consultationModes.map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${mode === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200'}`}>
                      {m === 'ONLINE' ? <Video size={15} /> : <Building2 size={15} />} {m === 'ONLINE' ? 'Video' : 'In-clinic'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="phone">Mobile number</label>
                <input id="phone" className="field" placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value.trim())} />
              </div>
            </div>
            <div className="mt-4">
              <label className="label" htmlFor="reason">What would you like to discuss? <span className="text-slate-400">(optional, shared only with your doctor)</span></label>
              <textarea id="reason" className="field" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <div className="text-sm">
                <div className="text-slate-500">{slot ? fmtDateTime(slot.startIso) : 'Select a time'}</div>
                <div className="text-lg font-bold">{rupees(doctor.consultationFee)}</div>
              </div>
              <button className="btn" disabled={!slot || busy} onClick={submit}>
                {busy ? 'Please wait…' : doctor.consultationFee > 0 ? 'Pay & confirm' : 'Confirm booking'}
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} /> Your slot is held for a few minutes while you pay.{config.paymentMode === 'mock' && ' Payments are in test mode.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
