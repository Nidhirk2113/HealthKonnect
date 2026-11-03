import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import DoctorProfile from '../src/models/DoctorProfile.js';
import { hashPassword } from '../src/utils/password.js';

// Reference roster supplied from the Tulasi Healthcare Bengaluru website HTML.
// Emails are intentionally non-deliverable placeholders for local/demo use only.
// Replace them with verified addresses before enabling real Google OAuth claims.
const hours = (days, startTime, endTime) => days.map((dayOfWeek) => ({ dayOfWeek, startTime, endTime }));
const MON_SAT = [1, 2, 3, 4, 5, 6];
const DOCTORS = [
  { name: 'Dr. Gorav Gupta', email: 'gorav.gupta@healthkonnect.com', title: 'CEO & Senior Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 25, languages: ['English', 'Hindi'], specialty: ['Addiction', 'Anxiety', 'OCD', 'Personality Disorders', 'Bipolar', 'Schizoaffective Disorders'], consultationFee: 2700, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([4], '14:00', '17:00'), rating: 4.98, reviewsCount: 310 },
  { name: 'Dr. Anu Yadav', email: 'anu.yadav@healthkonnect.com', title: 'Consultant Psychiatrist', qualifications: 'DNB (Psychiatry), MBBS', experienceYears: 9, languages: ['English', 'Hindi', 'Kannada'], specialty: ['Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.90, reviewsCount: 184 },
  { name: 'Dr. Ratnarakshit Ingole', email: 'ratnarakshit.ingole@healthkonnect.com', title: 'Senior Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 20, languages: ['English', 'Hindi', 'Marathi'], specialty: ['Dual Diagnosis', 'Panic Disorder', 'Geriatric Psychiatry', 'Bipolar Disorder'], consultationFee: 1700, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.92, reviewsCount: 220 },
  { name: 'Dr. Ichpreet Singh', email: 'ichpreet.singh@healthkonnect.com', title: 'Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 10, languages: ['English', 'Hindi', 'Punjabi'], specialty: ['Psychosexual Disorder', 'Psychotic Disorders', 'Anxiety & OCD', 'Phobias', 'Sexual Dysfunction'], consultationFee: 1400, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.88, reviewsCount: 156 },
  { name: 'Dr. Poorva Gupta', email: 'poorva.gupta@healthkonnect.com', title: 'Consultant Psychiatrist', qualifications: 'DPM, MD (Psychiatry)', experienceYears: 7, languages: ['English', 'Hindi'], specialty: ['Schizophrenia', 'Depression', 'Addiction', 'Female Sexual Disorder'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '18:00'), rating: 4.87, reviewsCount: 112 },
  { name: 'Dr. Alisha Nagar', email: 'alisha.nagar@healthkonnect.com', title: 'Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 8, languages: ['English', 'Hindi'], specialty: ['Psychosis', 'Dementia', 'Mood disorders', 'Schizophrenia'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '16:00', '18:00'), rating: 4.85, reviewsCount: 94 },
  { name: 'Dr. Pooja Sharma', email: 'pooja.sharma@healthkonnect.com', title: 'Consultant Psychiatrist', qualifications: 'DNB (Psychiatry)', experienceYears: 7, languages: ['English', 'Hindi'], specialty: ['Schizophrenia', 'OCD', 'Bipolar', 'Depression', 'Anxiety'], consultationFee: 1200, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '10:00', '17:00'), rating: 4.89, reviewsCount: 108 },
  { name: 'Dr. Suravi Das', email: 'suravi.das@healthkonnect.com', title: 'Consultant Psychiatrist', qualifications: 'MD (Psychiatry)', experienceYears: 7, languages: ['English', 'Hindi', 'Bengali'], specialty: ['Psychosis', 'Bipolar Disorder', 'Mood disorders', 'Schizophrenia'], consultationFee: 1000, slotDurationMinutes: 20, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours(MON_SAT, '16:30', '21:00'), rating: 4.86, reviewsCount: 88 },
  { name: 'Ms. Kiran Singh', email: 'kiran.singh@healthkonnect.com', title: 'Rehabilitation Psychologist (RCI)', qualifications: 'M.Phil Rehab Psychology (RCI Reg)', experienceYears: 8, languages: ['English', 'Hindi'], specialty: ['CBT', 'DBT', 'ACT', 'ERP'], consultationFee: 1500, slotDurationMinutes: 45, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([3, 6], '17:00', '20:00'), rating: 4.94, reviewsCount: 140 },
  { name: 'Ms. Manju Kumari', email: 'manju.kumari@healthkonnect.com', title: 'Clinical Psychologist (RCI)', qualifications: 'M.Phil Clinical Psychology (RCI Reg)', experienceYears: 6, languages: ['English', 'Hindi'], specialty: ['CBT', 'Family therapy', 'Marital therapy', 'Mindfulness based therapy', 'Female Sexual Disorder'], consultationFee: 1500, slotDurationMinutes: 45, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([3, 6], '17:00', '20:00'), rating: 4.91, reviewsCount: 115 },
  { name: 'Ms. Aastha Dwivedi', email: 'aastha.dwivedi@healthkonnect.com', title: 'Consultant Clinical Psychologist (RCI)', qualifications: 'M.Phil Clinical Psychology (RCI Reg)', experienceYears: 8, languages: ['English', 'Hindi'], specialty: ['Interpersonal therapy', 'CBT', 'DBT', 'Behavioral Therapy', 'ERP'], consultationFee: 1500, slotDurationMinutes: 45, consultationModes: ['ONLINE', 'IN_CLINIC'], workingHours: hours([1, 3], '17:00', '20:00'), rating: 4.93, reviewsCount: 128 },
];

await mongoose.connect(process.env.MONGODB_URI);

const initialDoctorPassword = process.env.DEMO_DOCTOR_PASSWORD || '';
if (process.env.DEMO_DOCTOR_AUTH === 'true' && initialDoctorPassword.length < 12) {
  throw new Error('Set DEMO_DOCTOR_PASSWORD (at least 12 characters) before seeding demo doctor accounts.');
}
const initialPasswordHash = initialDoctorPassword ? await hashPassword(initialDoctorPassword) : null;
const legacyEmails = {
  "gorav.gupta@healthkonnect.com": "dr.gorav.gupta@placeholder.tulasihealthcare.test",
  "anu.yadav@healthkonnect.com": "dr.anu.yadav@placeholder.tulasihealthcare.test",
  "ratnarakshit.ingole@healthkonnect.com": "dr.ratnarakshit.ingole@placeholder.tulasihealthcare.test",
  "ichpreet.singh@healthkonnect.com": "dr.ichpreet.singh@placeholder.tulasihealthcare.test",
  "poorva.gupta@healthkonnect.com": "dr.poorva.gupta@placeholder.tulasihealthcare.test",
  "alisha.nagar@healthkonnect.com": "dr.alisha.nagar@placeholder.tulasihealthcare.test",
  "pooja.sharma@healthkonnect.com": "dr.pooja.sharma@placeholder.tulasihealthcare.test",
  "suravi.das@healthkonnect.com": "dr.suravi.das@placeholder.tulasihealthcare.test",
  "kiran.singh@healthkonnect.com": "ms.kiran.singh@placeholder.tulasihealthcare.test",
  "manju.kumari@healthkonnect.com": "ms.manju.kumari@placeholder.tulasihealthcare.test",
  "aastha.dwivedi@healthkonnect.com": "ms.aastha.dwivedi@placeholder.tulasihealthcare.test"
};

try {
  // Hide only the three known demo profiles; retain their users and any historical appointments.
  const oldDemoUsers = await User.find({ email: { $in: ['anita.rao@example.com', 'vikram.shetty@example.com', 'meera.nair@example.com'] } }).select('_id');
  await DoctorProfile.updateMany({ user: { $in: oldDemoUsers.map((u) => u._id) } }, { $set: { isActive: false } });

  for (const { name, email, title, ...profile } of DOCTORS) {
    let user = await User.findOne({ email }).select('+passwordHash');
    if (!user && legacyEmails[email]) user = await User.findOne({ email: legacyEmails[email] }).select('+passwordHash');
    if (user) {
      user.email = email;
      user.name = name;
      user.role = 'doctor';
      user.isActive = true;
      if (initialPasswordHash && !user.passwordHash) user.passwordHash = initialPasswordHash;
      await user.save();
    } else {
      user = await User.create({
        name, email, role: 'doctor', isActive: true,
        ...(initialPasswordHash ? { passwordHash: initialPasswordHash } : {}),
      });
    }
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
