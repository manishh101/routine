/**
 * Database Seeder Script for Routine Management System
 * 
 * This script seeds the development database with realistic routine data.
 * It creates routine slots for BCT program, semesters 1-4, with both regular
 * and spanned (multi-period) classes while avoiding schedule conflicts.
 * 
 * Usage: node scripts/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const RoutineSlot = require('../backend/models/RoutineSlot');
const Teacher = require('../backend/models/Teacher');
const Room = require('../backend/models/Room');
const ProgramSemester = require('../backend/models/ProgramSemester');
const Subject = require('../backend/models/Subject');

// Import utility functions (teacher schedule functionality disabled)
// const { recalculateTeacherSchedule } = require('../backend/utils/scheduleGeneration');

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URI;

// Connection options with increased timeouts
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000
};

console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI, options)
  .then(() => console.log('MongoDB Atlas connected to be-routine database'))
  .catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
  });

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding process...');
    
    // 1. Clear existing data
    console.log('Clearing existing routine slots and teacher schedules...');
    try {
      console.log('Deleting routine slots...');
      await RoutineSlot.deleteMany({}).exec();
      console.log('Routine slots deleted successfully');
      
      console.log('Teacher schedules functionality has been removed - skipping cleanup');
      // await TeacherSchedule.deleteMany({}).exec();
      // console.log('Teacher schedules deleted successfully');
    } catch (error) {
      console.error('Error clearing existing data:', error.message);
      console.log('Continuing with seeding process...');
    }
    
    // 2. Fetch all master data
    console.log('Fetching master data...');
    
    // Get all teachers
    const teachers = await Teacher.find({}).lean();
    if (teachers.length === 0) {
      throw new Error('No teachers found in the database. Please add teachers first.');
    }
    console.log(`Fetched ${teachers.length} teachers.`);
    
    // Get all rooms
    const rooms = await Room.find({}).lean();
    if (rooms.length === 0) {
      throw new Error('No rooms found in the database. Please add rooms first.');
    }
    console.log(`Fetched ${rooms.length} rooms.`);
    
    // Get all subjects for BCT program, semesters 1-4
    const programSemesters = await ProgramSemester.find({
      programCode: 'BCT',
      semester: { $in: [1, 2, 3, 4] }
    }).populate('subjects').lean();
    
    if (programSemesters.length === 0) {
      throw new Error('No program semesters found for BCT. Please add program semesters first.');
    }
    console.log(`Fetched ${programSemesters.length} program semesters.`);
    
    // Organize subjects by semester
    const subjectsBySemester = {};
    programSemesters.forEach(ps => {
      subjectsBySemester[ps.semester] = ps.subjects;
    });
    
    // 3. Define target routines
    const routinesToSeed = [
      { programCode: 'BCT', semester: 1, section: 'AB' },
      { programCode: 'BCT', semester: 1, section: 'CD' },
      { programCode: 'BCT', semester: 2, section: 'AB' },
      { programCode: 'BCT', semester: 2, section: 'CD' },
      { programCode: 'BCT', semester: 3, section: 'AB' },
      { programCode: 'BCT', semester: 3, section: 'CD' },
      { programCode: 'BCT', semester: 4, section: 'AB' },
      { programCode: 'BCT', semester: 4, section: 'CD' },
    ];

    // 4. Track used resources to avoid collisions
    // Format: { day_slotIndex: { teacherId: [Set of teacherIds], roomId: [Set of roomIds] } }
    const usedResources = {};
    
    // 5. Generate routine data
    console.log('Generating routine data...');
    const routineSlots = [];
    const usedTeacherIds = new Set();
    
    // Iterate through each routine configuration
    for (const routine of routinesToSeed) {
      const { programCode, semester, section } = routine;
      console.log(`Generating data for ${programCode} semester ${semester} section ${section}...`);
      
      const semesterSubjects = subjectsBySemester[semester] || [];
      if (semesterSubjects.length === 0) {
        console.warn(`No subjects found for ${programCode} semester ${semester}. Skipping.`);
        continue;
      }
      
      // For each day (0-4, Monday to Friday)
      for (let dayIndex = 0; dayIndex <= 4; dayIndex++) {
        // Generate 3-4 classes per day
        const classesPerDay = Math.floor(Math.random() * 2) + 3; // 3-4 classes
        
        // Available slots for this day (assuming 8 periods, index 0-7)
        const availableSlots = Array.from({ length: 8 }, (_, i) => i);
        
        for (let i = 0; i < classesPerDay; i++) {
          // Skip if no more available slots or subjects
          if (availableSlots.length === 0 || semesterSubjects.length === 0) {
            continue;
          }
          
          // Decide if this should be a spanned class (20% probability)
          const isSpanned = Math.random() < 0.2;
          
          // Choose slot(s)
          const slotIndexes = [];
          
          // For spanned classes, we need two consecutive slots
          if (isSpanned) {
            // Find available consecutive slots
            for (let j = 0; j < availableSlots.length - 1; j++) {
              if (availableSlots[j] + 1 === availableSlots[j + 1]) {
                slotIndexes.push(availableSlots[j], availableSlots[j + 1]);
                // Remove these slots from available slots
                availableSlots.splice(j, 2);
                break;
              }
            }
            
            // If we couldn't find consecutive slots, create a regular class
            if (slotIndexes.length === 0) {
              const slotIndex = availableSlots.splice(Math.floor(Math.random() * availableSlots.length), 1)[0];
              slotIndexes.push(slotIndex);
            }
          } else {
            // Regular class - pick one random slot
            const slotIndex = availableSlots.splice(Math.floor(Math.random() * availableSlots.length), 1)[0];
            slotIndexes.push(slotIndex);
          }
          
          // Select a random subject
          const subjectIndex = Math.floor(Math.random() * semesterSubjects.length);
          const subject = semesterSubjects[subjectIndex];
          
          // Choose a class type based on the subject (L for theory, P for practical)
          const classType = subject.defaultHoursPractical > 0 && Math.random() < 0.3 ? 'P' : 'L';
          
          // Find available teacher and room for this time slot
          let availableTeacher = null;
          let availableRoom = null;
          
          // Shuffle teachers and rooms arrays for randomness
          const shuffledTeachers = [...teachers].sort(() => 0.5 - Math.random());
          const shuffledRooms = [...rooms].sort(() => 0.5 - Math.random());
          
          // Filter for appropriate room type
          const appropriateRooms = shuffledRooms.filter(room => 
            classType === 'P' ? room.roomType === 'Lab' : room.roomType === 'Lecture');
          
          // Check for an available teacher and room
          for (const teacher of shuffledTeachers) {
            // Check if teacher is available for all slots
            const teacherAvailable = slotIndexes.every(slotIndex => {
              const key = `${dayIndex}_${slotIndex}`;
              return !usedResources[key]?.teacherId?.has(teacher._id.toString());
            });
            
            if (teacherAvailable) {
              availableTeacher = teacher;
              
              // Now check for an available room
              for (const room of appropriateRooms) {
                const roomAvailable = slotIndexes.every(slotIndex => {
                  const key = `${dayIndex}_${slotIndex}`;
                  return !usedResources[key]?.roomId?.has(room._id.toString());
                });
                
                if (roomAvailable) {
                  availableRoom = room;
                  break;
                }
              }
              
              // If we found both teacher and room, break the loop
              if (availableTeacher && availableRoom) {
                break;
              }
            }
          }
          
          // If we couldn't find an available teacher or room, skip this class
          if (!availableTeacher || !availableRoom) {
            continue;
          }
          
          // Mark the resources as used
          slotIndexes.forEach(slotIndex => {
            const key = `${dayIndex}_${slotIndex}`;
            if (!usedResources[key]) {
              usedResources[key] = { teacherId: new Set(), roomId: new Set() };
            }
            usedResources[key].teacherId.add(availableTeacher._id.toString());
            usedResources[key].roomId.add(availableRoom._id.toString());
          });
          
          // Track the teacher for later schedule generation
          usedTeacherIds.add(availableTeacher._id.toString());
          
          // Create routine slot document(s)
          if (isSpanned && slotIndexes.length === 2) {
            // Generate a spanId for linked slots
            const spanId = uuidv4();
            
            // Create first slot (span master)
            routineSlots.push({
              programCode,
              semester,
              section,
              dayIndex,
              slotIndex: slotIndexes[0],
              subjectId: subject._id,
              teacherIds: [availableTeacher._id],
              roomId: availableRoom._id,
              classType,
              spanId,
              spanMaster: true
            });
            
            // Create second slot (linked to master)
            routineSlots.push({
              programCode,
              semester,
              section,
              dayIndex,
              slotIndex: slotIndexes[1],
              subjectId: subject._id,
              teacherIds: [availableTeacher._id],
              roomId: availableRoom._id,
              classType,
              spanId,
              spanMaster: false
            });
          } else {
            // Create regular slot
            routineSlots.push({
              programCode,
              semester,
              section,
              dayIndex,
              slotIndex: slotIndexes[0],
              subjectId: subject._id,
              teacherIds: [availableTeacher._id],
              roomId: availableRoom._id,
              classType
            });
          }
        }
      }
    }
    
    // 6. Insert generated slots in batches
    if (routineSlots.length > 0) {
      console.log(`Inserting ${routineSlots.length} routine slots in batches...`);
      
      // Split into batches of 20 for better reliability
      const BATCH_SIZE = 20;
      for (let i = 0; i < routineSlots.length; i += BATCH_SIZE) {
        const batch = routineSlots.slice(i, i + BATCH_SIZE);
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(routineSlots.length / BATCH_SIZE)}...`);
        try {
          await RoutineSlot.insertMany(batch, { timeout: 30000 });
        } catch (error) {
          console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
          console.log('Continuing with next batch...');
        }
      }
      console.log('All batches processed.');
    } else {
      console.warn('No routine slots were generated. Check your master data.');
    }
    
    // 7. Teacher schedule generation has been disabled
    console.log(`Teacher schedule generation functionality has been removed from the system`);
    console.log(`Used teachers: ${usedTeacherIds.size} teachers`);
    // const teacherIds = Array.from(usedTeacherIds);
    // for (const teacherId of teacherIds) {
    //   await recalculateTeacherSchedule(teacherId);
    // }
    
    // 8. Finish seeding process
    console.log(`Database successfully seeded with ${routineSlots.length} routine slots for ${usedTeacherIds.size} teachers.`);
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}

// Run the seeder and disconnect afterwards
seedDatabase()
  .then(result => {
    if (result) {
      console.log('Seeding completed successfully.');
    } else {
      console.error('Seeding failed.');
    }
    // Close database connection
    mongoose.connection.close()
      .then(() => console.log('MongoDB connection closed.'))
      .catch(err => console.error('Error closing MongoDB connection:', err));
  });
