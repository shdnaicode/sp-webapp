import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/course.js";

dotenv.config();

function toEmbed(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // youtube.com/watch?v=<id>
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch (_) {}
  return url;
}

async function main() {
  const [,, slugArg, moduleIndexArg, urlArg] = process.argv;
  if (!slugArg || moduleIndexArg == null || !urlArg) {
    console.error("Usage: node backend/scripts/set-course-video.js <course-slug> <moduleIndex> <url>");
    process.exit(1);
  }
  const slug = String(slugArg).toLowerCase();
  const moduleIndex = Number(moduleIndexArg);
  if (!Number.isInteger(moduleIndex) || moduleIndex < 0) {
    console.error("moduleIndex must be a non-negative integer");
    process.exit(1);
  }
  const videoUrl = toEmbed(urlArg);
  const mongo = process.env.MONGO_URI;
  if (!mongo) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
  }
  await mongoose.connect(mongo);
  try {
    const course = await Course.findOne({ slug });
    if (!course) {
      console.error("Course not found:", slug);
      process.exit(1);
    }
    if (!Array.isArray(course.modules) || moduleIndex >= course.modules.length) {
      console.error("Module index out of range. Modules length:", course.modules?.length || 0);
      process.exit(1);
    }
    course.modules[moduleIndex].videoUrl = videoUrl;
    await course.save();
    console.log("Updated videoUrl for", slug, "module", moduleIndex, "->", videoUrl);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
