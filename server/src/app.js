import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { razorpayWebhook } from './controllers/paymentController.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // Render / Vercel sit behind a proxy; needed for correct client IPs and rate limiting
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // API is consumed from a different origin (Vercel)
  app.use(cors({ origin: env.clientOrigins, credentials: false }));

  // Webhook needs the raw body for HMAC verification, so it is mounted before express.json().
  app.post('/api/v1/payments/razorpay/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);

  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1', rateLimit({ windowMs: 15 * 60000, limit: 600, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (_req, res) => {
    const up = mongoose.connection.readyState === 1;
    res.status(up ? 200 : 503).json({ status: up ? 'ok' : 'degraded', db: up });
  });
  app.use('/api/v1', routes);

  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.issues[0]?.message || 'Invalid input', issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ message: status >= 500 && env.isProd ? 'Internal server error' : err.message });
  });
  return app;
}
