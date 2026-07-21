const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Like = require("../models/Like");
const Notification = require("../models/Notification");
const Connection = require("../models/Connection");
const bcrypt = require("bcryptjs");

// @desc    Search users by name or username
// @route   GET /api/users/search
// @access  Private
// FIXED: searchUsers with partial name, first name, half username smart fuzzy TikTok-style matching
const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim() || "";
  if (!q) {
    return res.status(200).json({
      success: true,
      users: [],
      count: 0,
    });
  }

  // Split query into parts for smart matching
  // "sal af" → searches "sal" AND "af" separately
  const parts = q.split(" ").filter(Boolean);

  // Build OR conditions for each part
  const conditions = parts.flatMap((part) => [
    { name: { $regex: part, $options: "i" } },
    { username: { $regex: part, $options: "i" } },
    { bio: { $regex: part, $options: "i" } },
  ]);

  const users = await User.find({
    $and: [{ _id: { $ne: req.user._id } }, { $or: conditions }],
  })
    .select("_id name username avatar bio isVerified followers")
    .limit(15)
    .lean();

  // Score results by relevance
  const scored = users.map((user) => {
    let score = 0;
    const nameLower = user.name?.toLowerCase() || "";
    const usernameLower = user.username?.toLowerCase() || "";
    const qLower = q.toLowerCase();

    // Exact match = highest score
    if (nameLower === qLower) score += 20;
    if (usernameLower === qLower) score += 20;

    // Starts with query = high score
    if (nameLower.startsWith(qLower)) score += 15;
    if (usernameLower.startsWith(qLower)) score += 15;

    // Contains query = medium score
    if (nameLower.includes(qLower)) score += 10;
    if (usernameLower.includes(qLower)) score += 10;

    // More followers = more relevant
    score += Math.min(user.followers?.length || 0, 5);

    // Verified = more relevant
    if (user.isVerified) score += 3;

    return { ...user, score };
  });

  const result = scored
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...user }) => ({
      ...user,
      name: user.name || "Unknown",
      username: user.username || "unknown",
      avatar: user.avatar || "",
    }));

  res.status(200).json({
    success: true,
    users: result,
    count: result.length,
  });
});

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = asyncHandler(
  async (req, res) => {
    const me = await User.findById(req.user._id)
      .select('following')
      .lean()

    // Build exclusion list
    // Exclude: myself + people I already follow
    const excludeIds = [
      req.user._id,
      ...(me.following || [])
    ]

    // Step 1: Friends of friends (most relevant)
    const friendsOfFriends = await User.find({
      _id: { $nin: excludeIds },
      followers: { $in: me.following || [] }
    })
    .select(
      '_id name username avatar bio isVerified followers'
    )
    .limit(10)
    .lean()

    // Add their IDs to exclude list
    const fofIds = friendsOfFriends.map(u => u._id)
    const fullExclude = [...excludeIds, ...fofIds]

    // Step 2: Popular users not yet excluded
    const popularUsers = await User.find({
      _id: { $nin: fullExclude }
    })
    .select(
      '_id name username avatar bio isVerified followers'
    )
    .sort({ followers: -1 })
    .limit(5)
    .lean()

    // Combine + score
    const all = [
      ...friendsOfFriends,
      ...popularUsers
    ]

    const scored = all.map(u => {
      let score = 0
      // Friend of friend = high value
      if ((me.following || []).some(id =>
        (u.followers || []).some(f =>
          f.toString() === id.toString()
        )
      )) score += 10
      // Popularity
      score += Math.min(
        u.followers?.length || 0, 5
      )
      // Verified
      if (u.isVerified) score += 2
      return { ...u, score }
    })

    const suggestions = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ score, ...u }) => ({
        ...u,
        name: u.name || 'Unknown',
        username: u.username || 'unknown',
        avatar: u.avatar || '',
        isFollowing: false
      }))

    res.status(200).json({
      success: true,
      users: suggestions
    })
  }
)

