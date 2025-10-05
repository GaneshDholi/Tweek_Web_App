const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const UserTasksProfile = require("../models/UserTasksProfile");
const User = require("../models/User");

// POST /api/tasks/
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, date, isSomeday, notes, color, repeat, calendar } = req.body;
        const task = new Task({
            user: req.user.id,
            title, date, isSomeday, notes, color, repeat, calendar
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating task.' });
    }
});

// POST /api/tasks/batch-create
router.post('/batch-create', authMiddleware, async (req, res) => {
    try {
        const { tasks } = req.body;
        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ message: 'Request body must contain a "tasks" array.' });
        }
        const tasksToInsert = tasks.map(task => ({ ...task, user: req.user.id }));
        await Task.insertMany(tasksToInsert);
        res.status(201).json({ message: 'Tasks synced successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while syncing tasks.' });
    }
});


// Helper function (no changes)
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// --- READ OPERATIONS ---
router.get("/week/:weekId", async (req, res) => {
    try {
        const { weekId } = req.params;
        const currentUserId = new mongoose.Types.ObjectId(req.user.id);

        const currentUser = await User.findById(currentUserId)
            .select('canViewTasksOf')
            .lean();

        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found." });
        }

        const userIdsToFetch = [
            currentUserId,
            ...(currentUser.canViewTasksOf || [])
        ];

        const profiles = await UserTasksProfile.find({
            userId: { $in: userIdsToFetch }
        })
            .select(`userId userName weeklyTasks.${weekId}`)
            .lean(); // Because of .lean(), weeklyTasks is a plain object

        const responseData = profiles.map(profile => {

            // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ FIX HERE ▼▼"▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
            // Use standard bracket notation for a plain object from .lean()
            const weekData = profile.weeklyTasks ? profile.weeklyTasks[weekId] : undefined;
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ FIX HERE ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            return {
                userId: profile.userId,
                userName: profile.userName,
                tasks: weekData?.tasks || []
            };
        });

        res.json(responseData);

    } catch (err) {
        console.error("Error in GET /week/:weekId:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

router.get("/someday", async (req, res) => {
    try {
        const userProfile = await UserTasksProfile.findOne({ userId: req.user.id }).select('somedayTasks');
        res.json(userProfile ? userProfile.somedayTasks : []);


    } catch (err) {
        console.error("Error in GET /someday:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});


// --- WRITE OPERATIONS ---

router.post("/", async (req, res) => {
    try {
        const { title, date, completed = false, isSomeday = false, color = "#000000", repeat = 'none' } = req.body;
        const userId = req.user.id;

        // This part is fine
        const user = await User.findById(userId).select('firstName lastName').lean();
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find the user's task profile or prepare to create one
        let userProfile = await UserTasksProfile.findOne({ userId });
        if (!userProfile) {
            // Ensure the default value is an actual Map
            userProfile = new UserTasksProfile({ userId, somedayTasks: [], weeklyTasks: new Map() });
        }

        // This part is fine
        const newTask = {
            title: title,
            date: isSomeday ? null : new Date(date),
            completed: completed,
            createdAt: new Date(),
            isSomeday: isSomeday,
            color: color,
            repeat: repeat
        };

        if (isSomeday) {
            // Pushing to a regular array is correct
            userProfile.somedayTasks.push(newTask);
        } else {
            // Add to weekly tasks
            if (!date) {
                return res.status(400).json({ error: "A date is required for weekly tasks." });
            }
            const weekId = getWeekNumber(new Date(date));

            // 1. Correctly get the existing week's data from the Map
            const weekData = userProfile.weeklyTasks.get(weekId) || { tasks: [] };

            // 2. Push the new task to the local array
            weekData.tasks.push(newTask);

            // 3. Correctly set the updated data back into the Map
            userProfile.weeklyTasks.set(weekId, weekData);
        }

        // Save the changes and respond
        const savedProfile = await userProfile.save();

        // Retrieve the added task to send back in the response
        const addedTask = isSomeday
            ? savedProfile.somedayTasks[savedProfile.somedayTasks.length - 1]
            : savedProfile.weeklyTasks.get(getWeekNumber(new Date(date))).tasks.slice(-1)[0];

        res.status(201).json(addedTask);

    } catch (err) {
        console.error("Error in POST /:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});


//Update a task
router.put("/:id", async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title, date, completed, color } = req.body;

        // 1. Find the user's profile
        const userProfile = await UserTasksProfile.findOne({ userId: req.user.id });
        if (!userProfile) {
            return res.status(404).json({ error: "User profile not found." });
        }

        let task = null;
        let originalLocation = { type: null, weekId: null };

        // 2. Find the task, searching both 'someday' and 'weekly' lists
        // First, check somedayTasks
        const somedayIndex = userProfile.somedayTasks.findIndex(t => String(t._id) === taskId);
        if (somedayIndex > -1) {
            task = userProfile.somedayTasks[somedayIndex];
            originalLocation.type = 'someday';
        } else {
            // If not in someday, search all weeks
            for (const [weekId, weekData] of userProfile.weeklyTasks.entries()) {
                const taskIndex = weekData.tasks.findIndex(t => String(t._id) === taskId);
                if (taskIndex > -1) {
                    task = weekData.tasks[taskIndex];
                    originalLocation = { type: 'week', weekId: weekId };
                    break;
                }
            }
        }

        // 3. If task is not found anywhere, return an error
        if (!task) {
            return res.status(404).json({ error: "Task not found." });
        }

        // 4. Remove the task from its original location
        if (originalLocation.type === 'someday') {
            userProfile.somedayTasks.splice(somedayIndex, 1);
        } else if (originalLocation.type === 'week') {
            const week = userProfile.weeklyTasks.get(originalLocation.weekId);
            week.tasks = week.tasks.filter(t => String(t._id) !== taskId);
        }

        // 5. Update the task object with new data if provided
        if (title !== undefined) task.title = title;
        if (completed !== undefined) task.completed = completed;
        if (date !== undefined) {
            task.date = date ? new Date(date) : null;
        }
        if (color !== undefined) task.color = color;

        // 6. Place the updated task in its new correct location
        if (task.date === null) {
            userProfile.somedayTasks.push(task);
        } else {
            const newWeekId = getWeekNumber(new Date(task.date));
            const newWeek = userProfile.weeklyTasks.get(newWeekId) || { tasks: [] };
            newWeek.tasks.push(task);
            userProfile.weeklyTasks.set(newWeekId, newWeek);
        }

        // 7. Save the entire profile and return the updated task
        await userProfile.save();
        res.status(200).json(task);

    } catch (err) {
        console.error("Error in PUT /:id:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

// DELETE A TASK (Simplified and Corrected)
router.delete("/:id", async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        // Log the initial request details
        console.log(`--- DELETE /api/tasks/${taskId} ---`);
        console.log(`User ID: ${userId}, Task ID: ${taskId}`);

        // --- ATTEMPT 1: Atomically pull from 'somedayTasks' ---
        console.log("  -> Attempt 1: Searching 'somedayTasks' atomically...");
        const result = await UserTasksProfile.updateOne(
            { userId: userId },
            { $pull: { somedayTasks: { _id: taskId } } }
        );

        // Log the result of the database operation
        console.log("  updateOne result:", result);

        if (result.modifiedCount > 0) {
            console.log("SUCCESS ✅: Task found and deleted from somedayTasks.");
            return res.status(200).json({ message: "Task deleted successfully from someday." });
        }

        // --- ATTEMPT 2: If not in someday, handle 'weeklyTasks' ---
        console.log("  -> Attempt 2: Task not in someday. Searching 'weeklyTasks'...");
        const userProfile = await UserTasksProfile.findOne({ userId });

        if (!userProfile) {
            console.log("FAILURE ❌: User profile not found.");
            return res.status(404).json({ error: "User profile not found." });
        }

        let taskWasFoundInWeek = false;
        if (userProfile.weeklyTasks && userProfile.weeklyTasks.size > 0) {
            console.log("  Iterating through weeklyTasks map...");
            for (const [weekId, weekData] of userProfile.weeklyTasks.entries()) {
                console.log(`    - Checking week: ${weekId}`);
                const initialTaskCount = weekData.tasks.length;
                weekData.tasks = weekData.tasks.filter(t => String(t._id) !== String(taskId));

                if (weekData.tasks.length < initialTaskCount) {
                    console.log(`SUCCESS ✅: Found and removed task ${taskId} from week ${weekId}`);
                    taskWasFoundInWeek = true;
                    userProfile.weeklyTasks.set(weekId, weekData);
                    break;
                }
            }
        } else {
            console.log("  Info: No weekly tasks exist for this user to search.");
        }

        if (taskWasFoundInWeek) {
            console.log("  Saving updated user profile...");
            await userProfile.save();
            return res.status(200).json({ message: "Task deleted successfully from week." });
        }

        console.log("FAILURE ❌: Task not found anywhere.");
        return res.status(404).json({ error: "Task not found." });

    } catch (err) {
        // This will catch any unexpected errors during the process
        console.error("CRITICAL ERROR in DELETE /:id:", err);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
});

module.exports = router;

