const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB. Seeding NurseryPartner users...");

        // Check if NurseryPartner users already exist
        const existingPartners = await User.find({ role: "nurserypartner" });
        if (existingPartners.length >= 3) {
            console.log("⚠️ NurseryPartner users already exist. Skipping seeding.");
            process.exit();
        }

        const partners = [
            { username: "partner1", email: "greenleaf12@gmail.com", password: "partner@123", role: "nurserypartner" },
            { username: "partner2", email: "floraworld56@gmail.com", password: "partner@123", role: "nurserypartner" },
            { username: "partner3", email: "naturestouch78@gmail.com", password: "partner@123", role: "nurserypartner" }
        ];

        // Hash passwords before saving
        for (const partner of partners) {
            partner.password = await bcrypt.hash(partner.password, 10);
        }

        await User.insertMany(partners);
        console.log("✅ NurseryPartner users seeded successfully!");
        process.exit();
    })
    .catch(error => {
        console.error("❌ Error seeding NurseryPartner users:", error);
        process.exit(1);
    });
