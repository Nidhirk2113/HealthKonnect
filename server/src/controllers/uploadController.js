import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

// Browser uploads go straight to Cloudinary using a short-lived signature, so no image bytes pass
// through this serverless function. The signature fixes the folder and allowed formats.
export function signBlogImageUpload(_req, res) {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: secret } = env;
  if (!cloudName || !apiKey || !secret) {
    throw new HttpError(503, 'Image uploads are not configured yet. Paste an image URL instead.');
  }
  const params = { allowed_formats: 'jpg,jpeg,png,webp', folder: 'tulasi/blogs', timestamp: Math.floor(Date.now() / 1000) };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + secret).digest('hex');
  res.json({ cloudName, apiKey, signature, ...params, uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` });
}
