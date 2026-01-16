// Load environment variables
require("dotenv").config();

// Imports
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Blog = require("./models/Blog");
const upload = require("./multer"); // multer configured for Cloudinary
const Blog = require("./models/Blog");


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
// Create blog post (Cloudinary)
// ------------------------
app.post("/api/create-post", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    // Cloudinary stores uploaded file URL in req.file.path
    const imageUrl = req.file ? req.file.path : "";

    const post = await Blog.create({
      title,
      content,
      imageUrl
    });

    res.json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public route to get all blog posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Blog.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ------------------------
// Start server
// ------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


