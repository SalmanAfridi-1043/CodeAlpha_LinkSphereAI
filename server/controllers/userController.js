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
// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = asyncHandler(async (req, res) => {
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
    .limit(10);

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
    .limit(5);

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

  // Step 5 — Sort by score, take top 6
  const suggestions = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((u) => ({
      ...u,
      isFollowing: false,
      mutualFollowersCount: followingList.filter((id) =>
        u.followers.some((f) => f.toString() === id.toString())
      ).length,
    }));

  return res.status(200).json({ success: true, users: suggestions });
});

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
  let suggestions = scored.sort((a, b) => b.score - a.score);

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

module.exports = {
  searchUsers,
  getSuggestedUsers,
  refreshSuggestedUsers,
  updateUserProfile,
  getFollowers,
  getFollowing,
};
