import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  ADMIN_EMAILS: z.string().default(''),
  DEV_AUTH: bool,
  // Demo mode explicitly enables simulated payments in production. Never use for real transactions.
  DEMO_MODE: bool,
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  SLOT_HOLD_MINUTES: z.coerce.number().int().min(2).max(60).default(10),
  REFUND_CUTOFF_HOURS: z.coerce.number().min(0).default(2),
  JITSI_DOMAIN: z.string().default('meet.jit.si'),
  CLINIC_NAME: z.string().default('Tulasi Healthcare'),
  CLINIC_ADDRESS: z.string().default('Bengaluru, Karnataka, India'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

const raw = parsed.data;
const isProd = raw.NODE_ENV === 'production';
const hasRazorpay = Boolean(raw.RAZORPAY_KEY_ID && raw.RAZORPAY_KEY_SECRET);

// Demo deployments may explicitly use simulated payments. Development authentication
// remains forbidden in production, even when demo payments are enabled.
if (isProd) {
  if (!raw.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is required in production');
  if (raw.DEV_AUTH) throw new Error('DEV_AUTH must not be enabled in production');
  if (!raw.DEMO_MODE && !hasRazorpay) {
    throw new Error('Razorpay keys are required in production unless DEMO_MODE=true');
  }
  if (!raw.DEMO_MODE && !raw.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is required in production unless DEMO_MODE=true');
  }
}

export const env = {
  ...raw,
  isProd,
  clientOrigins: raw.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
  adminEmails: raw.ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  // DEMO_MODE always forces mock payments, even if Razorpay keys happen to be present.
  paymentMode: raw.DEMO_MODE ? 'mock' : hasRazorpay ? 'razorpay' : 'mock',
};
