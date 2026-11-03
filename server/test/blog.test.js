import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const { slugify, readingMinutes, publicFilter, toPublic } = await import('../src/utils/blog.js');
const { blogInput } = await import('../src/controllers/blogController.js');
const { contactInput } = await import('../src/controllers/contactController.js');
const { signBlogImageUpload } = await import('../src/controllers/uploadController.js');
const { env } = await import('../src/config/env.js');
const { createApp } = await import('../src/app.js');

const valid = { title: 'Managing exam stress', content: '## Intro\nHello', category: 'stress-management' };

test('slugify produces clean URL slugs', () => {
  assert.equal(slugify('  Managing Stress: 5 Tips!  '), 'managing-stress-5-tips');
  assert.equal(slugify('Café & Calm'), 'cafe-calm');
  assert.equal(slugify('!!!'), 'post');
});

test('readingMinutes is at least 1 and scales with length', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('word '.repeat(450)), 3);
});

test('publicFilter can only ever match published posts, even if a caller tries to override it', () => {
  const f = publicFilter({ category: 'psychiatry', status: 'draft' });
  assert.equal(f.status, 'published');
  assert.equal(f.category, 'psychiatry');
  assert.ok(f.publishedAt.$lte instanceof Date);
});

test('public shape never leaks author email or content unless asked', () => {
  const post = { _id: 'abc', title: 'T', slug: 't', content: 'secret body', author: { name: 'Dr A', picture: 'p', email: 'a@x.com', _id: 'u1' } };
  const list = toPublic(post);
  assert.equal(list.content, undefined);
  assert.deepEqual(list.author, { name: 'Dr A', picture: 'p' });
  assert.equal(JSON.stringify(list).includes('a@x.com'), false);
  assert.equal(toPublic(post, { withContent: true }).content, 'secret body');
});

test('blog input validation', () => {
  assert.ok(blogInput.safeParse(valid).success);
  assert.equal(blogInput.safeParse({ ...valid, category: 'made-up' }).success, false);
  assert.equal(blogInput.safeParse({ ...valid, coverImage: 'javascript:alert(1)' }).success, false);
  assert.equal(blogInput.safeParse({ ...valid, coverImage: 'http://insecure.example/a.jpg' }).success, false);
  assert.ok(blogInput.safeParse({ ...valid, coverImage: 'https://res.cloudinary.com/x/a.jpg' }).success);
  assert.equal(blogInput.safeParse({ ...valid, tags: Array(11).fill('a') }).success, false);
  assert.equal(blogInput.safeParse({ ...valid, title: 'ab' }).success, false);
});

test('blog input cannot set status, author or slug', () => {
  const out = blogInput.parse({ ...valid, status: 'published', author: 'someone', slug: 'hijack' });
  assert.equal('status' in out, false);
  assert.equal('author' in out, false);
  assert.equal('slug' in out, false);
});

test('contact form requires consent and valid fields', () => {
  const ok = { name: 'Asha', email: 'asha@example.com', message: 'I would like to know more.', consent: true };
  assert.ok(contactInput.safeParse(ok).success);
  assert.equal(contactInput.safeParse({ ...ok, consent: false }).success, false);
  assert.equal(contactInput.safeParse({ ...ok, email: 'nope' }).success, false);
  assert.equal(contactInput.safeParse({ ...ok, message: 'short' }).success, false);
  assert.equal(contactInput.safeParse({ ...ok, website: 'http://spam' }).success, false); // honeypot
});

test('image upload signing: 503 when unconfigured, correct SHA-1 signature when configured', () => {
  assert.throws(() => signBlogImageUpload({}, {}), (e) => e.status === 503);
  Object.assign(env, { CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'shh' });
  let out;
  signBlogImageUpload({}, { json: (b) => { out = b; } });
  const expected = crypto.createHash('sha1')
    .update(`allowed_formats=jpg,jpeg,png,webp&folder=tulasi/blogs&timestamp=${out.timestamp}shh`).digest('hex');
  assert.equal(out.signature, expected);
  assert.equal(out.folder, 'tulasi/blogs');
  assert.equal(JSON.stringify(out).includes('shh'), false); // the secret is never returned
  Object.assign(env, { CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' });
});

test('all blog management endpoints reject anonymous users; contact validates before touching the DB', async () => {
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (method, path, body) => fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  try {
    for (const [m, p] of [['POST', '/blogs'], ['PATCH', '/blogs/1'], ['PATCH', '/blogs/1/publish'], ['PATCH', '/blogs/1/unpublish'], ['DELETE', '/blogs/1'],
      ['GET', '/admin/blogs'], ['GET', '/admin/blogs/1'], ['POST', '/uploads/blog-image/sign'], ['GET', '/admin/contact-messages']]) {
      assert.equal((await call(m, `/api/v1${p}`, m === 'POST' ? {} : undefined)).status, 401, `${m} ${p}`);
    }
    assert.equal((await call('POST', '/api/v1/contact', { name: 'x' })).status, 400);
  } finally { server.close(); }
});
