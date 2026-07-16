const express = require('express')
const router = express.Router()
// authMiddleware uses default export
const protect = require('../middleware/authMiddleware')
const Message = require('../models/Message')
const {
  sendMessage,
  getConversation,
  getAllConversations
} = require('../controllers/messageController')

// ── Unread count — Sidebar badge (must be before /:userId) ────────
router.get('/unread-count', protect, async (req, res) => {
  const count = await Message.countDocuments({
    receiver: req.user._id,
    isRead: false
  })
  res.status(200).json({ success: true, count })
})

// ── Conversation list — root GET (Messages.jsx calls /messages) ───
router.get('/',              protect, getAllConversations)

// ── Named alias ───────────────────────────────────────────────────
router.get('/conversations', protect, getAllConversations)

// ── Dynamic routes last ───────────────────────────────────────────
router.get('/:userId',  protect, getConversation)
router.post('/:userId', protect, sendMessage)

module.exports = router
