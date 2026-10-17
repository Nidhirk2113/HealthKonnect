import { z } from 'zod';
import DoctorProfile from '../models/DoctorProfile.js';
import Appointment, { ACTIVE_HOLD_STATUSES } from '../models/Appointment.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSlots, istDate, istDateTime, isValidDateString } from '../utils/slots.js';
import { releaseExpiredHolds } from '../services/bookingService.js';
import { audit } from '../services/audit.js';

const POPULATE = { path: 'user', select: 'name email picture' };
const MAX_DAYS_AHEAD = 60;

export const listDoctors = asyncHandler(async (req, res) => {
  const q = { isActive: true };
  if (req.query.specialty) q.specialty = String(req.query.specialty);
  if (req.query.mode) q.consultationModes = String(req.query.mode);
  const doctors = await DoctorProfile.find(q).populate(POPULATE).sort({ consultationFee: 1 });
  res.json({ doctors: doctors.filter((d) => d.user) });
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorProfile.findOne({ user: req.params.id, isActive: true }).populate(POPULATE);
  if (!doctor) throw new HttpError(404, 'Doctor not found');
  res.json({ doctor });
});

export const getSlots = asyncHandler(async (req, res) => {
  const date = z.string().refine(isValidDateString, 'date must be YYYY-MM-DD').parse(req.query.date);
  const today = istDate();
  if (date < today) return res.json({ slots: [] });
  if (istDateTime(date, '00:00') - istDateTime(today, '00:00') > MAX_DAYS_AHEAD * 86400000) {
    throw new HttpError(400, `Bookings open up to ${MAX_DAYS_AHEAD} days ahead`);
  }
  const profile = await DoctorProfile.findOne({ user: req.params.id, isActive: true });
  if (!profile) throw new HttpError(404, 'Doctor not found');

  await releaseExpiredHolds();
  const from = istDateTime(date, '00:00');
  const to = new Date(from.getTime() + 86400000);
  const busy = await Appointment.find({
    doctor: req.params.id,
    status: { $in: ACTIVE_HOLD_STATUSES },
    slotStart: { $lt: to },
    slotEnd: { $gt: from },
  }).select('slotStart slotEnd');
  res.json({ slots: generateSlots(profile, date, busy) });
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Doctors manage their own schedule and public bio. Fees are admin-controlled. */
export const myProfile = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) throw new HttpError(404, 'Doctor profile not found');
  res.json({ profile });
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const data = z
    .object({
      slotDurationMinutes: z.union([z.literal(20), z.literal(30), z.literal(45)]),
      consultationModes: z.array(z.enum(['ONLINE', 'IN_CLINIC'])).min(1),
      bio: z.string().max(1000).optional(),
      workingHours: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startTime: hhmm, endTime: hhmm })).max(21),
    })
    .parse(req.body);
  for (const h of data.workingHours) if (h.endTime <= h.startTime) throw new HttpError(400, 'End time must be after start time');
  const profile = await DoctorProfile.findOneAndUpdate({ user: req.user._id }, { $set: data }, { new: true, runValidators: true });
  if (!profile) throw new HttpError(404, 'Doctor profile not found');
  await audit('DOCTOR_SCHEDULE_UPDATED', { user: req.user, req, targetId: profile._id, metadata: { slotDurationMinutes: data.slotDurationMinutes } });
  res.json({ profile });
});
