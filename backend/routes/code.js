import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { runCode } from "../lib/runner.js";

const router = express.Router();

// Stubbed code runner: does NOT execute untrusted code.
// Accepts { language, code, input } and returns a mocked response.
router.post("/run", requireAuth, async (req, res) => {
  try {
    const { language = "python", code = "", input = "" } = req.body || {};
    const lang = String(language).toLowerCase();
    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Missing code" });
    }
    const allowExec = String(process.env.ALLOW_CODE_EXEC || "").toLowerCase() === "true";
    const summary = {
      language: lang,
      codeLines: code.split(/\r?\n/).length,
      inputBytes: Buffer.byteLength(String(input || ""), "utf8"),
    };

    if (!allowExec) {
      const echo = String(input || "");
      let checksum = 0;
      for (let i = 0; i < code.length; i++) checksum = (checksum + code.charCodeAt(i)) % 1000;
      const output = [
        `Mock run for ${lang} (stub)`,
        `Echo: ${echo}`,
        `Lines of code: ${summary.codeLines}`,
        `Checksum: ${checksum}`,
      ].join("\n");
      return res.json({ output, timeMs: 1, passed: null, notes: "Execution disabled (set ALLOW_CODE_EXEC=true to enable)", summary });
    }

    // Real execution (limited to JS/Python)
    const mapped = lang === "js" ? "javascript" : lang === "py" ? "python" : lang;
    if (!new Set(["javascript", "python"]).has(mapped)) {
      return res.status(400).json({ message: `Unsupported language for execution: ${lang}` });
    }
    const result = await runCode({ language: mapped, code, input });
    const output = result.stdout;
    const errorOut = result.stderr;
    return res.json({
      output,
      error: errorOut,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      timeMs: result.durationMs,
      summary,
    });
  } catch (err) {
    console.error("POST /api/code/run error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
