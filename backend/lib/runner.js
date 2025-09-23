import { promises as fsp } from "fs";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

function randomId(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function rimraf(dir) {
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (_) {}
}

export async function runCode({ language, code, input = "", timeoutMs = 3000, maxOutputBytes = 64 * 1024 }) {
  const lang = String(language || "").toLowerCase();
  if (!code || typeof code !== "string") throw new Error("Missing code");
  const supported = new Set(["javascript", "js", "python", "py"]);
  if (!supported.has(lang)) {
    return {
      stdout: "",
      stderr: `Unsupported language: ${lang}`,
      exitCode: null,
      timedOut: false,
      durationMs: 0,
    };
  }

  const root = path.join(process.cwd(), "backend", "tmp");
  const work = path.join(root, `${Date.now()}-${randomId(6)}`);
  await ensureDir(work);
  const started = Date.now();

  let proc;
  try {
    let cmd, args, filename;
    if (lang === "javascript" || lang === "js") {
      filename = path.join(work, "main.js");
      await fsp.writeFile(filename, code, "utf8");
      cmd = process.execPath; // node
      args = [filename];
    } else if (lang === "python" || lang === "py") {
      filename = path.join(work, "main.py");
      await fsp.writeFile(filename, code, "utf8");
      cmd = "python3"; // assume python3 exists
      args = [filename];
    }

  let stdout = Buffer.alloc(0);
  let stderr = Buffer.alloc(0);
  let exited = false;
  let spawnErr = null;

  proc = spawn(cmd, args, { cwd: work });
    // write input
    if (input) {
      try { proc.stdin.write(String(input)); } catch (_) {}
    }
    try { proc.stdin.end(); } catch (_) {}

    proc.stdout.on("data", (chunk) => {
      const next = Buffer.concat([stdout, chunk]);
      // cap size
      if (next.length <= maxOutputBytes) stdout = next; else stdout = next.subarray(0, maxOutputBytes);
    });
    proc.stderr.on("data", (chunk) => {
      const next = Buffer.concat([stderr, chunk]);
      if (next.length <= maxOutputBytes) stderr = next; else stderr = next.subarray(0, maxOutputBytes);
    });

    const timeout = setTimeout(() => {
      if (proc && !exited) {
        try { proc.kill("SIGKILL"); } catch (_) {}
      }
    }, timeoutMs);

    const exitCode = await new Promise((resolve) => {
      proc.on("close", (code) => { exited = true; clearTimeout(timeout); resolve(code); });
      proc.on("error", (err) => { spawnErr = err; exited = true; clearTimeout(timeout); resolve(null); });
    });

    const durationMs = Date.now() - started;
    const timedOut = durationMs >= timeoutMs && exitCode === null;

    const outStr = stdout.toString("utf8");
    let errStr = stderr.toString("utf8");
    if (!errStr && spawnErr) errStr = String(spawnErr.message || spawnErr);

    return {
      stdout: outStr,
      stderr: errStr,
      exitCode,
      timedOut,
      durationMs,
    };
  } finally {
    // cleanup temp dir
    await rimraf(work);
  }
}
