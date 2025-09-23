import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    profileImage: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["student", "admin"], default: "student", index: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

export default User;