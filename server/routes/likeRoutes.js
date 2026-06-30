const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { toggleLike, getPostLikes } = require("../controllers/likeController");

// All routes are protected
router.post("/:postId", protect, toggleLike);
router.get("/:postId", protect, getPostLikes);

module.exports = router;
