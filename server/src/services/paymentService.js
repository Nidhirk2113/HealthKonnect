import crypto from 'node:crypto';
import { env } from '../config/env.js';
import * as rz from './razorpay.js';

/** Creates a payment order for an appointment. Falls back to a mock provider when Razorpay keys are absent (dev only). */
export async function createPaymentOrder(appt, patient) {
  if (env.paymentMode === 'mock') {
    return { provider: 'mock', orderId: `order_mock_${crypto.randomBytes(8).toString('hex')}` };
  }
  const order = await rz.createOrder({
    amountPaise: Math.round(appt.fee * 100),
    receipt: `appt_${appt.id}`.slice(0, 40),
    notes: { appointmentId: appt.id, patientEmail: patient.email },
  });
  return { provider: 'razorpay', orderId: order.id };
}

export function checkoutConfig(appt, patient) {
  return {
    required: true,
    provider: appt.payment.provider,
    orderId: appt.payment.orderId,
    amount: Math.round(appt.fee * 100), // paise
    currency: 'INR',
    keyId: appt.payment.provider === 'razorpay' ? env.RAZORPAY_KEY_ID : undefined,
    prefill: { name: patient.name, email: patient.email, contact: patient.phone },
  };
}

/** Returns the payment id when the client-supplied proof is valid, otherwise null. */
export function verifyClientPayment(appt, body) {
  if (appt.payment.provider === 'mock') {
    return env.paymentMode === 'mock' && body.mock === true ? `pay_mock_${crypto.randomBytes(8).toString('hex')}` : null;
  }
  const ok =
    body.razorpay_order_id === appt.payment.orderId &&
    rz.verifyCheckoutSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });
  return ok ? body.razorpay_payment_id : null;
}

export async function refund(appt) {
  if (appt.payment.provider === 'mock') return { id: `rfnd_mock_${crypto.randomBytes(6).toString('hex')}` };
  return rz.refundPayment(appt.payment.paymentId, Math.round(appt.fee * 100));
}
