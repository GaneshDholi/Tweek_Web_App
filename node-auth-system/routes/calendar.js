const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Calendar = require("../models/Calendar");
const User = require("../models/User");
const UserTasksProfile = require("../models/UserTasksProfile"); // Make sure to import this
const authMiddleware = require("../middleware/auth");

// This helper function creates the user's primary calendar if it doesn't exist.
// This is useful for sharing, ensuring there's always a calendar to share.
const ensurePrimaryCalendarExists = async (userId, userFirstName) => {
    return await Calendar.findOneAndUpdate(
        { owner: userId, isVirtual: true }, // 'isVirtual' marks it as the primary "My Tasks" calendar
        {
            $setOnInsert: {
                name: `${userFirstName}'s Tasks`,
                owner: userId,
                isVirtual: true,
                sharedWith: []
            }
        },
        { upsert: true, new: true } // Creates the document if it doesn't exist
    );
};


// 1. GET /api/calendars - Fetch all calendars visible to the current user
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const user = await User.findById(userId).lean();

        // Ensure the user's own primary calendar exists before fetching
        await ensurePrimaryCalendarExists(userId, user.firstName);

        // Calendars the user owns
        const owned = await Calendar.find({ owner: userId }).populate("owner", "firstName email").lean();

        // Calendars shared with the user
        const shared = await Calendar.find({ sharedWith: userId }).populate("owner", "firstName email").lean();

        // Merge and format for the frontend
        const calendars = [...owned, ...shared].map(cal => ({
            id: cal._id.toString(),
            name: cal.name,
            color: cal.color,
            owner: cal.owner,
            isOwnedByCurrentUser: cal.owner._id.toString() === userId.toString(),
        }));

        res.json(calendars);
    } catch (err) {
        console.error("Error fetching calendars:", err);
        res.status(500).json({ error: "An error occurred fetching calendars." });
    }
});

// 2. GET /api/calendars/:calendarId/tasks - Fetch tasks for a specific calendar
router.get("/:calendarId/tasks", authMiddleware, async (req, res) => {
    try {
        const { calendarId } = req.params;
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const calendar = await Calendar.findById(calendarId);
        if (!calendar) {
            return res.status(404).json({ error: "Calendar not found." });
        }

        // Authorization: User must be the owner OR be in the sharedWith list
        const isOwner = calendar.owner.equals(userId);
        const isSharedWith = calendar.sharedWith.some(id => id.equals(userId));

        if (!isOwner && !isSharedWith) {
            return res.status(403).json({ error: "You do not have access to this calendar." });
        }

        // Fetch tasks from the PROFILE of the CALENDAR OWNER
        const profile = await UserTasksProfile.findOne({ userId: calendar.owner }).lean();
        if (!profile) return res.json([]); // No profile, no tasks

        // Flatten all tasks from the owner's profile
        const allTasks = [
            ...(profile.somedayTasks || []),
            ...Object.values(profile.weeklyTasks || {}).flatMap(week => week.tasks || [])
        ];

        res.json(allTasks);

    } catch (err) {
        console.error("Error fetching calendar tasks:", err);
        res.status(500).json({ error: "An error occurred." });
    }
});

// 3. POST /api/calendars/:calendarId/share - Share a specific calendar with another user
router.post("/:calendarId/share", authMiddleware, async (req, res) => {
    try {
        const { calendarId } = req.params;
        const { shareWithEmail } = req.body;
        const ownerId = new mongoose.Types.ObjectId(req.user.id);

        if (!shareWithEmail) {
             return res.status(400).json({ error: "Email to share with is required." });
        }

        const [calendar, userToShareWith] = await Promise.all([
            Calendar.findById(calendarId),
            User.findOne({ email: shareWithEmail })
        ]);

        if (!calendar) {
            return res.status(404).json({ error: "Calendar not found." });
        }
        if (!userToShareWith) {
            return res.status(404).json({ error: "User to share with not found." });
        }
        if (!calendar.owner.equals(ownerId)) {
            return res.status(403).json({ error: "You are not authorized to share this calendar." });
        }
         if (userToShareWith._id.equals(ownerId)) {
            return res.status(400).json({ error: "You cannot share a calendar with yourself." });
        }

        // Add user to the calendar's sharedWith array
        await Calendar.updateOne(
            { _id: calendarId },
            { $addToSet: { sharedWith: userToShareWith._id } }
        );

        res.status(200).json({ message: `Successfully shared '${calendar.name}' with ${shareWithEmail}.` });

    } catch (err) {
        console.error("Error sharing calendar:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

// 4. POST /api/calendars/:calendarId/unshare - Stop sharing a calendar with a user
router.post("/:calendarId/unshare", authMiddleware, async (req, res) => {
    try {
        const { calendarId } = req.params;
        const { unshareWithEmail } = req.body;
        const ownerId = new mongoose.Types.ObjectId(req.user.id);

        const [calendar, userToUnshare] = await Promise.all([
             Calendar.findById(calendarId),
             User.findOne({ email: unshareWithEmail })
        ]);

        if (!calendar) return res.status(404).json({ error: "Calendar not found." });
        if (!userToUnshare) return res.status(404).json({ error: "User to unshare not found." });
        if (!calendar.owner.equals(ownerId)) return res.status(403).json({ error: "You are not authorized to manage this calendar." });

        // Remove the user from the sharedWith array
        await Calendar.updateOne(
            { _id: calendarId },
            { $pull: { sharedWith: userToUnshare._id } }
        );

         res.status(200).json({ message: `Successfully stopped sharing with ${unshareWithEmail}.` });

    } catch (err)
    {
        console.error("Error unsharing calendar:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});


// 5. GET /api/calendars/:calendarId/shared-with - Get list of users a calendar is shared with
router.get("/:calendarId/shared-with", authMiddleware, async (req, res) => {
    try {
        const { calendarId } = req.params;
        const calendar = await Calendar.findById(calendarId)
            .populate('sharedWith', 'email firstName lastName') // Select fields to return
            .lean();

        if (!calendar) {
            return res.status(404).json({ error: "Calendar not found." });
        }
        if (!calendar.owner.equals(req.user.id)) {
             return res.status(403).json({ error: "You are not authorized to view this." });
        }

        res.json(calendar.sharedWith || []);

    } catch (err) {
        console.error("Error fetching shared-with list:", err);
        res.status(500).json({ error: "An error occurred." });
    }
});


module.exports = router;