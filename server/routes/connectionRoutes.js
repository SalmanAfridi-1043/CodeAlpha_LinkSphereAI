const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  findPeople,
  getPendingRequests,
  getMyConnections,
  sendRequest,
  respondToRequest,
} = require("../controllers/connectionController");

const router = express.Router();

router.get("/find", protect, findPeople);
router.get("/pending", protect, getPendingRequests);
router.get("/", protect, getMyConnections);
router.post("/request/:userId", protect, sendRequest);
router.put("/respond/:connectionId", protect, respondToRequest);

module.exports = router;
