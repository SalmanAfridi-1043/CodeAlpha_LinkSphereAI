// VERIFIED: routes/commentRoutes.js — ownership middleware applied to PUT/DELETE
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
// SECURITY: Ownership check — ensures only the comment author can edit/delete their comment
const { verifyCommentOwner } = require("../middleware/ownershipMiddleware");
const {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

// All routes are protected
router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getPostComments);
// SECURITY: verifyCommentOwner confirms ownership before update/delete (IDOR prevention)
router.put("/:commentId", protect, verifyCommentOwner, updateComment);
router.delete("/:commentId", protect, verifyCommentOwner, deleteComment);

module.exports = router;
