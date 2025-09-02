const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Get tasks for the week
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}


// Add a task
router.post("/", async (req, res) => {
  try {
    const { title, description, date, isSomeday = false } = req.body;
    const userId = req.user.id; // assuming you use JWT/Auth middleware

    let jsDate = null;
    let weekId = null;
    let monthId = null;

    if (!isSomeday) {
      jsDate = new Date(date);
      weekId = getWeekNumber(jsDate);
      monthId = `${jsDate.getFullYear()}-${(jsDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    }

    const task = new Task({
      userId,
      title,
      description,
      date: jsDate,
      weekId,
      monthId,
      isSomeday
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /tasks/day/:date
router.get("/day/:date", async (req, res) => {
  try {
    const userId = req.user.id;
    const dayStart = new Date(req.params.date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const tasks = await Task.find({
      userId,
      date: { $gte: dayStart, $lt: dayEnd },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//fetching someday
router.get("/someday", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id, isSomeday: true });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /tasks/week/:weekId
router.get("/week/:weekId", async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ userId, weekId: req.params.weekId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /tasks/month/:monthId
router.get("/month/:monthId", async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ userId, monthId: req.params.monthId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Toggle complete / update
router.put("/:id", async (req, res) => {
  try {
    console.log("--- UPDATE REQUEST RECEIVED ---");
    console.log("Task ID from params:", req.params.id);
    console.log("User ID from auth:", req.user.id); // Is this correct?
    console.log("Data from body:", req.body);

    const { title, description, date, completed, isSomeday = false } = req.body;

    let updateData = { title, description, completed, isSomeday };

    if (!isSomeday && date) {
      const jsDate = new Date(date);
      updateData.date = jsDate;
      updateData.weekId = getWeekNumber(jsDate);
      updateData.monthId = `${jsDate.getFullYear()}-${(jsDate.getMonth() + 1).toString().padStart(2, "0")}`;
    } else {
      updateData.date = null;
      updateData.weekId = null;
      updateData.monthId = null;
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: updateData },
      { new: true }
    );

    console.log("Result from findOneAndUpdate:", updatedTask); // IMPORTANT: What does this print?

    if (!updatedTask) {
      console.log("!!! Task not found in DB, sending 404.");
      return res.status(404).json({ error: "Task not found or user not authorized." });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error("!!! ERROR IN PUT ROUTE:", err);
    res.status(500).json({ error: err.message });
  }
});



// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
