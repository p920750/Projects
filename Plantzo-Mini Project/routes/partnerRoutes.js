const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Partner = require('../models/Partner');
const Plant = require('../models/Product');
const User = require("../models/userModel");

const authenticatePartner = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader); // Debugging

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, partner) => {
        
            if (err) {
                console.error("JWT Verification Error:", err); // Debugging
                return res.sendStatus(403);
            }
            req.partner = partner;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Step 1: Find the partner by email in the Partner schema
        const partner = await Partner.findOne({ email });
        if (!partner) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Step 2: Find the user by email in the User collection (to get the password)
        const user = await User.findOne({ email }); // Adjust this to match your User model
        if (!user || !user.password) {
            console.error("Password is missing in the user collection!");
            return res.status(500).json({ message: "Password is not set for this user" });
        }

        // Step 3: Compare the provided password with the hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Step 4: Generate the JWT token
        const token = jwt.sign({ partnerName: partner.name }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error("Error in login route:", error); // Debugging
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.get('/products', authenticatePartner, async (req, res) => {
    try {
        const products = await Plant.find({ partnerName: req.partner.partnerName });
        if (products.length > 0) {
            res.json({ success: true, data: products });
        } else {
            res.json({ success: false, data: [] });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/products', authenticatePartner, async (req, res) => {
    try {
        const product = new Plant({
            ...req.body,
            partnerName: req.partner.partnerName,
        });
        await product.save();
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;