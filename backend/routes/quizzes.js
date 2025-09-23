import express from "express";
import Quiz from "../models/quiz.js";
import { requireAuth } from "../middleware/auth.js";
import Progress from "../models/progress.js";

const router = express.Router();

// Public: list quizzes for a course (and optionally moduleKey)
router.get("/", async (req, res) => {
  try {
    const { course, moduleKey } = req.query || {};
    const q = {};
    if (course) q.course = String(course);
    if (moduleKey) q.moduleKey = String(moduleKey);
    const items = await Quiz.find(q).sort({ createdAt: 1 });
    return res.json(items);
  } catch (err) {
    console.error("GET /api/quizzes error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin-only middleware
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
  });
}

// Admin: create quiz
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { course, moduleKey, question, options = [], explanation = "" } = req.body || {};
    if (!course || !moduleKey || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Invalid quiz data" });
    }
    const hasCorrect = options.some((o) => !!o.correct);
    if (!hasCorrect) return res.status(400).json({ message: "At least one correct option required" });
    const quiz = await Quiz.create({ course, moduleKey, question, options, explanation });
    return res.status(201).json(quiz);
  } catch (err) {
    console.error("POST /api/quizzes error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: update quiz
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    return res.json(quiz);
  } catch (err) {
    console.error("PUT /api/quizzes/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: delete quiz
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/quizzes/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Student: submit answers for a module's quizzes
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const { course, moduleKey, answers } = req.body || {};
    if (!course || !moduleKey || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    const quizzes = await Quiz.find({ course, moduleKey }).sort({ createdAt: 1 });
    if (!quizzes.length) return res.status(400).json({ message: "No quizzes for this module" });

    let correctCount = 0;
    quizzes.forEach((q, i) => {
      const a = answers[i];
      const ok = q.options.some((opt, idx) => opt.correct && idx === a);
      if (ok) correctCount += 1;
    });
    const score = Math.round((correctCount / quizzes.length) * 100);

    // Update course progress: mark module as completed if 70%+
    const email = req.user?.email;
    const MAX_ACTIVITY = 6;
    const pushActivity = { text: `Completed quiz for ${course}/${moduleKey} (${score}%)`, createdAt: new Date() };
    const setObj = {};
    setObj[`courseProgress.${course}.completed`] = moduleKey; // use $addToSet below

    const update = {
      $addToSet: { [`courseProgress.${course}.completed`]: moduleKey },
      $push: { recentActivity: { $each: [pushActivity], $slice: -MAX_ACTIVITY } },
      $setOnInsert: { email },
    };
    const doc = await Progress.findOneAndUpdate({ email }, update, { new: true, upsert: true });

    return res.json({ score, correct: correctCount, total: quizzes.length, progress: doc });
  } catch (err) {
    console.error("POST /api/quizzes/submit error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
