import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 20 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    consentGivenAt: { type: Date, required: true },
    status: { type: String, enum: ['new', 'handled'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', schema);
