import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ClipboardList, ShieldCheck, Lock, Save, ArrowLeft } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorNotice, Spinner, SuccessNotice } from '../components/Notice.jsx';

const moods = [
  { value: 1, emoji: '😞', label: 'Very low', color: 'border-rose-300 bg-rose-50' },
  { value: 2, emoji: '😕', label: 'Low', color: 'border-orange-300 bg-orange-50' },
  { value: 3, emoji: '😐', label: 'Okay', color: 'border-amber-300 bg-amber-50' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'border-lime-300 bg-lime-50' },
  { value: 5, emoji: '😄', label: 'Great', color: 'border-emerald-300 bg-emerald-50' },
];
const questions = [
  'Little interest or enjoyment in doing things',
  'Feeling low, sad or without hope',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or eating more than usual',
  'Feeling bad about yourself or that you have let yourself or others down',
  'Trouble concentrating on things',
  'Moving or speaking unusually slowly, or feeling unusually restless',
  'Thoughts that you would be better off not here, or of hurting yourself',
];
const frequency = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
const symptomOptions = ['Sleep difficulty', 'Low energy', 'Difficulty concentrating', 'Low appetite', 'Restlessness', 'Feeling overwhelmed', 'Social withdrawal'];

export default function Pause() {
  const [data, setData] = useState(null);
  const [mood, setMood] = useState(3);
  const [note, setNote] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [responses, setResponses] = useState(Array(9).fill(null));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState({});

  const load = () => api.get('/wellbeing/me').then((r) => {
    setData(r);
    const next = {};
    (r.appointments || []).forEach((a) => {
      const p = (r.permissions || []).find(x => String(x.appointment) === String(a._id));
      next[a._id] = {
        shareMoodHistory: p?.shareMoodHistory ?? true,
        shareSymptoms: p?.shareSymptoms ?? true,
        shareAssessment: p?.shareAssessment ?? true,
        permissionId: p?._id,
        granted: Boolean(p && !p.revokedAt),
      };
    });
    setShare(next);
  }).catch(e => setError(e.message));

  useEffect(() => { load(); }, []);

  const saveCheckIn = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      await api.post('/wellbeing/check-ins', { mood, note, symptoms });
      setNote(''); setSymptoms([]); setSuccess('Your check-in has been saved.'); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const saveAssessment = async () => {
    if (responses.some(v => v === null)) { setError('Please answer all nine questions, or return when you are ready.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.post('/wellbeing/assessments', { responses });
      setResponses(Array(9).fill(null)); setSuccess('Your reflection has been saved.'); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const updateShare = async (appointmentId) => {
    const s = share[appointmentId] || {};
    setBusy(true); setError(''); setSuccess('');
    try {
      const r = await api.put('/wellbeing/sharing', {
        appointmentId,
        shareMoodHistory: s.shareMoodHistory !== false,
        shareSymptoms: s.shareSymptoms !== false,
        shareAssessment: s.shareAssessment !== false,
      });
      setShare(x => ({ ...x, [appointmentId]: { ...s, permissionId: r.permission._id, granted: true } }));
      setSuccess('Your selected Pause information is now shared for this appointment.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const revoke = async (appointmentId) => {
    const s = share[appointmentId];
    if (!s?.permissionId) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.delete('/wellbeing/sharing/' + s.permissionId);
      setShare(x => ({ ...x, [appointmentId]: { ...s, granted: false } }));
      setSuccess('Sharing permission revoked.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const days = useMemo(() => {
    const items = data?.checkIns || [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (6-i));
      const key = d.toDateString();
      const hit = items.find(x => new Date(x.createdAt).toDateString() === key);
      return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), mood: hit?.mood, date: key };
    });
  }, [data]);

  if (!data) return <div className="mx-auto max-w-4xl p-6"><Spinner /></div>;
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
    <Link to="/appointments" className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16}/> My appointments</Link>
    <header className="rounded-3xl bg-gradient-to-br from-emerald-950 to-teal-800 p-6 text-white sm:p-8">
      <p className="text-sm font-semibold text-emerald-200">TULASI HEALTHCONNECT · PAUSE</p>
      <h1 className="mt-2 text-3xl font-bold">Pause &amp; Reflect</h1>
      <p className="mt-2 max-w-2xl text-emerald-100">A private space to check in with yourself, notice patterns and reflect at your own pace.</p>
    </header>
    <ErrorNotice>{error}</ErrorNotice><SuccessNotice>{success}</SuccessNotice>

    <section className="panel space-y-4 p-5 sm:p-6">
      <div className="flex items-center gap-2"><HeartPulse className="text-emerald-700"/><h2 className="text-xl font-bold">Daily mood check-in</h2></div>
      <form onSubmit={saveCheckIn} className="space-y-4">
        <fieldset><legend className="mb-3 text-sm text-slate-600">How are you feeling today?</legend>
          <div className="grid grid-cols-5 gap-2">{moods.map(m => <button type="button" key={m.value} aria-pressed={mood===m.value} onClick={()=>setMood(m.value)} className={`rounded-xl border p-2 text-center transition ${mood===m.value?m.color+' ring-2 ring-emerald-600':'border-slate-200 hover:bg-slate-50'}`}><span className="block text-2xl">{m.emoji}</span><span className="text-xs">{m.label}</span></button>)}</div>
        </fieldset>
        <div><label className="label" htmlFor="pause-note">Optional private note (max 200 characters)</label><textarea id="pause-note" className="field" maxLength={200} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Anything you'd like to remember about today?"/><p className="mt-1 text-right text-xs text-slate-400">{note.length}/200 · Never shared with your doctor</p></div>
        <fieldset><legend className="label mb-2">Any symptoms or experiences you'd like to note? (Optional)</legend><div className="flex flex-wrap gap-2">{symptomOptions.map(s=><button type="button" key={s} onClick={()=>setSymptoms(v=>v.includes(s)?v.filter(x=>x!==s):[...v,s])} className={`rounded-full border px-3 py-1.5 text-sm ${symptoms.includes(s)?'border-emerald-700 bg-emerald-50 text-emerald-800':'border-slate-200 text-slate-600'}`} aria-pressed={symptoms.includes(s)}>{s}</button>)}</div></fieldset>
        <button className="btn" disabled={busy}><Save size={16}/>{busy?'Saving…':'Save check-in'}</button>
      </form>
    </section>

    <section className="panel space-y-4 p-5 sm:p-6">
      <div className="flex items-center gap-2"><ClipboardList className="text-emerald-700"/><h2 className="text-xl font-bold">Mental well-being pre-assessment</h2></div>
      <p className="text-sm text-slate-600">Think about how often each experience has affected you over the last two weeks. This optional reflection is not a diagnosis or a substitute for professional assessment.</p>
      <div className="space-y-5">{questions.map((q,i)=><fieldset key={q} className="space-y-2"><legend className="text-sm font-medium text-slate-800">{i+1}. {q}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{frequency.map((f,v)=><button type="button" key={f} onClick={()=>setResponses(x=>x.map((n,j)=>j===i?v:n))} aria-pressed={responses[i]===v} className={`rounded-lg border px-2 py-2 text-xs ${responses[i]===v?'border-emerald-700 bg-emerald-50 text-emerald-900':'border-slate-200 text-slate-600'}`}>{f}</button>)}</div></fieldset>)}</div>
      {responses[8] !== null && responses[8] > 0 && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><strong>You deserve support right now.</strong><p className="mt-1">If you may act on these thoughts or are in immediate danger, contact emergency services (112 in India) or go to the nearest emergency department. You can also call Tele-MANAS at 14416. Consider telling someone you trust and staying with them. This questionnaire cannot assess immediate safety.</p></div>}
      <button className="btn" disabled={busy} onClick={saveAssessment}>{busy?'Saving…':'Save pre-assessment'}</button>
      <p className="text-xs text-slate-500">Your answers are stored privately. If you report thoughts of self-harm, please seek immediate support from a trusted person or qualified professional. In an emergency in India, call 112; Tele-MANAS is available at 14416.</p>
      {data.assessments?.length>0&&<div className="rounded-xl bg-slate-50 p-3"><p className="font-semibold text-sm">Previous reflections</p>{data.assessments.slice(0,3).map(a=><p key={a._id} className="mt-1 text-xs text-slate-600">{new Date(a.completedAt).toLocaleString('en-IN')} · {a.score}/27 reflection score</p>)}</div>}
    </section>

    <section className="panel space-y-4 p-5 sm:p-6">
      <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-700"/><h2 className="text-xl font-bold">Share with your treating doctor</h2></div>
      <p className="text-sm text-slate-600">You can share selected mood trends, symptom tags and your latest pre-assessment with the doctor for a booked consultation. Access is limited to the active consultation and ends when it is no longer active.</p>
      {data.appointments.length===0?<p className="text-sm text-slate-500">You don't have an upcoming booked appointment available for sharing.</p>:data.appointments.map(a=>{const s=share[a._id]||{};return <div key={a._id} className="rounded-xl border border-slate-200 p-4 space-y-3"><div><p className="font-semibold">{a.doctor?.name||'Treating doctor'}</p><p className="text-xs text-slate-500">{new Date(a.slotStart).toLocaleString('en-IN')}</p></div>{[['shareMoodHistory','Seven-day mood history'],['shareSymptoms','Symptom tags'],['shareAssessment','Pre-assessment responses']].map(([k,label])=><label key={k} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><input type="checkbox" checked={s[k]!==false} onChange={e=>setShare(x=>({...x,[a._id]:{...s,[k]:e.target.checked}}))}/></label>)}<div className="flex flex-wrap gap-2"><button className="btn btn-sm" disabled={busy} onClick={()=>updateShare(a._id)}>Save sharing choices</button>{s.granted&&<button className="btn-secondary btn-sm" disabled={busy} onClick={()=>revoke(a._id)}>Revoke sharing</button>}</div>{s.granted&&<p className="text-xs text-emerald-700">Sharing enabled for this appointment. Journal notes are never shared.</p>}</div>})}
      <div className="flex items-start gap-2 text-xs text-slate-500"><Lock size={15} className="mt-0.5 shrink-0"/>Your journal notes are private and excluded from doctor sharing. You can revoke permission at any time.</div>
    </section>
    <section className="panel p-5 sm:p-6"><h2 className="font-bold">Your last seven days</h2><div className="mt-4 grid grid-cols-7 gap-2">{days.map((d,i)=><div key={d.date} className="text-center"><div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg">{d.mood?moods[d.mood-1].emoji:'·'}</div><p className="mt-1 text-xs text-slate-500">{d.label}</p></div>)}</div></section>
  </main>;
}
