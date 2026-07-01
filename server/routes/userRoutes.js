const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { searchUsers, getSuggestedUsers } = require("../controllers/userController");

// All routes are protected
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getSuggestedUsers);

module.exports = router;
