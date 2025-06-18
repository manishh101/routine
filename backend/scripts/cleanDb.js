/**
 * Script to clean the database before seeding new data
 * Updated to include all new models as per MD specification
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Program = require('../models/Program');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');
const RoutineSlot = require('../models/RoutineSlot');
const TeacherSchedule = require('../models/TeacherSchedule');
const User = require('../models/User');

// Legacy model (if it exists)
let Class;
try {
  Class = require('../models/Class');
} catch (error) {
  console.log('Legacy Class model not found, skipping...');
}

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/routine')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

const cleanDatabase = async () => {
  try {
    console.log('🧹 Cleaning the database...');
    
    // Clear all collections
    await Subject.deleteMany({});
    console.log('✅ All subjects deleted');
    
    await Teacher.deleteMany({});
    console.log('✅ All teachers deleted');
    
    await Program.deleteMany({});
    console.log('✅ All programs deleted');
    
    await Room.deleteMany({});
    console.log('✅ All rooms deleted');
    
    await TimeSlot.deleteMany({});
    console.log('✅ All time slots deleted');
    
    await RoutineSlot.deleteMany({});
    console.log('✅ All routine slots deleted');
    
    await TeacherSchedule.deleteMany({});
    console.log('✅ All teacher schedules deleted');
    
    // Clear users (except keep admins if you want)
    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('✅ All non-admin users deleted');
    
    // Clear legacy classes if model exists
    if (Class) {
      await Class.deleteMany({});
      console.log('✅ All legacy classes deleted');
    }
    
    console.log('🎉 Database cleaned successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();
