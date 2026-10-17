import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as doctors from '../controllers/doctorController.js';
import * as appts from '../controllers/appointmentController.js';
import * as consult from '../controllers/consultationController.js';
import * as admin from '../controllers/adminController.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Please try again later.' } });
const bookingLimiter = rateLimit({ windowMs: 10 * 60000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many booking attempts. Please slow down.' } });
const needAuth = authenticate;
const patient = [needAuth, requireRole('patient')];
const doctor = [needAuth, requireRole('doctor')];
const adminOnly = [needAuth, requireRole('admin')];

// Public
router.get('/config', auth.config);
router.post('/auth/google', authLimiter, auth.googleLogin);

if (env.DEV_AUTH && !env.isProd) {
  router.post('/auth/dev-login', authLimiter, auth.devLogin);
  router.post('/auth/dev-doctor-login', authLimiter, auth.devDoctorLogin);
}

router.get('/doctors', doctors.listDoctors);
router.get('/doctors/me/profile', ...doctor, doctors.myProfile); // before /doctors/:id
router.put('/doctors/me/schedule', ...doctor, doctors.updateSchedule);
router.get('/doctors/:id', doctors.getDoctor);
router.get('/doctors/:id/slots', doctors.getSlots);

// Any signed-in user
router.get('/auth/me', needAuth, auth.me);
router.patch('/auth/me', needAuth, auth.updateMe);

// Appointments
router.post('/appointments', ...patient, bookingLimiter, appts.createAppointment);
router.get('/appointments/mine', ...patient, appts.myAppointments);
router.get('/appointments/doctor', ...doctor, appts.doctorAppointments);
router.get('/appointments/:id', needAuth, appts.getAppointment);
router.post('/appointments/:id/payment', ...patient, bookingLimiter, appts.retryPayment);
router.post('/appointments/:id/payment/verify', ...patient, appts.verifyPayment);
router.patch('/appointments/:id/status', needAuth, appts.updateStatus);

// Consultations & prescriptions (participants only)
router.get('/consultations/:appointmentId', needAuth, consult.getConsultation);
router.put('/consultations/:appointmentId', ...doctor, consult.saveConsultation);
router.post('/consultations/:appointmentId/finalize', ...doctor, consult.finalizeConsultation);
router.get('/consultations/:appointmentId/prescription.pdf', needAuth, consult.prescriptionPdf);

// Admin
router.get('/admin/stats', ...adminOnly, admin.stats);
router.get('/admin/doctors', ...adminOnly, admin.listDoctors);
router.post('/admin/doctors', ...adminOnly, admin.createDoctor);
router.patch('/admin/doctors/:id', ...adminOnly, admin.updateDoctor);
router.get('/admin/appointments', ...adminOnly, admin.listAppointments);
router.post('/admin/appointments/:id/retry-refund', ...adminOnly, admin.retryRefund);
router.get('/admin/audit-logs', ...adminOnly, admin.auditLogs);

export default router;
