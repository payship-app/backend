// Load environment variables
require("dotenv").config();

// Imports
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

// Create Express app
const app = express();
app.use(cors());
app.use(express.json()); // parse JSON

// ------------------------
// Test route
// ------------------------
app.get("/", (req, res) => res.send("Blog backend running"));

// ------------------------
// Connect to MongoDB
// ------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database connection error:", err));

// ------------------------
// Login route
// ------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ------------------------
// Create admin (ONE TIME ONLY)
// ------------------------
app.get("/create-admin", async (req, res) => {
  try {
    // Check if admin already exists
    const existing = await User.findOne({ email: "marketing@mypayship.com" });
    if (existing) return res.send("Admin already exists");

    // Hash password and create admin
    const hashed = await bcrypt.hash("admin123", 10);
    await User.create({
      email: "marketing@mypayship.com",
      password: hashed
    });

    res.send("Admin created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// ------------------------
// Start server
// ------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const multer = require("multer"); // for image uploads
const path = require("path");
const Blog = require("./models/Blog");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // folder for images
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Create uploads folder if not exists
const fs = require("fs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Route to create blog post
app.post("/api/create-post", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageUrl = "";

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const post = await Blog.create({ title, content, imageUrl });
    res.json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

