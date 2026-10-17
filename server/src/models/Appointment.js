import mongoose from 'mongoose';

export const ACTIVE_HOLD_STATUSES = ['PENDING_PAYMENT', 'BOOKED', 'COMPLETED', 'NO_SHOW'];

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    mode: { type: String, enum: ['ONLINE', 'IN_CLINIC'], required: true },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    // true while the slot is occupied; removed (unset) on CANCELLED/EXPIRED. Backs the partial unique index below.
    slotActive: { type: Boolean },
    holdExpiresAt: Date,
    reason: { type: String, trim: true, maxlength: 1000 },
    meetingUrl: { type: String, trim: true },
    fee: { type: Number, min: 0, default: 0 }, // INR snapshot at booking time
    payment: {
      status: { type: String, enum: ['NOT_REQUIRED', 'PENDING', 'PAID', 'REFUNDED', 'REFUND_FAILED'], default: 'PENDING' },
      provider: { type: String, enum: ['razorpay', 'mock'] },
      orderId: String,
      paymentId: String,
      refundId: String,
      paidAt: Date,
      refundedAt: Date,
    },
    cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin', 'system'] },
  },
  { timestamps: true }
);

// Atomic double-booking guard: only one occupied appointment per doctor per slot start.
appointmentSchema.index(
  { doctor: 1, slotStart: 1 },
  { unique: true, partialFilterExpression: { slotActive: true }, name: 'uniq_active_doctor_slot' }
);
appointmentSchema.index({ doctor: 1, slotStart: 1, slotEnd: 1 });
appointmentSchema.index({ patient: 1, slotStart: -1 });
appointmentSchema.index({ status: 1, holdExpiresAt: 1 });
appointmentSchema.index({ 'payment.orderId': 1 }, { sparse: true });

export default mongoose.model('Appointment', appointmentSchema);
