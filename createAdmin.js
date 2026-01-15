require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// connect to database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to DB"))
  .catch(err => console.log(err));

// user schema (same as before)
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);

async function createAdmin() {
  const email = "marketing@mypayship.com";   // CHANGE IF YOU WANT
  const plainPassword = "admin123";          // CHANGE THIS PASSWORD

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = new User({
    email,
    password: hashedPassword
  });

  await user.save();
  console.log("✅ Admin user created");

  mongoose.disconnect();
}

createAdmin();
