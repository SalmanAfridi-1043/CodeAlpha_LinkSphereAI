// VERIFIED: routes/commentRoutes.js — no issues found
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

// All routes are protected
router.post("/:postId", protect, addComment);
router.get("/:postId", protect, getPostComments);
router.put("/:commentId", protect, updateComment);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;
