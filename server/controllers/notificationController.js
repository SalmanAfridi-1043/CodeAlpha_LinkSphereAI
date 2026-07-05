// VERIFIED: controllers/notificationController.js — no issues found
const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

// @desc    Get user notifications (paginated)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(
  async (req, res) => {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
    .populate('sender',
      '_id name username avatar isVerified')
    .populate('post', '_id content image')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

    // Guard nulls
    const safe = notifications.filter(
      n => n.sender != null
    )

    return res.status(200).json({
      success: true,
      notifications: safe,
      unreadCount: safe.filter(n => !n.isRead).length
    })
  }
)

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  notification.isRead = true;
  await notification.save();

  // Populate sender again so we return populated object (safe for virtuals)
  await notification.populate("sender", "_id name username avatar isVerified followers following");
  if (notification.post) {
    await notification.populate("post", "_id content image");
  }

  return res.status(200).json({
    success: true,
    notification,
  });
});

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