// @desc    Refresh suggested users to follow
// @route   GET /api/users/suggestions/refresh
// @access  Private
const refreshSuggestedUsers = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).select("following bio website location");
  const followingList = me.following || [];

  // Step 2 — Get users followed by people I follow (friends of friends)
  const friendsOfFriends = await User.find({
    _id: {
      $nin: [...followingList, req.user._id],
    },
    followers: { $in: followingList },
  })
    .select("_id name username avatar bio isVerified followers website location")
    .limit(15); // get slightly more for refreshes

  // Step 3 — Get popular users I don't follow
  const popularUsers = await User.find({
    _id: {
      $nin: [
        ...followingList,
        req.user._id,
        ...friendsOfFriends.map((u) => u._id),
      ],
    },
  })
    .select("_id name username avatar bio isVerified followers website location")
    .sort({ followers: -1 })
    .limit(10); // get slightly more for refreshes

  // Step 4 — Combine + score each user
  const allCandidates = [...friendsOfFriends, ...popularUsers];
  const scored = allCandidates.map((user) => {
    let score = 0;

    // Friend of friend = high relevance
    if (
      followingList.some((id) =>
        user.followers.some((f) => f.toString() === id.toString())
      )
    ) {
      score += 10;
    }

    // More followers = more credibility
    score += Math.min(user.followers.length, 5);

    // Same location = local connection
    if (
      me.location &&
      user.location &&
      me.location.toLowerCase() === user.location.toLowerCase()
    ) {
      score += 3;
    }

    // Verified = trustworthy
    if (user.isVerified) {
      score += 2;
    }

    return { ...user.toObject(), score };
  });

  // Sort by score
  let suggestions = scored
    .sort((a, b) => b.score - a.score)
    .filter((u) => u._id.toString() !== req.user._id.toString());

  // Rotate suggestion list using seed parameter
  const seed = parseInt(req.query.seed) || 0;
  if (seed > 0 && suggestions.length > 6) {
    const offset = (seed * 6) % suggestions.length;
    suggestions = [
      ...suggestions.slice(offset),
      ...suggestions.slice(0, offset),
    ];
  }

  // Take top 6
  const finalSuggestions = suggestions.slice(0, 6).map((u) => ({
    ...u,
    isFollowing: false,
    mutualFollowersCount: followingList.filter((id) =>
      u.followers.some((f) => f.toString() === id.toString())
    ).length,
  }));

  return res.status(200).json({ success: true, users: finalSuggestions });
});

// DEBUGGED: Added updateUserProfile, getFollowers, and getFollowing controller functions to support profile changes and complete follow network populating.

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

const changePassword = asyncHandler(
  async (req, res) => {
  const { currentPassword, newPassword }
    = req.body

  if (!currentPassword || !newPassword) {
    res.status(400)
    throw new Error('Both fields required')
  }

  const user = await User
    .findById(req.user._id)
    .select('+password')

  const isMatch = await user
    .matchPassword(currentPassword)
  if (!isMatch) {
    res.status(401)
    throw new Error('Current password incorrect')
  }

  user.password = newPassword
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  })
})

const deleteAccount = asyncHandler(
  async (req, res) => {
  const userId = req.user._id

  // Delete all user data
  await Post.deleteMany({ user: userId })
  await Comment.deleteMany({ user: userId })
  await Like.deleteMany({ user: userId })
  await Connection.deleteMany({
    $or: [
      { sender: userId },
      { receiver: userId }
    ]
  })
  await Notification.deleteMany({
    $or: [
      { recipient: userId },
      { sender: userId }
    ]
  })

  // Remove from others followers/following
  await User.updateMany(
    { followers: userId },
    { $pull: { followers: userId } }
  )
  await User.updateMany(
    { following: userId },
    { $pull: { following: userId } }
  )

  // Delete the user
  await User.findByIdAndDelete(userId)

  res.status(200).json({
    success: true,
    message: 'Account deleted'
  })
})

module.exports = {
  searchUsers,
  getSuggestedUsers,
  refreshSuggestedUsers,
  updateUserProfile,
  getFollowers,
  getFollowing,
  changePassword,
  deleteAccount,
};
