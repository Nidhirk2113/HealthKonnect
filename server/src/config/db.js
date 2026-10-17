import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
  // Drops stale indexes from older schema versions (e.g. the v1 slot index) so the partial unique index is authoritative.
  await mongoose.syncIndexes();
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}
