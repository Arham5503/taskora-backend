import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "in_review", "done"],
      default: "todo",
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SignUp",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SignUp",
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    attachments: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    checklist: {
      completed: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// After saving a task, update the project's task counts
taskSchema.post("save", async function () {
  const Project = mongoose.model("Project");
  const Task = mongoose.model("Task");

  const projectId = this.project;
  const totalTasks = await Task.countDocuments({ project: projectId });
  const completedTasks = await Task.countDocuments({
    project: projectId,
    status: "done",
  });

  await Project.findByIdAndUpdate(projectId, {
    totalTasks,
    completedTasks,
  });
});

// After deleting a task, update the project's task counts
taskSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const Project = mongoose.model("Project");
    const Task = mongoose.model("Task");

    const projectId = doc.project;
    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = await Task.countDocuments({
      project: projectId,
      status: "done",
    });

    await Project.findByIdAndUpdate(projectId, {
      totalTasks,
      completedTasks,
    });
  }
});

export default mongoose.model("Task", taskSchema);
