import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, MapPin, ShieldCheck, Video } from 'lucide-react';
import { ICONS } from '../lib/icons.js';
import { api } from '../services/api.js';
import { CLINIC, HOW_IT_WORKS, SERVICES } from '../lib/clinic.js';
import { useMeta } from '../lib/seo.js';
import BlogCard from '../components/site/BlogCard.jsx';
import FeaturedDoctors from '../components/site/FeaturedDoctors.jsx';
import { Section, SectionHeading } from '../components/site/ui.jsx';
import { Empty, Spinner } from '../components/Notice.jsx';

const Icon = ({ name, ...p }) => { const C = ICONS[name] || ICONS.Circle; return <C {...p} />; };

function HeroVisual() {
  const [missing, setMissing] = useState(false);
  // Drop a licensed or clinic-owned photo at client/public/images/hero.jpg to replace the illustration.
  return missing ? (
    <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 via-brand-50 to-white shadow-soft" aria-hidden="true">
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/10" />
      <div className="absolute -bottom-12 -left-8 h-56 w-56 rounded-full bg-brand-500/10" />
      <ICONS.HeartPulse size={96} className="text-brand-600" strokeWidth={1.25} />
    </div>
  ) : (
    <img
  src="/images/hero.jpg"
  alt="Tulasi Healthcare — Mental Health and Well-being"
  onError={() => setMissing(true)}
  className="aspect-[4/3] w-full rounded-3xl object-contain bg-white shadow-soft"
/>
  );
}

export default function Landing() {
  useMeta({
  title: 'Tulasi HealthConnect · Thoughtful mental healthcare in Bengaluru',
  description: "Book a confidential online or in-clinic consultation with Tulasi Healthcare's mental health specialists.",
});
  const [posts, setPosts] = useState(null);
  useEffect(() => { api.get('/blogs?limit=3').then((r) => setPosts(r.posts)).catch(() => setPosts([])); }, []);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-[#f7faf8]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="fade-up">
           <p className="eyebrow">{CLINIC.name} · {CLINIC.location}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">Your Mental Well-being Deserves Thoughtful Care.</h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">{CLINIC.name} offers psychiatry and counselling consultations, online or in clinic. Book a confidential appointment in minutes and receive your prescription digitally.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/doctors" className="btn">Book an Appointment <ArrowRight size={16} /></Link>
              <Link to="/services" className="btn-secondary">Explore Our Services</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-2"><Video size={16} className="text-brand-600" /> Private video consults</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" /> Secure payments</span>
              <span className="flex items-center gap-2"><Lock size={16} className="text-brand-600" /> Notes stay confidential</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <Section id="about">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <SectionHeading eyebrow="About us" title="Care that puts you first">
            {CLINIC.name} is a {CLINIC.tagline.toLowerCase()} based in Bengaluru, committed to making quality mental health care accessible across India.
          </SectionHeading>
          <ul className="space-y-3 text-slate-600">
            <li className="panel p-4"><strong className="text-ink">Confidential by design.</strong> Consultation notes are visible only to you and your doctor.</li>
            <li className="panel p-4"><strong className="text-ink">Your choice of how to meet.</strong> Private video consultations or visits to the clinic.</li>
            <li className="panel p-4"><strong className="text-ink">Clear and digital.</strong> Book, pay and receive your prescription without paperwork.</li>
          </ul>
        </div>
        <div className="mt-6"><Link to="/about" className="font-semibold text-brand-700 hover:underline">More about us <ArrowRight size={14} className="inline" /></Link></div>
      </Section>

      <div className="bg-white">
        <Section id="services">
          <SectionHeading eyebrow="Services" title="Support for how you are feeling" center>Consultations and therapies delivered by our specialists.</SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="panel p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon name={s.icon} size={22} /></span>
                <h3 className="mt-4 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><Link to="/services" className="btn-secondary">All services <ArrowRight size={16} /></Link></div>
        </Section>
      </div>

      <Section id="doctors">
        <SectionHeading eyebrow="Our doctors" title="Meet our specialists">Book directly with the doctor who is right for you.</SectionHeading>
        <FeaturedDoctors />
      </Section>

      <div className="bg-white">
        <Section id="how-it-works">
          <SectionHeading eyebrow="How it works" title="From booking to prescription" center />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-brand-50 p-5">
                <span className="absolute right-4 top-3 text-3xl font-extrabold text-brand-500/20">{i + 1}</span>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600"><Icon name={s.icon} size={20} /></span>
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section id="blogs">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <SectionHeading eyebrow="Resources" title="Latest from our blog" />
          <Link to="/blogs" className="mb-8 font-semibold text-brand-700 hover:underline">All articles <ArrowRight size={14} className="inline" /></Link>
        </div>
        {posts === null ? <Spinner /> : posts.length === 0 ? <Empty>Articles are coming soon.</Empty> : (
          <div className="grid gap-5 md:grid-cols-3">{posts.map((p) => <BlogCard key={p.id} post={p} />)}</div>
        )}
      </Section>

      <Section id="contact" className="!pt-0">
        <div className="panel flex flex-col items-start justify-between gap-5 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Questions before you book?</h2>
            <p className="mt-2 flex items-center gap-2 text-slate-600"><MapPin size={16} className="text-brand-600" /> {CLINIC.address || CLINIC.location}</p>
            {CLINIC.phone && <p className="mt-1 text-slate-600">{CLINIC.phone}</p>}
          </div>
          <Link to="/contact" className="btn">Contact us</Link>
        </div>
      </Section>
    </>
  );
}
