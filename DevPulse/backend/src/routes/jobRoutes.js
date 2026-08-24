const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { scrapeAndStoreJobs } = require('../services/scraperService');

/**
 * @route   POST /api/jobs/trigger-scrape
 * @desc    Trigger Bright Data scraping job, poll results, normalize and store in DB
 */
router.post('/trigger-scrape', async (req, res) => {
  try {
    const result = await scrapeAndStoreJobs();
    return res.status(200).json({
      success: true,
      message: 'Scraping and data persistence completed successfully',
      data: result
    });
  } catch (error) {
    console.error('[Route] /trigger-scrape failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete job scraping task',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/jobs/analytics
 * @desc    Get skill counts and aggregated statistics for chart visualization
 */
router.get('/analytics', async (req, res) => {
  try {
    // Aggregation pipeline to count occurrences of each tech stack skill
    const skillStats = await Job.aggregate([
      { $unwind: '$tech_stack' },
      { $match: { tech_stack: { $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$tech_stack',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          skill: '$_id',
          count: 1
        }
      }
    ]);

    // Additional summary metrics
    const totalJobs = await Job.countDocuments();
    const remoteJobsCount = await Job.countDocuments({ is_remote: true });
    const nonRemoteJobsCount = totalJobs - remoteJobsCount;

    return res.status(200).json({
      success: true,
      data: {
        totalJobs,
        remoteCount: remoteJobsCount,
        nonRemoteCount: nonRemoteJobsCount,
        skills: skillStats
      }
    });
  } catch (error) {
    console.error('[Route] /analytics failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/jobs
 * @desc    Fetch stored job listings with filtering by tech_stack or remote status
 * @query   tech_stack, tech, is_remote, remote, company, search, limit, page
 */
router.get('/', async (req, res) => {
  try {
    const {
      tech_stack,
      tech,
      is_remote,
      remote,
      company,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};

    // Filter by tech stack (matches exact or regex in tech_stack array)
    const selectedTech = tech_stack || tech;
    if (selectedTech) {
      if (Array.isArray(selectedTech)) {
        filter.tech_stack = { $in: selectedTech };
      } else {
        filter.tech_stack = { $regex: new RegExp(`^${selectedTech.trim()}$`, 'i') };
      }
    }

    // Filter by remote status
    const remoteQuery = is_remote !== undefined ? is_remote : remote;
    if (remoteQuery !== undefined) {
      filter.is_remote = remoteQuery === 'true' || remoteQuery === true || remoteQuery === '1';
    }

    // Filter by company name
    if (company) {
      filter.company_name = { $regex: new RegExp(company.trim(), 'i') };
    }

    // General text search (job_title or company_name)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { job_title: searchRegex },
        { company_name: searchRegex },
        { tech_stack: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * pageSize;

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .sort({ scrapedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize) || 1,
      data: jobs
    });
  } catch (error) {
    console.error('[Route] GET /api/jobs failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
});

module.exports = router;
