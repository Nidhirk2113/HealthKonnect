import BlogPost from '../models/BlogPost.js';

export const slugify = (text) =>
  String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'post';

export const readingMinutes = (markdown = '') =>
  Math.max(1, Math.ceil(markdown.trim().split(/\s+/).filter(Boolean).length / 200));

/** Returns a slug that is not used by another post (appends -2, -3, ...). */
export async function uniqueSlug(title, excludeId) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; await BlogPost.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) }); i += 1) slug = `${base}-${i}`;
  return slug;
}

/** The ONLY filter public endpoints may use: drafts and future-dated posts never match. */
export const publicFilter = (extra = {}) => ({ ...extra, status: 'published', publishedAt: { $lte: new Date() } });

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Public shape: the author's email and internal ids are never exposed. */
export function toPublic(post, { withContent = false } = {}) {
  const o = post.toObject ? post.toObject() : post;
  return {
    id: String(o._id), title: o.title, slug: o.slug, excerpt: o.excerpt, coverImage: o.coverImage,
    category: o.category, tags: o.tags, publishedAt: o.publishedAt, readingMinutes: o.readingMinutes,
    seoTitle: o.seoTitle, seoDescription: o.seoDescription,
    author: o.author ? { name: o.authorDisplayName || o.author.name, picture: o.author.picture } : null,
    ...(withContent && { content: o.content }),
  };
}
