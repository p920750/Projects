const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI ;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB. Seeding admin users...");

        // Check if admins already exist
        const existingAdmins = await User.find({ role: "admin" });
        if (existingAdmins.length >= 2) {
            console.log("⚠️ Admins already exist. Skipping seeding.");
            process.exit();
        }

        const admins = [
            { username: "admin1", email: "admin1@plantzo.com", password: "Admin@123", role: "admin" },
            { username: "admin2", email: "admin2@plantzo.com", password: "Admin@123", role: "admin" }
        ];

        // Hash passwords before saving
        for (const admin of admins) {
            admin.password = await bcrypt.hash(admin.password, 10);
        }

        await User.insertMany(admins);
        console.log("✅ Admin users seeded successfully!");
        process.exit();
    })
    .catch(error => {
        console.error("❌ Error seeding admin users:", error);
        process.exit(1);
    });