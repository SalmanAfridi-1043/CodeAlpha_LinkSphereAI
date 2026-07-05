const asyncHandler = require("express-async-handler");
const Connection = require("../models/Connection");
const User = require("../models/User");
// FIXED: Import notification helper so connection requests are persisted to DB
const createNotification = require("../utils/notificationHelper");

// @desc    Send a connection request
// @route   POST /api/connections/request/:userId
// @access  Private
const sendRequest = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const receiverId = req.params.userId;

  // Cannot send connection request to yourself
  if (senderId.toString() === receiverId.toString()) {
    res.status(400);
    throw new Error("Cannot connect with yourself");
  }

  // Check if receiver user exists
  const receiverUser = await User.findById(receiverId);
  if (!receiverUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if connection already exists
  const existingConnection = await Connection.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existingConnection) {
    res.status(400);
    throw new Error("Connection or request already exists");
  }

  const connection = await Connection.create({
    sender: senderId,
    receiver: receiverId,
    status: "pending",
  });

  // Populate sender details for the socket notification
  const populatedConnection = await Connection.findById(connection._id).populate(
    "sender",
    "_id name username avatar bio isVerified"
  );

  // FIXED: Emit socket event to receiver for real-time notification
  const io = req.app.get("io");
  if (io) {
    io.to(receiverId.toString()).emit("connection_request", populatedConnection);
  }

  // FIXED: Persist notification to DB so it appears after page refresh
  try {
    await createNotification(io, {
      recipientId: receiverId,
      senderId: senderId,
      type: "connection_request",
      postId: null,
    });
  } catch (notifErr) {
    // Non-blocking — log but don't fail the request
    console.error("Failed to create connection_request notification:", notifErr.message);
  }

  res.status(201).json({
    success: true,
    connection: populatedConnection,
  });
});

// @desc    Accept or reject a connection request
// @route   PUT /api/connections/respond/:connectionId
// @access  Private
const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // "accept" or "reject"
  const connectionId = req.params.connectionId;
  const currentUserId = req.user._id;

  if (!["accept", "reject"].includes(action)) {
    res.status(400);
    throw new Error("Invalid action. Must be accept or reject");
  }

  const connection = await Connection.findById(connectionId);
  if (!connection) {
    res.status(404);
    throw new Error("Connection request not found");
  }

  // Only the receiver can accept/reject the request
  if (connection.receiver.toString() !== currentUserId.toString()) {
    res.status(403);
    throw new Error("Not authorized to respond to this request");
  }

  if (action === "accept") {
    connection.status = "accepted";
    await connection.save();

    const populatedConnection = await Connection.findById(connection._id)
      .populate("sender", "_id name username avatar bio isVerified")
      .populate("receiver", "_id name username avatar bio isVerified");

    // Emit socket event to sender
    const io = req.app.get("io");
    if (io) {
      io.to(connection.sender.toString()).emit("connection_accepted", populatedConnection);
    }

    // FIXED: notification identity — create notification in DB for acceptance
    try {
      await createNotification(io, {
        recipientId: connection.sender,  // original requester gets notified
        senderId: req.user._id,          // accepter who triggered the action
        type: "connection_accepted",
        postId: null,
      });
    } catch (notifErr) {
      console.error("Failed to create connection_accepted notification:", notifErr.message);
    }
  } else if (action === "reject") {
    connection.status = "rejected";
    await connection.save();
  }

  res.status(200).json({
    success: true,
    connection,
  });
});

// @desc    Get accepted connections
// @route   GET /api/connections
// @access  Private
const getMyConnections = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const connections = await Connection.find({
    $or: [
      { sender: currentUserId },
      { receiver: currentUserId },
    ],
    status: "accepted",
  })
    .populate("sender", "_id name username avatar isVerified bio")
    .populate("receiver", "_id name username avatar isVerified bio")
    .sort({ updatedAt: -1 });

  // Map to get the "other person" details
  const connectedUsers = connections.map((conn) => {
    if (conn.sender._id.toString() === currentUserId.toString()) {
      return conn.receiver;
    } else {
      return conn.sender;
    }
  }).filter(Boolean);

  res.status(200).json({
    success: true,
    connections: connectedUsers,
    count: connectedUsers.length,
  });
});

// @desc    Get pending received connection requests
// @route   GET /api/connections/pending
// @access  Private
const getPendingRequests = asyncHandler(
  async (req, res) => {
    const pending = await Connection.find({
      receiver: req.user._id,
      status: 'pending'
    })
    .populate('sender',
      '_id name username avatar bio isVerified'
    )
    .sort({ createdAt: -1 })
    .lean()

    // Remove null senders
    const safe = pending.filter(
      p => p.sender != null
    )

    res.status(200).json({
      success: true,
      requests: safe,
      count: safe.length
    })
  }
)

// @desc    Find/search people to connect with
// @route   GET /api/connections/find
// @access  Private
const findPeople = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim() || ''
  const type = req.query.type || 'all'

  if (!q || q.length < 1) {
    return res.status(200).json({
      success: true,
      users: [],
      count: 0
    })
  }

  // Build filter based on search type
  let searchFilter = {}
  if (type === 'username') {
    searchFilter = {
      username: { $regex: q, $options: 'i' }
    }
  } else if (type === 'github') {
    searchFilter = {
      website: {
        $regex: `github.*${q}|${q}.*github`,
        $options: 'i'
      }
    }
  } else if (type === 'website') {
    searchFilter = {
      website: { $regex: q, $options: 'i' }
    }
  } else {
    // Default: search name + username + bio
    searchFilter = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    }
  }

  // Get existing connections
  const myConnections = await Connection.find({
    $or: [
      { sender: req.user._id },
      { receiver: req.user._id }
    ]
  }).lean()

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } },
      searchFilter
    ]
  })
  .select(
    '_id name username avatar bio website isVerified followers'
  )
  .limit(10)
  .lean()

  // Map safely — no undefined
  const result = users.map(user => {
    const conn = myConnections.find(c =>
      c.sender?.toString() === user._id.toString() ||
      c.receiver?.toString() === user._id.toString()
    )
    return {
      _id: user._id,
      name: user.name || 'Unknown',
      username: user.username || 'unknown',
      avatar: user.avatar || '',
      bio: user.bio || '',
      website: user.website || '',
      isVerified: user.isVerified || false,
      followersCount: user.followers?.length || 0,
      isConnected: conn?.status === 'accepted',
      isPending: conn?.status === 'pending',
      connectionId: conn?._id || null
    }
  })

  res.status(200).json({
    success: true,
    users: result,
    count: result.length
  })
});

module.exports = {
  sendRequest,
  respondToRequest,
  getMyConnections,
  getPendingRequests,
  findPeople,
};
