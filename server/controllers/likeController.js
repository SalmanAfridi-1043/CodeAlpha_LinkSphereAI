// VERIFIED: controllers/likeController.js — no issues found
const asyncHandler = require("express-async-handler");
const Like = require("../models/Like");
const Post = require("../models/Post");
const createNotification = require("../utils/notificationHelper");

// @desc    Toggle like status on a post
// @route   POST /api/likes/:postId
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const existingLike = await Like.findOne({ post: postId, user: req.user._id });

  if (existingLike) {
    // Unlike post
    await existingLike.deleteOne();
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();

    return res.status(200).json({
      success: true,
      liked: false,
      likesCount: post.likesCount,
    });
  } else {
    // Like post
    await Like.create({ post: postId, user: req.user._id });
    post.likesCount += 1;
    await post.save();

    if (post.user.toString() !== req.user._id.toString()) {
      const io = req.app.get("io");
      // FIXED: notification identity — recipient is post owner, sender is liker
      await createNotification(io, {
        recipientId: post.user,
        senderId: req.user._id,
        type: "like",
        postId: post._id,
      });
    }

    return res.status(200).json({
      success: true,
      liked: true,
      likesCount: post.likesCount,
    });
  }
});

// @desc    Get users who liked a post
// @route   GET /api/likes/:postId
// @access  Private
const getPostLikes = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const likes = await Like.find({ post: postId })
    .populate("user", "_id name username avatar isVerified followers following")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    likes: likes.map((l) => l.user),
    count: likes.length,
  });
});

module.exports = {
  toggleLike,
  getPostLikes,
};
