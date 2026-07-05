// VERIFIED: controllers/commentController.js — no issues found
const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const createNotification = require("../utils/notificationHelper");
const { extractMentions, notifyMentions } = require("../utils/mentionHelper");

// @desc    Add a comment to a post
// @route   POST /api/comments/:postId
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Comment cannot be empty");
  }

  if (text.length > 300) {
    res.status(400);
    throw new Error("Comment cannot exceed 300 characters");
  }

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // Extract mention IDs from comment text
  const mentionIds = await extractMentions(text);

  const comment = await Comment.create({
    post: postId,
    user: req.user._id,
    text: text.trim(),
    mentions: mentionIds,
  });

  post.commentsCount += 1;
  await post.save();

  // Populate user info, including followers/following to prevent Mongoose virtuals crash
  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "_id name username avatar isVerified followers following"
  );

  const io = req.app.get("io");

  // Notify mentioned users in real-time
  await notifyMentions(io, {
    mentionedIds: mentionIds,
    senderId: req.user._id,
    postId: post._id,
  });

  const postOwnerId = (post.user._id || post.user).toString();
  const currentUserId = req.user._id.toString();

  if (postOwnerId !== currentUserId) {
    await createNotification(io, {
      recipientId: post.user,
      senderId: req.user._id,
      type: "comment",
      postId: post._id,
    });
  }

  return res.status(201).json({
    success: true,
    message: "Comment added",
    comment: populatedComment,
    commentsCount: post.commentsCount,
  });
});

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Private
const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const comments = await Comment.find({ post: postId })
    .populate("user", "_id name username avatar isVerified followers following")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Comment.countDocuments({ post: postId });

  return res.status(200).json({
    success: true,
    comments,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    hasMore: page * limit < totalCount,
  });
});

// @desc    Update a comment
// @route   PUT /api/comments/:commentId
// @access  Private (owner only)
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Comment cannot be empty");
  }

  if (text.length > 300) {
    res.status(400);
    throw new Error("Comment cannot exceed 300 characters");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this comment");
  }

  comment.text = text.trim();
  comment.isEdited = true;
  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "_id name username avatar isVerified followers following"
  );

  return res.status(200).json({
    success: true,
    message: "Comment updated",
    comment: populatedComment,
  });
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private (owner only)
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this comment");
  }

  const post = await Post.findById(comment.post);
  if (post) {
    post.commentsCount = Math.max(0, post.commentsCount - 1);
    await post.save();
  }

  await comment.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Comment deleted",
    commentId,
    commentsCount: post ? post.commentsCount : 0,
  });
});

module.exports = {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
};
