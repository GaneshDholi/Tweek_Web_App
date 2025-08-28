const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

const Otp = require('../models/Otp');
const User = require('../models/User');
const { sendSms } = require('../utils/smsProvider');


const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '5');
const RESEND_COOLDOWN = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60');

// Basic rate limiter (per IP) for OTP endpoints
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many OTP requests from this IP, try later'
});

function normalizePhone(raw) {
    const pn = parsePhoneNumberFromString(raw);
    if (!pn || !pn.isValid()) throw new Error('Invalid phone number');
    return pn.number;
}

function generateOtp(digits = OTP_LENGTH) {
    const min = 10 ** (digits - 1);
    const max = 10 ** digits - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// POST /auth/request-otp
// body: { phone, purpose: 'register'|'login' }
router.post('/request-otp', otpLimiter, async (req, res) => {
    try {
        const { phone: rawPhone, purpose } = req.body;
        if (!rawPhone || !purpose) return res.status(400).json({ message: 'phone and purpose required' });
        if (!['register', 'login'].includes(purpose)) return res.status(400).json({ message: 'invalid purpose' });

        const phone = normalizePhone(rawPhone);

        // If purpose is register and user already exists, suggest login flow instead
        if (purpose === 'register') {
            const existing = await User.findOne({ phone });
            if (existing) return res.status(400).json({ message: 'Phone already registered. Use login.' });
        }

        // If purpose is login and user doesn't exist, suggest register
        if (purpose === 'login') {
            const existing = await User.findOne({ phone });
            if (!existing) return res.status(400).json({ message: 'Phone not found. Please register first.' });
        }

        // Check existing OTP doc for cooldown
        const existingOtp = await Otp.findOne({ phone, purpose });
        const now = new Date();
        if (existingOtp) {
            const secondsSinceSent = (now - existingOtp.lastSentAt) / 1000;
            if (secondsSinceSent < RESEND_COOLDOWN) {
                return res.status(429).json({ message: `Please wait ${Math.ceil(RESEND_COOLDOWN - secondsSinceSent)}s before requesting again.` });
            }
        }

        const otp = generateOtp(OTP_LENGTH);
        const otpHash = await bcrypt.hash(otp, 10);

        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        // Upsert OTP record
        await Otp.findOneAndUpdate(
            { phone, purpose },
            {
                phone,
                purpose,
                otpHash,
                expiresAt,
                lastSentAt: now,
                $inc: { resendCount: 1 },
                attempts: 0
            },
            { upsert: true, new: true }
        );

        // Send SMS
        const smsBody = `Your verification code is: ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`;
        await sendSms({ to: phone, body: smsBody });

        return res.json({ message: 'OTP sent' });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: err.message || 'Error' });
    }
});

// POST /auth/verify-otp
// body: { phone, purpose, otp }
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone: rawPhone, purpose, otp } = req.body;
        if (!rawPhone || !purpose || !otp) return res.status(400).json({ message: 'phone, purpose, otp required' });

        const phone = normalizePhone(rawPhone);

        const otpDoc = await Otp.findOne({ phone, purpose });
        if (!otpDoc) return res.status(400).json({ message: 'No OTP requested for this phone/purpose' });

        const now = new Date();
        if (now > otpDoc.expiresAt) {
            await Otp.deleteOne({ _id: otpDoc._id });
            return res.status(400).json({ message: 'OTP expired. Request a new one.' });
        }

        // Limit attempts
        if (otpDoc.attempts >= 5) {
            await Otp.deleteOne({ _id: otpDoc._id });
            return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
        }

        const match = await bcrypt.compare(otp, otpDoc.otpHash);
        if (!match) {
            otpDoc.attempts = (otpDoc.attempts || 0) + 1;
            await otpDoc.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP correct
        await Otp.deleteOne({ _id: otpDoc._id });

        let user = await User.findOne({ phone });
        if (purpose === 'register') {
            if (user) {
                // maybe they tried to re-register — allow login instead
            } else {
                const { firstName, lastName } = req.body; // Get names from request
                user = new User({
                    phone,
                    firstName,
                    lastName
                });
                await user.save();
            }
        }

        const payload = { sub: user._id.toString(), phone: user.phone };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Store in cookie instead of only returning
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // routes/auth.js/

        // This new version includes the names in the response
        return res.json({
            message: 'Verified',
            user: {
                id: user._id,
                phone: user.phone,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: err.message || 'Error' });
    }
});

router.post('/refresh-token', authMiddleware, (req, res) => {
const user = req.user;

const payload = { sub: user.id, phone: user.phone };
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

res.cookie("token", token, {
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: "strict",
maxAge: 7 * 24 * 60 * 60 * 1000 
});

res.json({ message: 'Session refreshed successfully' });

});

module.exports = router;
