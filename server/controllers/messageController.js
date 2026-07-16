const asyncHandler = require('express-async-handler')
const Message = require('../models/Message')
const Connection = require('../models/Connection')

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const senderId  = req.user._id
  const receiverId = req.params.userId
  const { text } = req.body

  if (!text?.trim()) {
    res.status(400)
    throw new Error('Message cannot be empty')
  }

  const connected = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: receiverId, status: 'accepted' },
      { sender: receiverId, receiver: senderId, status: 'accepted' }
    ]
  })

  if (!connected) {
    res.status(403)
    throw new Error('Not connected')
  }

  // conversationId is always sorted so both users share the same key
  const convoId = [senderId.toString(), receiverId.toString()].sort().join('_')

  const saved = await Message.create({
    conversationId: convoId,
    sender:   senderId,
    receiver: receiverId,
    text:     text.trim()
  })

  // Populate fresh — never return raw ObjectIds
  const msg = await Message.findById(saved._id)
    .populate('sender',   '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .lean()

  // Emit ONLY to receiver room — sender already has msg via API response (no duplicates)
  const io = req.app.get('io')
  io?.to(receiverId.toString()).emit('new_message', msg)

  res.status(201).json({ success: true, message: msg })
})

// ── GET CONVERSATION ──────────────────────────────────────────────────────────
const getConversation = asyncHandler(async (req, res) => {
  const myId    = req.user._id
  const otherId = req.params.userId
  const convoId = [myId.toString(), otherId.toString()].sort().join('_')

  const messages = await Message.find({ conversationId: convoId })
    .populate('sender',   '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .sort({ createdAt: 1 })
    .lean()

  // Mark received messages as read
  await Message.updateMany(
    { conversationId: convoId, receiver: myId, isRead: false },
    { isRead: true }
  )

  res.status(200).json({
    success: true,
    messages,
    myId: myId.toString()   // frontend uses this for isMine — server truth
  })
})

// ── GET ALL CONVERSATIONS ─────────────────────────────────────────────────────
// Returns one entry per conversation partner with the full lastMessage object
// so Messages.jsx can render sender name, text, and timestamp correctly.
const getAllConversations = asyncHandler(async (req, res) => {
  const myId = req.user._id

  // Fetch all messages where this user is involved, newest first
  const messages = await Message.find({
    $or: [{ sender: myId }, { receiver: myId }]
  })
    .populate('sender',   '_id name username avatar isVerified')
    .populate('receiver', '_id name username avatar isVerified')
    .sort({ createdAt: -1 })
    .lean()

  // Deduplicate: one entry per conversation partner, keep first (= latest) message
  const map = new Map()
  for (const m of messages) {
    const other =
      m.sender._id.toString() === myId.toString() ? m.receiver : m.sender

    if (!map.has(other._id.toString())) {
      // Count unread messages for this conversation
      const convoId = [myId.toString(), other._id.toString()].sort().join('_')
      const unreadCount = await Message.countDocuments({
        conversationId: convoId,
        receiver: myId,
        isRead: false
      })

      map.set(other._id.toString(), {
        user:        other,           // full populated user object
        lastMessage: m,               // full message object (frontend reads .text, .createdAt, .sender._id)
        unreadCount                   // matches Messages.jsx convo.unreadCount usage
      })
    }
  }

  res.status(200).json({
    success: true,
    conversations: [...map.values()]
  })
})

module.exports = { sendMessage, getConversation, getAllConversations }
