// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    // ==> ADD THESE THREE FIELDS <==
    firstName: {
        type: String,
        required: false, // Or true if you want to make it mandatory
    },
    lastName: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', userSchema);