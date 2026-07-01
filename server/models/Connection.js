const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate requests in the same direction
connectionSchema.index({ sender: 1, receiver: 1 }, { unique: true });
// Index for fast query of pending/received requests
connectionSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model("Connection", connectionSchema);
