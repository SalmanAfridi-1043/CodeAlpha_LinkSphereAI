// Force Node.js to use public DNS servers to resolve MongoDB Atlas SRV connection strings on Windows/certain networks
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

// SECURITY: Validate required environment variables at startup — prevents silent misconfiguration
const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRE",
  "CLIENT_URL",
];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error("❌ Missing required env vars:", missingVars.join(", "));
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// SECURITY: HTTP headers — blocks clickjacking, sniffing, XSS, MIME attacks, etc.
const helmet = require("helmet");
// SECURITY: Rate limiting — prevents brute-force and DDoS
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const followRoutes = require("./routes/followRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PROD,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow any localhost port (handles Vite auto-port switching)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

const onlineUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// SECURITY: Apply Helmet before all routes — sets 11 protective HTTP response headers
app.use(helmet());
// SECURITY: Allow cross-origin images (needed for Cloudinary avatars/covers)
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors(corsOptions));

// SECURITY: Safe inline sanitizer — zero external dependencies, never touches req.query.
// Only cleans req.body strings:
//   - Strips $ from KEYS only (NoSQL injection prevention — blocks {$where:...}, {$gt:...})
//   - Strips <script> tags and javascript: URIs (XSS prevention)
//   - Strips inline event handlers like onerror= onclick= (XSS prevention)
// NOTE: We do NOT strip $ from values — doing so corrupts passwords and legitimate data.
const sanitizeInput = (req, res, next) => {
  const SKIP_VALUE_SANITIZE_KEYS = new Set(["password", "confirmPassword", "currentPassword", "newPassword"]);

  const clean = (obj) => {
    if (!obj || typeof obj !== "object") return;
    Object.keys(obj).forEach((key) => {
      // SECURITY: Strip $ from key names to block NoSQL injection operators
      const safeKey = key.replace(/\$/g, "");
      if (safeKey !== key) {
        obj[safeKey] = obj[key];
        delete obj[key];
      }
      const currentKey = safeKey;
      if (typeof obj[currentKey] === "string") {
        // Skip sanitizing password fields — stripping characters corrupts them
        if (SKIP_VALUE_SANITIZE_KEYS.has(currentKey)) return;
        obj[currentKey] = obj[currentKey]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      } else if (typeof obj[currentKey] === "object" && obj[currentKey] !== null) {
        clean(obj[currentKey]);
      }
    });
  };
  // Only sanitize body — NEVER touch req.query (read-only getter in Express 5 / Node 22+)
  if (req.body) clean(req.body);
  next();
};
app.use(sanitizeInput);

// SECURITY: General rate limit — 1000 req/15min in dev, 200 in production
// High-frequency polling paths (feed, notifications, etc.) are excluded so
// normal app usage never triggers this limit.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 1000,
  message: { success: false, message: "Too many requests — try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit frequently-polled read endpoints
    const skipPaths = [
      "/api/posts/feed",
      "/api/posts/explore",
      "/api/notifications",
      "/api/users/suggestions",
      "/api/messages/unread-count",
      "/api/connections/pending",
    ];
    return skipPaths.some((p) => req.path.startsWith(p));
  },
});

// SECURITY: Auth rate limit — brute-force protection on login + register only
// 20 attempts/15min in production, 100 in dev so testing isn't blocked.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 100,
  message: { success: false, message: "Too many login attempts — try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limiter across all API routes
app.use("/api", generalLimiter);
// Apply auth limiter only to the two write routes — NOT to /me or /logout
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/", (req, res) => {
  res.json({ message: "LinkSphereAI API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/follow", followRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const connectionRoutes = require("./routes/connectionRoutes");
app.use("/api/connections", connectionRoutes);

io.on("connection", (socket) => {
  onlineUsers.set(socket.userId, socket.id);
  socket.join(socket.userId);
  io.emit("user_online", { userId: socket.userId });
  console.log(`User connected: ${socket.userId}`);

  socket.on("get_online_users", () => {
    socket.emit("online_users_list", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.userId);
    io.emit("user_offline", { userId: socket.userId });
    console.log(`User disconnected: ${socket.userId}`);
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`LinkSphereAI Server running on port ${PORT}`);
  });
});

module.exports = { app, server, io, onlineUsers };
// Trigger nodemon change reload again

// RENDER DEPLOYMENT STEPS:
// 1. render.com → New Web Service
// 2. Connect GitHub repo
// 3. Root directory: server
// 4. Build command: npm install
// 5. Start command: node server.js
// 6. Add all .env keys in Render dashboard
// 7. Copy the Render URL for Vercel env vars


