import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Video } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDateTime, fmtTime, modeLabel } from '../lib/format.js';
import ConsultationEditor, { PrescriptionSummary } from '../components/ConsultationEditor.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { ErrorNotice, Spinner } from '../components/Notice.jsx';

export default function ConsultRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [rx, setRx] = useState(null); // patient-side finalized prescription

  const load = useCallback(() => api.get(`/appointments/${id}`).then(setData).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const isPatient = data?.viewerRole === 'patient';
  const ready = data?.appointment.prescriptionReady;
  useEffect(() => {
    if (isPatient && ready) api.get(`/consultations/${id}`).then((r) => setRx(r.consultation)).catch(() => {});
  }, [isPatient, ready, id]);

  if (error) return <div className="mx-auto max-w-3xl p-6"><ErrorNotice>{error}</ErrorNotice></div>;
  if (!data) return <Spinner />;

  const { appointment: a, video, viewerRole } = data;
  const other = viewerRole === 'doctor' ? a.patient : a.doctor;
  const joinUrl = video.url && `${video.url}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(JSON.stringify(user.name))}`;
  const back = viewerRole === 'doctor' ? '/doctor' : '/appointments';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to={back} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back</Link>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{viewerRole === 'doctor' ? other.name : `Dr. ${other.name.replace(/^Dr\.?\s*/i, '')}`}</h1>
          <p className="text-sm text-slate-500">{fmtDateTime(a.slotStart)} · {modeLabel(a.mode)}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <div className={`grid gap-5 ${viewerRole === 'doctor' || rx ? 'lg:grid-cols-[1.6fr_1fr]' : ''}`}>
        <section className="panel overflow-hidden">
          {video.state === 'open' ? (
            <>
              <iframe title="Video consultation" src={joinUrl} allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write" className="aspect-video w-full min-h-[420px] border-0 bg-slate-900" />
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-slate-500">Having trouble with audio or video?</span>
                <a className="btn-secondary btn-sm" href={video.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Open in new tab</a>
              </div>
            </>
          ) : (
            <div className="grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <Video className="mx-auto text-slate-300" size={44} />
                <h2 className="mt-3 text-lg font-bold">
                  {video.state === 'not_open' && 'Your video room is not open yet'}
                  {video.state === 'closed' && 'This video session has ended'}
                  {video.state === 'na' && (a.mode === 'IN_CLINIC' ? 'In-clinic appointment' : 'Video room unavailable')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {video.state === 'not_open' && `It opens at ${fmtTime(video.opensAt)} IST, 10 minutes before the appointment. This page refreshes automatically.`}
                  {video.state === 'closed' && 'If you need to continue, please book a follow-up.'}
                  {video.state === 'na' && (a.status === 'BOOKED' ? 'Please arrive 10 minutes early.' : `This appointment is ${a.status.toLowerCase().replace('_', ' ')}.`)}
                </p>
              </div>
            </div>
          )}
        </section>

        {viewerRole === 'doctor' && (
          <aside className="panel p-5">
            <h2 className="mb-4 text-lg font-bold">Consultation notes</h2>
            {a.reason && <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm"><div className="label">Patient's reason</div>{a.reason}</div>}
            {['BOOKED', 'COMPLETED'].includes(a.status) ? <ConsultationEditor appointmentId={a._id} onFinalized={load} /> : <p className="text-sm text-slate-500">Notes are available for booked or completed appointments.</p>}
          </aside>
        )}
        {rx && <aside className="panel p-5"><PrescriptionSummary c={rx} appointmentId={a._id} /></aside>}
      </div>
    </div>
  );
}
