import mongoose from 'mongoose';
import { CATEGORY_SLUGS } from './BlogCategory.js';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, trim: true, maxlength: 300, default: '' },
    content: { type: String, required: true, maxlength: 60000 }, // Markdown
    coverImage: { type: String, trim: true, maxlength: 600, default: '' }, // URL only, never binary data
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorDisplayName: { type: String, trim: true, maxlength: 120, default: '' },
    category: { type: String, required: true, enum: CATEGORY_SLUGS, index: true }, // BlogCategory slug
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: Date,
    readingMinutes: { type: Number, default: 1 }, // derived from content on every save
    seoTitle: { type: String, trim: true, maxlength: 70, default: '' },
    seoDescription: { type: String, trim: true, maxlength: 160, default: '' },
  },
  { timestamps: true }
);

schema.index({ status: 1, publishedAt: -1 });

export default mongoose.model('BlogPost', schema);
