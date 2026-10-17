import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import DoctorProfile from '../src/models/DoctorProfile.js';

// Reference roster supplied from the Tulasi Healthcare Bengaluru website HTML.
// Emails are intentionally non-deliverable placeholders for local/demo use only.
// Replace them with verified addresses before enabling real Google OAuth claims.
const hours = (days, startTime, endTime) => days.map((dayOfWeek) => ({ dayOfWeek, startTime, endTime }));
const MON_SAT = [1, 2, 3, 4, 5, 6];
const DOCTORS = [
  { name: 'Dr. Gorav Gupta', email: 'dr.gorav.gupta@placeholder.tulasihealthcare.test', title: 'CEO & Senior Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 25, languages: ['English', 'Hindi'], specialty: ['Addiction', 'Anxiety', 'OCD', 'Personality Disorders', 'Bipolar', 'Schizoaffective Disorders'], consultationFee: 2700, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([4], '14:00', '17:00'), rating: 4.98, reviewsCount: 310 },
  { name: 'Dr. Anu Yadav', email: 'dr.anu.yadav@placeholder.tulasihealthcare.test', title: 'Consultant Psychiatrist', qualifications: 'DNB (Psychiatry), MBBS', experienceYears: 9, languages: ['English', 'Hindi', 'Kannada'], specialty: ['Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.90, reviewsCount: 184 },
  { name: 'Dr. Ratnarakshit Ingole', email: 'dr.ratnarakshit.ingole@placeholder.tulasihealthcare.test', title: 'Senior Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 20, languages: ['English', 'Hindi', 'Marathi'], specialty: ['Dual Diagnosis', 'Panic Disorder', 'Geriatric Psychiatry', 'Bipolar Disorder'], consultationFee: 1700, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.92, reviewsCount: 220 },
  { name: 'Dr. Ichpreet Singh', email: 'dr.ichpreet.singh@placeholder.tulasihealthcare.test', title: 'Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 10, languages: ['English', 'Hindi', 'Punjabi'], specialty: ['Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction'], consultationFee: 1400, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.88, reviewsCount: 156 },
  { name: 'Dr. Poorva Gupta', email: 'dr.poorva.gupta@placeholder.tulasihealthcare.test', title: 'Consultant Psychiatrist', qualifications: 'DPM, MD (Psychiatry)', experienceYears: 7, languages: ['English', 'Hindi'], specialty: ['Schizophrenia', 'Depression', 'Addiction', 'Female Sexual Disorder'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '18:00'), rating: 4.87, reviewsCount: 112 },
  { name: 'Dr. Alisha Nagar', email: 'dr.alisha.nagar@placeholder.tulasihealthcare.test', title: 'Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 8, languages: ['English', 'Hindi'], specialty: ['Psychosis', 'Dementia', 'Mood disorders', 'Schizophrenia'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '16:00', '18:00'), rating: 4.85, reviewsCount: 94 },
  { name: 'Dr. Pooja Sharma', email: 'dr.pooja.sharma@placeholder.tulasihealthcare.test', title: 'Consultant Psychiatrist', qualifications: 'DNB (Psychiatry)', experienceYears: 7, languages: ['English', 'Hindi'], specialty: ['Schizophrenia', 'OCD', 'Bipolar', 'Depression', 'Anxiety'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.89, reviewsCount: 108 },
  { name: 'Dr. Suravi Das', email: 'dr.suravi.das@placeholder.tulasihealthcare.test', title: 'Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 7, languages: ['English', 'Hindi', 'Bengali'], specialty: ['Psychosis', 'Bipolar Disorder', 'Mood disorders', 'Schizophrenia'], consultationFee: 1000, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '16:30', '21:00'), rating: 4.86, reviewsCount: 88 },
  { name: 'Ms. Kiran Singh', email: 'ms.kiran.singh@placeholder.tulasihealthcare.test', title: 'Rehabilitation Psychologist (RCI)', qualifications: 'M.Phil Rehab Psychology (RCI Reg)', experienceYears: 8, languages: ['English', 'Hindi'], specialty: ['CBT', 'DBT', 'ACT', 'ERP'], consultationFee: 1500, slotDurationMinutes: 45, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([3, 6], '17:00', '20:00'), rating: 4.94, reviewsCount: 140 },
  { name: 'Ms. Manju Kumari', email: 'ms.manju.kumari@placeholder.tulasihealthcare.test', title: 'Clinical Psychologist (RCI)', qualifications: 'M.Phil Clinical Psychology (RCI Reg)', experienceYears: 6, languages: ['English', 'Hindi'], specialty: ['CBT', 'Family therapy', 'Marital therapy', 'Mindfulness based therapy', 'Female Sexual Disorder'], consultationFee: 1500, slotDurationMinutes: 45, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([3, 6], '17:00', '20:00'), rating: 4.91, reviewsCount: 115 },
  { name: 'Ms. Aastha Dwivedi', email: 'ms.aastha.dwivedi@placeholder.tulasihealthcare.test', title: 'Consultant Clinical Psychologist (RCI)', qualifications: 'M.Phil Clinical Psychology (RCI Reg)', experienceYears: 8, languages: ['English', 'Hindi'], specialty: ['Interpersonal therapy', 'CBT', 'DBT', 'Behavioral Therapy', 'ERP'], consultationFee: 1500, slotDurationMinutes: 45, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([1, 3], '17:00', '20:00'), rating: 4.93, reviewsCount: 128 },
];

await mongoose.connect(process.env.MONGODB_URI);
try {
  // Hide only the three known demo profiles; retain their users and any historical appointments.
  const oldDemoUsers = await User.find({ email: { $in: ['anita.rao@example.com', 'vikram.shetty@example.com', 'meera.nair@example.com'] } }).select('_id');
  await DoctorProfile.updateMany({ user: { $in: oldDemoUsers.map((u) => u._id) } }, { $set: { isActive: false } });

  for (const { name, email, title, ...profile } of DOCTORS) {
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { name, role: 'doctor', isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await DoctorProfile.findOneAndUpdate(
      { user: user._id },
      { $set: { user: user._id, title, bio: title, isActive: true, ...profile } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded ${name} <${email}>`);
  }
  console.log(`\nActive reference doctors seeded: ${DOCTORS.length}`);
} finally {
  await mongoose.disconnect();
}
