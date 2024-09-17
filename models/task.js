const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required"],
    validate: {
      validator: function (value) {
        return value > new Date();
      },
      message: "Due date must be in the future",
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

taskSchema.pre("save", async function (next) {
  try {
    if (!this.user) {
      return next(); 
    }
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const taskCount = await this.model("Task").countDocuments({
      user: this.user,
      dueDate: { $gte: startOfDay },
    });

    const TASK_LIMIT = 5;

    if (taskCount >= TASK_LIMIT) {
      const error = new Error("Task limit reached for the period");
      error.statusCode = 400; 
      return next(error); 
    }

    next(); 
  } catch (error) {
    next(error); 
  }
});

module.exports = mongoose.model("Task", taskSchema);
