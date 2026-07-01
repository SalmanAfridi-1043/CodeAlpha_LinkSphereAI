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

// DEBUGGED: Added updateUserProfile, getFollowers, and getFollowing controller functions to support profile changes and complete follow network populating.

module.exports = {
  searchUsers,
  getSuggestedUsers,
  updateUserProfile,
  getFollowers,
  getFollowing,
};

// @desc    Update user profile details
// @route   PUT /api/users/update
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, bio, website, location } = req.body;

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (website !== undefined) user.website = website;
  if (location !== undefined) user.location = location;

  if (req.files) {
    if (req.files.avatar && req.files.avatar[0]) {
      user.avatar = req.files.avatar[0].path;
    }
    if (req.files.coverImage && req.files.coverImage[0]) {
      user.coverImage = req.files.coverImage[0].path;
    }
  }

  await user.save();

  const updatedUser = await User.findById(user._id)
    .populate("followers", "_id name username avatar isVerified followers following")
    .populate("following", "_id name username avatar isVerified followers following");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Private
const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).populate(
    "followers",
    "_id name username avatar isVerified followers following"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    followers: user.followers,
  });
});

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Private
const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).populate(
    "following",
    "_id name username avatar isVerified followers following"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    following: user.following,
  });
});
