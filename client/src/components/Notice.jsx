import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function ErrorNotice({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
      <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{children}</span>
    </div>
  );
}

export function SuccessNotice({ children }) {
  if (!children) return null;
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> <span>{children}</span>
    </div>
  );
}

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><Loader2 className="animate-spin" size={18} /> {label}</div>
);

export const Empty = ({ children }) => <div className="panel px-6 py-12 text-center text-slate-500">{children}</div>;
