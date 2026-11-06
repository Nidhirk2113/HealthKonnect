import mongoose from 'mongoose';

const moodCheckInSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mood: { type: Number, min: 1, max: 5, required: true },
  note: { type: String, trim: true, maxlength: 200, default: '' },
  symptoms: { type: [String], default: [] },
}, { timestamps: true });

moodCheckInSchema.index({ patient: 1, createdAt: -1 });
export default mongoose.model('MoodCheckIn', moodCheckInSchema);
