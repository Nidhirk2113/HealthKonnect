import mongoose from 'mongoose';

// Fixed set of blog categories. Also upserted into the collection by scripts/seed-blog-categories.js.
export const DEFAULT_CATEGORIES = [
  { name: 'Mental Health Awareness', slug: 'mental-health-awareness', description: 'Understanding mental health conditions and reducing stigma.' },
  { name: 'Psychiatry', slug: 'psychiatry', description: 'Psychiatric conditions, treatments and what to expect.' },
  { name: 'Psychological Therapy', slug: 'psychological-therapy', description: 'Therapy approaches and how they help.' },
  { name: 'Stress Management', slug: 'stress-management', description: 'Practical ways to manage everyday stress.' },
  { name: 'Emotional Well-being', slug: 'emotional-well-being', description: 'Building emotional resilience and healthy habits.' },
  { name: 'Sleep and Lifestyle', slug: 'sleep-and-lifestyle', description: 'Sleep, routine and lifestyle factors that affect mental health.' },
  { name: 'Expert Insights', slug: 'expert-insights', description: 'Perspectives from clinicians.' },
];
export const CATEGORY_SLUGS = DEFAULT_CATEGORIES.map((c) => c.slug);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('BlogCategory', schema);
