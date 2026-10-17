import { z } from 'zod';
import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSlots, istDate, istDateTime } from '../utils/slots.js';
import { videoWindow } from '../utils/jitsi.js';
import { audit } from '../services/audit.js';
import { checkoutConfig, createPaymentOrder, verifyClientPayment } from '../services/paymentService.js';
import {
  cancelAppointment,
  confirmBooking,
  confirmFreeBooking,
  refundEligible,
  releaseExpiredHolds,
} from '../services/bookingService.js';

const MAX_OPEN_HOLDS = 3;
const LIST_POPULATE = [
  { path: 'doctor', select: 'name email picture' },
  { path: 'patient', select: 'name email phone picture' },
];

const clientView = (a, extras = {}) => {
  const o = a.toObject();
  // The meeting link is only ever delivered through the time-gated detail endpoint.
  delete o.meetingUrl;
  delete o.payment?.orderId;
  return { ...o, ...extras };
};

async function withPrescriptionFlags(appts) {
  const done = await Consultation.find({ appointment: { $in: appts.map((a) => a._id) }, finalized: true }).select('appointment');
  const ready = new Set(done.map((c) => String(c.appointment)));
  return appts.map((a) => clientView(a, { prescriptionReady: ready.has(String(a._id)) }));
}

export const createAppointment = asyncHandler(async (req, res) => {
  const body = z
    .object({
      doctorId: z.string().regex(/^[a-f\d]{24}$/i),
      slotStartIso: z.string().datetime(),
      mode: z.enum(['ONLINE', 'IN_CLINIC']),
      reason: z.string().trim().max(1000).optional(),
    })
    .parse(req.body);

  await releaseExpiredHolds();
  const profile = await DoctorProfile.findOne({ user: body.doctorId, isActive: true });
  if (!profile) throw new HttpError(404, 'Doctor not found');
  if (!profile.consultationModes.includes(body.mode)) throw new HttpError(400, `This doctor does not offer ${body.mode.replace('_', ' ').toLowerCase()} consultations`);

  // The requested time must be exactly one of the doctor's currently open slots; arbitrary times are rejected.
  const start = new Date(body.slotStartIso);
  const date = istDate(start);
  const from = istDateTime(date, '00:00');
  const busy = await Appointment.find({
    doctor: body.doctorId,
    status: { $in: ['PENDING_PAYMENT', 'BOOKED', 'COMPLETED', 'NO_SHOW'] },
    slotStart: { $lt: new Date(from.getTime() + 86400000) },
    slotEnd: { $gt: from },
  }).select('slotStart slotEnd');
  const slot = generateSlots(profile, date, busy).find((s) => s.startIso === start.toISOString());
  if (!slot || !slot.isAvailable) throw new HttpError(409, 'That slot is no longer available. Please pick another.');

  const openHolds = await Appointment.countDocuments({ patient: req.user._id, status: 'PENDING_PAYMENT' });
  if (openHolds >= MAX_OPEN_HOLDS) throw new HttpError(429, 'You have several unpaid bookings. Please complete or cancel them first.');

  let appt;
  try {
    appt = await Appointment.create({
      patient: req.user._id,
      doctor: body.doctorId,
      slotStart: new Date(slot.startIso),
      slotEnd: new Date(slot.endIso),
      mode: body.mode,
      reason: body.reason,
      fee: profile.consultationFee,
      status: 'PENDING_PAYMENT',
      slotActive: true,
      holdExpiresAt: new Date(Date.now() + env.SLOT_HOLD_MINUTES * 60000),
      payment: { status: profile.consultationFee > 0 ? 'PENDING' : 'NOT_REQUIRED' },
    });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'That slot was just taken. Please pick another.');
    throw err;
  }

  if (appt.fee === 0) {
    await confirmFreeBooking(appt, { user: req.user, req });
    return res.status(201).json({ appointment: clientView(appt), payment: { required: false } });
  }

  const order = await createPaymentOrder(appt, req.user);
  appt.payment.provider = order.provider;
  appt.payment.orderId = order.orderId;
  await appt.save();
  await audit('APPOINTMENT_HELD', { user: req.user, req, targetId: appt._id, metadata: { doctor: body.doctorId, slot: slot.startIso } });
  res.status(201).json({ appointment: clientView(appt), payment: checkoutConfig(appt, req.user) });
});

