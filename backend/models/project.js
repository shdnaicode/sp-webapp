import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    language: { type: String, trim: true, default: "" },
    // Legacy inline source code (kept for backward compatibility)
    sourceCode: { type: String, default: "" },
    // Uploaded file metadata (preferred)
    file: {
      originalName: { type: String },
      filename: { type: String }, // stored filename on disk
      url: { type: String }, // public URL path (served from /uploads)
      mimeType: { type: String },
      size: { type: Number },
      extension: { type: String },
    },
    // Multi-file repository-like support
    folder: { type: String }, // subfolder under uploads/projects
    files: [
      {
        originalName: { type: String },
        filename: { type: String },
        url: { type: String },
        mimeType: { type: String },
        size: { type: Number },
        extension: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
