// FIXED: notification identity helper - verified sender fetching and correct population
const Notification = require("../models/Notification");
const User = require("../models/User");

const createNotification = async (
  io, { recipientId, senderId, type, postId = null }
) => {
  try {
    const getUserId = (idOrObj) => {
      if (!idOrObj) return "";
      if (typeof idOrObj === "string") return idOrObj;
      return (idOrObj._id || idOrObj).toString();
    };

    // Never notify yourself
    if (getUserId(recipientId) === getUserId(senderId)) {
      return null;
    }

    // Fetch REAL sender details from DB
    // Never trust what's passed — always verify
    const sender = await User.findById(senderId)
      .select("_id name username avatar isVerified")
      .lean();

    if (!sender) return null;

    // Save to DB
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId || null,
      isRead: false,
    });

    // Populate for socket emit
    const populated = await Notification
      .findById(notification._id)
      .populate("sender", "_id name username avatar isVerified")
      .populate("post", "_id content image")
      .lean();

    // Emit to recipient's personal room
    // recipient gets notified WITH correct sender info
    if (io) {
      io.to(recipientId.toString())
        .emit("new_notification", {
          ...populated,
          // Guarantee correct sender data
          sender: {
            _id: sender._id,
            name: sender.name,
            username: sender.username,
            avatar: sender.avatar,
            isVerified: sender.isVerified,
          },
        });
    }

    return populated;

  } catch (err) {
    console.error("Notification error:", err);
    return null;
  }
};

module.exports = createNotification;
