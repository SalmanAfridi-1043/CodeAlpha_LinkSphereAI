const asyncHandler = require('express-async-handler')
const Message = require('../models/Message')
const Connection = require('../models/Connection')
const User = require('../models/User')

// ─── Helper: get consistent conversation ID ───
const getConvoId = (id1, id2) => {
  return [id1.toString(), id2.toString()]
    .sort()
    .join('_')
}

// ─── Send Message ───
const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id
  const receiverId = req.params.userId
  const { text } = req.body

  // Validate text
  if (!text?.trim()) {
    res.status(400)
    throw new Error('Message text is required')
  }

  // Must be connected
  const connection = await Connection.findOne({
    $or: [
      { sender: senderId,
        receiver: receiverId,
        status: 'accepted' },
      { sender: receiverId,
        receiver: senderId,
        status: 'accepted' }
    ]
  })

  if (!connection) {
    res.status(403)
    throw new Error(
      'You must be connected to message this person'
    )
  }

  // Create message with EXACT sender/receiver
  const message = await Message.create({
    conversationId: getConvoId(senderId, receiverId),
    sender: senderId,
    receiver: receiverId,
    text: text.trim(),
    isRead: false
  })

  // Always populate fresh from DB
  const fresh = await Message
    .findById(message._id)
    .populate('sender',
      '_id name username avatar')
    .populate('receiver',
      '_id name username avatar')
    .lean()

  // Emit to receiver room
  const io = req.app.get('io')
  if (io) {
    io.to(receiverId.toString())
      .emit('new_message', fresh)
  }

  res.status(201).json({
    success: true,
    message: fresh
  })
})

// ─── Get Conversation ───
const getConversation = asyncHandler(
  async (req, res) => {
    const myId = req.user._id
    const otherId = req.params.userId

    const conversationId =
      getConvoId(myId, otherId)

    const messages = await Message
      .find({ conversationId })
      .populate('sender',
        '_id name username avatar')
      .populate('receiver',
        '_id name username avatar')
      .sort({ createdAt: 1 })
      .lean()

    // Mark received messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: myId,
        isRead: false
      },
      { isRead: true }
    )

    res.status(200).json({
      success: true,
      messages: messages || []
    })
  }
)

// ─── Get Conversation List ───
const getConversationList = asyncHandler(
  async (req, res) => {
    const myId = req.user._id

    // Only accepted connections
    const connections = await Connection.find({
      $or: [
        { sender: myId, status: 'accepted' },
        { receiver: myId, status: 'accepted' }
      ]
    }).lean()

    if (!connections.length) {
      return res.status(200).json({
        success: true,
        conversations: []
      })
    }

    const list = await Promise.all(
      connections.map(async (conn) => {
        // Get the OTHER person
        const otherId =
          conn.sender.toString() === myId.toString()
            ? conn.receiver
            : conn.sender

        const otherUser = await User
          .findById(otherId)
          .select(
            '_id name username avatar isVerified'
          )
          .lean()

        if (!otherUser) return null

        const conversationId =
          getConvoId(myId, otherId)

        const lastMessage = await Message
          .findOne({ conversationId })
          .sort({ createdAt: -1 })
          .populate('sender', '_id name')
          .lean()

        const unreadCount =
          await Message.countDocuments({
            conversationId,
            receiver: myId,
            isRead: false
          })

        return {
          user: otherUser,
          lastMessage: lastMessage || null,
          unreadCount,
          conversationId
        }
      })
    )

    const conversations = list
      .filter(Boolean)
      .sort((a, b) => {
        const aT = a.lastMessage?.createdAt || 0
        const bT = b.lastMessage?.createdAt || 0
        return new Date(bT) - new Date(aT)
      })

    res.status(200).json({
      success: true,
      conversations
    })
  }
)

// ─── Unread Count ───
const getUnreadCount = asyncHandler(
  async (req, res) => {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    })
    res.status(200).json({ success: true, count })
  }
)

module.exports = {
  sendMessage,
  getConversation,
  getConversationList,
  getUnreadCount
}
