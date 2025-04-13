const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Partner = require("../models/Partner");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const partner = await Partner.findOne({ email });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, partner.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid password." });
    }

    // Generate token
    const token = jwt.sign(
      { id: partner._id, name: partner.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token valid for 1 hour
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;