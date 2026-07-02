// VERIFIED: controllers/authController.js — security layer added
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const generateToken = require("../utils/generateToken");
// SECURITY: Token blacklist — used by logoutUser to invalidate tokens on logout
const BlacklistedToken = require("../models/BlacklistedToken");

const formatUserResponse = (user, postsCount = 0) => ({
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
  postsCount,
});

// SECURITY: Regex — enforces strong password: 8+ chars, upper, lower, digit, special char
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// SECURITY: Regex — detect HTML tags in name/username to block injection attempts
const HTML_TAG_REGEX = /<[^>]*>/g;

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // SECURITY: Block HTML/script tags in name and username (XSS via profile fields)
  if (HTML_TAG_REGEX.test(name) || HTML_TAG_REGEX.test(username)) {
    res.status(400);
    throw new Error("Invalid characters in name or username");
  }

  // SECURITY: Enforce strong password policy — prevents weak credentials
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (@$!%*?&)"
    );
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
    user: formatUserResponse(user, 0),
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

  // FIX: Include postsCount in login response so sidebar stats work immediately
  const postsCount = await Post.countDocuments({ user: user._id });

  res.status(200).json({
    success: true,
    token,
    user: formatUserResponse(user, postsCount),
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("followers", "_id name username avatar")
    .populate("following", "_id name username avatar");

  // FIX: Count actual posts from DB so sidebar displays correct number
  const postsCount = await Post.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    user: {
      ...user.toObject(),
      postsCount,
    },
  });
});

// SECURITY: Secure logout — blacklists the JWT so it can't be reused even if intercepted
const logoutUser = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // SECURITY: Store token in blacklist until its natural expiry time
      await BlacklistedToken.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
      });
    } catch (err) {
      // Token already invalid — no action needed, logout still succeeds
      console.warn("Logout: token decode failed (already expired?):", err.message);
    }
  }
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = { registerUser, loginUser, getMe, logoutUser };
