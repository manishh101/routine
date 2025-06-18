/**
 * Seed Script for Faculty Data
 * 
 * This script populates the database with faculty data for 
 * Institute of Engineering (IOE) Pulchowk Campus, Nepal
 */

const mongoose = require('mongoose');
const Program = require('../models/Program');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/routine')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// IOE Pulchowk Campus faculty programs with appropriate durations
const engineeringPrograms = [
  {
    name: 'Bachelor in Computer Engineering',
    code: 'BCT',
    department: 'Department of Electronics and Computer Engineering',
    semesters: 8 // 8 semesters (4 years)
  },
  {
    name: 'Bachelor in Civil Engineering',
    code: 'BCE',
    department: 'Department of Civil Engineering',
    duration: 8
  },
  {
    name: 'Bachelor in Electrical Engineering',
    code: 'BEE',
    department: 'Department of Electrical Engineering',
    duration: 8
  },
  {
    name: 'Bachelor in Electronics and Communication',
    code: 'BEX',
    department: 'Department of Electronics and Computer Engineering',
    duration: 8
  },
  {
    name: 'Bachelor in Mechanical Engineering',
    code: 'BME',
    department: 'Department of Mechanical Engineering',
    duration: 8
  },
  {
    name: 'Bachelor in Architecture',
    code: 'BAR',
    department: 'Department of Architecture',
    duration: 10 // 10 semesters (5 years)
  }
];

// Insert the programs into the database
const seedPrograms = async () => {
  try {
    // Clear existing programs
    console.log('Clearing existing programs...');
    await Program.deleteMany({});
    
    // Insert new programs
    console.log('Inserting new programs...');
    const createdPrograms = await Program.insertMany(engineeringPrograms);
    
    console.log(`${createdPrograms.length} programs inserted successfully`);
    console.log('Programs:');
    createdPrograms.forEach(program => {
      console.log(`- ${program.name} (${program.code}): ${program.duration} semesters`);
    });
    
    process.exit();
  } catch (err) {
    console.error('Error seeding programs:', err);
    process.exit(1);
  }
};

// Run the seeding function
seedPrograms();
