// VERIFIED: routes/authRoutes.js — logout route added
const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getMe,
  // SECURITY: logoutUser blacklists the JWT token on the server side
  logoutUser,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
// SECURITY: Logout endpoint — invalidates the user's JWT by adding it to the blacklist
router.post("/logout", protect, logoutUser);

module.exports = router;
