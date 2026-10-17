import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const { verifyCheckoutSignature, verifyWebhookSignature } = await import('../src/services/razorpay.js');
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

test('accepts a valid checkout signature', () => {
  const sig = hmac('rzp_secret_for_tests', 'order_1|pay_1');
  assert.ok(verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: sig }));
});

test('rejects tampered or missing checkout signatures', () => {
  const sig = hmac('rzp_secret_for_tests', 'order_1|pay_1');
  assert.ok(!verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_2', signature: sig }));
  assert.ok(!verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1', signature: 'abc' }));
  assert.ok(!verifyCheckoutSignature({ orderId: 'order_1', paymentId: 'pay_1' }));
});

test('webhook signature is verified over the raw body', () => {
  const body = '{"event":"payment.captured"}';
  assert.ok(verifyWebhookSignature(body, hmac('whsec_for_tests', body)));
  assert.ok(!verifyWebhookSignature(body + ' ', hmac('whsec_for_tests', body)));
});
