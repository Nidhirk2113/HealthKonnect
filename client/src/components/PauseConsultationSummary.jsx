import { useEffect, useState } from 'react';
import { HeartPulse, LockKeyhole } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorNotice } from './Notice.jsx';

const moodNames = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great'];
const frequency = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];

export default function PauseConsultationSummary({ appointmentId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    api.get(`/consultations/${appointmentId}/wellbeing`)
      .then(r => { if (alive) setData(r); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [appointmentId]);

  return <section className="panel p-5 lg:col-span-2">
    <div className="flex items-center gap-2"><HeartPulse className="text-emerald-700"/><h2 className="text-lg font-bold">Pause · Patient well-being</h2></div>
    {error && <ErrorNotice>{error}</ErrorNotice>}
    {!data && !error && <p className="mt-3 text-sm text-slate-500">Loading shared information…</p>}
    {data && !data.shared && <div className="mt-3 flex items-start gap-2 text-sm text-slate-500"><LockKeyhole size={17}/>The patient has not enabled Pause sharing for this consultation.</div>}
    {data?.shared && <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div><h3 className="font-semibold">Mood history · last 7 days</h3><div className="mt-2 flex flex-wrap gap-2">{data.summary.moodHistory.length ? data.summary.moodHistory.map((m,i)=><span key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">{new Date(m.createdAt).toLocaleDateString('en-IN')} · {moodNames[m.mood]}</span>) : <p className="text-sm text-slate-500">No shared mood entries.</p>}</div></div>
      <div><h3 className="font-semibold">Patient-reported symptoms</h3><div className="mt-2 flex flex-wrap gap-2">{data.summary.symptoms.length ? data.summary.symptoms.map(s=><span key={s} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">{s}</span>) : <p className="text-sm text-slate-500">No shared symptom tags.</p>}</div><p className="mt-2 text-xs text-slate-500">{data.summary.checkInCount} check-ins in the last seven days.</p></div>
      {data.summary.assessment && <div className="rounded-xl bg-slate-50 p-3 md:col-span-2"><h3 className="font-semibold">Latest pre-assessment</h3><p className="mt-1 text-sm text-slate-600">{new Date(data.summary.assessment.completedAt).toLocaleString('en-IN')} · Reflection score {data.summary.assessment.score}/27</p><p className="mt-1 text-xs text-slate-500">Self-reflection only; not a diagnosis. Review responses with the patient.</p><div className="mt-2 grid gap-1 sm:grid-cols-2">{data.summary.assessment.responses.map((v,i)=><p key={i} className="text-xs text-slate-600">Q{i+1}: {frequency[v]}</p>)}</div></div>}
      <p className="text-xs text-slate-500 md:col-span-2">Shared by the patient for this active consultation. Journal notes are never shared.</p>
    </div>}
  </section>;
}
