
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  Stethoscope,
  Video,
  MapPin,
  UserRound,
  ArrowUpRight,
  Settings2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { DAYS, fmtDateTime, fmtTime, modeLabel } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  Empty,
  ErrorNotice,
  Spinner,
  SuccessNotice,
} from '../components/Notice.jsx';

function AppointmentList({ scope }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    return api
      .get(`/appointments/doctor?scope=${scope}`)
      .then((r) => {
        setItems(r.appointments);
        setError('');
      })
      .catch((e) => {
        setError(e.message);
        setItems([]);
      });
  }, [scope]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  const mark = async (id, status) => {
    setBusyId(id);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setSuccess(
        status === 'NO_SHOW'
          ? 'Appointment marked as a no-show.'
          : 'Appointment cancelled successfully.'
      );
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancel = (id) => {
    if (
      window.confirm(
        'Cancel this appointment? The patient will be refunded in full.'
      )
    ) {
      mark(id, 'CANCELLED');
    }
  };

  if (items === null) return <Spinner />;

  const booked = items.filter((a) => a.status === 'BOOKED').length;
  const completed = items.filter((a) => a.status === 'COMPLETED').length;
  const title = scope === 'today' ? "Today's appointments" : 'Upcoming appointments';

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-500">Total listed</span>
            <CalendarDays size={18} className="text-emerald-700" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{items.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            {scope === 'today' ? 'Scheduled today' : 'In this list'}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-500">Confirmed</span>
            <Clock3 size={18} className="text-emerald-700" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{booked}</p>
          <p className="mt-1 text-xs text-slate-500">Booked appointments</p>
        </div>

        <div className="col-span-2 rounded-2xl border border-emerald-100 bg-white p-4 sm:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-500">Completed</span>
            <Stethoscope size={18} className="text-emerald-700" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{completed}</p>
          <p className="mt-1 text-xs text-slate-500">Consultations completed</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Your schedule
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review patient details and manage consultations.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
          {items.length} {items.length === 1 ? 'appointment' : 'appointments'}
        </span>
      </div>

      <ErrorNotice>{error}</ErrorNotice>
      <SuccessNotice>{success}</SuccessNotice>

      {items.length === 0 ? (
        <div className="panel p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50">
            <CalendarDays size={26} className="text-emerald-700" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">Nothing on your schedule</h3>
          <p className="mt-1 text-sm text-slate-500">
            No appointments {scope === 'today' ? 'today' : 'coming up'}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const started = new Date(a.slotStart).getTime() <= Date.now();
            const isBusy = busyId === a._id;

            return (
              <article
                key={a._id}
                className="panel overflow-hidden transition hover:border-emerald-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                      <UserRound size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900">
                        {a.patient.name}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={15} />
                          {scope === 'today'
                            ? fmtTime(a.slotStart)
                            : fmtDateTime(a.slotStart)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          {a.mode === 'ONLINE' ? (
                            <Video size={15} />
                          ) : (
                            <MapPin size={15} />
                          )}
                          {modeLabel(a.mode)}
                        </span>
                      </div>

                      {a.reason && (
                        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                          <span className="font-medium text-slate-700">
                            Reason: 
                          </span>
                          {a.reason}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={a.status} />
                        {a.prescriptionReady && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            Prescription shared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    {['BOOKED', 'COMPLETED'].includes(a.status) && (
                      <Link
                        to={`/consult/${a._id}`}
                        className="btn btn-sm"
                      >
                        <Stethoscope size={15} />
                        {a.status === 'BOOKED' ? 'Open consultation' : 'View consultation'}
                        <ArrowUpRight size={14} />
                      </Link>
                    )}

                    {a.status === 'BOOKED' && started && (
                      <button
                        className="btn-secondary btn-sm"
                        disabled={isBusy}
                        onClick={() => mark(a._id, 'NO_SHOW')}
                      >
                        No-show
                      </button>
                    )}

                    {a.status === 'BOOKED' && (
                      <button
                        className="btn-danger btn-sm"
                        disabled={isBusy}
                        onClick={() => cancel(a._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ScheduleEditor() {
  const [p, setP] = useState(null);
  const [days, setDays] = useState({});
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/doctors/me/profile')
      .then(({ profile }) => {
        setP(profile);
        const map = {};

        for (let d = 0; d < 7; d++) {
          const w = profile.workingHours.find((h) => h.dayOfWeek === d);
          map[d] = {
            on: Boolean(w),
            startTime: w?.startTime || '10:00',
            endTime: w?.endTime || '17:00',
          };
        }

        setDays(map);
      })
      .catch((e) => setMsg({ error: e.message, ok: '' }));
  }, []);

  if (!p) {
    return msg.error ? <ErrorNotice>{msg.error}</ErrorNotice> : <Spinner />;
  }

  const toggleMode = (m) =>
    setP((x) => ({
      ...x,
      consultationModes: x.consultationModes.includes(m)
        ? x.consultationModes.filter((i) => i !== m)
        : [...x.consultationModes, m],
    }));

  const save = async () => {
    setBusy(true);
    setMsg({ error: '', ok: '' });

    try {
      const workingHours = Object.entries(days)
        .filter(([, v]) => v.on)
        .map(([d, v]) => ({
          dayOfWeek: Number(d),
          startTime: v.startTime,
          endTime: v.endTime,
        }));

      await api.put('/doctors/me/schedule', {
        slotDurationMinutes: p.slotDurationMinutes,
        consultationModes: p.consultationModes,
        bio: p.bio || '',
        workingHours,
      });

      setMsg({
        error: '',
        ok: 'Schedule saved. Existing bookings are unaffected.',
      });
    } catch (e) {
      setMsg({ error: e.message, ok: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel max-w-3xl space-y-6 p-5 sm:p-7">
      <div>
        <p className="eyebrow">Practice settings</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Schedule & profile
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure your availability and consultation preferences.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="dur">
            Appointment length
          </label>
          <select
            id="dur"
            className="field"
            value={p.slotDurationMinutes}
            onChange={(e) =>
              setP({ ...p, slotDurationMinutes: Number(e.target.value) })
            }
          >
            {[20, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="label">Consultation types</span>
          <div className="flex flex-wrap gap-4 pt-2">
            {['ONLINE', 'IN_CLINIC'].map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.consultationModes.includes(m)}
                  onChange={() => toggleMode(m)}
                />
                {m === 'ONLINE' ? 'Video' : 'In-clinic'}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Public bio
        </label>
        <textarea
          id="bio"
          className="field"
          rows={3}
          maxLength={1000}
          value={p.bio || ''}
          onChange={(e) => setP({ ...p, bio: e.target.value })}
        />
      </div>

      <div>
        <h3 className="font-semibold text-slate-900">Weekly availability</h3>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Set the days and hours when patients can book you. Times are in IST.
        </p>

        <div className="space-y-3">
          {DAYS.map((name, d) => (
            <div
              key={d}
              className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[120px_1fr_20px_1fr] sm:items-center"
            >
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(days[d]?.on)}
                  onChange={(e) =>
                    setDays({
                      ...days,
                      [d]: { ...days[d], on: e.target.checked },
                    })
                  }
                />
                {name}
              </label>

              <input
                type="time"
                className="field !py-2"
                disabled={!days[d]?.on}
                value={days[d]?.startTime || '10:00'}
                onChange={(e) =>
                  setDays({
                    ...days,
                    [d]: { ...days[d], startTime: e.target.value },
                  })
                }
                aria-label={`${name} start`}
              />

              <span className="hidden text-center text-slate-400 sm:block">
                to
              </span>

              <input
                type="time"
                className="field !py-2"
                disabled={!days[d]?.on}
                value={days[d]?.endTime || '17:00'}
                onChange={(e) =>
                  setDays({
                    ...days,
                    [d]: { ...days[d], endTime: e.target.value },
                  })
                }
                aria-label={`${name} end`}
              />
            </div>
          ))}
        </div>
      </div>

      <ErrorNotice>{msg.error}</ErrorNotice>
      <SuccessNotice>{msg.ok}</SuccessNotice>

      <button className="btn" onClick={save} disabled={busy}>
        <Settings2 size={16} />
        {busy ? 'Saving…' : 'Save schedule'}
      </button>
    </div>
  );
}

export default function DoctorDashboard() {
  const [tab, setTab] = useState('today');

  const tabs = [
    { id: 'today', label: 'Today', icon: CalendarDays },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
    { id: 'schedule', label: 'Schedule & profile', icon: Settings2 },
  ];

  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-9">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg sm:p-9">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-semibold text-emerald-200">
            TULASI HEALTHCONNECT · DOCTOR PORTAL
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Your practice, at a glance.
          </h1>
          <p className="mt-3 text-sm leading-6 text-emerald-100 sm:text-base">
            Manage appointments, meet your patients, and prepare consultation
            reports from one place.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-emerald-50">
            <CalendarDays size={16} />
            {todayLabel}
          </div>
        </div>

        <div className="pointer-events-none absolute -right-10 -top-12 hidden h-64 w-64 rounded-full border border-white/10 sm:block" />
        <div className="pointer-events-none absolute -right-1 -top-3 hidden h-44 w-44 rounded-full border border-white/10 sm:block" />
        <Stethoscope
          className="pointer-events-none absolute bottom-6 right-8 hidden text-white/10 sm:block"
          size={120}
          strokeWidth={1}
        />
      </section>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            My practice
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a view to manage your working day.
          </p>
        </div>

        {tab !== 'schedule' && (
          <Link to="/" className="btn-secondary self-start sm:self-auto">
            View patient portal
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              tab === id
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'schedule' ? (
          <ScheduleEditor />
        ) : (
          <AppointmentList key={tab} scope={tab} />
        )}
      </div>
    </main>
  );
}
