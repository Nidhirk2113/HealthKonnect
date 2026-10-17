import { useEffect, useState } from 'react';
import { Download, FileCheck2, Plus, Trash2 } from 'lucide-react';
import { api, downloadPrescription } from '../services/api.js';
import { fmtDate } from '../lib/format.js';
import { ErrorNotice, SuccessNotice } from './Notice.jsx';

const blankMed = () => ({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** Read-only prescription summary (used for patients and for finalized consultations). */
export function PrescriptionSummary({ c, appointmentId }) {
  const [err, setErr] = useState('');
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">E-prescription</p>
          <p className="font-semibold">{c.rxNumber} · {fmtDate(c.finalizedAt)}</p>
        </div>
        <button className="btn btn-sm" onClick={() => downloadPrescription(appointmentId).catch((e) => setErr(e.message))}><Download size={15} /> PDF</button>
      </div>
      <ErrorNotice>{err}</ErrorNotice>
      {c.diagnosis && <div><div className="label">Diagnosis</div><p>{c.diagnosis}</p></div>}
      {c.medicines?.length > 0 && (
        <div>
          <div className="label">Medicines</div>
          <ol className="list-decimal space-y-2 pl-5">
            {c.medicines.map((m, i) => (
              <li key={i}><span className="font-semibold">{m.name}</span><div className="text-slate-500">{[m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')}{m.instructions && ` — ${m.instructions}`}</div></li>
            ))}
          </ol>
        </div>
      )}
      {c.advice && <div><div className="label">Advice</div><p className="whitespace-pre-line">{c.advice}</p></div>}
      {c.followUpDate && <div><div className="label">Follow-up</div><p>{fmtDate(c.followUpDate)}</p></div>}
    </div>
  );
}

/** Doctor's notes + prescription editor. Notes stay private; only the finalized prescription reaches the patient. */
export default function ConsultationEditor({ appointmentId, onFinalized }) {
  const [c, setC] = useState(null);
  const [form, setForm] = useState({ privateNotes: '', diagnosis: '', advice: '', followUpDate: '', medicines: [] });
  const [state, setState] = useState({ busy: false, error: '', ok: '' });

  useEffect(() => {
    api.get(`/consultations/${appointmentId}`).then(({ consultation }) => {
      if (!consultation) return setC(false);
      setC(consultation);
      setForm({ privateNotes: consultation.privateNotes || '', diagnosis: consultation.diagnosis || '', advice: consultation.advice || '', followUpDate: toDateInput(consultation.followUpDate), medicines: consultation.medicines || [] });
    }).catch((e) => setState((s) => ({ ...s, error: e.message })));
  }, [appointmentId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setMed = (i, k, v) => setForm((f) => ({ ...f, medicines: f.medicines.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }));

  const payload = () => ({
    privateNotes: form.privateNotes, diagnosis: form.diagnosis, advice: form.advice,
    followUpDate: form.followUpDate || null,
    medicines: form.medicines.filter((m) => m.name.trim()),
  });

  const run = async (fn, ok) => {
    setState({ busy: true, error: '', ok: '' });
    try { await fn(); setState({ busy: false, error: '', ok }); }
    catch (e) { setState({ busy: false, error: e.message, ok: '' }); }
  };

  const save = () => run(async () => setC((await api.put(`/consultations/${appointmentId}`, payload())).consultation), 'Draft saved');
  const finalize = () => {
    if (!window.confirm('Finalize this prescription? The patient will be able to see and download it, and it can no longer be edited.')) return;
    run(async () => {
      await api.put(`/consultations/${appointmentId}`, payload());
      const { consultation } = await api.post(`/consultations/${appointmentId}/finalize`);
      setC(consultation);
      onFinalized?.();
    }, 'Prescription finalized and shared with the patient');
  };

  if (c === null && !state.error) return <p className="text-sm text-slate-400">Loading notes…</p>;
  if (c?.finalized) return <PrescriptionSummary c={c} appointmentId={appointmentId} />;

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="pn">Private clinical notes <span className="text-slate-400">(never shown to the patient)</span></label>
        <textarea id="pn" className="field" rows={4} value={form.privateNotes} onChange={set('privateNotes')} maxLength={5000} />
      </div>
      <div>
        <label className="label" htmlFor="dx">Diagnosis</label>
        <input id="dx" className="field" value={form.diagnosis} onChange={set('diagnosis')} maxLength={500} />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between"><span className="label !mb-0">Medicines</span>
          <button className="btn-secondary btn-sm" onClick={() => setForm((f) => ({ ...f, medicines: [...f.medicines, blankMed()] }))}><Plus size={14} /> Add</button>
        </div>
        {form.medicines.length === 0 && <p className="text-sm text-slate-400">No medicines added.</p>}
        <div className="space-y-3">
          {form.medicines.map((m, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="flex gap-2">
                <input className="field" placeholder="Medicine name & strength" value={m.name} onChange={(e) => setMed(i, 'name', e.target.value)} aria-label="Medicine name" />
                <button className="btn-danger btn-sm" onClick={() => setForm((f) => ({ ...f, medicines: f.medicines.filter((_, j) => j !== i) }))} aria-label="Remove medicine"><Trash2 size={14} /></button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input className="field" placeholder="Dose" value={m.dosage} onChange={(e) => setMed(i, 'dosage', e.target.value)} />
                <input className="field" placeholder="Frequency" value={m.frequency} onChange={(e) => setMed(i, 'frequency', e.target.value)} />
                <input className="field" placeholder="Duration" value={m.duration} onChange={(e) => setMed(i, 'duration', e.target.value)} />
              </div>
              <input className="field mt-2" placeholder="Instructions (e.g. after food)" value={m.instructions} onChange={(e) => setMed(i, 'instructions', e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="adv">Advice for the patient</label>
        <textarea id="adv" className="field" rows={3} value={form.advice} onChange={set('advice')} maxLength={3000} />
      </div>
      <div>
        <label className="label" htmlFor="fu">Follow-up date</label>
        <input id="fu" type="date" className="field" value={form.followUpDate} onChange={set('followUpDate')} />
      </div>

      <ErrorNotice>{state.error}</ErrorNotice>
      <SuccessNotice>{state.ok}</SuccessNotice>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={state.busy} onClick={save}>Save draft</button>
        <button className="btn" disabled={state.busy} onClick={finalize}><FileCheck2 size={16} /> Finalize & share</button>
      </div>
    </div>
  );
}
