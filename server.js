require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => res.send("Blog backend running"));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database connection error:", err));

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));


