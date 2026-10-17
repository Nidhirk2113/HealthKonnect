import { z } from 'zod';
import User from '../models/User.js';
import DoctorProfile, { SPECIALTIES } from '../models/DoctorProfile.js';
import Appointment from '../models/Appointment.js';
import AuditLog from '../models/AuditLog.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.js';
import { refundAppointment } from '../services/bookingService.js';

const doctorBase = {
  specialty: z.array(z.enum(SPECIALTIES)).min(1),
  qualifications: z.string().trim().max(200).optional(),
  registrationNumber: z.string().trim().max(60).optional(),
  experienceYears: z.number().min(0).max(70).optional(),
  bio: z.string().trim().max(1000).optional(),
  clinicAddress: z.string().trim().max(300).optional(),
  consultationFee: z.number().min(0).max(100000),
  slotDurationMinutes: z.union([z.literal(20), z.literal(30), z.literal(45)]).default(20),
  consultationModes: z.array(z.enum(['ONLINE', 'IN_CLINIC'])).min(1).default(['ONLINE', 'IN_CLINIC']),
};
const weekdays = [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startTime: '10:00', endTime: '17:00' }));

export const stats = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  const [byStatus, revenue, users, doctors] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.aggregate([
      { $match: { 'payment.status': 'PAID', 'payment.paidAt': { $gte: since } } },
      { $group: { _id: null, total: { $sum: '$fee' }, count: { $sum: 1 } } },
    ]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    DoctorProfile.countDocuments({ isActive: true }),
  ]);
  const refundIssues = await Appointment.countDocuments({ 'payment.status': 'REFUND_FAILED' });
  res.json({
    appointmentsByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    revenueLast30Days: revenue[0]?.total || 0,
    paidAppointmentsLast30Days: revenue[0]?.count || 0,
    usersByRole: Object.fromEntries(users.map((u) => [u._id, u.count])),
    activeDoctors: doctors,
    refundIssues,
  });
});

export const listDoctors = asyncHandler(async (_req, res) => {
  const doctors = await DoctorProfile.find().populate('user', 'name email picture isActive lastLoginAt').sort({ createdAt: -1 });
  res.json({ doctors });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const data = z.object({ name: z.string().trim().min(2).max(120), email: z.string().email(), phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(), ...doctorBase }).parse(req.body);
  const { name, email, phone, ...profileData } = data;
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user && user.role !== 'patient') throw new HttpError(409, `That email already belongs to a ${user.role}`);
  if (user && (await DoctorProfile.exists({ user: user._id }))) throw new HttpError(409, 'A doctor profile already exists for that email');

  if (user) Object.assign(user, { role: 'doctor', name, ...(phone && { phone }) });
  else user = new User({ name, email, phone, role: 'doctor' }); // claims the account on first Google sign-in with this email
  await user.save();
  const profile = await DoctorProfile.create({ user: user._id, ...profileData, workingHours: weekdays });
  await audit('DOCTOR_CREATED', { user: req.user, req, targetId: profile._id, metadata: { email } });
  res.status(201).json({ doctor: await profile.populate('user', 'name email picture isActive') });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const data = z.object({ ...Object.fromEntries(Object.entries(doctorBase).map(([k, v]) => [k, v.optional()])), isActive: z.boolean().optional() }).parse(req.body);
  const profile = await DoctorProfile.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true }).populate('user', 'name email picture isActive');
  if (!profile) throw new HttpError(404, 'Doctor not found');
  await audit('DOCTOR_UPDATED', { user: req.user, req, targetId: profile._id, metadata: data });
  res.json({ doctor: profile });
});

export const listAppointments = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.status) q.status = String(req.query.status);
  const page = Math.max(1, Number(req.query.page) || 1);
  const [appointments, total] = await Promise.all([
    Appointment.find(q).select('-meetingUrl').populate('doctor patient', 'name email').sort({ slotStart: -1 }).skip((page - 1) * 25).limit(25),
    Appointment.countDocuments(q),
  ]);
  res.json({ appointments, total, page, pages: Math.ceil(total / 25) });
});

/** Retry a refund that failed at the payment provider (status REFUND_FAILED). */
export const retryRefund = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.id);
  if (!appt || appt.payment.status !== 'REFUND_FAILED') throw new HttpError(404, 'No failed refund found for this appointment');
  appt.payment.status = 'PAID';
  await refundAppointment(appt, req.user, req);
  res.json({ paymentStatus: appt.payment.status });
});

export const auditLogs = asyncHandler(async (req, res) => {
  const q = req.query.action ? { action: String(req.query.action) } : {};
  const logs = await AuditLog.find(q).populate('performedBy', 'name email role').sort({ createdAt: -1 }).limit(100);
  res.json({ logs });
});
