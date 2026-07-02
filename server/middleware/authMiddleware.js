// VERIFIED: middleware/authMiddleware.js — blacklist check added
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// SECURITY: Token blacklist — reject tokens that were invalidated via logout
const BlacklistedToken = require("../models/BlacklistedToken");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // SECURITY: Reject tokens that were explicitly blacklisted (post-logout reuse attack)
      const isBlacklisted = await BlacklistedToken.findOne({ token });
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: "Token has been invalidated — please log in again",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = protect;
