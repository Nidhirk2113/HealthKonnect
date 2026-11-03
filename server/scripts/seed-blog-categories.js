// Adds the 7 blog categories. Upsert only: touches nothing else and is safe to run repeatedly.
import 'dotenv/config';
import mongoose from 'mongoose';
import BlogCategory, { DEFAULT_CATEGORIES } from '../src/models/BlogCategory.js';

try {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const category of DEFAULT_CATEGORIES) {
    await BlogCategory.updateOne(
      { slug: category.slug },
      { $set: category },
      { upsert: true, runValidators: true }
    );
  }

  console.log(`Successfully upserted ${DEFAULT_CATEGORIES.length} blog categories.`);
} catch (error) {
  console.error('Blog category seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}