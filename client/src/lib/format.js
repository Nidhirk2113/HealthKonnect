const TZ = 'Asia/Kolkata';
const fmt = (opts) => new Intl.DateTimeFormat('en-IN', { timeZone: TZ, ...opts });

export const fmtDateTime = (d) => fmt({ weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(d));
export const fmtTime = (d) => fmt({ hour: 'numeric', minute: '2-digit' }).format(new Date(d));
export const fmtDate = (d) => fmt({ day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
export const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** YYYY-MM-DD for an instant, in IST. */
export const istDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
export const nextDays = (count) => Array.from({ length: count }, (_, i) => istDate(new Date(Date.now() + i * 86400000)));
export const dayChip = (date) => {
  const d = new Date(`${date}T12:00:00+05:30`);
  return { weekday: fmt({ weekday: 'short' }).format(d), day: fmt({ day: 'numeric', month: 'short' }).format(d) };
};
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const modeLabel = (m) => (m === 'ONLINE' ? 'Video' : 'In-clinic');
