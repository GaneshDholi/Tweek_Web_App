const express = require("express");
const router = express.Router();
const Calendar = require("../models/Calendar");

// GET /api/calendars
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Calendars owned by the user
    const ownedCalendars = await Calendar.find({ owner: userId }).lean();

    // 2. Calendars shared with the user
    const sharedCalendars = await Calendar.find({ sharedWith: userId })
      .populate("owner", "firstName lastName")
      .lean();

    const allCalendars = [
      ...ownedCalendars.map(c => ({
        _id: c._id,
        name: c.isPersonal ? "My Calendar" : c.name,
        isOwnedByCurrentUser: true,
        owner: { firstName: "You" }
      })),
      ...sharedCalendars.map(c => ({
        _id: c._id,
        name: c.name,
        isOwnedByCurrentUser: false,
        owner: { firstName: c.owner.firstName }
      }))
    ];

    res.json(allCalendars);
  } catch (err) {
    console.error("Error fetching calendars:", err);
    res.status(500).json({ error: "An error occurred while fetching calendars." });
  }
});

module.exports = router;
