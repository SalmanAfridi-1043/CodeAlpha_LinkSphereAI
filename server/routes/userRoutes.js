const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { searchUsers, getSuggestedUsers, refreshSuggestedUsers, updateUserProfile, getFollowers, getFollowing } = require("../controllers/userController");
const { upload } = require("../config/cloudinary");

// DEBUGGED: Added PUT /update, GET /:userId/followers, and GET /:userId/following routes.

// All routes are protected
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getSuggestedUsers);
router.get("/suggestions/refresh", protect, refreshSuggestedUsers);
router.put(
  "/update",
  protect,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateUserProfile
);
router.get("/:userId/followers", protect, getFollowers);
router.get("/:userId/following", protect, getFollowing);

module.exports = router;