/** Re-opens checkout for an unpaid booking that is still within its hold window. */
export const retryPayment = asyncHandler(async (req, res) => {
  await releaseExpiredHolds();
  const appt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appt) throw new HttpError(404, 'Appointment not found');
  if (appt.status !== 'PENDING_PAYMENT') throw new HttpError(409, 'This booking is no longer awaiting payment');
  if (!appt.payment.orderId) {
    const order = await createPaymentOrder(appt, req.user);
    appt.payment.provider = order.provider;
    appt.payment.orderId = order.orderId;
    await appt.save();
  }
  res.json({ appointment: clientView(appt), payment: checkoutConfig(appt, req.user) });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appt) throw new HttpError(404, 'Appointment not found');
  if (appt.status === 'BOOKED' && appt.payment.status === 'PAID') return res.json({ appointment: clientView(appt) });
  const paymentId = verifyClientPayment(appt, req.body || {});
  if (!paymentId) throw new HttpError(400, 'Payment could not be verified');
  const booked = await confirmBooking(appt._id, paymentId, { user: req.user, req });
  if (booked.status !== 'BOOKED') throw new HttpError(409, 'This booking could not be confirmed');
  res.json({ appointment: clientView(booked) });
});

export const myAppointments = asyncHandler(async (req, res) => {
  await releaseExpiredHolds();
  const appts = await Appointment.find({ patient: req.user._id, status: { $ne: 'EXPIRED' } }).populate(LIST_POPULATE).sort({ slotStart: -1 }).limit(100);
  res.json({ appointments: await withPrescriptionFlags(appts) });
});

export const doctorAppointments = asyncHandler(async (req, res) => {
  const scope = req.query.scope === 'today' ? 'today' : 'upcoming';
  const todayStart = istDateTime(istDate(), '00:00');
  const range = scope === 'today' ? { $gte: todayStart, $lt: new Date(todayStart.getTime() + 86400000) } : { $gte: todayStart };
  const appts = await Appointment.find({ doctor: req.user._id, status: { $in: ['BOOKED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'] }, slotStart: range })
    .populate(LIST_POPULATE)
    .sort({ slotStart: 1 })
    .limit(200);
  res.json({ appointments: await withPrescriptionFlags(appts) });
});

/** Detail + time-gated video access for the two participants. */
export const getAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.id).populate(LIST_POPULATE);
  const isParticipant = appt && [appt.patient._id, appt.doctor._id].some((id) => id.equals(req.user._id));
  if (!appt || !isParticipant) throw new HttpError(404, 'Appointment not found');

  const video = { state: 'na', url: null };
  if (appt.mode === 'ONLINE' && appt.status === 'BOOKED' && appt.meetingUrl) {
    const { opensAt, closesAt } = videoWindow(appt);
    const now = new Date();
    video.opensAt = opensAt;
    video.closesAt = closesAt;
    video.state = now < opensAt ? 'not_open' : now > closesAt ? 'closed' : 'open';
    if (video.state === 'open') video.url = appt.meetingUrl;
  }
  const [ready] = await withPrescriptionFlags([appt]);
  res.json({ appointment: ready, video, viewerRole: appt.doctor._id.equals(req.user._id) ? 'doctor' : 'patient' });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(['CANCELLED', 'COMPLETED', 'NO_SHOW']) }).parse(req.body);
  const appt = await Appointment.findById(req.params.id);
  if (!appt) throw new HttpError(404, 'Appointment not found');

  const role = req.user.role;
  const isPatient = appt.patient.equals(req.user._id);
  const isDoctor = appt.doctor.equals(req.user._id);
  const ctx = { user: req.user, req };

  if (status === 'CANCELLED') {
    if (!(isPatient || isDoctor || role === 'admin')) throw new HttpError(404, 'Appointment not found');
    if (!['PENDING_PAYMENT', 'BOOKED'].includes(appt.status)) throw new HttpError(409, `A ${appt.status.toLowerCase().replace('_', ' ')} appointment cannot be cancelled`);
    if (appt.slotStart <= new Date() && isPatient && role === 'patient') throw new HttpError(409, 'This appointment has already started');
    const by = isPatient && role === 'patient' ? 'patient' : role === 'admin' ? 'admin' : 'doctor';
    // Patients get a refund only before the cutoff; clinic-initiated cancellations are always refunded in full.
    const refundPaid = by === 'patient' ? refundEligible(appt) : true;
    await cancelAppointment(appt, { by, refundPaid, ...ctx });
    return res.json({ appointment: clientView(appt), refunded: appt.payment.status === 'REFUNDED' });
  }

  if (!isDoctor) throw new HttpError(403, 'Only the treating doctor can do this');
  if (appt.status !== 'BOOKED') throw new HttpError(409, 'Only booked appointments can be updated');
  if (appt.slotStart > new Date()) throw new HttpError(409, 'This appointment has not started yet');
  appt.status = status;
  await appt.save();
  await audit(status === 'COMPLETED' ? 'APPOINTMENT_COMPLETED' : 'APPOINTMENT_NO_SHOW', { ...ctx, targetId: appt._id });
  res.json({ appointment: clientView(appt) });
});
