import crypto from 'node:crypto';
import { z } from 'zod';
import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.js';
import { renderPrescription } from '../services/prescriptionPdf.js';

const medicine = z.object({
  name: z.string().trim().min(1).max(120),
  dosage: z.string().trim().max(60).optional().default(''),
  frequency: z.string().trim().max(80).optional().default(''),
  duration: z.string().trim().max(60).optional().default(''),
  instructions: z.string().trim().max(200).optional().default(''),
});
const draftSchema = z.object({
  privateNotes: z.string().max(5000).optional(),
  diagnosis: z.string().trim().max(500).optional(),
  advice: z.string().trim().max(3000).optional(),
  medicines: z.array(medicine).max(20).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

/** Loads the appointment and the caller's role in it. Admins are deliberately excluded: clinical content is private. */
async function loadForParticipant(appointmentId, user) {
  const appt = await Appointment.findById(appointmentId);
  if (!appt) throw new HttpError(404, 'Appointment not found');
  const role = appt.doctor.equals(user._id) ? 'doctor' : appt.patient.equals(user._id) ? 'patient' : null;
  if (!role) throw new HttpError(404, 'Appointment not found');
  return { appt, role };
}

const patientView = (c) => ({
  id: c.id,
  appointment: c.appointment,
  rxNumber: c.rxNumber,
  diagnosis: c.diagnosis,
  advice: c.advice,
  medicines: c.medicines,
  followUpDate: c.followUpDate,
  finalizedAt: c.finalizedAt,
  finalized: true,
});

export const getConsultation = asyncHandler(async (req, res) => {
  const { appt, role } = await loadForParticipant(req.params.appointmentId, req.user);
  const c = await Consultation.findOne({ appointment: appt._id });
  if (role === 'doctor') return res.json({ consultation: c });
  res.json({ consultation: c?.finalized ? patientView(c) : null });
});

export const saveConsultation = asyncHandler(async (req, res) => {
  const { appt, role } = await loadForParticipant(req.params.appointmentId, req.user);
  if (role !== 'doctor') throw new HttpError(403, 'Only the treating doctor can write consultation notes');
  if (!['BOOKED', 'COMPLETED'].includes(appt.status)) throw new HttpError(409, 'Notes can only be added to a booked or completed appointment');
  if (appt.slotStart.getTime() - Date.now() > 15 * 60000) throw new HttpError(409, 'Notes open 15 minutes before the appointment');

  const data = draftSchema.parse(req.body);
  const existing = await Consultation.findOne({ appointment: appt._id });
  if (existing?.finalized) throw new HttpError(409, 'This prescription is finalized and can no longer be edited');
  const { followUpDate, ...fields } = data;
  const update = { ...fields };
  // null clears a previously set follow-up date; undefined leaves it untouched.
  if (followUpDate !== undefined) update.followUpDate = followUpDate ? new Date(`${followUpDate}T00:00:00+05:30`) : null;
  const consultation = await Consultation.findOneAndUpdate(
    { appointment: appt._id },
    { $set: update, $setOnInsert: { doctor: appt.doctor, patient: appt.patient } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await audit('CONSULTATION_SAVED', { user: req.user, req, targetId: consultation._id });
  res.json({ consultation });
});

export const finalizeConsultation = asyncHandler(async (req, res) => {
  const { appt, role } = await loadForParticipant(req.params.appointmentId, req.user);
  if (role !== 'doctor') throw new HttpError(403, 'Only the treating doctor can finalize a prescription');
  const c = await Consultation.findOne({ appointment: appt._id });
  if (!c) throw new HttpError(409, 'Save your notes before finalizing');
  if (c.finalized) return res.json({ consultation: c });
  if (!c.diagnosis && !c.advice && !c.medicines.length) throw new HttpError(400, 'Add a diagnosis, advice, or at least one medicine before finalizing');

  const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()).replaceAll('-', '');
  c.rxNumber = `TH-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  c.finalized = true;
  c.finalizedAt = new Date();
  await c.save();
  if (appt.status === 'BOOKED') {
    appt.status = 'COMPLETED';
    await appt.save();
  }
  await audit('CONSULTATION_FINALIZED', { user: req.user, req, targetId: c._id, metadata: { rxNumber: c.rxNumber } });
  res.json({ consultation: c });
});

export const prescriptionPdf = asyncHandler(async (req, res) => {
  const { appt } = await loadForParticipant(req.params.appointmentId, req.user);
  const c = await Consultation.findOne({ appointment: appt._id, finalized: true });
  if (!c) throw new HttpError(404, 'No finalized prescription for this appointment');
  const [appointment, doctorProfile] = await Promise.all([
    Appointment.findById(appt._id).populate('doctor patient', 'name email phone'),
    DoctorProfile.findOne({ user: appt.doctor }),
  ]);
  const pdf = await renderPrescription({
    clinic: { name: env.CLINIC_NAME, address: doctorProfile?.clinicAddress || env.CLINIC_ADDRESS },
    doctor: appointment.doctor,
    doctorProfile,
    patient: appointment.patient,
    appointment,
    consultation: c,
  });
  await audit('PRESCRIPTION_DOWNLOADED', { user: req.user, req, targetId: c._id });
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${c.rxNumber}.pdf"`,
    'Cache-Control': 'private, no-store',
  });
  res.send(pdf);
});
