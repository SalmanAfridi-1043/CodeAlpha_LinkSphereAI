const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const Connection = require("../models/Connection");
const User = require("../models/User");

// @desc    Send a message to a connected user
// @route   POST /api/messages/:userId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.params.userId;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Message text is required");
  }

  // Check if they are connected
  const connection = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
    status: "accepted",
  });

  if (!connection) {
    res.status(403);
    throw new Error("You must be connected with this user to send messages");
  }

  const conversationId = Message.getConversationId(senderId, receiverId);

  const message = await Message.create({
    conversationId,
    sender: senderId,
    receiver: receiverId,
    text: text.trim(),
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "_id name username avatar isVerified")
    .populate("receiver", "_id name username avatar isVerified");

  // Emit to receiver via socket
  const io = req.app.get("io");
  if (io) {
    io.to(receiverId.toString()).emit("new_message", populatedMessage);
  }

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});

// @desc    Get conversation messages between current user and target user
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const targetUserId = req.params.userId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  const conversationId = Message.getConversationId(currentUserId, targetUserId);

  // Get total message count in conversation
  const totalMessages = await Message.countDocuments({ conversationId });

  // Get conversation messages
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "_id name username avatar isVerified")
    .populate("receiver", "_id name username avatar isVerified");

  // Mark all unread messages received by me in this conversation as read
  await Message.updateMany(
    { conversationId, receiver: currentUserId, isRead: false },
    { $set: { isRead: true } }
  );

  // Emit to the other user that their messages have been read
  const io = req.app.get("io");
  if (io) {
    io.to(targetUserId.toString()).emit("messages_read", {
      conversationId,
      readerId: currentUserId,
    });
  }

  res.status(200).json({
    success: true,
    messages,
    pagination: {
      total: totalMessages,
      page,
      limit,
      pages: Math.ceil(totalMessages / limit),
    },
  });
});

// @desc    Get all conversations list for the current user
// @route   GET /api/messages
// @access  Private
const getConversationList = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // Find all accepted connections
  const connections = await Connection.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    status: "accepted",
  })
    .populate("sender", "_id name username avatar isVerified bio")
    .populate("receiver", "_id name username avatar isVerified bio");

  const conversationList = [];

  for (const conn of connections) {
    const otherUser =
      conn.sender._id.toString() === currentUserId.toString()
        ? conn.receiver
        : conn.sender;

    const conversationId = Message.getConversationId(currentUserId, otherUser._id);

    // Get last message
    const lastMessage = await Message.findOne({ conversationId })
      .sort({ createdAt: -1 })
      .populate("sender", "_id name username avatar")
      .populate("receiver", "_id name username avatar");

    // Get unread count sent by otherUser to me
    const unreadCount = await Message.countDocuments({
      conversationId,
      receiver: currentUserId,
      isRead: false,
    });

    conversationList.push({
      user: otherUser,
      lastMessage: lastMessage || null,
      unreadCount,
    });
  }

  // Sort by the last message's createdAt descending.
  // If a conversation has no messages, place it at the end.
  conversationList.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
  });

  res.status(200).json({
    success: true,
    conversations: conversationList,
  });
});

// @desc    Get total unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const count = await Message.countDocuments({
    receiver: currentUserId,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count,
  });
});

module.exports = {
  sendMessage,
  getConversation,
  getConversationList,
  getUnreadCount,
};
