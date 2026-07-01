const Notification = require("../models/Notification");

/**
 * Helper to create a notification, store it in MongoDB, and emit a real-time socket event.
 * Prevents self-notifications automatically.
 * @param {object} io - Socket.io server instance
 * @param {object} params - Notification parameters
 * @param {string} params.recipientId - User receiving the notification
 * @param {string} params.senderId - User triggering the notification
 * @param {string} params.type - Type of event ("like" | "comment" | "follow")
 * @param {string} [params.postId] - Associated post ID, if applicable
 */
const createNotification = async (io, { recipientId, senderId, type, postId = null }) => {
  // 1. Don't notify yourself
  if (recipientId.toString() === senderId.toString()) {
    return null;
  }

  // 2. Create notification in DB
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    post: postId,
  });

  // 3. Populate sender details (including followers/following to prevent virtual getters crash)
  await notification.populate("sender", "_id name username avatar isVerified followers following");

  // 4. Populate post details if available
  if (postId) {
    await notification.populate("post", "_id content image");
  }

  // 5. Emit real-time event to the recipient's personal room
  if (io) {
    io.to(recipientId.toString()).emit("new_notification", notification);
  }

  return notification;
};

module.exports = createNotification;
