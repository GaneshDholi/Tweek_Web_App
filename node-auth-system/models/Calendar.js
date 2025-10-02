const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
    // The name of the calendar, e.g., "Personal", "Work Projects"
    name: {
        type: String,
        required: true,
        trim: true
    },

    // The user who created and owns this calendar
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to your User model
        required: true,
        index: true // Indexing for faster lookups of a user's calendars
    },

    // An array of user IDs who have access to view this calendar
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // A flag to identify a user's primary, default calendar
    isPersonal: {
        type: Boolean,
        default: false
    },
    
    // Optional color for the calendar to be displayed on the frontend
    color: {
        type: String,
        default: '#007bff' // A default blue color
    }
}, {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
});

module.exports = mongoose.model('Calendar', calendarSchema);