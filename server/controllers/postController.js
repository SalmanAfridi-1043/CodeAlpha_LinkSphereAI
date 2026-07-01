const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const User = require("../models/User");
const Like = require("../models/Like");

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  let image = "";

  if (req.file) {
    image = req.file.path; // Cloudinary secure_url from multer-storage-cloudinary
  }

  if (!content && !image) {
    res.status(400);
    throw new Error("Post must have text or an image");
  }

  const post = await Post.create({
    user: req.user._id,
    content: content || "",
    image: image || "",
  });

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "_id name username avatar isVerified followers following"
  );

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    post: populatedPost,
  });
});

// @desc    Get feed posts (own posts + followed users' posts)
// @route   GET /api/posts/feed
// @access  Private
const getFeedPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const currentUser = await User.findById(req.user._id);
  const userIdsToShow = [...(currentUser.following || []), req.user._id];

  const posts = await Post.find({ user: { $in: userIdsToShow } })
    .populate("user", "_id name username avatar isVerified followers following")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Post.countDocuments({ user: { $in: userIdsToShow } });

  const postIds = posts.map((p) => p._id);
  const userLikes = await Like.find({ post: { $in: postIds }, user: req.user._id }).select("post");
  const likedPostIds = new Set(userLikes.map((l) => l.post.toString()));
  const postsWithLikes = posts.map((post) => {
    const postObj = post.toObject();
    postObj.isLiked = likedPostIds.has(post._id.toString());
    return postObj;
  });

  res.status(200).json({
    success: true,
    posts: postsWithLikes,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalPosts: totalCount,
    hasMore: page * limit < totalCount,
  });
});

// @desc    Get explore posts (all posts sorted by most recent)
// @route   GET /api/posts/explore
// @access  Private
const getExplorePosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const posts = await Post.find({})
    .populate("user", "_id name username avatar isVerified followers following")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Post.countDocuments({});

  const postIds = posts.map((p) => p._id);
  const userLikes = await Like.find({ post: { $in: postIds }, user: req.user._id }).select("post");
  const likedPostIds = new Set(userLikes.map((l) => l.post.toString()));
  const postsWithLikes = posts.map((post) => {
    const postObj = post.toObject();
    postObj.isLiked = likedPostIds.has(post._id.toString());
    return postObj;
  });

  res.status(200).json({
    success: true,
    posts: postsWithLikes,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    hasMore: page * limit < totalCount,
  });
});

// @desc    Get user's posts
// @route   GET /api/posts/user/:username
// @access  Private
const getUserPosts = asyncHandler(async (req, res) => {
  const username = req.params.username.toLowerCase();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ username });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const posts = await Post.find({ user: user._id })
    .populate("user", "_id name username avatar isVerified followers following")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Post.countDocuments({ user: user._id });

  const postIds = posts.map((p) => p._id);
  const userLikes = await Like.find({ post: { $in: postIds }, user: req.user._id }).select("post");
  const likedPostIds = new Set(userLikes.map((l) => l.post.toString()));
  const postsWithLikes = posts.map((post) => {
    const postObj = post.toObject();
    postObj.isLiked = likedPostIds.has(post._id.toString());
    return postObj;
  });

  res.status(200).json({
    success: true,
    posts: postsWithLikes,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    hasMore: page * limit < totalCount,
  });
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (owner only)
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this post");
  }

  const { content } = req.body;

  if (!content && !post.image) {
    res.status(400);
    throw new Error("Post must have text if it has no image");
  }

  post.content = content || "";
  post.isEdited = true;

  await post.save();

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "_id name username avatar isVerified followers following"
  );

  res.status(200).json({
    success: true,
    message: "Post updated successfully",
    post: populatedPost,
  });
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (owner only)
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: "Post deleted successfully",
    postId: req.params.id,
  });
});

// @desc    Get user profile details by username
// @route   GET /api/posts/profile/:username
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const username = req.params.username.toLowerCase();
  const user = await User.findOne({ username })
    .select("-password")
    .populate("followers", "_id name username avatar isVerified followers following")
    .populate("following", "_id name username avatar isVerified followers following");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

module.exports = {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getUserPosts,
  updatePost,
  deletePost,
  getUserProfile,
};
