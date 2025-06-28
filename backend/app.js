const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Environment loaded:');
console.log('MongoDB URI:', process.env.MONGODB_ATLAS_URI ? 'Connected' : 'Missing');
console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:7103');
console.log('Server Port:', process.env.PORT || 7102);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const app = express();

// Connect to database (with better error handling)
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Server starting without database connection...');
});

// Enhanced CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:7103',
    'http://localhost:3000',
    'http://localhost:7103',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health check route (before other routes)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Connected'
  });
});

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BE Routine Management System API',
      version: '1.0.0',
      description: 'API for managing BE routine',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 7102}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// API Routes with error handling wrapper

const routeHandler = (routePath, routeFile) => {
  console.log('Loading route:', routePath, 'from file:', routeFile);
  try {
    const route = require(routeFile);
    app.use(routePath, route);
    console.log(`✅ Route loaded: ${routePath}`);
  } catch (error) {
    console.error(`❌ Failed to load route ${routePath}:`, error.message);
    throw error;
  }
};

// Load all routes
routeHandler('/api/auth', './routes/auth');
routeHandler('/api/users', './routes/users');
routeHandler('/api/teachers', './routes/teachers');
routeHandler('/api/programs', './routes/programs');
routeHandler('/api/subjects', './routes/subjects');
routeHandler('/api/rooms', './routes/rooms');
routeHandler('/api/timeslots', './routes/timeslots');
routeHandler('/api/routines', './routes/routine');
routeHandler('/api/program-semesters', './routes/programSemesters');
routeHandler('/api/health', './routes/health');

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'BE Routine Management System API is running...',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      auth: '/api/auth',
      teachers: '/api/teachers',
      programs: '/api/programs',
      subjects: '/api/subjects',
      rooms: '/api/rooms',
      timeslots: '/api/timeslots',
      routines: '/api/routines',
      'program-semesters': '/api/program-semesters'
    }
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/teachers',
      '/api/programs',
      '/api/subjects',
      '/api/rooms',
      '/api/timeslots',
      '/api/routines',
      '/api/program-semesters'
    ]
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:');
  console.error('Stack:', err.stack);
  console.error('Request:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  // Mongoose duplicate key errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error',
        field: field,
        value: err.keyValue[field],
        error: `${field} already exists`
      });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: err.message
    });
  }

  // Cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      details: err
    } : 'Something went wrong'
  });
});

// Export the app (server startup is handled by server.js)

module.exports = app;