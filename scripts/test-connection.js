/**
 * Test MongoDB Connection
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get MongoDB URI
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URI;
console.log('MongoDB URI (masked):', MONGODB_URI ? MONGODB_URI.substring(0, 15) + '...' : 'Not found');

// Connect without any models
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    
    // List all collections to verify connection works
    mongoose.connection.db.listCollections().toArray()
      .then(collections => {
        console.log('Available collections:');
        collections.forEach(collection => {
          console.log(`- ${collection.name}`);
        });
      })
      .catch(err => console.error('Error listing collections:', err))
      .finally(() => {
        mongoose.connection.close()
          .then(() => console.log('Connection closed'))
          .catch(err => console.error('Error closing connection:', err))
          .finally(() => process.exit(0));
      });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
