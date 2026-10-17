import Appointment from '../models/Appointment.js';
import { env } from '../config/env.js';
import { buildMeetingUrl } from '../utils/jitsi.js';
import { refund } from './paymentService.js';
import { audit } from './audit.js';

/** Frees slots whose payment hold ran out. Cheap enough to call before every slot read/booking, and also run on a timer. */
export async function releaseExpiredHolds() {
  const res = await Appointment.updateMany(
    { status: 'PENDING_PAYMENT', holdExpiresAt: { $lte: new Date() } },
    { $set: { status: 'EXPIRED' }, $unset: { slotActive: 1 } }
  );
  return res.modifiedCount;
}

/** Refunds a paid appointment. Never throws: failures are recorded so an admin can resolve them. */
export async function refundAppointment(appt, user, req) {
  if (appt.payment.status !== 'PAID') return appt;
  try {
    const r = await refund(appt);
    appt.payment.status = 'REFUNDED';
    appt.payment.refundId = r.id;
    appt.payment.refundedAt = new Date();
    await appt.save();
    await audit('PAYMENT_REFUNDED', { user, req, targetId: appt._id, metadata: { amount: appt.fee, refundId: r.id } });
  } catch (err) {
    appt.payment.status = 'REFUND_FAILED';
    await appt.save();
    await audit('PAYMENT_REFUND_FAILED', { user, req, targetId: appt._id, metadata: { error: err.message } });
  }
  return appt;
}

/**
 * Marks an appointment as paid + booked. Idempotent, so it is safe for both the browser callback and the webhook to call it.
 * If the hold already expired and someone else took the slot, the payment is refunded and a 409 is raised.
 */
export async function confirmBooking(appointmentId, paymentId, { user, req } = {}) {
  const appt = await Appointment.findById(appointmentId);
  if (!appt) return null;
  if (appt.payment.status === 'PAID' || ['BOOKED', 'COMPLETED'].includes(appt.status)) return appt;

  const update = {
    status: 'BOOKED',
    slotActive: true,
    'payment.status': 'PAID',
    'payment.paymentId': paymentId,
    'payment.paidAt': new Date(),
  };
  if (appt.mode === 'ONLINE') update.meetingUrl = buildMeetingUrl();

  try {
    const booked = await Appointment.findOneAndUpdate(
      { _id: appt._id, status: { $in: ['PENDING_PAYMENT', 'EXPIRED'] } },
      { $set: update, $unset: { holdExpiresAt: 1 } },
      { new: true }
    );
    if (booked) await audit('PAYMENT_CAPTURED', { user, req, targetId: booked._id, metadata: { paymentId, amount: booked.fee } });
    if (booked) await audit('APPOINTMENT_BOOKED', { user, req, targetId: booked._id });
    return booked || (await Appointment.findById(appt._id));
  } catch (err) {
    if (err.code !== 11000) throw err;
    // Slot was re-booked by someone else after our hold expired: keep the money trail, then refund.
    const lost = await Appointment.findByIdAndUpdate(
      appt._id,
      { $set: { 'payment.status': 'PAID', 'payment.paymentId': paymentId, 'payment.paidAt': new Date(), cancelledBy: 'system' } },
      { new: true }
    );
    await refundAppointment(lost, user, req);
    const e = new Error('Your payment window expired and the slot was taken. The payment has been refunded.');
    e.status = 409;
    throw e;
  }
}

/** Books immediately when the fee is zero (no payment step). */
export async function confirmFreeBooking(appt, { user, req } = {}) {
  appt.status = 'BOOKED';
  appt.holdExpiresAt = undefined;
  appt.payment.status = 'NOT_REQUIRED';
  if (appt.mode === 'ONLINE') appt.meetingUrl = buildMeetingUrl();
  await appt.save();
  await audit('APPOINTMENT_BOOKED', { user, req, targetId: appt._id });
  return appt;
}

/** True if the patient cancelled early enough to receive a refund. */
export const refundEligible = (appt, now = new Date()) =>
  appt.slotStart.getTime() - now.getTime() >= env.REFUND_CUTOFF_HOURS * 3600000;

export async function cancelAppointment(appt, { by, user, req, refundPaid }) {
  appt.status = 'CANCELLED';
  appt.cancelledBy = by;
  appt.set('slotActive', undefined);
  appt.holdExpiresAt = undefined;
  await appt.save();
  await audit('APPOINTMENT_CANCELLED', { user, req, targetId: appt._id, metadata: { by, refundPaid } });
  if (refundPaid) await refundAppointment(appt, user, req);
  return appt;
}
