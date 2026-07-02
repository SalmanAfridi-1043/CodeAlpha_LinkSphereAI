// VERIFIED: routes/postRoutes.js — ownership middleware applied to PUT/DELETE
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
// SECURITY: Ownership check — ensures only the post author can edit/delete their post
const { verifyPostOwner } = require("../middleware/ownershipMiddleware");
const { upload } = require("../config/cloudinary");
const {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getUserPosts,
  updatePost,
  deletePost,
  getUserProfile,
  searchPosts,
} = require("../controllers/postController");

// All routes are protected
router.post("/", protect, upload.single("image"), createPost);
router.get("/feed", protect, getFeedPosts);
router.get("/explore", protect, getExplorePosts);
router.get("/user/:username", protect, getUserPosts);
router.get("/profile/:username", protect, getUserProfile);
// FIXED: Register search route before dynamic parameters to avoid collision
router.get("/search", protect, searchPosts);
// SECURITY: verifyPostOwner confirms ownership before update/delete (IDOR prevention)
router.put("/:id", protect, verifyPostOwner, updatePost);
router.delete("/:id", protect, verifyPostOwner, deletePost);

module.exports = router;
