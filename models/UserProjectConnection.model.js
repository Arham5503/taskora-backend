import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    // Store both User IDs in an array to make querying easier
    // Example: [UserA_ID, UserB_ID]
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Signup",
        required: true,
      },
    ],
    // Track when they last collaborated to sort the "Recent" list
    lastCollaboratedAt: {
      type: Date,
      default: Date.now,
    },
    // Useful for counting how many projects they've shared
    commonProjectsCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

connectionSchema.index({ participants: 1 }, { unique: true });

export default mongoose.model("Connection", connectionSchema);