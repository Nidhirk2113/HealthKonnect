import { api } from '../services/api.js';
import { loadScript } from './loadScript.js';
import { rupees } from './format.js';

export class PaymentDismissed extends Error {
  constructor() {
    super('Payment was not completed. Your slot is held for a few minutes; you can finish paying from My appointments.');
  }
}

/**
 * Opens checkout for a held appointment and resolves with the confirmed appointment once the server has verified payment.
 * Rejects with PaymentDismissed if the patient closes the checkout window.
 */
export async function collectPayment({ appointment, payment }) {
  const verify = (body) => api.post(`/appointments/${appointment._id}/payment/verify`, body).then((r) => r.appointment);

  if (payment.provider === 'mock') {
    const ok = window.confirm(`TEST MODE: simulate a successful payment of ${rupees(payment.amount / 100)}?`);
    if (!ok) throw new PaymentDismissed();
    return verify({ mock: true });
  }

  await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      name: 'Tulasi HealthConnect',
      description: 'Consultation fee',
      prefill: payment.prefill,
      theme: { color: '#1f7b50' },
      handler: (resp) => verify(resp).then(resolve, reject),
      modal: { ondismiss: () => reject(new PaymentDismissed()) },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed. Please try again.')));
    rzp.open();
  });
}
