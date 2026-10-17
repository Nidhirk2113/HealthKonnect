import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 120 },
    dosage: { type: String, trim: true, maxlength: 60 },
    frequency: { type: String, trim: true, maxlength: 80 },
    duration: { type: String, trim: true, maxlength: 60 },
    instructions: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    privateNotes: { type: String, trim: true, maxlength: 5000, default: '' }, // never exposed to the patient
    diagnosis: { type: String, trim: true, maxlength: 500, default: '' },
    advice: { type: String, trim: true, maxlength: 3000, default: '' },
    medicines: { type: [medicineSchema], default: [] },
    followUpDate: Date,
    finalized: { type: Boolean, default: false },
    finalizedAt: Date,
    rxNumber: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model('Consultation', consultationSchema);
