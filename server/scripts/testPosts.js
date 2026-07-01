require("dotenv").config();

const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const postRoutes = require("../routes/postRoutes");
const likeRoutes = require("../routes/likeRoutes");
const commentRoutes = require("../routes/commentRoutes");
const followRoutes = require("../routes/followRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const { errorHandler } = require("../middleware/errorMiddleware");

const runTests = async () => {
  console.log("🚀 Initializing MongoMemoryServer for E2E LinkSphereAI System Tests...");
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = "linksphereai_super_secret_jwt_key_2024";
  process.env.JWT_EXPIRE = "30d";

  await connectDB();

  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/likes", likeRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/follow", followRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use(errorHandler);

  // Mock socket.io to put on express app context for helper calls
  const mockIo = {
    to: () => ({
      emit: () => {},
    }),
  };
  app.set("io", mockIo);

  const server = app.listen(0);
  const { port } = server.address();
  const authUrl = `http://127.0.0.1:${port}/api/auth`;
  const usersUrl = `http://127.0.0.1:${port}/api/users`;
  const postsUrl = `http://127.0.0.1:${port}/api/posts`;
  const likesUrl = `http://127.0.0.1:${port}/api/likes`;
  const commentsUrl = `http://127.0.0.1:${port}/api/comments`;
  const followUrl = `http://127.0.0.1:${port}/api/follow`;
  const notificationsUrl = `http://127.0.0.1:${port}/api/notifications`;

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, detail = "") => {
    if (condition) {
      console.log(`✅ ${name}`);
      passed += 1;
    } else {
      console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`);
      failed += 1;
    }
  };

  try {
    // 1. Create three users
    console.log("\n--- Creating Test Accounts ---");
    const user1Res = await fetch(`${authUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ahmed Ali",
        username: "ahmedali",
        email: "ahmed@test.com",
        password: "password123",
      }),
    });
    const user1Data = await user1Res.json();
    assert("Register Ahmed Ali (User 1)", user1Res.status === 201 && !!user1Data.token);
    const token1 = user1Data.token;
    const user1Id = user1Data.user?._id;

    const user2Res = await fetch(`${authUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sarah Connor",
        username: "sarahc",
        email: "sarah@test.com",
        password: "password123",
      }),
    });
    const user2Data = await user2Res.json();
    assert("Register Sarah Connor (User 2)", user2Res.status === 201 && !!user2Data.token);
    const token2 = user2Data.token;
    const user2Id = user2Data.user?._id;

    const user3Res = await fetch(`${authUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Connor",
        username: "johnc",
        email: "john@test.com",
        password: "password123",
      }),
    });
    const user3Data = await user3Res.json();
    assert("Register John Connor (User 3)", user3Res.status === 201 && !!user3Data.token);
    const token3 = user3Data.token;
    const user3Id = user3Data.user?._id;

    // 2. Create Post as User 2 (to verify User 1 sees it only after following)
    console.log("\n--- Creating a Post (User 2) ---");
    const createRes = await fetch(postsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        content: "Just started building LinkSphereAI! 🚀 #MERN #CodeAlpha",
      }),
    });
    const createData = await createRes.json();
    assert("Create Post returns 201 status", createRes.status === 201);
    const createdPostId = createData.post?._id;

    // 3. Follow System Tests (triggers follow notifications)
    console.log("\n--- FOLLOW SYSTEM TESTS ---");

    // Ahmed (User 1) follows Sarah (User 2)
    const followRes = await fetch(`${followUrl}/${user2Id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert("TEST 1 - Follow user returns 200", followRes.status === 200);

    // Check status
    const statusRes = await fetch(`${followUrl}/status/${user2Id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const statusData = await statusRes.json();
    assert("TEST 2 - Check status returns following true", statusData.isFollowing === true);

    // John (User 3) follows Sarah (User 2)
    await fetch(`${followUrl}/${user2Id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token3}` },
    });

    // Ahmed (User 1) follows John (User 3)
    await fetch(`${followUrl}/${user3Id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });

    // Verify mutual followers setup
    const mutualRes = await fetch(`${followUrl}/mutual/${user2Id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const mutualData = await mutualRes.json();
    assert("TEST 5 - Get Mutual Followers returns count 1", mutualRes.status === 200 && mutualData.mutualCount === 1);

    // Verify Feed updates
    const updatedFeedRes = await fetch(`${postsUrl}/feed`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const updatedFeedData = await updatedFeedRes.json();
    assert("TEST 6 - Feed contains Sarah's post", updatedFeedData.posts?.length === 1 && updatedFeedData.posts[0]._id === createdPostId);

    // 4. Like & Comment System Tests (triggers notifications)
    console.log("\n--- LIKE & COMMENT SYSTEM TESTS ---");
    // Ahmed likes Sarah's post
    const likeRes = await fetch(`${likesUrl}/${createdPostId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert("Like post succeeds", likeRes.status === 200);

    // Ahmed comments on Sarah's post
    const commentRes = await fetch(`${commentsUrl}/${createdPostId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ text: "Super cool!" }),
    });
    assert("Comment post succeeds", commentRes.status === 201);

    // 5. Notification System Tests
    console.log("\n--- NOTIFICATION SYSTEM TESTS ---");

    // Fetch notifications for User 2 (Sarah)
    // Expected: 4 notifications (follow by Ahmed, follow by John, like by Ahmed, comment by Ahmed)
    const notifRes = await fetch(`${notificationsUrl}?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const notifData = await notifRes.json();
    assert("Get Notifications returns 200 status", notifRes.status === 200);
    assert("Notifications count equals 4", notifData.notifications?.length === 4);
    assert("UnreadCount equals 4", notifData.unreadCount === 4);

    // Inspect notification types
    const types = notifData.notifications.map(n => n.type);
    assert("Contains comment, like, and follow types", types.includes("comment") && types.includes("like") && types.includes("follow"));
    
    // Mark one notification as read
    const singleNotifId = notifData.notifications[0]._id;
    const readRes = await fetch(`${notificationsUrl}/${singleNotifId}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token2}` },
    });
    const readData = await readRes.json();
    assert("Mark notification read returns 200 status", readRes.status === 200);
    assert("Notification marked isRead true", readData.notification?.isRead === true);

    // Fetch notifications again to verify unreadCount decreases
    const checkReadRes = await fetch(`${notificationsUrl}?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const checkReadData = await checkReadRes.json();
    assert("UnreadCount decremented to 3", checkReadData.unreadCount === 3);

    // Mark all as read
    const readAllRes = await fetch(`${notificationsUrl}/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert("Mark all read returns 200 status", readAllRes.status === 200);

    // Final unread validation
    const finalRes = await fetch(`${notificationsUrl}?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const finalData = await finalRes.json();
    assert("All notifications marked isRead true (unreadCount is 0)", finalData.unreadCount === 0);

  } catch (error) {
    console.error("❌ Test script failed with error:", error);
    failed += 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    console.log(`\n--- Test Summary: Passed: ${passed}, Failed: ${failed} ---`);
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
