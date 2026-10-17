import Appointment from '../models/Appointment.js';
import { env } from '../config/env.js';
import { verifyWebhookSignature } from '../services/razorpay.js';
import { confirmBooking } from '../services/bookingService.js';

/**
 * Razorpay webhook: confirms bookings even if the patient closes the tab right after paying.
 * Mounted with express.raw() so the HMAC is computed over the exact bytes Razorpay sent.
 */
export async function razorpayWebhook(req, res) {
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : '';
  if (env.paymentMode !== 'razorpay' || !verifyWebhookSignature(raw, req.get('x-razorpay-signature'))) {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  try {
    const event = JSON.parse(raw);
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        const appt = await Appointment.findOne({ 'payment.orderId': payment.order_id });
        if (appt) await confirmBooking(appt._id, payment.id);
      }
    }
    res.json({ received: true });
  } catch (err) {
    // A 5xx makes Razorpay retry; a lost-slot conflict (409) has already been refunded, so acknowledge it.
    if (err.status === 409) return res.json({ received: true });
    console.error('Webhook error:', err.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
}
