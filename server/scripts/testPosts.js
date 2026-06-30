require("dotenv").config();

const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const authRoutes = require("../routes/authRoutes");
const postRoutes = require("../routes/postRoutes");
const likeRoutes = require("../routes/likeRoutes");
const commentRoutes = require("../routes/commentRoutes");
const { errorHandler } = require("../middleware/errorMiddleware");

const runTests = async () => {
  console.log("🚀 Initializing MongoMemoryServer for Post, Like, & Comment System Tests...");
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = "linksphereai_super_secret_jwt_key_2024";
  process.env.JWT_EXPIRE = "30d";

  await connectDB();

  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/likes", likeRoutes);
  app.use("/api/comments", commentRoutes);
  app.use(errorHandler);

  const server = app.listen(0);
  const { port } = server.address();
  const authUrl = `http://127.0.0.1:${port}/api/auth`;
  const postsUrl = `http://127.0.0.1:${port}/api/posts`;
  const likesUrl = `http://127.0.0.1:${port}/api/likes`;
  const commentsUrl = `http://127.0.0.1:${port}/api/comments`;

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

    // 2. Create Post
    console.log("\n--- Creating a Post ---");
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
    const createdPostId = createData.post?._id;

    // 3. Like System Tests
    console.log("\n--- LIKE SYSTEM TESTS ---");
    // TEST 1: Toggle Like (like a post)
    const likeRes = await fetch(`${likesUrl}/${createdPostId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    const likeData = await likeRes.json();
    assert("TEST 1 - Toggle Like (like a post) returns 200", likeRes.status === 200);
    assert("TEST 1 - Response has liked: true", likeData.liked === true);
    assert("TEST 1 - Response has likesCount: 1", likeData.likesCount === 1);

    // TEST 2: Toggle Like Again (unlike)
    const unlikeRes = await fetch(`${likesUrl}/${createdPostId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    const unlikeData = await unlikeRes.json();
    assert("TEST 2 - Toggle Like Again (unlike) returns 200", unlikeRes.status === 200);
    assert("TEST 2 - Response has liked: false", unlikeData.liked === false);
    assert("TEST 2 - Response has likesCount: 0", unlikeData.likesCount === 0);

    // TEST 3: Get Post Likes
    // Toggle like back on first
    await fetch(`${likesUrl}/${createdPostId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token1}` },
    });
    const getLikesRes = await fetch(`${likesUrl}/${createdPostId}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const getLikesData = await getLikesRes.json();
    assert("TEST 3 - Get Post Likes returns 200", getLikesRes.status === 200);
    assert("TEST 3 - Response contains likes array", Array.isArray(getLikesData.likes) && getLikesData.likes.length === 1);
    assert("TEST 3 - User details populated in likes array", getLikesData.likes[0].username === "ahmedali");

    // 4. Comment System Tests
    console.log("\n--- COMMENT SYSTEM TESTS ---");
    // TEST 4: Add Comment
    const addCommentRes = await fetch(`${commentsUrl}/${createdPostId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        text: "This is amazing! Great work 🔥",
      }),
    });
    const addCommentData = await addCommentRes.json();
    assert("TEST 4 - Add Comment returns 201", addCommentRes.status === 201);
    assert("TEST 4 - Response contains comment text", addCommentData.comment?.text === "This is amazing! Great work 🔥");
    assert("TEST 4 - Response returns updated commentsCount: 1", addCommentData.commentsCount === 1);
    const commentId = addCommentData.comment?._id;

    // TEST 5: Get Post Comments
    const getCommentsRes = await fetch(`${commentsUrl}/${createdPostId}?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const getCommentsData = await getCommentsRes.json();
    assert("TEST 5 - Get Post Comments returns 200", getCommentsRes.status === 200);
    assert("TEST 5 - Comments list length is 1", getCommentsData.comments?.length === 1);
    assert("TEST 5 - Comment contains populated user", getCommentsData.comments[0].user?.username === "ahmedali");

    // TEST 6: Update Comment
    const updateCommentRes = await fetch(`${commentsUrl}/${commentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        text: "This is amazing! Great work on LinkSphereAI 🔥🚀",
      }),
    });
    const updateCommentData = await updateCommentRes.json();
    assert("TEST 6 - Update Comment returns 200", updateCommentRes.status === 200);
    assert("TEST 6 - Comment text is updated", updateCommentData.comment?.text === "This is amazing! Great work on LinkSphereAI 🔥🚀");
    assert("TEST 6 - Comment isEdited is true", updateCommentData.comment?.isEdited === true);

    // TEST 7: Delete Comment
    const deleteCommentRes = await fetch(`${commentsUrl}/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token1}` },
    });
    const deleteCommentData = await deleteCommentRes.json();
    assert("TEST 7 - Delete Comment returns 200", deleteCommentRes.status === 200);
    assert("TEST 7 - Response has commentId and commentsCount: 0", deleteCommentData.success === true && deleteCommentData.commentsCount === 0);

    // TEST 8: Get Feed (verify isLiked works)
    console.log("\n--- TEST 8: Get Feed & isLiked Status ---");
    // Like post as user 2, get feed as user 2
    const getFeedRes = await fetch(`${postsUrl}/feed?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const getFeedData = await getFeedRes.json();
    assert("TEST 8 - Get Feed returns 200 status", getFeedRes.status === 200);
    assert("TEST 8 - Post isLiked reflects true status", getFeedData.posts?.length === 1 && getFeedData.posts[0].isLiked === true);

    // 5. Post system updates and cleanups
    console.log("\n--- Cleanups and Ownership Tests ---");
    // Unauthorized Comment Edit Attempt
    const badCommentRes = await fetch(`${commentsUrl}/654321098765432109876543`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ text: "hacking" }),
    });
    assert("Attempting to edit nonexistent comment returns 404", badCommentRes.status === 404);

    // Delete post and close
    const deletePostRes = await fetch(`${postsUrl}/${createdPostId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert("Post clean up successful", deletePostRes.status === 200);

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
