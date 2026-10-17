import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Authentication required');
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.isActive) throw new HttpError(401, 'Account not found or disabled');
  req.user = user; // role is read fresh from the DB, so role changes apply immediately
  next();
});

export const requireRole = (...roles) => (req, _res, next) =>
  !req.user || !roles.includes(req.user.role)
    ? next(new HttpError(403, 'You do not have permission to perform this action'))
    : next();
