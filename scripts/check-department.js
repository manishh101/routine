/**
 * Check if DOECE department already exists
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    
    try {
      // Import models after connection
      const Department = require('../backend/models/Department');
      
      // Check if DOECE department exists
      const doeceDept = await Department.findOne({ code: 'DOECE' });
      
      if (doeceDept) {
        console.log('✅ DOECE department already exists with ID:', doeceDept._id);
        console.log('Department details:', JSON.stringify(doeceDept, null, 2));
      } else {
        console.log('❌ DOECE department does not exist');
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.connection.close()
        .then(() => console.log('MongoDB connection closed'))
        .catch(err => console.error('Error closing connection:', err));
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
