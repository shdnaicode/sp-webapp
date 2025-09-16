import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoute from "./routes/auth.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MongoURL = process.env.MONGO_URI;

if (!MongoURL) {
  console.error("MongoDB URI is missing. Check your .env file!");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use("/api", authRoute);

mongoose.connect(MongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})
.catch(err => console.log("MongoDB connection error:", err));
