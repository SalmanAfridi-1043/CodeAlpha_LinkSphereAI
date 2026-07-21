const asyncHandler = require('express-async-handler')
const Message = require('../models/Message')
const User = require('../models/User')
const Connection = require('../models/Connection')

// Helper — check accepted Connection between two users
const isConnected = async (userA, userB) => {
  const connection = await Connection.findOne({
    $or: [
      { sender: userA, receiver: userB, status: 'accepted' },
      { sender: userB, receiver: userA, status: 'accepted' }
    ]
  })
  return !!connection
}

// @desc  Send a message
// @route POST /api/messages/:userId
// @access Private
const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id
  const receiverId = req.params.userId
  const { text } = req.body

  if (!text?.trim()) {
    res.status(400)
    throw new Error('Message cannot be empty')
  }

  if (senderId.toString() === receiverId.toString()) {
    res.status(400)
    throw new Error('Cannot message yourself')
  }

  const connected = await isConnected(senderId, receiverId)
  if (!connected) {
    res.status(403)
    throw new Error('You can only message people you are connected with')
  }

  const convoId = [senderId.toString(), receiverId.toString()].sort().join('_')

  const saved = await Message.create({
    conversationId: convoId,
    sender: senderId,
    receiver: receiverId,
    text: text.trim()
  })

  const msg = await Message.findById(saved._id)
    .populate('sender',   '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .lean()

  // Emit to receiver's socket room only — sender gets it from API response
  const io = req.app.get('io')
  io?.to(receiverId.toString()).emit('new_message', msg)

  res.status(201).json({ success: true, message: msg })
})

// @desc  Get chat history with one user
// @route GET /api/messages/:userId
// @access Private
const getConversation = asyncHandler(async (req, res) => {
  const myId = req.user._id
  const otherId = req.params.userId

  const convoId = [myId.toString(), otherId.toString()].sort().join('_')

  const messages = await Message.find({ conversationId: convoId })
    .populate('sender',   '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .sort({ createdAt: 1 })
    .lean()

  res.status(200).json({ success: true, messages })
})

// @desc  Get sidebar list — all conversations (latest message per person)
// @route GET /api/messages/conversations
// @access Private
const getAllConversations = asyncHandler(async (req, res) => {
  const myId = req.user._id

  const messages = await Message.find({
    $or: [{ sender: myId }, { receiver: myId }]
  })
    .populate('sender',   '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .sort({ createdAt: -1 })
    .lean()

  // Deduplicate — keep only the latest message per conversation partner
  const map = new Map()
  for (const m of messages) {
    const other = m.sender._id.toString() === myId.toString() ? m.receiver : m.sender
    if (!map.has(other._id.toString())) {
      map.set(other._id.toString(), {
        user: other,
        lastMessage: m.text,
        lastTime: m.createdAt
      })
    }
  }

  res.status(200).json({ success: true, conversations: [...map.values()] })
})

module.exports = { sendMessage, getConversation, getAllConversations }
