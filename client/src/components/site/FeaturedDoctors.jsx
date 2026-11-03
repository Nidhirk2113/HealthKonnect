
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Video } from 'lucide-react';

import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { rupees } from '../../lib/format.js';
import Avatar from '../Avatar.jsx';
import BookingModal from '../BookingModal.jsx';
import { Empty, ErrorNotice, Spinner } from '../Notice.jsx';

export default function FeaturedDoctors({ limit = 3 }) {
  const { user, openAuth } = useAuth();

  const [doctors, setDoctors] = useState(null);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get('/doctors')
      .then((r) => {
        if (active) {
          const doctorList = Array.isArray(r.doctors) ? r.doctors : [];

          setDoctors(
            [...doctorList]
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, limit)
          );
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message || 'Unable to load doctors.');
          setDoctors([]);
        }
      });

    return () => {
      active = false;
    };
  }, [limit]);

  const book = (doctor) => {
    if (!user) {
      openAuth();
      return;
    }

    if (user.role !== 'patient') return;

    setBooking(doctor);
  };

  return (
    <>
      <ErrorNotice>{error}</ErrorNotice>

      {doctors === null ? (
        <Spinner />
      ) : error ? null : doctors.length === 0 ? (
        <Empty>Our doctors will be listed here soon.</Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {doctors.map((d) => (
            <article
              key={d._id}
              className="panel flex flex-col p-5"
            >
              {/* Doctor information */}
              <div className="flex items-center gap-3">
                <Avatar
                  name={d.user?.name || 'Doctor'}
                  src={d.user?.picture}
                  size={56}
                />

                <div className="min-w-0">
                  <h3 className="truncate font-bold">
                    {d.user?.name || 'Doctor'}
                  </h3>

                  {d.title && (
                    <p className="truncate text-xs font-medium text-brand-700">
                      {d.title}
                    </p>
                  )}

                  <p className="truncate text-xs text-slate-500">
                    {d.qualifications || ''}
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(d.specialty || []).slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Consultation modes */}
              <div className="mb-4 mt-3 flex items-center gap-3 text-xs text-slate-500">
                {(d.consultationModes || []).includes('ONLINE') && (
                  <span className="flex items-center gap-1">
                    <Video size={13} />
                    Video
                  </span>
                )}

                {(d.consultationModes || []).includes('IN_CLINIC') && (
                  <span className="flex items-center gap-1">
                    <Building2 size={13} />
                    Clinic
                  </span>
                )}
              </div>

              {/* Consultation fee and booking */}
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-lg font-bold">
                  {rupees(d.consultationFee)}
                </span>

                <button
                  className="btn btn-sm"
                  onClick={() => book(d)}
                  disabled={!!user && user.role !== 'patient'}
                >
                  Book
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* View all doctors */}
      <div className="mt-8 text-center">
        <Link to="/doctors" className="btn-secondary">
          View all doctors <ArrowRight size={16} />
        </Link>
      </div>

      {/* Booking modal */}
      {booking && (
        <BookingModal
          doctor={booking}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}
