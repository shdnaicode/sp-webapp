import mongoose from "mongoose";
import dotenv from "dotenv";
import Quiz from "../models/quiz.js";

dotenv.config();

const blocks = [
  ["intro-to-robotics", ["intro", "kinematics", "control"]],
  ["arduino-basics", ["ide", "io", "sensors"]],
  ["sensors-and-actuators", ["sensors", "drivers", "integrate"]],
  ["computer-vision", ["basics", "edges", "tracking"]],
  ["ros-fundamentals", ["concepts", "nodes", "packages"]],
];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  for (const [course, modules] of blocks) {
    for (const moduleKey of modules) {
      const cnt = await Quiz.countDocuments({ course, moduleKey });
      console.log(`${course}/${moduleKey}: ${cnt}`);
    }
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
