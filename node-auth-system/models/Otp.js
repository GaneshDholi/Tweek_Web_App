const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  purpose: { type: String, enum: ['register', 'login'], required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  resendCount: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now }
});

// optional TTL index if you'd like auto-removal after a fixed window (Mongo TTL uses createdAt+expireAfterSeconds)
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
