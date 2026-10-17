import mongoose from 'mongoose';

export const SPECIALTIES = ['Addiction', 'Anxiety', 'OCD', 'Personality Disorders', 'Bipolar', 'Schizoaffective Disorders', 'Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction', 'Dual Diagnosis', 'Panic Disorder', 'Geriatric Psychiatry', 'Bipolar Disorder', 'Schizophrenia', 'Depression', 'Female Sexual Disorder', 'Psychosis', 'Dementia', 'Mood disorders', 'CBT', 'DBT', 'ACT', 'ERP', 'Family therapy', 'Marital therapy', 'Mindfulness based therapy', 'Interpersonal therapy', 'Behavioral Therapy'];
const time = /^([01]\d|2[0-3]):[0-5]\d$/;

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    title: { type: String, trim: true, maxlength: 160 },
    specialty: { type: [{ type: String, enum: SPECIALTIES }], default: [] },
    qualifications: { type: String, trim: true, maxlength: 200 },
    languages: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
    rating: { type: Number, min: 0, max: 5 },
    reviewsCount: { type: Number, min: 0, default: 0 },
    registrationNumber: { type: String, trim: true, maxlength: 60 },
    experienceYears: { type: Number, min: 0, max: 70 },
    bio: { type: String, trim: true, maxlength: 1000 },
    clinicAddress: { type: String, trim: true, maxlength: 300 },
    consultationFee: { type: Number, min: 0, required: true },
    slotDurationMinutes: { type: Number, enum: [20, 30, 45], default: 20 },
    consultationModes: { type: [{ type: String, enum: ['ONLINE', 'IN_CLINIC'] }], default: ['ONLINE'] },
    workingHours: {
      type: [{
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        startTime: { type: String, match: time, required: true },
        endTime: { type: String, match: time, required: true },
        _id: false,
      }],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('DoctorProfile', doctorProfileSchema);
