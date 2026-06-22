const Session = require("../models/Session");
const { generateQuest, evaluateAns, summarizeSession } = require("../services/groq");

// POST /api/interview/start
const startSession = async (req, res) => {
  try {
    const { role, 
      difficulty = "Medium", 
      experienceLevel,
      interviewType = "Mixed",
      questionCount = 5,
      jobDescription = null 
    } = req.body;

    if (!role) return res.status(400).json({ message: "Role is required" });
    if (!experienceLevel) {
      return res.status(400).json({ message: "Experience level is required" });
    }
    const questions = await generateQuest(role, difficulty,experienceLevel, questionCount, jobDescription, interviewType);

    const session = await Session.create({
      userId: req.user._id,
      role,
      difficulty,
      experienceLevel,
      interviewType,
      questionCount,
      jobDescription: jobDescription || null,
      questions: questions.map((q) => ({ question: q })),
    });

    res.status(201).json({
      sessionId: session._id,
      questions: session.questions.map((q) => ({
        id: q._id,
        question: q.question,
      })),
    });
  } catch (err) {
    console.error("startSession error:", err.message);
    res.status(500).json({ message: "Failed to generate questions" });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, userAns, timeTaken = 0 } = req.body;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const qa = session.questions.id(questionId);
    if (!qa) return res.status(404).json({ message: "Question not found" });

    // Get AI evaluation
    const { score, aifeedback } = await evaluateAns(
      qa.question,
      userAns,
      session.role
    );
    await Session.findOneAndUpdate(
      { 
        _id: sessionId, 
        "questions._id": questionId 
      },
      {
        $set: {
          "questions.$.userAns": userAns,
          "questions.$.aifeedback": aifeedback,
          "questions.$.score": score,
          "questions.$.timeTaken": timeTaken,
        }
      },
      { new: true }
    );
    await session.save();

    res.json({ score, aifeedback });
  } catch (err) {
    console.error("submitAnswer error:", err.message);
    res.status(500).json({ message: "Failed to evaluate answer" });
  }
};
const completeSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });

    let improvements = [];
    try {
      const summary = await summarizeSession(session.questions);
      improvements = summary.improvements || [];
    } catch (aiErr) {
      console.error("summarizeSession failed:", aiErr.message);
    }

    session.improvements = improvements;
    session.completed = true;
    await session.save();

    res.json({
      totalScore: session.totalScore,
      maxScore: session.maxScore,
      percentage: Math.round((session.totalScore / session.maxScore) * 100),
      improvements: session.improvements,
    });
  } catch (err) {
    console.error("completeSession error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview/history
const getHistory = async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      completed: true,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("role difficulty experienceLevel interviewType questionCount totalScore maxScore createdAt improvements");

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview/:sessionId
const getSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  startSession,
  submitAnswer,
  completeSession,
  getHistory,
  getSession,
};
