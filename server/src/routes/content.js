import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import * as blog from '../controllers/blogController.js';
import * as contact from '../controllers/contactController.js';
import { signBlogImageUpload } from '../controllers/uploadController.js';

const router = Router();
const adminOnly = [authenticate, requireRole('admin')];
const contactLimiter = rateLimit({ windowMs: 60 * 60000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many enquiries from this connection. Please try again later.' } });

// Public: published content only
router.get('/blogs', h(blog.listPublic));
router.get('/blogs/:slug', h(blog.getPublic));
router.get('/categories', h(blog.categories));
router.post('/contact', contactLimiter, h(contact.submit));

// Admin only
router.get('/admin/blogs', ...adminOnly, h(blog.adminList));
router.get('/admin/blogs/:id', ...adminOnly, h(blog.adminGet));
router.post('/blogs', ...adminOnly, h(blog.create));
router.patch('/blogs/:id', ...adminOnly, h(blog.update));
router.patch('/blogs/:id/publish', ...adminOnly, h(blog.publish));
router.patch('/blogs/:id/unpublish', ...adminOnly, h(blog.unpublish));
router.delete('/blogs/:id', ...adminOnly, h(blog.remove));
router.post('/uploads/blog-image/sign', ...adminOnly, signBlogImageUpload);
router.get('/admin/contact-messages', ...adminOnly, h(contact.adminList));
router.patch('/admin/contact-messages/:id/handled', ...adminOnly, h(contact.markHandled));

export default router;
