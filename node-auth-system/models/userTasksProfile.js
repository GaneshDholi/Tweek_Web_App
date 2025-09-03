// models/UserTasksProfile.js
const mongoose = require("mongoose");

// Schema for a single task that lives inside the profile document.
const SubTaskSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    date: { type: Date }, // Optional for someday tasks
    completed: { type: Boolean, default: false },
    // You can add other fields like 'description' or 'color' here
});

// The schema for the document that holds all of a user's tasks.
const UserTasksProfileSchema = new mongoose.Schema({
    // This is the primary link to the main 'User' collection.
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true,
        index: true 
    },
    // ✅ This is the copied user name for fast display.
    userName: {
        type: String,
        required: true
    },
    // The Map object to store all tasks, organized by week.
    weeklyTasks: {
        type: Map,
        of: [SubTaskSchema], 
        default: {}
    },
    // An array for all someday tasks.
    somedayTasks: [SubTaskSchema]
});

module.exports = mongoose.model("UserTasksProfile", UserTasksProfileSchema);