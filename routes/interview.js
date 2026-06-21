const express = require('express');
const router = express.Router();
const {verifyJWT} = require("../middleware/verifyJWT")

const {startSession, submitAnswer, completeSession, getHistory, getSession} = require("../controllers/interviewcontroller");
// console.log("Controller import result:", {
//   startSession: typeof startSession,
//   submitAnswer: typeof submitAnswer,
//   completeSession: typeof completeSession,
//   getHistory: typeof getHistory,
//   getSession: typeof getSession
// });

router.post("/start", verifyJWT, startSession);
router.post("/:sessionId/answer", verifyJWT, submitAnswer);
router.patch("/:sessionId/complete", verifyJWT, completeSession);
router.get("/history", verifyJWT, getHistory);
router.get("/:sessionId", verifyJWT, getSession);

module.exports = router ;

