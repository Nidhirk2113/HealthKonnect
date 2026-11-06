import mongoose from 'mongoose';

const wellbeingAssessmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  responses: { type: [Number], required: true, validate: v => v.length === 9 && v.every(n => Number.isInteger(n) && n >= 0 && n <= 3) },
  score: { type: Number, min: 0, max: 27, required: true },
  completedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

wellbeingAssessmentSchema.index({ patient: 1, completedAt: -1 });
export default mongoose.model('WellbeingAssessment', wellbeingAssessmentSchema);
