const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");
const {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getUserPosts,
  updatePost,
  deletePost,
  getUserProfile,
} = require("../controllers/postController");

// All routes are protected
router.post("/", protect, upload.single("image"), createPost);
router.get("/feed", protect, getFeedPosts);
router.get("/explore", protect, getExplorePosts);
router.get("/user/:username", protect, getUserPosts);
router.get("/profile/:username", protect, getUserProfile);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;
