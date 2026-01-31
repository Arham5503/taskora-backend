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
      maxlength:50,
    },

    client: {
        type: String,
        trim: true,
      },
    //   logo: {
    //     type: String, 
    //   },
    // },

    // logo: {
    //   type: String, 
    // },

    // team: [
    //   {
    //     userId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "User",
    //       required: true,
    //     },
    //     role: {
    //       type: String,
    //       enum: ["owner", "manager", "developer", "designer", "viewer"],
    //       default: "developer",
    //     },
    //   },
    // ],

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

projectSchema.pre("save", async function () {
  if (this.totalTasks > 0) {
    this.progress = Math.round(
      (this.completedTasks / this.totalTasks) * 100
    );
  } else {
    this.progress = 0;
  }

  // Don't auto-update status if it's on_hold or archived
  if (this.status === "on_hold" || this.status === "archived") {
    return;
  }

  if (this.totalTasks === 0) {
    this.status = "planning";
  } else if (this.completedTasks === this.totalTasks) {
    this.status = "completed";
  } else {
    this.status = "in_progress";
  }
});

export default mongoose.model("Project", projectSchema);
