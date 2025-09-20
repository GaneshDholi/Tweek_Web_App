const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const User = require("../models/User");
const Calendar = require("../models/Calendar");

// GET all calendars accessible by the current user
router.get("/", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Find calendars shared with the user
        const sharedCalendars = await Calendar.find({ sharedWith: userId }).populate('owner', 'firstName lastName').lean();

        // Add the user's own "My Calendar"
        const myCalendar = {
            _id: userId, // Use user's own ID for the personal calendar key
            name: "My Calendar",
            owner: { _id: userId, firstName: "My", lastName: "Tasks" },
            isPersonal: true
        };

        const allCalendars = [myCalendar, ...sharedCalendars];

        res.json(allCalendars);

    } catch (err) {
        console.error("Error in GET /api/calendars:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

module.exports = router;