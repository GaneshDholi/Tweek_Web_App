const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true }, // when the task is scheduled
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  
  // Optional helpers for fast querying
  weekId: { type: String },  // e.g. "2025-W35"
  monthId: { type: String }, // e.g. "2025-08"
});

module.exports = mongoose.model("Task", taskSchema);
