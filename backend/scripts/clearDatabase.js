/**
 * Simple database clear script with better error handling
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Program = require('../models/Program');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');
const RoutineSlot = require('../models/RoutineSlot');
// TeacherSchedule model has been removed (unused)
const User = require('../models/User');

async function clearDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Clearing database collections...');
    
    const collections = [
      { model: Subject, name: 'Subjects' },
      { model: Teacher, name: 'Teachers' },
      { model: Program, name: 'Programs' },
      { model: Room, name: 'Rooms' },
      { model: TimeSlot, name: 'TimeSlots' },
      { model: RoutineSlot, name: 'RoutineSlots' },
      // TeacherSchedule model has been removed
    ];

    for (const { model, name } of collections) {
      try {
        const result = await model.deleteMany({});
        console.log(`✅ Cleared ${name}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        console.log(`⚠️  Error clearing ${name}:`, error.message);
      }
    }

    // Clear non-admin users
    try {
      const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
      console.log(`✅ Cleared non-admin Users: ${userResult.deletedCount} documents deleted`);
    } catch (error) {
      console.log(`⚠️  Error clearing Users:`, error.message);
    }

    console.log('🎉 Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

clearDatabase();
