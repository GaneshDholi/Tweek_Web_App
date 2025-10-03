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
      id: cal._id,
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

module.exports = router;
