import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import imageSize from "image-size";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/user.js";


const router = express.Router();

// Update profile: username, email, profileImage
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { username, email, profileImage } = req.body || {};
    const updates = {};
    if (typeof username === "string") {
      const u = username.trim();
      if (!u) return res.status(400).json({ message: "Username cannot be empty" });
      if (u.length > 50) return res.status(400).json({ message: "Username too long" });
      updates.username = u;
    }
    if (typeof email === "string") {
      const e = email.trim().toLowerCase();
      if (!e) return res.status(400).json({ message: "Email cannot be empty" });
      // Optional: basic format check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ message: "Invalid email" });
      // Ensure not taken by someone else
      const existing = await User.findOne({ email: e, _id: { $ne: req.user.id } });
      if (existing) return res.status(400).json({ message: "Email already in use" });
      updates.email = e;
    }
    if (typeof profileImage === "string") {
      updates.profileImage = profileImage.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Issue a new token if username/email changed
  const payload = { id: user._id, email: user.email, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });

    return res.json({
      message: "Profile updated",
      token,
  user: { email: user.email, username: user.username, profileImage: user.profileImage, id: user._id, role: user.role },
    });
  } catch (err) {
    console.error("PUT /api/user/profile error", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update password
router.put("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both currentPassword and newPassword are required" });
    }
    if (newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({ message: "New password must be 6-100 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("PUT /api/user/password error", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Upload profile image
const uploadDir = path.join(process.cwd(), "backend", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `avatar_${req.user?.id || "anon"}_${Date.now()}`;
    cb(null, base + ext);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Unsupported file type"));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
// Wrap multer to catch errors and return JSON instead of default HTML 500
const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 400 : 400;
      return res.status(status).json({ message: err.message || "Upload error" });
    }
    next();
  });
};

router.post("/profile-image", requireAuth, uploadSingleImage, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const filePath = req.file.path;
    let dim;
    try {
      dim = imageSize(filePath);
    } catch (e) {
      // Not a valid image; cleanup and report
      fs.unlink(filePath, () => {});
      return res.status(400).json({ message: "Invalid image file" });
    }
    const minW = Number(process.env.MIN_AVATAR_WIDTH || 128);
    const minH = Number(process.env.MIN_AVATAR_HEIGHT || 128);
    if (!dim?.width || !dim?.height || dim.width < minW || dim.height < minH) {
      fs.unlink(filePath, () => {});
      return res.status(400).json({ message: `Image too small. Minimum ${minW}x${minH}px` });
    }
    const publicUrl = `/uploads/${path.basename(filePath)}`;
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { profileImage: publicUrl } }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    const payload = { id: user._id, email: user.email, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
    return res.json({
      message: "Profile image updated",
      token,
      user: { email: user.email, username: user.username, profileImage: user.profileImage, id: user._id },
    });
  } catch (err) {
    console.error("POST /api/user/profile-image error", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
