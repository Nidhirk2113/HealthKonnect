
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { env } from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { audit } from '../services/audit.js';
import { verifyPassword, hashPassword } from '../utils/password.js';

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  picture: u.picture,
  phone: u.phone,
  role: u.role,
});

/**
 * Find-or-create a user by Google subject, falling back to verified email.
 * Existing pre-provisioned doctor accounts can claim their account by
 * signing in with the matching verified Google email.
 */
async function upsertUser({ googleId, email, name, picture }) {
  email = email.toLowerCase().trim();

  let user = googleId ? await User.findOne({ googleId }) : null;

  if (!user) {
    user = await User.findOne({ email });
  }

  if (user) {
    if (
      googleId &&
      user.googleId &&
      user.googleId !== googleId
    ) {
      throw new HttpError(
        409,
        'This email is linked to a different Google account'
      );
    }

    if (googleId && !user.googleId) {
      user.googleId = googleId;
    }

    if (picture) user.picture = picture;
    if (!user.name) user.name = name;
  } else {
    user = new User({
      googleId,
      email,
      name,
      picture,
      role: 'patient',
    });
  }

  if (env.adminEmails.includes(email)) {
    user.role = 'admin';
  }

  if (!user.isActive) {
    throw new HttpError(403, 'This account has been disabled');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return user;
}

/**
 * Google sign-in.
 */
export const googleLogin = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw new HttpError(
      503,
      'Google sign-in is not configured on the server'
    );
  }

  const { credential } = z
    .object({ credential: z.string().min(20) })
    .parse(req.body);

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch {
    throw new HttpError(
      401,
      'Google sign-in could not be verified'
    );
  }

  if (!payload?.email || !payload.email_verified) {
    throw new HttpError(
      403,
      'Your Google email address is not verified'
    );
  }

  const user = await upsertUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture,
  });

  await audit('USER_LOGIN', {
    user,
    req,
    metadata: { method: 'google' },
  });

  res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

/**
 * Development convenience login.
 * The route must only be mounted when DEV_AUTH=true outside production.
 */
export const devLogin = asyncHandler(async (req, res) => {
  const { email, name } = z
    .object({
      email: z.string().email(),
      name: z.string().min(1).max(120).optional(),
    })
    .parse(req.body);

  const normalizedEmail = email.trim().toLowerCase();

  const user = await upsertUser({
    email: normalizedEmail,
    name: name || normalizedEmail.split('@')[0],
  });

  await audit('USER_LOGIN', {
    user,
    req,
    metadata: { method: 'dev' },
  });

  res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

/**
 * Development-only login for an existing roster doctor.
 *
 * This endpoint never creates a user or promotes a patient to doctor.
 * The user must already have the doctor role and an active linked profile.
 */
export const devDoctorLogin = asyncHandler(async (req, res) => {
  const { email } = z
    .object({
      email: z.string().trim().email(),
    })
    .parse(req.body);

  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role: 'doctor',
    isActive: true,
  });

  if (!user) {
    throw new HttpError(
      403,
      'No active doctor account exists for this email'
    );
  }

  const profile = await DoctorProfile.findOne({
    user: user._id,
    isActive: true,
  });

  if (!profile) {
    throw new HttpError(
      403,
      'No active doctor profile is linked to this account'
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  await audit('USER_LOGIN', {
    user,
    req,
    metadata: { method: 'dev-doctor' },
  });

  res.json({
    token: signToken(user),
    user: publicUser(user),
  });
});

/**
 * Return the currently authenticated user.
 */
export const me = (req, res) =>
  res.json({ user: publicUser(req.user) });

/**
 * Update the current user's profile.
 */
export const updateMe = asyncHandler(async (req, res) => {
  const data = z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      phone: z
        .string()
        .trim()
        .regex(
          /^\+?[1-9]\d{9,14}$/,
          'Enter a valid phone number with country code'
        )
        .optional(),
    })
    .parse(req.body);

  Object.assign(req.user, data);

  await req.user.save();

  res.json({
    user: publicUser(req.user),
  });
});

/**
 * Public application configuration.
 */
export const config = (_req, res) =>
  res.json({
    googleClientId: env.GOOGLE_CLIENT_ID || null,
    devAuth: env.DEV_AUTH,
    doctorLoginEnabled: env.DEMO_DOCTOR_AUTH,
    paymentMode: env.paymentMode,
    clinicName: env.CLINIC_NAME,
  });


/**
 * Demo doctor login. It is deliberately limited to pre-provisioned active
 * doctor accounts with an active DoctorProfile; it never creates/promotes users.
 */
export const doctorPasswordLogin = asyncHandler(async (req, res) => {
  if (!env.DEMO_DOCTOR_AUTH) throw new HttpError(404, 'Doctor password sign-in is unavailable');

  const { email, password } = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(200),
  }).parse(req.body);

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({
    email: normalizedEmail,
    role: 'doctor',
    isActive: true,
  }).select('+passwordHash');

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid doctor email or password');
  }

  const profile = await DoctorProfile.findOne({ user: user._id, isActive: true });
  if (!profile) throw new HttpError(403, 'No active doctor profile is linked to this account');

  user.lastLoginAt = new Date();
  await user.save();
  await audit('USER_LOGIN', { user, req, metadata: { method: 'doctor-password' } });

  res.json({ token: signToken(user), user: publicUser(user) });
});

/** Doctors can change only their own password after verifying the current one. */
export const changeDoctorPassword = asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor') throw new HttpError(403, 'Doctor access required');

  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12, 'New password must be at least 12 characters').max(200),
  }).parse(req.body);

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user || !user.isActive) throw new HttpError(401, 'Account not found or disabled');
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError( currentPassword === newPassword ? 400 : 401, 'Current password is incorrect');
  }
  if (currentPassword === newPassword) {
    throw new HttpError(400, 'Choose a password different from your current password');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await audit('DOCTOR_PASSWORD_CHANGED', { user, req });
  res.json({ message: 'Password changed successfully.' });
});
