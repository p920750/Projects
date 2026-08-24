const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    job_title: {
      type: String,
      required: true,
      trim: true
    },
    company_name: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    is_remote: {
      type: Boolean,
      default: false
    },
    salary: {
      type: String,
      trim: true
    },
    tech_stack: {
      type: [String],
      default: []
    },
    scrapedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
