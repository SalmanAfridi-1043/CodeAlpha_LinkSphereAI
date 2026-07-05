const asyncHandler = require('express-async-handler')
const Message = require('../models/Message')
const Connection = require('../models/Connection')
const User = require('../models/User')

// HELPER — always same conversationId regardless of who initiates
const getConvoId = (id1, id2) =>
  [id1.toString(), id2.toString()].sort().join('_')

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id
  const receiverId = req.params.userId
  const { text } = req.body

  // Guard 1 — empty text
  if (!text?.trim()) {
    res.status(400)
    throw new Error('Message is empty')
  }

  // Guard 2 — sender ≠ receiver
  if (senderId.toString() === receiverId.toString()) {
    res.status(400)
    throw new Error('Cannot message yourself')
  }

  // Guard 3 — must be connected
  const conn = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: receiverId, status: 'accepted' },
      { sender: receiverId, receiver: senderId, status: 'accepted' }
    ]
  })

  if (!conn) {
    res.status(403)
    throw new Error('Connect first to send messages')
  }

  // Save to DB — sender = logged in user ALWAYS
  const saved = await Message.create({
    conversationId: getConvoId(senderId, receiverId),
    sender: senderId,
    receiver: receiverId,
    text: text.trim(),
    isRead: false
  })

  // Populate sender + receiver fresh from DB
  const fresh = await Message.findById(saved._id)
    .populate('sender', '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .lean()

  // Emit ONLY to receiver room — sender already has it via API response
  const io = req.app.get('io')
  io?.to(receiverId.toString()).emit('new_message', fresh)

  res.status(201).json({
    success: true,
    message: fresh
  })
})

// ── GET CONVERSATION ──────────────────────────────────────────────────────────
const getConversation = asyncHandler(async (req, res) => {
  const myId = req.user._id
  const otherId = req.params.userId
  const convoId = getConvoId(myId, otherId)

  const messages = await Message.find({ conversationId: convoId })
    .populate('sender', '_id name username avatar')
    .populate('receiver', '_id name username avatar')
    .sort({ createdAt: 1 })
    .lean()

  // Only valid messages with text
  const clean = messages.filter(
    m => m.sender != null && m.text?.trim() !== ''
  )

  // Mark received messages as read
  await Message.updateMany(
    { conversationId: convoId, receiver: myId, isRead: false },
    { isRead: true }
  )

  res.status(200).json({
    success: true,
    messages: clean,
    myId: myId.toString() // send myId so frontend isMine check is 100% accurate
  })
})

// ── GET CONVERSATION LIST ─────────────────────────────────────────────────────
const getConversationList = asyncHandler(async (req, res) => {
  const myId = req.user._id

  // Only accepted connections
  const connections = await Connection.find({
    $or: [
      { sender: myId, status: 'accepted' },
      { receiver: myId, status: 'accepted' }
    ]
  }).lean()

  if (!connections.length) {
    return res.status(200).json({ success: true, conversations: [] })
  }

  const list = await Promise.all(
    connections.map(async (conn) => {
      // Get the OTHER person
      const otherId =
        conn.sender.toString() === myId.toString()
          ? conn.receiver
          : conn.sender

      const other = await User.findById(otherId)
        .select('_id name username avatar isVerified')
        .lean()

      if (!other) return null

      const convoId = getConvoId(myId, otherId)

      const last = await Message.findOne({ conversationId: convoId })
        .populate('sender', '_id name')
        .sort({ createdAt: -1 })
        .lean()

      const unread = await Message.countDocuments({
        conversationId: convoId,
        receiver: myId,
        isRead: false
      })

      return {
        user: other,
        lastMessage: last || null,
        unreadCount: unread
      }
    })
  )

  // Remove nulls + sort by latest message
  const sorted = list
    .filter(Boolean)
    .sort((a, b) => {
      const at = a.lastMessage?.createdAt || 0
      const bt = b.lastMessage?.createdAt || 0
      return new Date(bt) - new Date(at)
    })

  res.status(200).json({ success: true, conversations: sorted })
})

// ── UNREAD COUNT ──────────────────────────────────────────────────────────────
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    receiver: req.user._id,
    isRead: false
  })
  res.status(200).json({ success: true, count })
})

module.exports = {
  sendMessage,
  getConversation,
  getConversationList,
  getUnreadCount
}
