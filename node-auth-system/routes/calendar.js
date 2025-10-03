// routes/calendars.js
const express = require("express");
const router = express.Router();
const Calendar = require("../models/Calendar");
const User = require("../models/User");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware"); // assume you already have this

// GET /api/calendars
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Calendars the user owns
    const owned = await Calendar.find({ owner: userId })
      .populate("owner", "firstName lastName email")
      .lean();

    // 2. Calendars shared with the user
    const shared = await Calendar.find({ sharedWith: userId })
      .populate("owner", "firstName lastName email")
      .lean();

    // 3. Merge and format for frontend
    const calendars = [...owned, ...shared].map(cal => ({
      id: cal._id.toString(),
      name: cal.name,
      color: cal.color,
      owner: cal.owner,
      isOwnedByCurrentUser: String(cal.owner._id) === String(userId)
    }));

    res.json(calendars);
  } catch (err) {
    console.error("Error fetching calendars:", err);
    res.status(500).json({ error: "An error occurred fetching calendars." });
  }
});

router.get("/:calendarId/tasks", authMiddleware, async (req, res) => {
  try {
    const { calendarId } = req.params;
    const userId = req.user.id;

    const calendar = await Calendar.findById(calendarId);
    if (!calendar) return res.status(404).json({ error: "Calendar not found." });

    // Authorization check
    if (
      !calendar.owner.equals(userId) &&
      !calendar.sharedWith.some(uid => String(uid) === String(userId))
    ) {
      return res.status(403).json({ error: "You do not have access to this calendar." });
    }

    // Fetch tasks from the userTasksProfile of the calendar owner
    const profile = await UserTasksProfile.findOne({ userId: calendar.owner }).lean();

    if (!profile) return res.json([]);

    // Flatten tasks (someday + all weeks)
    const tasks = [
      ...(profile.somedayTasks || []),
      ...Object.values(profile.weeklyTasks || {}).flatMap(w => w.tasks || [])
    ];

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching calendar tasks:", err);
    res.status(500).json({ error: "An error occurred." });
  }
});

module.exports = router;
