import express from "express";
import User from "../models/user.js";
const router = express.Router();

// Register logic
router.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "User already exists" });
  }
  users.push({ email, password });
  res.json({ message: "Registered successfully" });
});

// Login logic
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  res.json({ message: "Login successfully", user: { email } });
});

export default router;
