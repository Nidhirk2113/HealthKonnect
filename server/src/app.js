
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { razorpayWebhook } from './controllers/paymentController.js';

export function createApp() {
  const app = express();

  // Trust the reverse proxy for client IP detection and rate limiting.
  app.set('trust proxy', 1);

  // Security headers.
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    })
  );

  // CORS configuration.
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: false,
    })
  );

  // Razorpay webhook must receive the raw request body for HMAC verification.
  // This middleware must remain before express.json().
  app.post(
    '/api/v1/payments/razorpay/webhook',
    express.raw({
      type: 'application/json',
      limit: '1mb',
    }),
    razorpayWebhook
  );

  // Parse JSON request bodies.
  app.use(
    express.json({
      limit: '100kb',
    })
  );

  // Global API rate limiting.
  app.use(
    '/api/v1',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Health-check endpoint.
  app.get('/health', (_req, res) => {
    const up = mongoose.connection.readyState === 1;

    return res.status(up ? 200 : 503).json({
      status: up ? 'ok' : 'degraded',
      db: up,
    });
  });

  // API routes.
  app.use('/api/v1', routes);

  // JSON 404 handler.
  app.use((_req, res) => {
    return res.status(404).json({
      message: 'Route not found',
    });
  });

  // Centralized error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Zod validation errors.
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: err.issues[0]?.message || 'Invalid input',
        issues: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Invalid MongoDB ObjectId or casting errors.
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid identifier',
      });
    }

    // Mongoose schema validation errors.
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: err.message,
      });
    }

    // MongoDB duplicate-key errors.
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'A record with this value already exists',
      });
    }

    // Other application or server errors.
    const status = err.status || 500;

    if (status >= 500) {
      console.error(err);
    }

    return res.status(status).json({
      message:
        status >= 500 && env.isProd
          ? 'Internal server error'
          : err.message,
    });
  });

  return app;
}

// Vercel serverless handler.
// Connect to MongoDB lazily and reuse the Express app between invocations.
const serverlessApp = createApp();

let dbConnectionPromise;

export default async function handler(req, res) {
  if (mongoose.connection.readyState !== 1) {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDB().catch((error) => {
        dbConnectionPromise = undefined;
        throw error;
      });
    }

    await dbConnectionPromise;
  }

  return serverlessApp(req, res);
}
