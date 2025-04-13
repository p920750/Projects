require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types; // Import ObjectId
const Partner = require("./models/Partner"); // Import Partner model

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined. Check your .env file.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB.");

        // Define updates with average ratings
        const updates = [
            {
                _id: "67e7b741f3ce5c9320a0f237",
                joinedDate: new Date("2023-06-15"),
                products: 25,
                totalSales: 1500,
                averageRating: 4.2, // ⭐⭐⭐⭐☆
            },
            {
                _id: "67e7b741f3ce5c9320a0f238",
                joinedDate: new Date("2023-08-10"),
                products: 30,
                totalSales: 2000,
                averageRating: 3.8, // ⭐⭐⭐☆
            },
            {
                _id: "67e7b741f3ce5c9320a0f239",
                joinedDate: new Date("2023-09-20"),
                products: 18,
                totalSales: 1200,
                averageRating: 4.5, // ⭐⭐⭐⭐⭐
            },
        ];

        for (const partner of updates) {
            const result = await Partner.updateOne(
                { _id: new ObjectId(partner._id) }, // Convert _id to ObjectId
                { $set: partner }
            );
            console.log(`Update result for ${partner._id}:`, result);
        }

        console.log("✅ All partners updated successfully with average ratings.");
        mongoose.connection.close();
    })
    .catch(error => {
        console.error("❌ MongoDB connection error:", error);
        mongoose.connection.close();
    });