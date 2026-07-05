const express = require('express')
const router = express.Router()
const protect = require('../middleware/authMiddleware')
const {
  sendMessage,
  getConversation,
  getConversationList,
  getUnreadCount
} = require('../controllers/messageController')

// STATIC routes BEFORE dynamic /:userId
router.get('/unread-count', protect, getUnreadCount)
router.get('/',             protect, getConversationList)
router.get('/:userId',      protect, getConversation)
router.post('/:userId',     protect, sendMessage)

module.exports = router
