require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const app = express();

// Connect to database (with error handling)
connectDB().catch(console.error);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/timeslots', require('./routes/timeslots'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/routines', require('./routes/routine'));
app.use('/api/program-semesters', require('./routes/programSemesters'));

// Base route
app.get('/', (req, res) => {
  res.send('BE Routine Management System API is running...');
});

module.exports = app;
