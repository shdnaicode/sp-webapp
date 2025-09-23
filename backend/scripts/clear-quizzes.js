import mongoose from "mongoose";
import dotenv from "dotenv";
import Quiz from "../models/quiz.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const result = await Quiz.deleteMany({});
  console.log(`Deleted quizzes: ${result.deletedCount}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
