import express from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../middleware/auth.js";
import Project from "../models/project.js";
import Progress from "../models/progress.js";
import fs from "fs";

const router = express.Router();

router.use(requireAuth);

// Set up multer storage in backend/uploads/projects
// We'll resolve the destination dynamically if foldering is required.
const uploadsBase = path.join(process.cwd(), "backend", "uploads", "projects");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // For multi-file uploads, set req.uploadFolder beforehand
    const dest = req.uploadFolder ? path.join(uploadsBase, req.uploadFolder) : uploadsBase;
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]+/g, "-");
    const stamp = Date.now();
    cb(null, `${name}-${stamp}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExt = [".c", ".cpp", ".cc", ".cxx", ".cs", ".py"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error("Only C, C++, C#, or Python files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// List projects for current user
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    return res.json(projects);
  } catch (err) {
    console.error("GET /api/projects error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create new project (legacy JSON body with optional inline sourceCode)
router.post("/", async (req, res) => {
  try {
    const { name, description, sourceCode, language } = req.body || {};
    const n = String(name || "").trim();
    if (!n) return res.status(400).json({ message: "Project name is required" });
    const proj = await Project.create({ userId: req.user.id, name: n, description: description || "", sourceCode: sourceCode || "", language: language || "" });
    // Log recent activity
  const MAX_ACTIVITY = 6;
    await Progress.findOneAndUpdate(
      { email: req.user.email },
      { $push: { recentActivity: { $each: [{ text: `Created project: ${n}`, createdAt: new Date() }], $slice: -MAX_ACTIVITY } }, $setOnInsert: { email: req.user.email } },
      { upsert: true }
    );
    return res.status(201).json(proj);
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create new project with file upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { name, description = "", language = "" } = req.body || {};
    const n = String(name || "").trim();
    if (!n) return res.status(400).json({ message: "Project name is required" });
    if (!req.file) return res.status(400).json({ message: "File is required" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileMeta = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/projects/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      extension: ext.replace(/^\./, ""),
    };

    const proj = await Project.create({
      userId: req.user.id,
      name: n,
      description: description || "",
      language: language || "",
      sourceCode: "", // prefer file storage
      file: fileMeta,
    });

    // Log recent activity
    const MAX_ACTIVITY = 6;
    await Progress.findOneAndUpdate(
      { email: req.user.email },
      { $push: { recentActivity: { $each: [{ text: `Created project: ${n}`, createdAt: new Date() }], $slice: -MAX_ACTIVITY } }, $setOnInsert: { email: req.user.email } },
      { upsert: true }
    );

    return res.status(201).json(proj);
  } catch (err) {
    console.error("POST /api/projects/upload error:", err);
    return res.status(400).json({ message: err.message || "Upload failed" });
  }
});

// Create new project with multiple files (repository-like)
router.post("/upload-multi", async (req, res) => {
  try {
    // Generate a unique folder BEFORE parsing form data
    const folder = `repo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    req.uploadFolder = folder;
    const dest = path.join(uploadsBase, folder);
    fs.mkdirSync(dest, { recursive: true });

    // Run multer to parse files and fields
    const mw = upload.array("files", 50);
    mw(req, res, async (err) => {
      if (err) {
        console.error("/upload-multi multer error:", err);
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      try {
        const { name, description = "", language = "" } = req.body || {};
        const n = String(name || "").trim();
        if (!n) return res.status(400).json({ message: "Project name is required" });

        const files = (req.files || []).map((f) => {
          const ext = path.extname(f.originalname).toLowerCase();
          return {
            originalName: f.originalname,
            filename: f.filename,
            url: `/uploads/projects/${folder}/${f.filename}`,
            mimeType: f.mimetype,
            size: f.size,
            extension: ext.replace(/^\./, ""),
          };
        });
        if (!files.length) return res.status(400).json({ message: "At least one file is required" });

        const proj = await Project.create({
          userId: req.user.id,
          name: n,
          description: description || "",
          language: language || "",
          sourceCode: "",
          folder,
          files,
        });

        const MAX_ACTIVITY = 6;
        await Progress.findOneAndUpdate(
          { email: req.user.email },
          { $push: { recentActivity: { $each: [{ text: `Created project: ${n}`, createdAt: new Date() }], $slice: -MAX_ACTIVITY } }, $setOnInsert: { email: req.user.email } },
          { upsert: true }
        );
        return res.status(201).json(proj);
      } catch (e) {
        console.error("POST /api/projects/upload-multi error:", e);
        return res.status(500).json({ message: "Server error", error: e.message });
      }
    });
  } catch (e) {
    console.error("/upload-multi error:", e);
    return res.status(400).json({ message: e.message || "Upload failed" });
  }
});

// Get single project by id for current user
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const proj = await Project.findOne({ _id: id, userId: req.user.id });
    if (!proj) return res.status(404).json({ message: "Project not found" });
    return res.json(proj);
  } catch (err) {
    console.error("GET /api/projects/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update project (name/description/sourceCode/language)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    ["name", "description", "sourceCode", "language"].forEach((k) => {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) updates[k] = req.body[k];
    });
    if (updates.name) updates.name = String(updates.name).trim();
    const proj = await Project.findOneAndUpdate({ _id: id, userId: req.user.id }, { $set: updates }, { new: true });
    if (!proj) return res.status(404).json({ message: "Project not found" });
    return res.json(proj);
  } catch (err) {
    console.error("PUT /api/projects/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const proj = await Project.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!proj) return res.status(404).json({ message: "Project not found" });
    // Attempt to remove uploaded file if present
    try {
      const base = path.join(process.cwd(), "backend", "uploads", "projects");
      if (proj.folder) {
        const folderPath = path.join(base, proj.folder);
        if (fs.existsSync(folderPath)) fs.rmSync(folderPath, { recursive: true, force: true });
      } else if (proj.file?.filename) {
        const filePath = path.join(base, proj.file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn("Failed to remove project file:", e?.message);
    }
    // Log recent activity
  const MAX_ACTIVITY = 6;
    await Progress.findOneAndUpdate(
      { email: req.user.email },
      { $push: { recentActivity: { $each: [{ text: `Deleted project: ${proj.name}`, createdAt: new Date() }], $slice: -MAX_ACTIVITY } }, $setOnInsert: { email: req.user.email } },
      { upsert: true }
    );
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/projects/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
