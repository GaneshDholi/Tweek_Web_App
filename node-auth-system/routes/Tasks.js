const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const UserTasksProfile = require("../models/userTasksProfile");
const User = require("../models/User");

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

        // 1. Find the current user to get their 'canViewTasksOf' list
        const currentUser = await User.findById(currentUserId)
            .select('canViewTasksOf')
            .lean();

        if (!currentUser) {
            return res.status(404).json({ error: "Current user not found." });
        }

        // 2. Create an array of all user IDs to fetch tasks for
        const userIdsToFetch = [
            currentUserId,
            ...(currentUser.canViewTasksOf || [])
        ];

        // 3. Find all task profiles for these users
        const profiles = await UserTasksProfile.find({
            userId: { $in: userIdsToFetch }
        })
            // Select only the necessary fields for a smaller payload
            .select(`userId userName weeklyTasks.${weekId}`)
            .lean();

        // 4. Format the response to be clean and easy for the frontend to use
        const responseData = profiles.map(profile => {
            const weekData = profile.weeklyTasks?.[weekId];
            return {
                userId: profile.userId,
                userName: profile.userName,
                tasks: weekData?.tasks || [] // Return tasks for the week or an empty array
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

// ADD A TASK (Corrected with Aggregation Pipeline)
router.post("/", async (req, res) => {
  try {
    const { title, date, completed = false, isSomeday = false } = req.body;
    const userId = req.user.id;

    // Find the user to get their name
    const user = await User.findById(userId).select('firstName lastName').lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userName = `${user.firstName} ${user.lastName}`;

    // Find the user's task profile or create a new one
    let userProfile = await UserTasksProfile.findOne({ userId });
    if (!userProfile) {
      userProfile = new UserTasksProfile({ userId, userName, somedayTasks: [], weeklyTasks: {} });
    }

    // Create the new task object
    const newTask = {
      // _id is added by default, no need to create it manually
      title: title,
      date: isSomeday ? null : new Date(date),
      completed: completed,
      createdAt: new Date(),
      isSomeday: isSomeday
    };

    if (isSomeday) {
      // Add to someday tasks
      userProfile.somedayTasks.push(newTask);
    } else {
      // Add to weekly tasks
      if (!date) {
        return res.status(400).json({ error: "A date is required for weekly tasks." });
      }
      const weekId = getWeekNumber(new Date(date));

      // Ensure the week and its tasks array exist
      if (!userProfile.weeklyTasks) {
        userProfile.weeklyTasks = {};
      }
      if (!userProfile.weeklyTasks[weekId]) {
        userProfile.weeklyTasks[weekId] = { tasks: [] };
      }
      userProfile.weeklyTasks[weekId].tasks.push(newTask);
      
      // Mongoose needs to be told that a nested object has changed
      userProfile.markModified('weeklyTasks');
    }

    // Save the changes and respond with the newly added task from the profile
    const savedProfile = await userProfile.save();
    const addedTask = isSomeday
        ? savedProfile.somedayTasks[savedProfile.somedayTasks.length - 1]
        : savedProfile.weeklyTasks[getWeekNumber(new Date(date))].tasks[savedProfile.weeklyTasks[getWeekNumber(new Date(date))].tasks.length - 1];

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
        const { title, date, completed, oldWeekId, oldIsSomeday } = req.body;

        const userProfile = await UserTasksProfile.findOne({
            userId: new mongoose.Types.ObjectId(req.user.id)
        });
        if (!userProfile) return res.status(404).json({ error: "Task profile not found." });

        // Ensure containers exist
        userProfile.somedayTasks ||= [];
        userProfile.weeklyTasks ||= {};

        // Helpers to support both Object and Map
        const isMap = (v) => v instanceof Map;
        const getWeek = (id) =>
            isMap(userProfile.weeklyTasks) ? userProfile.weeklyTasks.get(id) : userProfile.weeklyTasks[id];
        const setWeek = (id, data) => {
            if (isMap(userProfile.weeklyTasks)) userProfile.weeklyTasks.set(id, data);
            else userProfile.weeklyTasks[id] = data;
        };
        const ensureWeek = (id) => {
            let w = getWeek(id);
            if (!w || !Array.isArray(w.tasks)) {
                w = { tasks: [] };
                setWeek(id, w);
            }
            return w;
        };
        const weeksEntries = () =>
            isMap(userProfile.weeklyTasks)
                ? Array.from(userProfile.weeklyTasks.entries())
                : Object.entries(userProfile.weeklyTasks || {});

        // 1) Find & remove from original location
        let from = null;
        let idx = -1;

        if (oldIsSomeday === true) {
            from = { type: "someday" };
            idx = userProfile.somedayTasks.findIndex(t => String(t._id) === String(taskId));
        } else if (oldWeekId) {
            const w = getWeek(oldWeekId);
            idx = w?.tasks?.findIndex(t => String(t._id) === String(taskId)) ?? -1;
            if (idx !== -1) from = { type: "week", id: oldWeekId };
        } else {
            // Auto-detect: first check someday
            idx = userProfile.somedayTasks.findIndex(t => String(t._id) === String(taskId));
            if (idx !== -1) from = { type: "someday" };
            // then scan weeks
            if (!from) {
                for (const [wid, w] of weeksEntries()) {
                    const i = w?.tasks?.findIndex(t => String(t._id) === String(taskId)) ?? -1;
                    if (i !== -1) { from = { type: "week", id: wid }; idx = i; break; }
                }
            }
        }

        if (!from || idx === -1) {
            return res.status(404).json({ error: "Task not found in its original location." });
        }

        let task;
        if (from.type === "someday") {
            [task] = userProfile.somedayTasks.splice(idx, 1);
        } else {
            const w = getWeek(from.id);
            [task] = w.tasks.splice(idx, 1);
        }

        // 2) Update fields
        if (title !== undefined) task.title = title;
        if (completed !== undefined) task.completed = completed;

        const toSomeday = date === null || date === "" || date === undefined;
        task.date = toSomeday ? null : new Date(date);

        // 3) Insert into destination
        if (toSomeday) {
            userProfile.somedayTasks.push(task);
        } else {
            const newWeekId = getWeekNumber(new Date(date));
            const dest = ensureWeek(newWeekId);
            dest.tasks.push(task);
        }
        
        userProfile.markModified('weeklyTasks');

        await userProfile.save();
        res.json(task);
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

    const userProfile = await UserTasksProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found." });
    }

    // 1. Attempt to find and remove from 'somedayTasks'
    const somedayTaskCount = userProfile.somedayTasks.length;
    userProfile.somedayTasks = userProfile.somedayTasks.filter(
      t => String(t._id) !== String(taskId)
    );

    if (userProfile.somedayTasks.length < somedayTaskCount) {
      // A task was removed from somedayTasks
      await userProfile.save();
      return res.status(200).json({ message: "Task deleted successfully from someday." });
    }

    // 2. If not found in someday, search through 'weeklyTasks'
    console.log("Task not found in someday. Searching weeklyTasks...");
    console.log("Searching for taskId:", taskId);

    let weekIdToDeleteFrom = null;
    if (userProfile.weeklyTasks && Object.keys(userProfile.weeklyTasks).length > 0) {
        console.log("Weekly tasks found. Iterating through weeks...");
        for (const weekId in userProfile.weeklyTasks) {
            console.log(`Checking week: ${weekId}`);
            // Safety check in case a week object has no tasks array
            if (!userProfile.weeklyTasks[weekId].tasks) continue;

            const taskIndex = userProfile.weeklyTasks[weekId].tasks.findIndex(t => {
                console.log(`  - Comparing with task._id: ${t._id}`);
                return String(t._id) === String(taskId);
            });

            if (taskIndex > -1) {
                console.log(`SUCCESS: Found task in week ${weekId} at index ${taskIndex}`);
                // Found the task in a week
                userProfile.weeklyTasks[weekId].tasks.splice(taskIndex, 1);
                weekIdToDeleteFrom = weekId;
                break; // Exit the loop once found
            }
        }
    } else {
        console.log("No weekly tasks exist for this user.");
    }

    if (weekIdToDeleteFrom) {
      // A task was found and removed from weeklyTasks
      console.log("Task removed. Marking weeklyTasks as modified and saving.");
      // Explicitly tell Mongoose that the nested weeklyTasks object has changed
      userProfile.markModified('weeklyTasks');
      await userProfile.save();
      return res.status(200).json({ message: "Task deleted successfully from week." });
    }

    // 3. If we reach here, the task was not found anywhere
    console.log("FAILURE: Task not found anywhere. Returning 404.");
    return res.status(404).json({ error: "Task not found." });

  } catch (err) {
    console.error("Error in DELETE /:id:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});


// --- SHARE FUNCTIONALITY ---
router.post("/share", async (req, res) => {
    try {
        const sharerId = new mongoose.Types.ObjectId(req.user.id); // The person sharing (you)
        const { shareWithEmail } = req.body; // The email of the person you want to share with

        if (!shareWithEmail) {
            return res.status(400).json({ error: "Email to share with is required." });
        }

        // Find the user to share with
        const userToShareWith = await User.findOne({ email: shareWithEmail });
        console.log(userToShareWith);
        if (!userToShareWith) {
            return res.status(404).json({ error: "User to share with not found." });
        }

        if (userToShareWith._id.equals(sharerId)) {
            return res.status(400).json({ error: "You cannot share your calendar with yourself." });
        }

        // Add the sharer's ID to the other user's 'canViewTasksOf' array
        // Using $addToSet prevents adding duplicate IDs
        await User.updateOne(
            { _id: userToShareWith._id },
            { $addToSet: { canViewTasksOf: sharerId } }
        );

        res.status(200).json({ message: `Successfully shared your tasks with ${shareWithEmail}.` });

    } catch (err) {
        console.error("Error in POST /share:", err);
        res.status(500).json({ error: "An unexpected error occurred during sharing." });
    }
});


module.exports = router;

