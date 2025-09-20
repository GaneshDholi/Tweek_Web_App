const mongoose = require('mongoose');

const CalendarSchema = new mongoose.Schema({
    name: { type: String, required: true },
    // The user who owns the tasks
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    color: { type: String, default: '#7C3AED' },
    // A list of users this calendar is shared with
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // is a virtual representation of another user's entire task list
    isVirtual: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Calendar', CalendarSchema);