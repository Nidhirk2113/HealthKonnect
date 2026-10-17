import crypto from 'node:crypto';
import { env } from '../config/env.js';

const API = 'https://api.razorpay.com/v1';
const authHeader = () => `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`;

async function call(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Razorpay error: ${data?.error?.description || res.statusText}`);
  return data;
}

export const createOrder = ({ amountPaise, receipt, notes }) =>
  call('/orders', { amount: amountPaise, currency: 'INR', receipt, notes });

export const refundPayment = (paymentId, amountPaise) => call(`/payments/${paymentId}/refund`, { amount: amountPaise });

const safeEqualHex = (a, b) => {
  const x = Buffer.from(String(a), 'utf8');
  const y = Buffer.from(String(b), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const hmac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');

/** Checkout callback signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export const verifyCheckoutSignature = ({ orderId, paymentId, signature, secret = env.RAZORPAY_KEY_SECRET }) =>
  Boolean(secret && orderId && paymentId && signature) && safeEqualHex(hmac(secret, `${orderId}|${paymentId}`), signature);

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret). */
export const verifyWebhookSignature = (rawBody, signature, secret = env.RAZORPAY_WEBHOOK_SECRET) =>
  Boolean(secret && signature) && safeEqualHex(hmac(secret, rawBody), signature);
