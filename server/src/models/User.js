import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    picture: { type: String, trim: true },
    phone: { type: String, trim: true, match: /^\+?[1-9]\d{9,14}$/ },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient', index: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
