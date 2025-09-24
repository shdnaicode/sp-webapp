import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

const router = express.Router();

function buildBackendUrl(req) {
  const host = req.get("host");
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0];
  return `${proto}://${host}`;
}

function getFrontendBase() {
  return process.env.FRONTEND_URL || process.env.APP_ORIGIN || "http://localhost:5173";
}

// Step 1: Redirect to GitHub authorize URL
router.get("/github", async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return res.status(500).send("Missing GITHUB_CLIENT_ID");
    const backendBase = buildBackendUrl(req);
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${backendBase}/api/oauth/github/callback`;
    const scope = encodeURIComponent("read:user user:email");
    const state = encodeURIComponent(Buffer.from(JSON.stringify({ t: Date.now() })).toString("base64url"));
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
    return res.redirect(url);
  } catch (e) {
    console.error("/api/oauth/github error", e);
    return res.status(500).send("OAuth init failed");
  }
});

// Step 2: Callback to exchange code, create/find user, issue JWT, and redirect to frontend
router.get("/github/callback", async (req, res) => {
  const { code } = req.query || {};
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(500).send("Missing GitHub OAuth env");
    if (!code) return res.status(400).send("Missing code");

    const backendBase = buildBackendUrl(req);
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${backendBase}/api/oauth/github/callback`;

    // Exchange code for access token
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
    });
    const tokenJson = await tokenResp.json();
    const accessToken = tokenJson?.access_token;
    if (!accessToken) {
      console.error("GitHub access token error", tokenJson);
      return res.status(400).send("Failed to obtain GitHub token");
    }

    // Fetch user profile
    const ghUserResp = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "sp-webapp" },
    });
    const ghUser = await ghUserResp.json();
    // Fetch emails for primary/verified
    const ghEmailsResp = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "sp-webapp" },
    });
    const ghEmails = (await ghEmailsResp.json()) || [];
    const primaryEmail = Array.isArray(ghEmails) ? ghEmails.find((e) => e.primary && e.verified)?.email || ghEmails.find((e) => e.verified)?.email : null;

    const email = (primaryEmail || ghUser?.email || `${ghUser?.id}@users.noreply.github.com`).toLowerCase();
    const usernameBase = ghUser?.login || ghUser?.name || `user${ghUser?.id || ""}`;
    const username = String(usernameBase).slice(0, 20);
    const avatarUrl = ghUser?.avatar_url || "";

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const randomPass = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const hashed = await bcrypt.hash(randomPass, 10);
      user = new User({ username, email, password: hashed, profileImage: avatarUrl });
      await user.save();
    } else if (!user.profileImage && avatarUrl) {
      // Optionally update avatar on first OAuth
      user.profileImage = avatarUrl;
      await user.save();
    }

    // Issue app JWT
    const payload = { email: user.email, username: user.username, id: user._id, role: user.role };
    const appToken = jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });

    // Redirect to frontend success page with token and user info
    const frontend = getFrontendBase();
    const userB64 = Buffer.from(JSON.stringify({ email: user.email, username: user.username, id: user._id, role: user.role, profileImage: user.profileImage || "" })).toString("base64url");
    const dest = `${frontend}/oauth/success?token=${encodeURIComponent(appToken)}&user=${encodeURIComponent(userB64)}`;
    return res.redirect(dest);
  } catch (e) {
    console.error("/api/oauth/github/callback error", e);
    return res.status(500).send("OAuth callback failed");
  }
});

export default router;
