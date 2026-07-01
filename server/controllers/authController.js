// VERIFIED: controllers/authController.js — no issues found
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  followers: user.followers,
  following: user.following,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    res.status(400);
    throw new Error("Username already taken");
  }

  const user = await User.create({ name, username, email, password });
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: formatUserResponse(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: formatUserResponse(user),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("followers", "_id name username avatar")
    .populate("following", "_id name username avatar");

  res.status(200).json({
    success: true,
    user,
  });
});

module.exports = { registerUser, loginUser, getMe };
