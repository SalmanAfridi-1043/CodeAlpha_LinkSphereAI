const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
    },
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
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast message retrieval within a conversation sorted by date
messageSchema.index({ conversationId: 1, createdAt: 1 });

// Static helper to generate unique conversation ID for two users (always smallerUserId_largerUserId)
messageSchema.statics.getConversationId = function (userId1, userId2) {
  const id1 = userId1.toString();
  const id2 = userId2.toString();
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
};

module.exports = mongoose.model("Message", messageSchema);
