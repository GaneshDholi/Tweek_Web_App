const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const User = require("../models/User");
const Calendar = require("../models/Calendar");

// GET all calendars accessible by the current user
router.get("/", async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const calendars = await Calendar.find({
            $or: [
                { owner: userId }, // Calendars they own
                { sharedWith: userId } // Calendars shared with them
            ]
        }).populate('owner', 'firstName'); // Populate owner's name for display

        if (!calendars) {
            return res.json([]);
        }

        // Add a flag to easily identify the user's own calendars on the frontend
        const processedCalendars = calendars.map(cal => ({
            ...cal.toObject(),
            isOwnedByCurrentUser: cal.owner._id.equals(userId)
        }));

        res.json(processedCalendars);

    } catch (err) {
        console.error("Error fetching calendars:", err);
        res.status(500).json({ error: "Could not fetch calendars." });
    }
});
module.exports = router;