require("dotenv").config();

const { MongoMemoryServer } = require("mongodb-memory-server");
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const authRoutes = require("../routes/authRoutes");
const { errorHandler } = require("../middleware/errorMiddleware");

const runTests = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = "linksphereai_super_secret_jwt_key_2024";
  process.env.JWT_EXPIRE = "30d";

  await connectDB();

  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(errorHandler);

  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  let passed = 0;
  let failed = 0;
  let token = "";

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
    const registerRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ahmed Ali",
        username: "ahmedali",
        email: "ahmed@test.com",
        password: "123456",
      }),
    });
    const registerData = await registerRes.json();
    assert("TEST 1 — Register returns 201", registerRes.status === 201);
    assert("TEST 1 — Register returns token", Boolean(registerData.token));
    assert("TEST 1 — Register returns user", Boolean(registerData.user));
    token = registerData.token;

    const userWithPassword = await mongoose.connection.db
      .collection("users")
      .findOne({ email: "ahmed@test.com" });
    assert(
      "Password is hashed in MongoDB",
      userWithPassword?.password?.startsWith("$2")
    );

    const loginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ahmed@test.com",
        password: "123456",
      }),
    });
    const loginData = await loginRes.json();
    assert("TEST 2 — Login returns 200", loginRes.status === 200);
    assert("TEST 2 — Login returns token", Boolean(loginData.token));
    token = loginData.token;

    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    assert("TEST 3 — Get Me returns 200", meRes.status === 200);
    assert("TEST 3 — Get Me returns user", Boolean(meData.user));

    const dupRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        username: "testuser2",
        email: "ahmed@test.com",
        password: "123456",
      }),
    });
    const dupData = await dupRes.json();
    assert("TEST 4 — Duplicate email returns 400", dupRes.status === 400);
    assert(
      "TEST 4 — Duplicate email message",
      dupData.message === "Email already registered"
    );

    const wrongPassRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ahmed@test.com",
        password: "wrongpassword",
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    assert("TEST 5 — Wrong password returns 401", wrongPassRes.status === 401);
    assert(
      "TEST 5 — Wrong password message",
      wrongPassData.message === "Invalid email or password"
    );

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
