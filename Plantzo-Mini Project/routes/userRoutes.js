const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// ✅ Password Validation Function
const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[\W_]).{6,}$/;
  return passwordRegex.test(password);
};

// ✅ SIGNUP Route
router.post("/signup", async (req, res) => {
  try {
    let { username, email, password, role } = req.body;

    // Check for missing fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    if (!["admin", "nurserypartner", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Restrict admin accounts to max 2
    if (role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount >= 2) {
        return res.status(400).json({ message: "Only 2 admins are allowed." });
      }
    }

    // Validate password format
    if (!isValidPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters and include at least one special character." });
    }

    email = email.toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    console.log("hdhh",existingUser)
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({ username, email, password, role });
    await newUser.save();

    res.status(201).json({ message: "Signup successful! Please login." });

  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ✅ LOGIN Route
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ Generate JWT Token
    try {
      const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error("❌ JWT Error:", err);
      res.status(500).json({ message: "Token generation failed" });
    }

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ✅ GET ALL USERS (For Admin)
router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password
    res.json(users);
  } catch (error) {
    console.error("❌ Fetch users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;