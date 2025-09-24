import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "../middleware/auth.js";
import Course from "../models/course.js";

const router = express.Router();

router.use(requireAuth);

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment");
  }
  return new GoogleGenerativeAI(apiKey);
}

function truncate(str = "", max = 240) {
  const s = String(str);
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)) + "…";
}

// --- Safe extraction helpers for Gemini responses ---
function hadBadFinishReason(candidate) {
  const bad = new Set([
    "SAFETY",
    "RECITATION",
    "PROHIBITED_CONTENT",
    "OTHER",
    "MALFORMED_FUNCTION_CALL",
    "BLOCKLIST",
  ]);
  return !!candidate && bad.has(candidate.finishReason);
}

function getTextFromResponse(response) {
  try {
    if (typeof response?.text === "function") return response.text();
  } catch {}
  try {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    return parts.map((p) => p?.text || "").join("");
  } catch {}
  return "";
}

function formatBlockErrorMessage(response) {
  const reason = response?.promptFeedback?.blockReason || response?.candidates?.[0]?.finishReason;
  const safety = response?.promptFeedback?.safetyRatings || [];
  const details = Array.isArray(safety)
    ? safety
        .map((r) => `${r.category || ""}:${r.probability || ""}`)
        .filter(Boolean)
        .join(", ")
    : "";
  return `Blocked by model (${reason || "unknown"})${details ? ": " + details : ""}`;
}

function extractTextOrThrow(response) {
  if (response?.candidates && response.candidates.length > 0) {
    if (response.candidates.length > 1) {
      console.warn(
        `This response had ${response.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`
      );
    }
    if (hadBadFinishReason(response.candidates[0])) {
      throw new Error(`Text not available. ${formatBlockErrorMessage(response)}`);
    }
    return getTextFromResponse(response);
  }
  if (response?.promptFeedback) {
    throw new Error(`Text not available. ${formatBlockErrorMessage(response)}`);
  }
  return "";
}

async function buildCourseContext(courseSlugs) {
  const query = { published: true };
  if (Array.isArray(courseSlugs) && courseSlugs.length > 0) {
    query.slug = { $in: courseSlugs.map((s) => String(s).toLowerCase()) };
  }
  const courses = await Course.find(query).sort({ createdAt: -1 }).limit(10).lean();
  if (!courses || courses.length === 0) return "";
  const lines = ["Course catalog:"];
  for (const c of courses) {
    const modules = Array.isArray(c.modules) ? [...c.modules].sort((a,b)=>(a.order||0)-(b.order||0)) : [];
    const topMods = modules.slice(0, 8);
    const modList = topMods.map((m) => `${m.title} (${m.key})`).join(", ");
    lines.push(
      `- ${c.title} [${c.slug}]: ${truncate(c.description || "", 220)} Modules: ${modules.length}. ${modList ? `Top: ${truncate(modList, 300)}` : ""}`.trim()
    );
  }
  // Cap overall size to keep within token budget
  const joined = lines.join("\n");
  return truncate(joined, 4000);
}

// Helper to assemble systemInstruction with optional contexts
async function composeSystemInstruction(reqBody, forRoute = "chat") {
  const { includeCourseContext, courseSlugs, extraContext } = reqBody || {};
  let systemInstruction =
    (reqBody && (reqBody.systemInstruction || reqBody.system || reqBody.systemPrompt)) ||
    process.env.GEMINI_SYSTEM_PROMPT;
  if (includeCourseContext) {
    try {
      const cx = await buildCourseContext(courseSlugs);
      if (cx) {
        systemInstruction = `${systemInstruction ? systemInstruction + "\n\n" : ""}Platform course reference:\n${cx}`;
      }
    } catch (e) {
      console.warn(`Failed to build course context for ${forRoute}:`, e?.message || e);
    }
  }
  if (extraContext) {
    const items = Array.isArray(extraContext) ? extraContext : [extraContext];
    const cleaned = items
      .map((x) => String(x || "").trim())
      .filter((x) => x.length > 0)
      .slice(0, 4)
      .map((x) => truncate(x, 1600));
    if (cleaned.length) {
      systemInstruction = `${systemInstruction ? systemInstruction + "\n\n" : ""}User-provided external references (summaries, prioritize accuracy over speculation):\n- ${cleaned.join("\n- ")}`;
    }
  }
  return systemInstruction;
}

