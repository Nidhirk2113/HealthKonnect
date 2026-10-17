import AuditLog from '../models/AuditLog.js';

/** Best-effort audit trail: a logging failure must never break the user's action. */
export async function audit(action, { user, req, targetId, metadata } = {}) {
  try {
    await AuditLog.create({ action, performedBy: user?._id, targetId, metadata: metadata || {}, ipAddress: req?.ip });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}
