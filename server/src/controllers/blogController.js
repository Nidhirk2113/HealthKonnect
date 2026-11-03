import { z } from 'zod';
import BlogPost from '../models/BlogPost.js';
import BlogCategory, { CATEGORY_SLUGS, DEFAULT_CATEGORIES } from '../models/BlogCategory.js';
import { HttpError } from '../utils/httpError.js';
import { escapeRegex, publicFilter, readingMinutes, toPublic, uniqueSlug } from '../utils/blog.js';

const url = z.string().trim().max(600).refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), 'Image must be an https:// URL');

export const blogInput = z.object({
  title: z.string().trim().min(3, 'Title is too short').max(160),
  excerpt: z.string().trim().max(300).default(''),
  content: z.string().trim().min(1, 'Content is required').max(60000),
  coverImage: url.default(''),
  category: z.enum(CATEGORY_SLUGS, { error: 'Choose a valid category'}),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(10).default([]),
  seoTitle: z.string().trim().max(70).default(''),
  seoDescription: z.string().trim().max(160).default(''),
});
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(9),
  q: z.string().trim().max(80).optional(),
 category: z.enum(CATEGORY_SLUGS).optional(),
});

const withAuthor = (q) => q.populate('author', 'name picture');

// ---------- Public ----------
export async function listPublic(req, res) {
  const { page, limit, q, category } = listQuery.parse(req.query);
  const extra = {};
  if (category) extra.category = category;
  if (q) { const rx = new RegExp(escapeRegex(q), 'i'); extra.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }]; }
  const filter = publicFilter(extra);
  const [total, posts] = await Promise.all([
    BlogPost.countDocuments(filter),
    withAuthor(BlogPost.find(filter).select('-content').sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit)),
  ]);
  res.json({ posts: posts.map((p) => toPublic(p)), page, pages: Math.max(1, Math.ceil(total / limit)), total });
}

export async function getPublic(req, res) {
  const post = await withAuthor(BlogPost.findOne(publicFilter({ slug: String(req.params.slug).toLowerCase() })));
  if (!post) throw new HttpError(404, 'Article not found');
  const related = await withAuthor(BlogPost.find(publicFilter({ category: post.category, _id: { $ne: post._id } })).select('-content').sort({ publishedAt: -1 }).limit(3));
  res.json({ post: toPublic(post, { withContent: true }), related: related.map((p) => toPublic(p)) });
}

export async function categories(_req, res) {
  const rows = await BlogCategory.find().sort({ name: 1 }).lean();
  res.json({ categories: (rows.length ? rows : DEFAULT_CATEGORIES).map(({ name, slug, description }) => ({ name, slug, description })) });
}

// ---------- Admin ----------
export async function adminList(_req, res) {
  const posts = await withAuthor(BlogPost.find().select('-content').sort({ updatedAt: -1 }).limit(200));
  res.json({ posts: posts.map((p) => ({ ...toPublic(p), status: p.status, updatedAt: p.updatedAt })) });
}

export async function adminGet(req, res) {
  const post = await withAuthor(BlogPost.findById(req.params.id));
  if (!post) throw new HttpError(404, 'Article not found');
  res.json({ post: { ...toPublic(post, { withContent: true }), status: post.status } });
}

export async function create(req, res) {
  const data = blogInput.parse(req.body);
  const post = await BlogPost.create({
    ...data, author: req.user._id, slug: await uniqueSlug(data.title), readingMinutes: readingMinutes(data.content),
  });
  res.status(201).json({ post: { ...toPublic(post, { withContent: true }), status: post.status } });
}

export async function update(req, res) {
  const data = blogInput.partial().parse(req.body);
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw new HttpError(404, 'Article not found');
  Object.assign(post, data);
  // The slug is generated once, so published URLs never change when a title is edited.
  if (data.content !== undefined) post.readingMinutes = readingMinutes(post.content);
  await post.save();
  res.json({ post: { ...toPublic(post, { withContent: true }), status: post.status } });
}

export async function setStatus(req, res, status) {
  const post = await BlogPost.findById(req.params.id);

  if (!post) {
    throw new HttpError(404, 'Article not found');
  }

  if (status === 'published') {
    if (
      !post.title?.trim() ||
      !post.content?.trim() ||
      !CATEGORY_SLUGS.includes(post.category)
    ) {
      throw new HttpError(400, 'Complete the article before publishing');
    }
  }

  post.status = status;

  if (status === 'published' && !post.publishedAt) {
    post.publishedAt = new Date();
  }

  await post.save();

  res.json({ post: { ...toPublic(post), status: post.status } });
}

export const publish = (req, res) => setStatus(req, res, 'published');
export const unpublish = (req, res) => setStatus(req, res, 'draft');

export async function remove(req, res) {
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) throw new HttpError(404, 'Article not found');
  res.json({ deleted: true });
}
