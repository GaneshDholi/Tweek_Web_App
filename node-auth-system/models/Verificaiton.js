const mongoose = require('mongoose');

// This schema stores the temporary verification codes sent to users' emails.
const VerificationSchema = new mongoose.Schema({
    // The user's email address. It's indexed for quick lookups.
    email: {
        type: String,
        required: true,
        index: true,
        trim: true,
        lowercase: true
    },

    // The securely hashed verification code. We never store the plain code.
    codeHash: {
        type: String,
        required: true
    },

    // The reason for the verification, either for registering a new account or logging in.
    purpose: {
        type: String,
        enum: ['register', 'login'],
        required: true
    },

    // The timestamp when this verification document was created.
    createdAt: {
        type: Date,
        default: Date.now
    },

    // The exact date and time when the verification code will become invalid.
    expiresAt: {
        type: Date,
        required: true
    },

    // A counter for how many times the user has tried to verify with the wrong code.
    attempts: {
        type: Number,
        default: 0
    },

    // The timestamp of the most recent time a code was sent to this email.
    lastSentAt: {
        type: Date,
        default: Date.now
    }
});

// This TTL (Time-To-Live) index automatically removes documents from the collection
// once they have expired. This is an efficient way to clean up old verification codes.
// The document is deleted when the `expiresAt` date is reached.
VerificationSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Verification', VerificationSchema);
