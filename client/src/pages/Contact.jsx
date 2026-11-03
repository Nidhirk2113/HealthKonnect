import { useState } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { api } from '../services/api.js';
import { CLINIC } from '../lib/clinic.js';
import { useMeta } from '../lib/seo.js';
import { PageHero, Section } from '../components/site/ui.jsx';
import { ErrorNotice, SuccessNotice } from '../components/Notice.jsx';

const blank = { name: '', email: '', phone: '', message: '', consent: false, website: '' };

export default function Contact() {
  useMeta({ title: `Contact · ${CLINIC.name}`, description: 'Send an enquiry to Tulasi Healthcare.' });
  const [f, setF] = useState(blank);
  const [state, setState] = useState({ busy: false, error: '', ok: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const details = [[MapPin, 'Location', CLINIC.address || CLINIC.location], [Phone, 'Phone', CLINIC.phone], [Mail, 'Email', CLINIC.email], [Clock, 'Hours', CLINIC.hours]].filter(([, , v]) => v);

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: '', ok: false });
    try { await api.post('/contact', f); setF(blank); setState({ busy: false, error: '', ok: true }); }
    catch (err) { setState({ busy: false, error: err.message, ok: false }); }
  };

  return (
    <>
      <PageHero eyebrow="Contact" title="We’re here to help">Send us an enquiry and we’ll get back to you. This form is not for emergencies.</PageHero>
      <Section>
        <div className="grid gap-8 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="panel space-y-4 p-5">
              {details.map(([I, label, v]) => <div key={label} className="flex gap-3"><I size={18} className="mt-0.5 shrink-0 text-brand-600" /><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="text-slate-700">{v}</p></div></div>)}
            </div>
            <div className="rounded-2xl bg-brand-50 p-5 text-sm font-medium text-brand-700">{CLINIC.emergency}</div>
          </div>
          <form onSubmit={submit} className="panel space-y-4 p-6 md:col-span-3" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="c-name">Full name</label><input id="c-name" className="field" required autoComplete="name" value={f.name} onChange={set('name')} /></div>
              <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" className="field" required autoComplete="email" value={f.email} onChange={set('email')} /></div>
            </div>
            <div><label className="label" htmlFor="c-phone">Phone (optional)</label><input id="c-phone" type="tel" className="field" autoComplete="tel" value={f.phone} onChange={set('phone')} /></div>
            <div><label className="label" htmlFor="c-msg">How can we help?</label><textarea id="c-msg" rows={5} className="field" required maxLength={2000} value={f.message} onChange={set('message')} /></div>
            <div aria-hidden="true" className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
            <label className="flex items-start gap-2 text-sm text-slate-600"><input type="checkbox" className="mt-1" checked={f.consent} onChange={set('consent')} /> I agree that Tulasi Healthcare may use these details to respond to my enquiry.</label>
            <p className="text-xs text-slate-400">Please don’t include sensitive medical details in this form.</p>
            <ErrorNotice>{state.error}</ErrorNotice>
            <SuccessNotice>{state.ok && 'Thank you. Your enquiry has been sent.'}</SuccessNotice>
            <button className="btn" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send enquiry'}</button>
          </form>
        </div>
      </Section>
    </>
  );
}
