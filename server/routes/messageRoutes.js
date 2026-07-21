const express = require('express')
const router = express.Router()
const protect = require('../middleware/authMiddleware')
const {
  sendMessage,
  getConversation,
  getAllConversations
} = require('../controllers/messageController')

router.get('/conversations', protect, getAllConversations)
router.get('/:userId',       protect, getConversation)
router.post('/:userId',      protect, sendMessage)

module.exports = router