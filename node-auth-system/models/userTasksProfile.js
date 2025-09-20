const mongoose = require('mongoose');

// SubTaskSchema remains the same as you wrote it
const SubTaskSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    date: { type: Date, required: false },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    isSomeday: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    color: { type: String, default: "#000000" },
    repeat: { type: String, enum: ['none', 'daily', 'weekly', 'monthly', 'annually'], default: 'none'},
    calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' }
});

const UserTasksSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    weeklyTasks: {
        type: Map,
        of: {
            tasks: [SubTaskSchema]
        },
        default: {}
    },
    somedayTasks: [SubTaskSchema]
});

module.exports = mongoose.model('UserTasks', UserTasksSchema);