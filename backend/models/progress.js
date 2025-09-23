import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    modulesCompleted: { type: Number, default: 0 },
    modulesTotal: { type: Number, default: 0 },
    coursesDone: { type: Number, default: 0 },
    studyHours: { type: Number, default: 0 },
    overallPercent: { type: Number, default: 0 },
    currentCourses: { type: [String], default: [] },
    // Per-course module progress: { [slug]: { completed: [moduleKey] } }
    courseProgress: { type: Object, default: {} },
    recentActivity: { type: [activitySchema], default: [] },
    recentProjects: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Progress = mongoose.model("Progress", progressSchema);
export default Progress;
