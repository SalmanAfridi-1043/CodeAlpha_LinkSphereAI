// VERIFIED: controllers/followController.js — no issues found
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const createNotification = require("../utils/notificationHelper");

// @desc    Toggle follow/unfollow status for a user
// @route   POST /api/follow/:userId
// @access  Private
const toggleFollow = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const currentUser = await User.findById(req.user._id);

  const isFollowing = currentUser.following.some(
    (id) => id.toString() === userId.toString()
  );

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId.toString()
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    return res.status(200).json({
      success: true,
      following: false,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  } else {
    // Follow
    currentUser.following.push(userId);
    targetUser.followers.push(req.user._id);

    await Promise.all([currentUser.save(), targetUser.save()]);

    const io = req.app.get("io");
    // FIXED: notification identity — recipient is targetUser, sender is active requester
    await createNotification(io, {
      recipientId: targetUser._id,
      senderId: req.user._id,
      type: "follow",
    });

    return res.status(200).json({
      success: true,
      following: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    });
  }
});

// @desc    Check follow status of a user
// @route   GET /api/follow/status/:userId
// @access  Private
const checkFollowStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const currentUser = await User.findById(req.user._id).select("following");
  const isFollowing = currentUser.following.some(
    (id) => id.toString() === userId.toString()
  );

  return res.status(200).json({
    success: true,
    isFollowing,
  });
});

// @desc    Get mutual followers between current user and target user
// @route   GET /api/follow/mutual/:userId
// @access  Private
const getMutualFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId).select("followers");
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const currentUser = await User.findById(req.user._id).select("following");

  const mutualIds = (currentUser.following || []).filter((id) =>
    (targetUser.followers || []).some(
      (followerId) => followerId.toString() === id.toString()
    )
  );

  const mutualUsers = await User.find({ _id: { $in: mutualIds } })
    .select("_id name username avatar isVerified followers following")
    .limit(3);

  return res.status(200).json({
    success: true,
    mutualFollowers: mutualUsers,
    mutualCount: mutualIds.length,
  });
});

module.exports = {
  toggleFollow,
  checkFollowStatus,
  getMutualFollowers,
};
