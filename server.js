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
