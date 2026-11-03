import { Link } from 'react-router-dom';
import { ICONS } from '../lib/icons.js';
import { CONDITIONS, SERVICES, THERAPIES } from '../lib/clinic.js';
import { useMeta } from '../lib/seo.js';
import { PageHero, Section } from '../components/site/ui.jsx';

export default function Services() {
  useMeta({ title: 'Services · Tulasi HealthConnect', description: 'Psychiatry consultations, counselling and therapies, online or in clinic.' });
  return (
    <>
      <PageHero eyebrow="Services" title="How we can help">Consultations and therapies, online or in clinic. Availability varies by doctor, so check each doctor’s profile.</PageHero>
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => { const I = ICONS[s.icon] || ICONS.Circle; return (
            <div key={s.title} className="panel p-5">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><I size={22} /></span>
              <h2 className="mt-4 font-bold">{s.title}</h2><p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>); })}
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div><h2 className="text-xl font-extrabold">Therapies</h2><ul className="mt-4 space-y-2 text-slate-600">{THERAPIES.map((t) => <li key={t} className="flex gap-2"><span className="text-brand-600">•</span>{t}</li>)}</ul></div>
          <div><h2 className="text-xl font-extrabold">Areas of care</h2>
            <div className="mt-4 flex flex-wrap gap-2">{CONDITIONS.map((c) => <span key={c} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">{c}</span>)}</div></div>
        </div>
        <div className="mt-12"><Link to="/doctors" className="btn">Book an appointment</Link></div>
      </Section>
    </>
  );
}
