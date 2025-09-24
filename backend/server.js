import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import oauthRoute from "./routes/oauth.js";
import progressRoute from "./routes/progress.js";
import geminiRoute from "./routes/gemini.js";
import userRoute from "./routes/user.js";
import projectsRoute from "./routes/projects.js";
import quizzesRoute from "./routes/quizzes.js";
import coursesRoute from "./routes/courses.js";
import chatRoute from "./routes/chat.js";
import chatThreadsRoute from "./routes/chatThreads.js";
import commentsRoute from "./routes/comments.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5050;
const HOST = process.env.HOST || "0.0.0.0";
const MongoURL = process.env.MONGO_URI;

if (!MongoURL) {
  console.error("MongoDB URI is missing.");
  process.exit(1);
}

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Rate limiting: apply to all /api routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api", apiLimiter);

// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "uploads");
const projectUploads = path.join(uploadsRoot, "projects");
try {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
  if (!fs.existsSync(projectUploads)) fs.mkdirSync(projectUploads);
} catch (e) {
  console.error("Failed to create uploads directory:", e);
}
app.use("/uploads", express.static(uploadsRoot));

app.use("/api/progress", progressRoute);
app.use("/api", authRoute);
app.use("/api/gemini", geminiRoute);
app.use("/api/user", userRoute);
app.use("/api/projects", projectsRoute);
app.use("/api/quizzes", quizzesRoute);
app.use("/api/courses", coursesRoute);
app.use("/api/chat", chatRoute);
app.use("/api/chat", chatThreadsRoute);
app.use("/api/comments", commentsRoute);
app.use("/api/oauth", oauthRoute);

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

mongoose.connect(MongoURL)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, HOST, () => {
      const where = HOST === "0.0.0.0" ? `port ${PORT}` : `${HOST}:${PORT}`;
      console.log(`Server listening on ${where}`);
    });
  })
  .catch(err => console.log("MongoDB connection error:", err));
