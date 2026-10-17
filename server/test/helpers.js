// Minimal env so modules that import config/env.js can load in tests (no DB connection is made).
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-123';
process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_for_tests';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_for_tests';
