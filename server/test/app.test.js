import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { createApp } = await import('../src/app.js');

async function withServer(fn) {
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}

test('unauthenticated requests to protected routes are rejected', async () => {
  await withServer(async (base) => {
    for (const path of ['/api/v1/appointments/mine', '/api/v1/admin/stats', '/api/v1/auth/me']) {
      const res = await fetch(base + path);
      assert.equal(res.status, 401, path);
    }
  });
});

test('dev-login is not mounted when DEV_AUTH is off', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/v1/auth/dev-login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"email":"a@b.co"}' });
    assert.equal(res.status, 404);
  });
});

test('webhook rejects requests with a bad signature', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/v1/payments/razorpay/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'nope' }, body: '{}' });
    assert.equal(res.status, 400);
  });
});

test('unknown routes return JSON 404', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/v1/nope`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).message, 'Route not found');
  });
});
