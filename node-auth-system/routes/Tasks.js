const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const UserTasksProfile = require("../models/userTasksProfile"); // The only model you need
const User = require("../models/User"); // Needed to get user's name on profile creation

// Helper function to get the week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// --- READ OPERATIONS ---

// GET TASKS FOR A SPECIFIC WEEK
router.get("/week/:weekId", async (req, res) => {
    try {
        const userId = req.user.id;
        const weekId = req.params.weekId;

        const userProfile = await UserTasksProfile.findOne({ userId }).select('weeklyTasks');
        if (!userProfile) {
            return res.json([]); // No profile means no tasks
        }

        const tasksForWeek = userProfile.weeklyTasks.get(weekId);
        res.json(tasksForWeek || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET SOMEDAY TASKS
router.get("/someday", async (req, res) => {
    try {
        const userId = req.user.id;
        const userProfile = await UserTasksProfile.findOne({ userId }).select('somedayTasks');
        res.json(userProfile ? userProfile.somedayTasks : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WRITE OPERATIONS ---

// ADD A TASK
router.post("/", async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, date, completed = false, oldWeekId, oldIsSomeday } = req.body;
        
        // Create the new sub-task object that will be saved
        const newSubTask = {
            _id: new mongoose.Types.ObjectId(),
            title,
            date: isSomeday ? null : new Date(date),
            completed
        };

        // Find the user's name for the profile document
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const userName = `${user.firstName} ${user.lastName}`;

        let updateOperation;
        if (isSomeday) {
            // If it's a someday task, push to the somedayTasks array
            updateOperation = { $push: { somedayTasks: newSubTask } };
        } else {
            // If it's a weekly task, push to the correct week in the map
            const weekId = getWeekNumber(new Date(date));
            // Use dot notation to update the map
            updateOperation = { $push: { [`weeklyTasks.${weekId}`]: newSubTask } };
        }

        // Find the profile and update it, or create it if it's the user's first task
        await UserTasksProfile.findOneAndUpdate(
            { userId },
            { ...updateOperation, $setOnInsert: { userName } },
            { upsert: true, new: true }
        );

        res.status(201).json(newSubTask);

    } catch (err) {
        console.error("Error in POST /:", err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE A TASK
router.put("/:id", async (req, res) => {
    // This operation is very complex and inefficient with this data model.
    // It requires reading the entire document, modifying it in JS, and saving it back.
    // The frontend MUST provide context about where the task currently is.
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const { title, date, completed, oldWeekId, oldIsSomeday } = req.body;

        const userProfile = await UserTasksProfile.findOne({ userId });
        if (!userProfile) return res.status(404).json({ error: "Task profile not found." });

        let taskToUpdate;
        let taskIndex = -1;

        // Step 1: Find and remove the task from its old location
        if (oldIsSomeday) {
            taskIndex = userProfile.somedayTasks.findIndex(t => t._id.toString() === taskId);
            if (taskIndex !== -1) [taskToUpdate] = userProfile.somedayTasks.splice(taskIndex, 1);
        } else if (oldWeekId) {
            const oldTasksArray = userProfile.weeklyTasks.get(oldWeekId) || [];
            taskIndex = oldTasksArray.findIndex(t => t._id.toString() === taskId);
            if (taskIndex !== -1) {
                [taskToUpdate] = oldTasksArray.splice(taskIndex, 1);
                userProfile.weeklyTasks.set(oldWeekId, oldTasksArray);
            }
        }
        
        if (!taskToUpdate) return res.status(404).json({ error: "Task not found in its original location." });

        // Step 2: Update the task's properties
        const isNowSomeday = !date;
        taskToUpdate.title = title;
        taskToUpdate.date = isNowSomeday ? null : new Date(date);
        taskToUpdate.completed = completed;

        // Step 3: Add the updated task to its new location
        if (isNowSomeday) {
            userProfile.somedayTasks.push(taskToUpdate);
        } else {
            const newWeekId = getWeekNumber(new Date(date));
            const newTasksArray = userProfile.weeklyTasks.get(newWeekId) || [];
            newTasksArray.push(taskToUpdate);
            userProfile.weeklyTasks.set(newWeekId, newTasksArray);
        }

        // Step 4: Save the entire giant document
        await userProfile.save();
        res.json(taskToUpdate);

    } catch (err) {
        console.error("Error in PUT /:id:", err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE A TASK
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        // Frontend MUST provide context on where to find the task
        const { weekId, isSomeday } = req.body; 

        let updateOperation;
        if (isSomeday) {
            updateOperation = { $pull: { somedayTasks: { _id: taskId } } };
        } else if (weekId) {
            updateOperation = { $pull: { [`weeklyTasks.${weekId}`]: { _id: taskId } } };
        } else {
            return res.status(400).json({ error: "weekId or isSomeday flag is required." });
        }

        const result = await UserTasksProfile.updateOne({ userId }, updateOperation);

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Task not found to delete." });
        }

        res.json({ message: "Task deleted successfully" });
    } catch (err) {
        console.error("Error in DELETE /:id:", err);
        res.status(500).json({ error: err.message });
    }
});

// NOTE: A month-based view is not efficient with this model and has been removed.

module.exports = router;