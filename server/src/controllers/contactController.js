import { z } from 'zod';
import ContactMessage from '../models/ContactMessage.js';
import { HttpError } from '../utils/httpError.js';

export const contactInput = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().email('Enter a valid email address').max(200),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
  consent: z.literal(true, {
  error: 'Please agree to be contacted about your enquiry'
}),
  website: z.string().trim().max(0).optional(), // honeypot: real users never fill this in
});

export async function submit(req, res) {
  const parsed = contactInput.safeParse(req.body);
  if (!parsed.success) {
    // A filled honeypot is treated as success so bots learn nothing.
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return res.status(201).json({ ok: true });
    throw parsed.error;
  }
  const { name, email, phone, message } = parsed.data;
  await ContactMessage.create({ name, email, phone: phone || undefined, message, consentGivenAt: new Date() });
  res.status(201).json({ ok: true });
}

export async function adminList(_req, res) {
  res.json({ messages: await ContactMessage.find().sort({ createdAt: -1 }).limit(100).lean() });
}

export async function markHandled(req, res) {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: 'handled' },
    { new: true, runValidators: true }
  );

  if (!message) {
    throw new HttpError(404, 'Contact enquiry not found');
  }

  res.json({ ok: true, message });
}
