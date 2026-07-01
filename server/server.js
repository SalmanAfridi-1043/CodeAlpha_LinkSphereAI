// VERIFIED: server.js — no issues found
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const followRoutes = require("./routes/followRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_PROD,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

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

// RENDER DEPLOYMENT STEPS:
// 1. render.com → New Web Service
// 2. Connect GitHub repo
// 3. Root directory: server
// 4. Build command: npm install
// 5. Start command: node server.js
// 6. Add all .env keys in Render dashboard
// 7. Copy the Render URL for Vercel env vars


