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
        ref: "Signup",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Signup",
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

async function updateProjectCounts(projectId) {
  const Project = mongoose.model("Project");
  const Task = mongoose.model("Task");

  const totalTasks = await Task.countDocuments({ project: projectId });
  const completedTasks = await Task.countDocuments({
    project: projectId,
    status: "done",
  });

  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  console.log("Updating project:", projectId, { totalTasks, completedTasks, progress });

  const updated = await Project.findByIdAndUpdate(
    projectId,
    { $set: { totalTasks, completedTasks, progress } },
    { new: true, runValidators: true }
  );

  console.log("Project after update:", updated.totalTasks, updated.completedTasks, updated.progress);
}

// After creating or updating a task
taskSchema.post("save", async function () {
  await updateProjectCounts(this.project);
});

// After deleting via task.deleteOne()
taskSchema.post("deleteOne", { document: true }, async function () {
  await updateProjectCounts(this.project);
});

export default mongoose.model("Task", taskSchema);