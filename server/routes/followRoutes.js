const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  toggleFollow,
  checkFollowStatus,
  getMutualFollowers,
} = require("../controllers/followController");

// All routes are protected
router.get("/status/:userId", protect, checkFollowStatus);
router.get("/mutual/:userId", protect, getMutualFollowers);
router.post("/:userId", protect, toggleFollow);

module.exports = router;
