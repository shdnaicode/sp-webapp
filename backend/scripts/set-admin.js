import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.js";

dotenv.config();

function parseArgs(argv) {
  const args = { role: "admin" };
  for (const a of argv.slice(2)) {
    const [k, v] = a.includes("=") ? a.split("=") : [a, true];
    if (k === "--email") args.email = v;
    else if (k === "--role") args.role = v;
  }
  return args;
}

async function main() {
  const { email, role } = parseArgs(process.argv);
  if (!email) {
    console.error("Usage: node backend/scripts/set-admin.js --email=<email> [--role=admin|student]");
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Create a .env with MONGO_URI=... or export it in your shell.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const normalized = String(email).trim().toLowerCase();
    const updated = await User.findOneAndUpdate(
      { email: normalized },
      { $set: { role } },
      { new: true }
    );
    if (!updated) {
      console.error(`No user found for email: ${normalized}`);
      process.exit(2);
    }
    console.log(`Updated user ${updated.email} to role: ${updated.role}`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating role:", err.message);
    process.exit(3);
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }
}

main();
