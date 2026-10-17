import mongoose from 'mongoose';

export const AUDIT_ACTIONS = [
  'USER_LOGIN',
  'APPOINTMENT_HELD',
  'APPOINTMENT_BOOKED',
  'APPOINTMENT_CANCELLED',
  'APPOINTMENT_COMPLETED',
  'APPOINTMENT_NO_SHOW',
  'PAYMENT_CAPTURED',
  'PAYMENT_REFUNDED',
  'PAYMENT_REFUND_FAILED',
  'DOCTOR_SCHEDULE_UPDATED',
  'DOCTOR_CREATED',
  'DOCTOR_UPDATED',
  'CONSULTATION_SAVED',
  'CONSULTATION_FINALIZED',
  'PRESCRIPTION_DOWNLOADED',
];

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // empty for system / webhook events
    targetId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: String,
  },
  { timestamps: true }
);
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
