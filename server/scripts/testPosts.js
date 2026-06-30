require("dotenv").config();

const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const authRoutes = require("../routes/authRoutes");
const postRoutes = require("../routes/postRoutes");
const { errorHandler } = require("../middleware/errorMiddleware");

const runTests = async () => {
  console.log("🚀 Initializing MongoMemoryServer for Post System Tests...");
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = "linksphereai_super_secret_jwt_key_2024";
  process.env.JWT_EXPIRE = "30d";

  await connectDB();

  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use(errorHandler);

  const server = app.listen(0);
  const { port } = server.address();
  const authUrl = `http://127.0.0.1:${port}/api/auth`;
  const postsUrl = `http://127.0.0.1:${port}/api/posts`;

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
    // 1. Create two users
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

    // 2. TEST 1 — Create Post (text only)
    console.log("\n--- TEST 1: Create Post ---");
    const createRes = await fetch(postsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        content: "Just started building LinkSphereAI! 🚀 #MERN #CodeAlpha",
      }),
    });
    const createData = await createRes.json();
    assert("Create Post returns 201 status", createRes.status === 201);
    assert("Create Post response has success: true", createData.success === true);
    assert("Create Post contains populated user details", createData.post?.user?.username === "ahmedali");
    const createdPostId = createData.post?._id;

    // 3. TEST 2 — Get Feed
    console.log("\n--- TEST 2: Get Feed ---");
    const feedRes = await fetch(`${postsUrl}/feed?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const feedData = await feedRes.json();
    assert("Get Feed returns 200 status", feedRes.status === 200);
    assert("Get Feed returns posts list including own post", feedData.posts?.length === 1 && feedData.posts[0]._id === createdPostId);
    assert("Get Feed pagination contains currentPage and totalPages", feedData.currentPage === 1 && feedData.totalPages === 1);

    // 4. TEST 3 — Get Explore Posts
    console.log("\n--- TEST 3: Get Explore Posts ---");
    const exploreRes = await fetch(`${postsUrl}/explore?page=1&limit=12`, {
      headers: { Authorization: `Bearer ${token2}` }, // User 2 explores
    });
    const exploreData = await exploreRes.json();
    assert("Get Explore returns 200 status", exploreRes.status === 200);
    assert("Get Explore contains User 1's post", exploreData.posts?.length === 1 && exploreData.posts[0].user.username === "ahmedali");

    // 5. TEST 4 — Get User Posts
    console.log("\n--- TEST 4: Get User Posts ---");
    const userPostsRes = await fetch(`${postsUrl}/user/ahmedali?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const userPostsData = await userPostsRes.json();
    assert("Get User Posts returns 200 status", userPostsRes.status === 200);
    assert("Get User Posts contains only User 1's posts", userPostsData.posts?.length === 1 && userPostsData.posts[0].user.username === "ahmedali");

    // 6. TEST 5 — Update Post
    console.log("\n--- TEST 5: Update Post ---");
    const updateRes = await fetch(`${postsUrl}/${createdPostId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        content: "Updated: Building LinkSphereAI with real-time features! 🚀",
      }),
    });
    const updateData = await updateRes.json();
    assert("Update Post returns 200 status", updateRes.status === 200);
    assert("Update Post isEdited is true", updateData.post?.isEdited === true);
    assert("Update Post content is updated", updateData.post?.content === "Updated: Building LinkSphereAI with real-time features! 🚀");

    // 7. TEST 7 — Unauthorized Edit Attempt
    console.log("\n--- TEST 7: Unauthorized Edit Attempt ---");
    const unauthorizedRes = await fetch(`${postsUrl}/${createdPostId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`, // Sarah trying to edit Ahmed's post
      },
      body: JSON.stringify({
        content: "trying to hack",
      }),
    });
    const unauthorizedData = await unauthorizedRes.json();
    assert("Unauthorized Edit Attempt returns 403 status", unauthorizedRes.status === 403);
    assert("Unauthorized error message indicates authorization failure", unauthorizedData.message === "Not authorized to edit this post");

    // 8. TEST 6 — Delete Post
    console.log("\n--- TEST 6: Delete Post ---");
    const deleteRes = await fetch(`${postsUrl}/${createdPostId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token1}` },
    });
    const deleteData = await deleteRes.json();
    assert("Delete Post returns 200 status", deleteRes.status === 200);
    assert("Delete Post returns success and postId", deleteData.success === true && deleteData.postId === createdPostId);

    // Verify deleted post is gone from feed
    const verifyFeedRes = await fetch(`${postsUrl}/feed`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const verifyFeedData = await verifyFeedRes.json();
    assert("Verify post is deleted from feed", verifyFeedData.posts?.length === 0);

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
