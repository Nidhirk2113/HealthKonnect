import mongoose from 'mongoose';

const wellbeingSharePermissionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
  shareMoodHistory: { type: Boolean, default: true },
  shareSymptoms: { type: Boolean, default: true },
  shareAssessment: { type: Boolean, default: true },
  shareJournalNotes: { type: Boolean, default: false, select: false },
  grantedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

wellbeingSharePermissionSchema.index({ patient: 1, appointment: 1 }, { unique: true });
export default mongoose.model('WellbeingSharePermission', wellbeingSharePermissionSchema);
