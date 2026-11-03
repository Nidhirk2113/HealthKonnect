import { Link } from 'react-router-dom';
import { CLINIC } from '../lib/clinic.js';
import { useMeta } from '../lib/seo.js';
import { PageHero, Section } from '../components/site/ui.jsx';

// Only statements supported by the clinic's own materials or by how the platform works.
const PRINCIPLES = [
  ['Patient-centred', 'You choose your doctor and how to meet: private video or in clinic.'],
  ['Confidential', 'Consultation notes are visible only to you and your doctor, and prescriptions are shared only once finalised.'],
  ['Accessible', 'Clear fees, simple booking and digital prescriptions, so care is easier to reach.'],
];

export default function About() {
  useMeta({ title: `About · ${CLINIC.name}`, description: `${CLINIC.name} is a ${CLINIC.tagline.toLowerCase()} in Bengaluru.` });
  return (
    <>
      <PageHero eyebrow="About us" title={`About ${CLINIC.name}`}>{CLINIC.tagline}, Bengaluru.</PageHero>
      <Section>
        <div className="max-w-3xl space-y-4 text-lg text-slate-600">
          <p>{CLINIC.name} is a {CLINIC.tagline.toLowerCase()} based in Bengaluru, committed to making quality mental health care accessible across India.</p>
          <p>Tulasi HealthConnect is the clinic’s digital platform. It lets patients find a specialist, book an online or in-clinic consultation, pay securely and receive their prescription digitally.</p>
        </div>
        <h2 className="mt-12 text-2xl font-extrabold">Our approach to care</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(([t, d]) => <div key={t} className="panel p-5"><h3 className="font-bold text-brand-700">{t}</h3><p className="mt-2 text-sm text-slate-600">{d}</p></div>)}
        </div>
        <div className="mt-10 flex gap-3"><Link to="/doctors" className="btn">Meet our doctors</Link><Link to="/contact" className="btn-secondary">Contact us</Link></div>
      </Section>
    </>
  );
}
