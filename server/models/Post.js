const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.image;
      },
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
      default: "",
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast profile queries and feeds
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

// Pre-validate hook to verify the post has either text or an image
postSchema.pre("validate", function () {
  if (!this.content && !this.image) {
    throw new Error("Post must have either text or an image");
  }
});

module.exports = mongoose.model("Post", postSchema);
