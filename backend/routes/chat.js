import express from "express";
import Chat from "../models/chat.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// Get current user's chat history
router.get("/history", async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id }).lean();
    return res.json({ messages: chat?.messages || [] });
  } catch (err) {
    console.error("GET /api/chat/history error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Replace current user's chat history (persist)
router.post("/history", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ message: "messages must be an array" });
    const sanitized = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000), at: m.at ? new Date(m.at) : new Date() }));
    const doc = await Chat.findOneAndUpdate(
      { user: req.user.id },
      { $set: { messages: sanitized } },
      { new: true, upsert: true }
    );
    return res.json({ messages: doc.messages });
  } catch (err) {
    console.error("POST /api/chat/history error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Clear current chat
router.delete("/history", async (req, res) => {
  try {
    const doc = await Chat.findOneAndUpdate(
      { user: req.user.id },
      { $set: { messages: [] } },
      { new: true, upsert: true }
    );
    return res.json({ messages: doc.messages });
  } catch (err) {
    console.error("DELETE /api/chat/history error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
