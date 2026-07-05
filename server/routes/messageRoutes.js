const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  getUnreadCount,
  getConversationList,
  getConversation,
  sendMessage,
} = require("../controllers/messageController");

const router = express.Router();

router.get("/unread-count", protect, getUnreadCount);
router.get("/", protect, getConversationList);
router.get("/:userId", protect, getConversation);
router.post("/:userId", protect, sendMessage);

// Reload server comment
module.exports = router;
