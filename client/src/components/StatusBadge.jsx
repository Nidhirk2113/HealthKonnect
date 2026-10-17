const STYLES = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-800 ring-amber-200',
  BOOKED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 ring-slate-200',
  CANCELLED: 'bg-red-50 text-red-700 ring-red-200',
  NO_SHOW: 'bg-orange-50 text-orange-800 ring-orange-200',
  EXPIRED: 'bg-slate-100 text-slate-500 ring-slate-200',
  PAID: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  REFUNDED: 'bg-sky-50 text-sky-800 ring-sky-200',
  REFUND_FAILED: 'bg-red-50 text-red-700 ring-red-200',
};
const LABELS = { PENDING_PAYMENT: 'Awaiting payment', NO_SHOW: 'No-show', REFUND_FAILED: 'Refund failed' };

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status.charAt(0) + status.slice(1).toLowerCase();
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLES[status] || STYLES.COMPLETED}`}>{label}</span>;
}
