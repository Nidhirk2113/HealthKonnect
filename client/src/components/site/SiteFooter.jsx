import { Link, useLocation } from 'react-router-dom';
import { HeartPulse, Mail, MapPin, Phone, Clock } from 'lucide-react';
import { CLINIC } from '../../lib/clinic.js';

const PUBLIC_PATH = /^\/(about|services|blogs|contact|doctors)?(\/|$)/;
const LINKS = [['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/doctors', 'Doctors'], ['/blogs', 'Blogs'], ['/contact', 'Contact']];

export default function SiteFooter() {
  const { pathname } = useLocation();
  const base = 'Tulasi HealthConnect · In a mental-health emergency call 112 or Tele-MANAS 14416';

  // App pages (dashboards, consult room) keep the original compact footer.
  if (!PUBLIC_PATH.test(pathname)) {
    return <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">{base}</footer>;
  }
  const contact = [[MapPin, CLINIC.address || CLINIC.location], [Phone, CLINIC.phone], [Mail, CLINIC.email], [Clock, CLINIC.hours]].filter(([, v]) => v);
  return (
    <footer className="mt-8 border-t border-emerald-900/5 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-extrabold text-brand-700"><HeartPulse size={20} /> Tulasi HealthConnect</p>
          <p className="mt-3 text-sm text-slate-600">{CLINIC.name} · {CLINIC.tagline}. Confidential mental healthcare, online or in clinic.</p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-bold">Explore</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
            {LINKS.map(([to, label]) => <li key={to}><Link className="hover:text-brand-700" to={to}>{label}</Link></li>)}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-bold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {contact.map(([Icon, v]) => <li key={v} className="flex items-start gap-2"><Icon size={15} className="mt-0.5 shrink-0 text-brand-600" /> {v}</li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-brand-50 px-4 py-4 text-center text-sm font-medium text-brand-700">{CLINIC.emergency}</div>
      <p className="py-4 text-center text-xs text-slate-400">{base}</p>
    </footer>
  );
}
