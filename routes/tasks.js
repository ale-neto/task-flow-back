// routes/tasks.js
const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const auth = require("../middleware/auth");

// GET /tasks - Lista de tarefas
router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// GET /v1/tasks/:id - Retorna uma tarefa por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

// POST /tasks - Criar nova tarefa
router.post("/", auth, async (req, res) => {
  const { title, dueDate } = req.body;
  if (!title || !dueDate) {
    return res.status(400).json({ msg: "Title and due date are required" });
  }

  try {
    const newTask = new Task({
      title,
      dueDate,
      user: req.user.id,
    });

    const task = await newTask.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(err.statusCode || 500).json({ msg: err.message || "Server Error" });
  }
});

// PUT /tasks/:id - Atualizar tarefa existente
router.put("/:id", auth, async (req, res) => {
  const { title, dueDate, completed } = req.body;
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    task.title = title || task.title;
    task.dueDate = dueDate || task.dueDate;
    task.completed = completed ?? task.completed;

    task = await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// DELETE /v1/tasks/:id - Exclui uma tarefa por ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ msg: "Task not found" });
    }

    res.json({ msg: "Task deleted successfully", task: deletedTask });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error });
  }
});

module.exports = router;
