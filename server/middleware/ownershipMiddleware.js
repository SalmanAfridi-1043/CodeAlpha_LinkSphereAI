// SECURITY: Ownership middleware — ensures users can only modify their OWN posts/comments
// Applied to PUT/DELETE routes so resource IDs can't be guessed to access others' data
const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

/**
 * SECURITY: verifyPostOwner
 * Confirms the authenticated user is the author of the post being modified.
 * Attaches req.post so downstream handlers don't need to re-query the DB.
 */
const verifyPostOwner = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  // SECURITY: Reject if the requester is not the post author
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Access denied — you do not own this post");
  }

  req.post = post; // pass along to controller so it doesn't re-fetch
  next();
});

/**
 * SECURITY: verifyCommentOwner
 * Confirms the authenticated user is the author of the comment being modified.
 * Attaches req.comment so downstream handlers don't need to re-query the DB.
 */
const verifyCommentOwner = asyncHandler(async (req, res, next) => {
  const comment = await Comment.findById(req.params.commentId);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  // SECURITY: Reject if the requester is not the comment author
  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Access denied — you do not own this comment");
  }

  req.comment = comment; // pass along to controller
  next();
});

module.exports = { verifyPostOwner, verifyCommentOwner };
