const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const otpGenerator = require('otp-generator');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailProvider');
const authMiddleware = require('../middleware/auth');


// --- Security & Validation (No changes needed) ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many attempts from this IP, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

const registerValidationRules = [
    body('firstName').trim().not().isEmpty().withMessage('First name is required.'),
    body('lastName').trim().not().isEmpty().withMessage('Last name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
];

const loginValidationRules = [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email.'),
    body('password').not().isEmpty().withMessage('Password cannot be empty.'),
];


// --- FLOW STEP 1: Register with Password & Send OTP ---
router.post('/register', authLimiter, registerValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { firstName, lastName, email, password } = req.body;
        let user = await User.findOne({ email });

        if (user && user.isEmailVerified) {
            return res.status(409).json({ message: 'A verified user with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user && !user.isEmailVerified) {
            user.password = hashedPassword;
            user.firstName = firstName;
            user.lastName = lastName;
        } else {
            user = new User({ firstName, lastName, email, password: hashedPassword, isEmailVerified: false });
        }

        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        user.otp = await bcrypt.hash(otp, salt);
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
        await user.save();

        const emailHtml = `<h1>Account Verification</h1><p>Your OTP to verify your account is: <strong>${otp}</strong></p><p>This code will expire in 10 minutes.</p>`;
        await sendEmail({ to: user.email, subject: 'Verify Your Account', html: emailHtml });

        res.status(201).json({ message: 'Registration initiated. Please check your email for an OTP.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// --- FLOW STEP 2: Verify Account with OTP ---
router.post('/verify-account', authLimiter, async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please complete registration first.' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'This account is already verified.' });
        }
        if (!user.otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP is invalid or has expired. Please try registering again.' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Account verified successfully. You can now log in.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during account verification.' });
    }
});


// --- FLOW STEP 3: Login with Password ---
router.post('/login', authLimiter, loginValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        if (!user.isEmailVerified) {
            return res.status(401).json({ message: 'Account not verified. Please check your email for the OTP.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const payload = { sub: user._id.toString(), email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie("token", token, {
            httpOnly: true,
            secure: true, 
            sameSite: "none", 
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        res.json({
            message: 'Logged in successfully',
            user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

router.get('/profile', authMiddleware, (req, res) => {
    // If the code reaches this point, the authMiddleware has successfully
    // verified the user. We just need to send the user data back
    // in the format the frontend expects.
    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
        },
    });
});

// --- Logout and Refresh Token (No changes needed) ---
router.post('/logout', (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully." });
});

router.post('/refresh-token', authMiddleware, (req, res) => {
    const user = req.user;
    const payload = { sub: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ message: 'Session refreshed successfully' });
});

module.exports = router;