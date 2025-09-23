import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    correct: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, index: true }, // slug
    moduleKey: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    explanation: { type: String, default: "" },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
