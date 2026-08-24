const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Job = require('../models/Job');

// Load environment variables from backend/.env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devpulse';

async function clearDatabase() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI.replace(/\/\/.*@/, '//***:***@')}...`);
    await mongoose.connect(MONGO_URI);

    const deleteResult = await Job.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} job records.`);
    console.log('Database cleared successfully');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error.message);
    process.exit(1);
  }
}

clearDatabase();
