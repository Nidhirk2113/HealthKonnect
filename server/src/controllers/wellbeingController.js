import { z } from 'zod';
import Appointment from '../models/Appointment.js';
import MoodCheckIn from '../models/MoodCheckIn.js';
import WellbeingAssessment from '../models/WellbeingAssessment.js';
import WellbeingSharePermission from '../models/WellbeingSharePermission.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.js';

const symptomOptions = ['Sleep difficulty', 'Low energy', 'Difficulty concentrating', 'Low appetite', 'Restlessness', 'Feeling overwhelmed', 'Social withdrawal'];
const checkInSchema = z.object({
  mood: z.number().int().min(1).max(5),
  note: z.string().trim().max(200).optional().default(''),
  symptoms: z.array(z.enum(symptomOptions)).max(symptomOptions.length).optional().default([]),
});
const assessmentSchema = z.object({
  responses: z.array(z.number().int().min(0).max(3)).length(9),
});

export const createCheckIn = asyncHandler(async (req, res) => {
  const data = checkInSchema.parse(req.body);
  const checkIn = await MoodCheckIn.create({ patient: req.user._id, ...data });
  res.status(201).json({ checkIn });
});

export const patientOverview = asyncHandler(async (req, res) => {
  const [checkIns, assessments, appointments] = await Promise.all([
    MoodCheckIn.find({ patient: req.user._id }).sort({ createdAt: -1 }).limit(90).lean(),
    WellbeingAssessment.find({ patient: req.user._id }).sort({ completedAt: -1 }).limit(10).lean(),
    Appointment.find({ patient: req.user._id, status: 'BOOKED', slotEnd: { $gte: new Date() } }).select('_id doctor slotStart slotEnd status').populate('doctor', 'name').sort({ slotStart: 1 }).lean(),
  ]);
  const permissions = appointments.length ? await WellbeingSharePermission.find({ patient: req.user._id, appointment: { $in: appointments.map(a => a._id) } }).lean() : [];
  res.json({ checkIns, assessments, appointments, permissions, symptomOptions });
});

export const saveAssessment = asyncHandler(async (req, res) => {
  const { responses } = assessmentSchema.parse(req.body);
  const score = responses.reduce((sum, value) => sum + value, 0);
  const assessment = await WellbeingAssessment.create({ patient: req.user._id, responses, score });
  res.status(201).json({ assessment });
});

export const setSharing = asyncHandler(async (req, res) => {
  const data = z.object({
    appointmentId: z.string().regex(/^[a-f\d]{24}$/i),
    shareMoodHistory: z.boolean(),
    shareSymptoms: z.boolean(),
    shareAssessment: z.boolean(),
  }).parse(req.body);
  const appt = await Appointment.findOne({ _id: data.appointmentId, patient: req.user._id, status: 'BOOKED', slotEnd: { $gte: new Date() } });
  if (!appt) throw new HttpError(404, 'No active booked appointment is available for sharing');
  const permission = await WellbeingSharePermission.findOneAndUpdate(
    { patient: req.user._id, appointment: appt._id },
    { $set: { doctor: appt.doctor, appointment: appt._id, shareMoodHistory: data.shareMoodHistory, shareSymptoms: data.shareSymptoms, shareAssessment: data.shareAssessment, revokedAt: null, grantedAt: new Date(), shareJournalNotes: false } },
    { new: true, upsert: true, runValidators: true }
  );
  await audit('WELLBEING_SHARE_UPDATED', { user: req.user, req, targetId: permission._id, metadata: { appointmentId: String(appt._id), shareMoodHistory: data.shareMoodHistory, shareSymptoms: data.shareSymptoms, shareAssessment: data.shareAssessment } });
  res.json({ permission });
});

export const revokeSharing = asyncHandler(async (req, res) => {
  const permission = await WellbeingSharePermission.findOneAndUpdate(
    { _id: req.params.permissionId, patient: req.user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }, { new: true }
  );
  if (!permission) throw new HttpError(404, 'Sharing permission not found');
  await audit('WELLBEING_SHARE_REVOKED', { user: req.user, req, targetId: permission._id });
  res.json({ message: 'Sharing permission revoked.' });
});

export const consultationSummary = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({
    _id: req.params.appointmentId,
    doctor: req.user._id,
    status: 'BOOKED',
    slotStart: { $lte: new Date() },
    slotEnd: { $gte: new Date() },
  });
  if (!appt) throw new HttpError(404, 'Active consultation not found');
  const permission = await WellbeingSharePermission.findOne({
    patient: appt.patient, doctor: req.user._id, appointment: appt._id, revokedAt: null,
  });
  if (!permission) return res.json({ shared: false, summary: null });
  const since = new Date(Date.now() - 7 * 86400000);
  const [checkIns, assessment] = await Promise.all([
    permission.shareMoodHistory || permission.shareSymptoms
      ? MoodCheckIn.find({ patient: appt.patient, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean()
      : [],
    permission.shareAssessment ? WellbeingAssessment.findOne({ patient: appt.patient }).sort({ completedAt: -1 }).lean() : null,
  ]);
  const summary = {
    moodHistory: permission.shareMoodHistory ? checkIns.map(({ mood, createdAt }) => ({ mood, createdAt })) : [],
    symptoms: permission.shareSymptoms ? [...new Set(checkIns.flatMap(c => c.symptoms || []))] : [],
    checkInCount: checkIns.length,
    assessment: assessment ? { responses: assessment.responses, score: assessment.score, completedAt: assessment.completedAt } : null,
    windowStart: since,
    generatedAt: new Date(),
  };
  await audit('WELLBEING_SUMMARY_VIEWED', { user: req.user, req, targetId: appt._id, metadata: { patientId: String(appt.patient) } });
  res.set('Cache-Control', 'private, no-store').json({ shared: true, summary });
});
