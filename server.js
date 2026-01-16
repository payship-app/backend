// Load environment variables
require("dotenv").config();

// Imports
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

// Models
const User = require("./models/User");
const Blog = require("./models/Blog");

// Multer (Cloudinary)
const upload = require("./multer");

// App
const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// ------------------------
// AUTH MIDDLEWARE
// ------------------------
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ------------------------
// Test route
// ------------------------
app.get("/", (req, res) => {
  res.send("✅ Blog backend running");
});

// ------------------------
// MongoDB connection
// ------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database error:", err));

// ------------------------
// LOGIN
// ------------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------
// CREATE ADMIN (RUN ONCE)
// ------------------------
app.get("/create-admin", async (req, res) => {
  try {
    const exists = await User.findOne({ email: "marketing@mypayship.com" });
    if (exists) return res.send("Admin already exists");

    const hashed = await bcrypt.hash("admin123", 10);

    await User.create({
      email: "marketing@mypayship.com",
      password: hashed
    });

    res.send("✅ Admin created");
  } catch {
    res.status(500).send("Error creating admin");
  }
});

// ------------------------
// CREATE POST (ADMIN)
// ------------------------
app.post(
  "/api/create-post",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const imageUrl = req.file ? req.file.path : "";

      const post = await Blog.create({
        title,
        content,
        imageUrl
      });

      res.json({ message: "Post created", post });
    } catch {
      res.status(500).json({ message: "Create failed" });
    }
  }
);

// ------------------------
// GET ALL POSTS (PUBLIC)
// ------------------------
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Blog.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch {
    res.status(500).json({ message: "Fetch failed" });
  }
});

// ------------------------
// GET SINGLE POST (PUBLIC)
// ------------------------
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Not found" });
    res.json(post);
  } catch {
    res.status(404).json({ message: "Invalid ID" });
  }
});

// ------------------------
// UPDATE POST (ADMIN)
// ------------------------
app.put("/api/posts/:id", auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );

    res.json(updated);
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
});

// ------------------------
// DELETE POST (ADMIN)
// ------------------------
app.delete("/api/posts/:id", auth, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ------------------------
// START SERVER
// ------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
