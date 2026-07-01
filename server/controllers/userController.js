const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// @desc    Search users by name or username
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(200).json({ success: true, users: [] });
  }

  const currentUser = await User.findById(req.user._id).select("following");

  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: q, $options: "i" } },
      { username: { $regex: q, $options: "i" } },
    ],
  })
    .select("_id name username avatar isVerified followers following")
    .limit(20);

  const usersWithFollowStatus = users.map((u) => {
    const userObj = u.toObject();
    userObj.isFollowing = currentUser.following.some(
      (id) => id.toString() === u._id.toString()
    );
    return userObj;
  });

  return res.status(200).json({
    success: true,
    users: usersWithFollowStatus,
  });
});

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id).select("following");
  const excludedIds = [...(currentUser.following || []), req.user._id];

  const suggestions = await User.find({
    _id: { $nin: excludedIds },
  })
    .select("_id name username avatar isVerified followers following")
    .limit(5);

  const suggestionsWithFollowStatus = suggestions.map((u) => {
    const userObj = u.toObject();
    userObj.isFollowing = false;
    return userObj;
  });

  return res.status(200).json({
    success: true,
    users: suggestionsWithFollowStatus,
  });
});

module.exports = {
  searchUsers,
  getSuggestedUsers,
};
