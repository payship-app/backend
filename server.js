const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");



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

  //login route
app.post("/api/login", async (req, res) => {
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
});


// Start server
app.listen(5000, () => console.log("Server running on port 5000"));


//create admin

app.get("/create-admin", async (req, res) => {
  const bcrypt = require("bcryptjs");
  const mongoose = require("mongoose");

  const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
  });

  const User = mongoose.model("User", UserSchema);

  const hashed = await bcrypt.hash("admin123", 10);
  await User.create({
    email: "marketing@mypayship.com",
    password: hashed
  });

  res.send("Admin created successfully");
});

