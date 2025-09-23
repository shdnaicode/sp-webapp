import express from "express";
import Course from "../models/course.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public: list published courses
router.get("/", async (req, res) => {
  try {
    const items = await Course.find({ published: true }).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error("GET /api/courses error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: list all (including unpublished)
router.get("/all", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const items = await Course.find({}).sort({ createdAt: -1 });
    return res.json(items);
  } catch (err) {
    console.error("GET /api/courses/all error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public: get one by slug
router.get("/:slug", async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course || (course.published !== true && req.query.preview !== "true")) {
      return res.status(404).json({ message: "Course not found" });
    }
    // Sort modules by order
    const c = course.toObject();
    c.modules = [...(c.modules || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    return res.json(c);
  } catch (err) {
    console.error("GET /api/courses/:slug error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
  });
}

// Admin: create
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, slug, description = "", image = "", modules = [], published = true } = req.body || {};
    if (!title || !slug) return res.status(400).json({ message: "title and slug are required" });
    const exists = await Course.findOne({ slug: String(slug).trim().toLowerCase() });
    if (exists) return res.status(400).json({ message: "Slug already exists" });
    const doc = await Course.create({ title: title.trim(), slug: String(slug).trim().toLowerCase(), description, image, modules, published });
    return res.status(201).json(doc);
  } catch (err) {
    console.error("POST /api/courses error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: update
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updates = req.body || {};
    const doc = await Course.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ message: "Course not found" });
    return res.json(doc);
  } catch (err) {
    console.error("PUT /api/courses/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: delete
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const doc = await Course.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Course not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/courses/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
