import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Comment from "../models/comment.js";

const router = express.Router();

// List comments for a module
router.get("/", async (req, res) => {
  try {
    const { course, moduleKey, limit = 100 } = req.query || {};
    if (!course || !moduleKey) return res.status(400).json({ message: "course and moduleKey are required" });
    const lim = Math.min(200, Math.max(1, Number(limit) || 100));
    const items = await Comment.find({ course: String(course).toLowerCase(), moduleKey: String(moduleKey) })
      .sort({ createdAt: -1 })
      .limit(lim)
      .populate("user", "username profileImage role")
      .lean();
    return res.json({ comments: items });
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Create a comment
router.post("/", requireAuth, async (req, res) => {
  try {
    const { course, moduleKey, content } = req.body || {};
    if (!course || !moduleKey) return res.status(400).json({ message: "course and moduleKey are required" });
    const text = String(content || "").trim();
    if (!text) return res.status(400).json({ message: "content is required" });
    if (text.length > 2000) return res.status(400).json({ message: "content too long" });
    const doc = await Comment.create({ user: req.user.id, course: String(course).toLowerCase(), moduleKey: String(moduleKey), content: text });
    const populated = await Comment.findById(doc._id).populate("user", "username profileImage role").lean();
    return res.status(201).json({ comment: populated });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a comment (owner or admin)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const com = await Comment.findById(req.params.id);
    if (!com) return res.status(404).json({ message: "Not found" });
    const isOwner = String(com.user) === String(req.user.id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    await Comment.deleteOne({ _id: com._id });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/comments/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
