import mongoose from "mongoose";
import crypto from "crypto";

const projectInviteSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SignUp",
      required: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor", "admin"],
      default: "editor",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    maxUses: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique invite code before saving
projectInviteSchema.pre("save", function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(16).toString("hex");
  }
  next();
});

// Check if invite is valid
projectInviteSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  return true;
};

export default mongoose.model("ProjectInvite", projectInviteSchema);
