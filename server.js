const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

// Load environment variables FIRST
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/connections", require("./routes/connections"));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
