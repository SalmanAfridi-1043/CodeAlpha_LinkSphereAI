// SECURITY: Token blacklist model — invalidates JWT tokens on logout
// Tokens stored here are rejected by authMiddleware even if not expired
const mongoose = require("mongoose");

const blacklistedTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    // SECURITY: TTL field — MongoDB auto-deletes expired token documents (no manual cleanup needed)
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// SECURITY: MongoDB TTL index — auto-purges expired blacklist entries at DB level
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("BlacklistedToken", blacklistedTokenSchema);
