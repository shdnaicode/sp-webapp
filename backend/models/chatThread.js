import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatThreadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    title: { type: String, default: "New chat" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

const ChatThread = mongoose.model("ChatThread", chatThreadSchema);
export default ChatThread;
