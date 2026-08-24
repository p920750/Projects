const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/devpulse';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is healthy and running!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/api/info', (req, res) => {
  res.status(200).json({
    service: 'Scrap Verse API',
    version: '1.0.0',
    hasBrightDataConfigured: Boolean(
      process.env.BRIGHT_DATA_API_TOKEN && process.env.BRIGHT_DATA_COLLECTOR_ID
    ),
    hasMongoConfigured: Boolean(process.env.MONGO_URI)
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Scrap Verse Backend is running. Access API at /api/health or /api/jobs');
});

// Connect to MongoDB & Start Server
async function startServer() {
  try {
    console.log(`[Database] Connecting to MongoDB at ${MONGO_URI.replace(/\/\/.*@/, '//***:***@')}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    // Still listen so healthcheck and other endpoints are reachable
    app.listen(PORT, () => {
      console.log(`⚠️ Server running with DB offline on http://localhost:${PORT}`);
    });
  }
}

startServer();
