import crypto from 'node:crypto';
import { env } from '../config/env.js';

/** Unguessable room name; the URL itself acts as the access token. Use a self-hosted Jitsi + JWT for stricter control. */
export function buildMeetingUrl() {
  return `https://${env.JITSI_DOMAIN}/TulasiHC-${crypto.randomBytes(12).toString('hex')}`;
}

/** Join window: opens 10 minutes before start, closes 30 minutes after the slot ends. */
export function videoWindow(appt) {
  return {
    opensAt: new Date(appt.slotStart.getTime() - 10 * 60000),
    closesAt: new Date(appt.slotEnd.getTime() + 30 * 60000),
  };
}
