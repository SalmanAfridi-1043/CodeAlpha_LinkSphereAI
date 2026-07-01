const User = require("../models/User");
const createNotification = require("./notificationHelper");

/**
 * Extracts @usernames from text and returns their corresponding MongoDB Object IDs.
 * @param {string} text - The input text body (post content or comment text)
 * @returns {Promise<Array>} - Array of matching User Object IDs
 */
const extractMentions = async (text) => {
  if (!text) return [];

  // Match all instances of @username (where username is alphanumeric + underscore)
  const regex = /@([a-zA-Z0-9_]+)/g;
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add the matched username in lowercase to keep search robust
    matches.push(match[1].toLowerCase());
  }

  if (matches.length === 0) return [];

  // Get unique usernames from the matches
  const uniqueUsernames = [...new Set(matches)];

  // Find users in DB
  const users = await User.find({ username: { $in: uniqueUsernames } }).select("_id");
  return users.map((user) => user._id);
};

/**
 * Sends a real-time socket and DB notification for each mentioned user.
 * @param {object} io - Socket.io server instance
 * @param {object} params - Parameters
 * @param {Array} params.mentionedIds - Array of User IDs who were mentioned
 * @param {string} params.senderId - User ID who triggered the mention
 * @param {string} params.postId - Associated post ID
 */
const notifyMentions = async (io, { mentionedIds, senderId, postId }) => {
  if (!mentionedIds || mentionedIds.length === 0) return;

  for (const recipientId of mentionedIds) {
    // Skip notifying yourself
    if (recipientId.toString() === senderId.toString()) {
      continue;
    }

    try {
      await createNotification(io, {
        recipientId,
        senderId,
        type: "mention",
        postId,
      });
    } catch (err) {
      console.error(`Failed to notify mention to user ${recipientId}:`, err);
    }
  }
};

module.exports = {
  extractMentions,
  notifyMentions,
};
