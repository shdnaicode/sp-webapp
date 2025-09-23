import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    key: { type: String, required: true },
    description: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    modules: { type: [moduleSchema], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
