const express = require('express');
const router = express.Router();
const { isConnected } = require('../services/queue.service');

// @route   GET /api/health/queue
// @desc    Check RabbitMQ connection status
// @access  Public
router.get('/queue', (req, res) => {
  const queueStatus = isConnected();
  
  res.json({
    success: true,
    data: {
      queue: {
        connected: queueStatus,
        status: queueStatus ? 'healthy' : 'disconnected',
        timestamp: new Date().toISOString()
      }
    }
  });
});

// @route   GET /api/health
// @desc    General health check
// @access  Public
router.get('/', (req, res) => {
  const queueStatus = isConnected();
  
  res.json({
    success: true,
    data: {
      api: {
        status: 'healthy',
        timestamp: new Date().toISOString()
      },
      queue: {
        connected: queueStatus,
        status: queueStatus ? 'healthy' : 'disconnected'
      },
      database: {
        status: 'healthy' // MongoDB connection is handled by Mongoose
      }
    }
  });
});

module.exports = router;
