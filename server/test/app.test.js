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
    const protectedRequests = [
      ['GET', '/api/v1/appointments/mine'],
      ['GET', '/api/v1/admin/stats'],
      ['GET', '/api/v1/auth/me'],
      ['GET', '/api/v1/wellbeing/me'],
      ['POST', '/api/v1/wellbeing/check-ins'],
      ['POST', '/api/v1/wellbeing/assessments'],
      ['PUT', '/api/v1/wellbeing/sharing'],
      ['DELETE', '/api/v1/wellbeing/sharing/507f1f77bcf86cd799439011'],
      ['GET', '/api/v1/consultations/507f1f77bcf86cd799439011/wellbeing'],
    ];

    for (const [method, path] of protectedRequests) {
      const res = await fetch(base + path, { method });
      assert.equal(res.status, 401, `${method} ${path}`);
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
