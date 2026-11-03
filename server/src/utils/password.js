import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [algorithm, salt, key] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !key) return false;
  try {
    const expected = Buffer.from(key, 'hex');
    const actual = Buffer.from(await scrypt(password, salt, expected.length));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
