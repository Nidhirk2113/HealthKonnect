export default function Avatar({ name = '?', src, size = 44 }) {
  const initials = name.replace(/^Dr\.?\s*/i, '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return src ? (
    <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <div style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initials}</div>
  );
}
