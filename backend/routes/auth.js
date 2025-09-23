import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
const router = express.Router();

// Register logic
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body || {};
  try {
    // basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (username.length > 20) {
      return res
        .status(400)
        .json({ message: "Username must be 20 characters or less" });
    }
    if (password.length < 6 || password.length > 100) {
      return res
        .status(400)
        .json({ message: "Password must be 6-100 characters" });
    }
  const normalizedEmail = String(email).trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login logic
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const payload = { email: user.email, username: user.username, id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
    res.json({
      message: "Login successfully",
      token,
      user: { email: user.email, username: user.username, id: user._id, role: user.role, profileImage: user.profileImage },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    // Fetch to ensure we include latest profileImage
    const dbUser = await User.findById(decoded.id).lean();
    if (!dbUser) return res.status(404).json({ message: "User not found" });
    return res.json({ user: { email: dbUser.email, username: dbUser.username, id: dbUser._id, role: dbUser.role, profileImage: dbUser.profileImage } });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

export default router;

router.use((req, res, next) => next());
