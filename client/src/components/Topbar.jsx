import { Link, NavLink, useNavigate } from 'react-router-dom';
import { HeartPulse, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

const NAV = {
  patient: [['/', 'Find a doctor'], ['/appointments', 'My appointments']],
  doctor: [['/doctor', 'My schedule']],
  admin: [['/admin', 'Admin']],
};

export default function Topbar() {
  const { user, signOut, openAuth } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`;

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-brand-700">
          <HeartPulse size={22} /> Tulasi HealthConnect
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {(user ? NAV[user.role] : [['/', 'Find a doctor']]).map(([to, label]) => (
            <NavLink key={to} to={to} end className={link}>{label}</NavLink>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight md:block">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs capitalize text-slate-500">{user.role}</div>
            </div>
            <Avatar name={user.name} src={user.picture} size={36} />
            <button className="btn-secondary btn-sm" onClick={() => { signOut(); navigate('/'); }} aria-label="Sign out"><LogOut size={15} /></button>
          </div>
        ) : (
          <button className="btn btn-sm" onClick={openAuth}>Sign in</button>
        )}
      </div>
      {user && (
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 sm:hidden">
          {NAV[user.role].map(([to, label]) => <NavLink key={to} to={to} end className={link}>{label}</NavLink>)}
        </nav>
      )}
    </header>
  );
}
