import express from "express";
import Progress from "../models/progress.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use((req, res, next) => {
  if (req.path === "/ping") return next();
  return requireAuth(req, res, next);
});

router.get("/ping", (req, res) => {
  return res.json({ ok: true });
});

router.get("/", async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: "Unauthorized" });
    const doc = await Progress.findOneAndUpdate(
      { email },
      { $setOnInsert: { email } },
      { new: true, upsert: true }
    );
    return res.json(doc);
  } catch (err) {
    console.error("GET /api/progress error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: "Unauthorized" });
    const update = req.body || {};
    const doc = await Progress.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true, upsert: true }
    );
    return res.json(doc);
  } catch (err) {
    console.error("POST /api/progress error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Enroll in a course: body { course: <slug> }
router.post("/enroll", async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: "Unauthorized" });
    const { course } = req.body || {};
    if (!course || typeof course !== "string") {
      return res.status(400).json({ message: "Invalid course" });
    }
  const MAX_ACTIVITY = 6;
    const doc = await Progress.findOneAndUpdate(
      { email },
      {
        $addToSet: { currentCourses: course },
        $push: { recentActivity: { $each: [{ text: `Enrolled in ${course}`, createdAt: new Date() }], $slice: -MAX_ACTIVITY } },
        $setOnInsert: { email },
      },
      { new: true, upsert: true }
    );
    return res.json(doc);
  } catch (err) {
    console.error("POST /api/progress/enroll error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Unenroll from a course: body { course: <slug> }
router.post("/unenroll", async (req, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.status(401).json({ message: "Unauthorized" });
    const { course } = req.body || {};
    if (!course || typeof course !== "string") {
      return res.status(400).json({ message: "Invalid course" });
    }
  const MAX_ACTIVITY = 6;
    const doc = await Progress.findOneAndUpdate(
      { email },
      {
        $pull: { currentCourses: course },
        $push: { recentActivity: { $each: [{ text: `Unenrolled from ${course}`, createdAt: new Date() }], $slice: -MAX_ACTIVITY } },
        $setOnInsert: { email },
      },
      { new: true, upsert: true }
    );
    return res.json(doc);
  } catch (err) {
    console.error("POST /api/progress/unenroll error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