// Streaming chat via Server-Sent Events
router.post("/chat/stream", async (req, res) => {
  try {
    const { messages, prompt, model } = req.body || {};
    const modelName = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const genAI = getGenAI();
    const systemInstruction = await composeSystemInstruction(req.body, "chat/stream");
    const gemModel = genAI.getGenerativeModel({ model: modelName, systemInstruction });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    function sendEvent(type, data) {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    const sendTextStream = async (textStreamPromise) => {
      const stream = await textStreamPromise;
      // The SDK exposes a stream with async iterable chunks
      let full = "";
      for await (const chunk of stream.stream || []) {
        let piece = "";
        if (typeof chunk?.text === "function") {
          try { piece = chunk.text() || ""; } catch {}
        } else if (typeof chunk?.text === "string") {
          piece = chunk.text;
        }
        if (!piece) {
          piece = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        if (piece) {
          full += piece;
          sendEvent("token", { text: piece });
        }
      }
      // Await the final aggregated response and reconcile
      try {
        const finalResp = await stream.response;
        if ((finalResp?.candidates?.[0] && hadBadFinishReason(finalResp.candidates[0])) || finalResp?.promptFeedback) {
          const msg = formatBlockErrorMessage(finalResp);
          sendEvent("error", { message: msg });
          return res.end();
        }
        const finalText = getTextFromResponse(finalResp);
        if (finalText && finalText !== full) {
          const delta = finalText.slice(full.length);
          if (delta) sendEvent("token", { text: delta });
          full = finalText;
        }
      } catch (e) {
        console.warn("Failed to read final stream.response:", e?.message || e);
      }
      sendEvent("done", { text: full });
      res.end();
    };

    if (Array.isArray(messages) && messages.length > 0) {
      const history = messages
        .slice(0, -1)
        .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.content) }] }));
      const last = messages[messages.length - 1];
      const userMsg = String(last?.content || "").trim();
      if (history.length === 0 || history[0]?.role === "model") {
        await sendTextStream(gemModel.generateContentStream(userMsg));
        return;
      }
      const chat = await gemModel.startChat({ history });
      await sendTextStream(chat.sendMessageStream(userMsg));
      return;
    }

    const textPrompt = String(prompt || "");
    if (!textPrompt) return res.status(400).json({ message: "Missing prompt" });
    await sendTextStream(gemModel.generateContentStream(textPrompt));
  } catch (err) {
    console.error("/api/gemini/chat/stream error:", err?.stack || err);
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: err?.message || "Gemini stream failed" })}\n\n`);
    } catch {}
    res.end();
  }
});

// Fetch external URL and summarize for safe context injection
router.post("/context/from-url", async (req, res) => {
  try {
    const { url, maxChars = 12000, model } = req.body || {};
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ message: "A valid http(s) URL is required" });
    }
    // Fetch content
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 15000);
    let resp;
    try {
      resp = await fetch(url, { redirect: "follow", headers: { "User-Agent": "sp-webapp-bot/1.0" }, signal: ac.signal });
    } finally {
      clearTimeout(to);
    }
    if (!resp.ok) {
      return res.status(400).json({ message: `Failed to fetch URL (status ${resp.status})` });
    }
    const contentType = resp.headers.get("content-type") || "";
    if (!/text\//.test(contentType) && !/json/.test(contentType)) {
      return res.status(400).json({ message: "URL does not appear to be textual content" });
    }
    const raw = await resp.text();
    // Very light cleanup: strip tags if HTML
    const text = raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const clipped = text.slice(0, Math.min(200000, Math.max(1000, Number(maxChars) || 12000)));

    const genAI = getGenAI();
    const modelName = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const systemInstruction = await composeSystemInstruction(
      {
        system: process.env.GEMINI_SYSTEM_PROMPT,
      },
      "context/from-url"
    );
    const gemModel = genAI.getGenerativeModel({ model: modelName, systemInstruction });
    const prompt = `You are given content fetched from a user-provided URL. Summarize the key points concisely in plain English, avoiding special formatting. Include the source domain in parentheses at the end. Keep to 6-10 short bullet-like lines (no dashes, just sentences). Text to summarize: \n\n${clipped}`;
    const result = await gemModel.generateContent(prompt);
    const summary = extractTextOrThrow(result?.response);
    return res.json({ summary, url });
  } catch (err) {
    console.error("/api/gemini/context/from-url error:", err?.stack || err);
    return res.status(500).json({ message: "Failed to fetch/summarize URL", error: err?.message });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { messages, prompt, model, includeCourseContext, courseSlugs, extraContext } = req.body || {};
    // Support system prompt via request or environment
    let systemInstruction =
      (req.body && (req.body.systemInstruction || req.body.system || req.body.systemPrompt)) ||
      process.env.GEMINI_SYSTEM_PROMPT;
    if (includeCourseContext) {
      try {
        const cx = await buildCourseContext(courseSlugs);
        if (cx) {
          systemInstruction = `${systemInstruction ? systemInstruction + "\n\n" : ""}Platform course reference:\n${cx}`;
        }
      } catch (e) {
        console.warn("Failed to build course context for chat:", e?.message || e);
      }
    }
    // Append any user-provided extra context (e.g., URL summaries)
    if (extraContext) {
      const items = Array.isArray(extraContext) ? extraContext : [extraContext];
      const cleaned = items
        .map((x) => String(x || "").trim())
        .filter((x) => x.length > 0)
        .slice(0, 4)
        .map((x) => truncate(x, 1600));
      if (cleaned.length) {
        systemInstruction = `${systemInstruction ? systemInstruction + "\n\n" : ""}User-provided external references (summaries, prioritize accuracy over speculation):\n- ${cleaned.join("\n- ")}`;
      }
    }
    const genAI = getGenAI();
    const modelName = model || process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (Array.isArray(messages) && messages.length > 0) {
      const history = messages.slice(0, -1)
        .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.content) }],
        }));
      const last = messages[messages.length - 1];
      const userMsg = String(last?.content || "").trim();
      const gemModel = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      if (history.length === 0 || history[0]?.role === "model") {
        const result = await gemModel.generateContent(userMsg);
        const text = extractTextOrThrow(result?.response);
        return res.json({ text });
      }
      try {
        const chat = await gemModel.startChat({ history });
        const result = await chat.sendMessage(userMsg);
        const text = extractTextOrThrow(result?.response);
        return res.json({ text });
      } catch (innerErr) {
        console.error("Gemini chat/sendMessage failed; falling back to generateContent", innerErr);
        const result = await gemModel.generateContent(userMsg);
        const text = extractTextOrThrow(result?.response);
        return res.json({ text });
      }
    }

    const textPrompt = String(prompt || "");
    if (!textPrompt) return res.status(400).json({ message: "Missing prompt" });
    const gemModel = genAI.getGenerativeModel({ model: modelName, systemInstruction });
    const result = await gemModel.generateContent(textPrompt);
    const text = extractTextOrThrow(result?.response);
    return res.json({ text });
  } catch (err) {
    console.error("/api/gemini/chat error:", err?.stack || err);
    const message = err?.message || "Gemini request failed";
    return res.status(500).json({ message });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { prompt, model = "gemini-1.5-flash", includeCourseContext, courseSlugs, extraContext } = req.body || {};
    let systemInstruction =
      (req.body && (req.body.systemInstruction || req.body.system || req.body.systemPrompt)) ||
      process.env.GEMINI_SYSTEM_PROMPT;
    if (includeCourseContext) {
      try {
        const cx = await buildCourseContext(courseSlugs);
        if (cx) {
          systemInstruction = `${systemInstruction ? systemInstruction + "\n\n" : ""}Platform course reference:\n${cx}`;
        }
      } catch (e) {
        console.warn("Failed to build course context for generate:", e?.message || e);
      }
    }
    if (extraContext) {
      const items = Array.isArray(extraContext) ? extraContext : [extraContext];
      const cleaned = items
        .map((x) => String(x || "").trim())
        .filter((x) => x.length > 0)
        .slice(0, 4)
        .map((x) => truncate(x, 1600));
      if (cleaned.length) {
        systemInstruction = `${systemInstruction ? systemInstruction + "\n\n" : ""}User-provided external references (summaries):\n- ${cleaned.join("\n- ")}`;
      }
    }
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "'prompt' is required" });
    }
    const genAI = getGenAI();
    const modelClient = genAI.getGenerativeModel({ model, systemInstruction });
  const result = await modelClient.generateContent(prompt);
  const text = extractTextOrThrow(result?.response);
    return res.json({ text });
  } catch (err) {
    console.error("/api/gemini/generate error", err);
    return res.status(500).json({ message: "Gemini request failed", error: err.message });
  }
});

export default router;
