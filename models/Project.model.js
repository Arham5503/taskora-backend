import mongoose from "mongoose";
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    client: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["planning", "in_progress", "completed", "on_hold", "archived"],
      default: "planning",
    },

    isStarred: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },

    totalTasks: {
      type: Number,
      default: 0,
    },

    completedTasks: {
      type: Number,
      default: 0,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Signup",
      required: true,
    },

    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Signup",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Project", projectSchema);