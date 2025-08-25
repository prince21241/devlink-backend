const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Ensure persistent uploads dir (works with a Render Disk)
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// DB
connectDB();

// CORS: allow your Vercel site + local dev
const allowedOrigins = [
  "http://localhost:5173",
  "https://devlink-frontend-roan.vercel.app"
];

app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

// Static uploads
app.use("/uploads", express.static(UPLOADS_DIR));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/connections", require("./routes/connections"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/search", require("./routes/search"));
app.use("/api/messages", require("./routes/messages"));

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
