/**
 * Database Verification Script
 * 
 * This script counts the BCT routine slots in the database by semester and section
 * to verify that the seeding was successful.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URI;

// Connection options
const options = {
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000
};

// Main verification function
async function verifyDatabase() {
  try {
    console.log('Starting verification...');
    
    // Import the RoutineSlot model
    const RoutineSlot = mongoose.models.RoutineSlot || mongoose.model('RoutineSlot', require('../backend/models/RoutineSlot').schema);
    
    // Count the total number of routine slots
    const totalCount = await RoutineSlot.countDocuments();
    console.log(`Total routine slots in database: ${totalCount}`);
    
    // Count BCT routine slots
    const bctCount = await RoutineSlot.countDocuments({ programCode: 'BCT' });
    console.log(`BCT routine slots in database: ${bctCount}`);
    
    // Count BEX routine slots
    const bexCount = await RoutineSlot.countDocuments({ programCode: 'BEX' });
    console.log(`BEX routine slots in database: ${bexCount}`);
    
    // Count by semester and section for BCT
    for (let semester = 1; semester <= 4; semester++) {
      for (const section of ['AB', 'CD']) {
        const count = await RoutineSlot.countDocuments({ 
          programCode: 'BCT', 
          semester, 
          section 
        });
        console.log(`BCT Semester ${semester} Section ${section}: ${count} slots`);
        
        // Count spanned classes
        const spannedCount = await RoutineSlot.countDocuments({
          programCode: 'BCT',
          semester,
          section,
          spanId: { $exists: true, $ne: null }
        });
        console.log(`  - Slots part of spanned classes: ${spannedCount}`);
        
        // Count span masters (to get the number of unique spanned classes)
        const spanMasterCount = await RoutineSlot.countDocuments({
          programCode: 'BCT',
          semester,
          section,
          spanMaster: true
        });
        console.log(`  - Unique spanned classes: ${spanMasterCount}`);
      }
    }
    
    console.log('\nVerification completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during verification:', error);
    return false;
  }
}

// Run the verification
console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI, options)
  .then(async () => {
    console.log('MongoDB Atlas connected successfully!');
    
    try {
      await verifyDatabase();
      
      // Close the connection
      console.log('Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (error) {
      console.error('Error during verification:', error);
      
      // Attempt to close the connection
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
      }
    }
  })
  .catch(error => {
    console.error('Failed to connect to MongoDB Atlas:', error);
  });
