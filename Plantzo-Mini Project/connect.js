require('dotenv').config(); // Load .env file

const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI; // Retrieve the connection string

async function connectToDatabase() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        // Perform database operations here...
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    } finally {
        await client.close();
    }
}

connectToDatabase();