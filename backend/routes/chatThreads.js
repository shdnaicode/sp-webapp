import express from "express";
import { requireAuth } from "../middleware/auth.js";
import ChatThread from "../models/chatThread.js";

const router = express.Router();
router.use(requireAuth);

// List user's threads (id, title, updatedAt)
router.get("/threads", async (req, res) => {
  try {
    const threads = await ChatThread.find({ user: req.user.id })
      .select("title updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ threads });
  } catch (err) {
    console.error("GET /api/chat/threads error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create a new thread
router.post("/threads", async (req, res) => {
  try {
    const { title } = req.body || {};
    const doc = await ChatThread.create({ user: req.user.id, title: title?.trim() || "New chat", messages: [] });
    return res.status(201).json({ thread: { id: doc._id, title: doc.title, updatedAt: doc.updatedAt } });
  } catch (err) {
    console.error("POST /api/chat/threads error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get a thread by id (messages)
router.get("/threads/:id", async (req, res) => {
  try {
    const doc = await ChatThread.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!doc) return res.status(404).json({ message: "Thread not found" });
    return res.json({ thread: { id: doc._id, title: doc.title, messages: doc.messages, updatedAt: doc.updatedAt } });
  } catch (err) {
    console.error("GET /api/chat/threads/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Replace messages (persist)
router.post("/threads/:id/messages", async (req, res) => {
  try {
    const { messages, title } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ message: "messages must be an array" });
    const sanitized = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000), at: m.at ? new Date(m.at) : new Date() }));
    const update = { messages: sanitized };
    if (typeof title === "string" && title.trim().length > 0) update.title = title.trim().slice(0, 120);
    const doc = await ChatThread.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Thread not found" });
    return res.json({ thread: { id: doc._id, title: doc.title, messages: doc.messages, updatedAt: doc.updatedAt } });
  } catch (err) {
    console.error("POST /api/chat/threads/:id/messages error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Rename a thread
router.put("/threads/:id", async (req, res) => {
  try {
    const { title } = req.body || {};
    if (typeof title !== "string" || title.trim().length === 0) return res.status(400).json({ message: "title is required" });
    const doc = await ChatThread.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { title: title.trim().slice(0, 120) } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Thread not found" });
    return res.json({ thread: { id: doc._id, title: doc.title, updatedAt: doc.updatedAt } });
  } catch (err) {
    console.error("PUT /api/chat/threads/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a thread
router.delete("/threads/:id", async (req, res) => {
  try {
    const doc = await ChatThread.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!doc) return res.status(404).json({ message: "Thread not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/chat/threads/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
