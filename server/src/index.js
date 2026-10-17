import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startHoldSweeper } from './jobs/holdSweeper.js';

await connectDB();
const app = createApp();
const sweeper = startHoldSweeper();
const server = app.listen(env.PORT, () => {
  console.log(`Tulasi HealthConnect API on :${env.PORT} (${env.NODE_ENV}) | payments: ${env.paymentMode} | dev-auth: ${env.DEV_AUTH && !env.isProd}`);
});

const shutdown = async () => {
  clearInterval(sweeper);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
