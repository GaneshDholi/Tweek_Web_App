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
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}


// Add a task
router.post("/", async (req, res) => {
    try {
        const { title, description, date } = req.body;
        const userId = req.user.id; // assuming you use JWT/Auth middleware

        const jsDate = new Date(date);

        const weekId = getWeekNumber(jsDate);
        const monthId = `${jsDate.getFullYear()}-${(jsDate.getMonth()+1).toString().padStart(2, "0")}`;

        const task = new Task({
            userId,
            title,
            description,
            date: jsDate,
            weekId,
            monthId
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
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json(task);
  } catch (err) {
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
