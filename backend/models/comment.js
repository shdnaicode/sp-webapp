import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: String, required: true, index: true, lowercase: true, trim: true }, // course slug
    moduleKey: { type: String, required: true, index: true, trim: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ course: 1, moduleKey: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
