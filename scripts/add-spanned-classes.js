/**
 * Script to add spanned/merged classes to existing routines
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

/**
 * Create a spanned routine slot in the database
 * @param {Object} RoutineSlot - The RoutineSlot model
 * @param {Object} slotData - The base slot data
 * @param {Array} slotIndexes - The slot indexes for the spanned slots
 */
async function createSpannedRoutineSlot(RoutineSlot, slotData, slotIndexes) {
  try {
    // Use MongoDB ObjectId for spanId
    const spanId = new mongoose.Types.ObjectId();
    const slots = [];
    
    // Delete any existing slots at these positions
    for (const slotIndex of slotIndexes) {
      await RoutineSlot.deleteOne({
        programCode: slotData.programCode,
        semester: slotData.semester,
        section: slotData.section,
        dayIndex: slotData.dayIndex,
        slotIndex
      });
    }
    
    // Create new spanned slots
    for (let i = 0; i < slotIndexes.length; i++) {
      const slotIndex = slotIndexes[i];
      const spanMaster = i === 0; // First slot is the master
      
      const routineSlot = new RoutineSlot({
        ...slotData,
        slotIndex,
        spanId,
        spanMaster
      });
      
      await routineSlot.save();
      slots.push(routineSlot);
    }
    
    console.log(`Created spanned routine with spanId: ${spanId}`);
    return { spanId, slots };
  } catch (error) {
    console.error('Error creating spanned routine slot:', error.message);
    return null;
  }
}

// Main function to add spanned classes
async function addSpannedClasses() {
  try {
    console.log('Starting to add spanned classes...');
    
    // Import models
    const Subject = mongoose.models.Subject || mongoose.model('Subject', require('../backend/models/Subject').schema);
    const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', require('../backend/models/Teacher').schema);
    const Room = mongoose.models.Room || mongoose.model('Room', require('../backend/models/Room').schema);
    const RoutineSlot = mongoose.models.RoutineSlot || mongoose.model('RoutineSlot', require('../backend/models/RoutineSlot').schema);
    
    // Get required data
    const subjects = await Subject.find({});
    const teachers = await Teacher.find({});
    const rooms = await Room.find({});
    
    if (subjects.length === 0 || teachers.length === 0 || rooms.length === 0) {
      throw new Error('Missing required data (subjects, teachers, or rooms)');
    }
    
    // Find appropriate rooms
    const lectureRooms = rooms.filter(r => r.roomType === 'Lecture' || r.name.includes('LH'));
    const labRooms = rooms.filter(r => r.roomType === 'Lab' || r.name.includes('Lab') || r.name.includes('CL') || r.name.includes('PL'));
    
    if (labRooms.length === 0) {
      // Use lecture rooms as lab rooms if no lab rooms are found
      console.log('No lab rooms found. Using lecture rooms for labs.');
      labRooms.push(...lectureRooms);
    }
    
    // Labs by department
    const computerSubjects = subjects.filter(s => 
      (s.code.startsWith('CT') || s.code.startsWith('CSC') || s.name.toLowerCase().includes('computer') || s.name.toLowerCase().includes('programming')) && 
      s.defaultHoursPractical > 0
    );
    
    const physicsSubjects = subjects.filter(s => 
      s.code.includes('SH402') || s.code.includes('PHY') || 
      s.name.toLowerCase().includes('physics')
    );
    // Distribute teachers based on their departments or by simple division if no department info
    const computerTeachers = teachers.filter(t => 
      t.department === 'Computer' || 
      t.shortName?.includes('RK') || 
      t.fullName?.toLowerCase().includes('computer')
    );
    
    const physicsTeachers = teachers.filter(t => 
      t.department === 'Physics' || 
      t.shortName?.includes('NP') || 
      t.fullName?.toLowerCase().includes('physics')
    );
    
    // If no teachers found with department info, just divide them
    if (computerTeachers.length === 0) {
      console.log('No computer teachers found. Using first half of teachers.');
      computerTeachers.push(...teachers.slice(0, Math.ceil(teachers.length / 2)));
    }
    
    if (physicsTeachers.length === 0) {
      console.log('No physics teachers found. Using second half of teachers.');
      physicsTeachers.push(...teachers.slice(Math.ceil(teachers.length / 2)))
    }
    
    // Add 2-3 spanned classes (labs) for each semester and section
    const semesters = [1, 2, 3, 4];
    const sections = ['AB', 'CD'];
    
    for (const semester of semesters) {
      for (const section of sections) {
        console.log(`Adding spanned classes for BCT Semester ${semester} Section ${section}...`);
        
        // Computer lab 1: Slots 0, 1
        try {
          const computerSubject = computerSubjects.length > 0 ? 
            computerSubjects[0] : subjects[0];
            
          const computerTeacher = computerTeachers.length > 0 ? 
            computerTeachers[0] : teachers[0];
            
          const labRoom = labRooms.length > 0 ? 
            labRooms[0] : rooms[0];
            
          await createSpannedRoutineSlot(
            RoutineSlot,
            {
              programCode: 'BCT',
              semester,
              section,
              dayIndex: 0, // Sunday
              subjectId: computerSubject._id,
              teacherIds: [computerTeacher._id],
              roomId: labRoom._id,
              classType: 'P'
            },
            [0, 1]
          );
          console.log(`✅ Added computer lab on Sunday for BCT ${semester}${section}`);
        } catch (error) {
          console.error(`❌ Failed to add computer lab on Sunday for BCT ${semester}${section}:`, error.message);
        }
        
        // Physics lab: Slots 4, 5, 6 (3-period span)
        try {
          const physicsSubject = physicsSubjects.length > 0 ? 
            physicsSubjects[0] : (computerSubjects.length > 0 ? computerSubjects[0] : subjects[1]);
            
          const physicsTeacher = physicsTeachers.length > 0 ? 
            physicsTeachers[0] : (computerTeachers.length > 0 ? computerTeachers[1] : teachers[1]);
            
          const labRoom = labRooms.length > 1 ? 
            labRooms[1] : (labRooms.length > 0 ? labRooms[0] : rooms[0]);
            
          await createSpannedRoutineSlot(
            RoutineSlot,
            {
              programCode: 'BCT',
              semester,
              section,
              dayIndex: 1, // Monday
              subjectId: physicsSubject._id,
              teacherIds: [physicsTeacher._id],
              roomId: labRoom._id,
              classType: 'P'
            },
            [4, 5, 6]
          );
          console.log(`✅ Added physics lab on Monday for BCT ${semester}${section}`);
        } catch (error) {
          console.error(`❌ Failed to add physics lab on Monday for BCT ${semester}${section}:`, error.message);
        }
        
        // Computer lab 2: Slots 4, 5 (different day)
        try {
          const computerSubject = computerSubjects.length > 0 ? 
            (computerSubjects.length > 1 ? computerSubjects[1] : computerSubjects[0]) : subjects[0];
            
          const computerTeacher = computerTeachers.length > 1 ? 
            computerTeachers[1] : (computerTeachers.length > 0 ? computerTeachers[0] : teachers[0]);
            
          const labRoom = labRooms.length > 0 ? 
            labRooms[0] : rooms[0];
            
          await createSpannedRoutineSlot(
            RoutineSlot,
            {
              programCode: 'BCT',
              semester,
              section,
              dayIndex: 2, // Tuesday
              subjectId: computerSubject._id,
              teacherIds: [computerTeacher._id],
              roomId: labRoom._id,
              classType: 'P'
            },
            [4, 5]
          );
          console.log(`✅ Added computer lab on Tuesday for BCT ${semester}${section}`);
        } catch (error) {
          console.error(`❌ Failed to add computer lab on Tuesday for BCT ${semester}${section}:`, error.message);
        }
      }
    }
    
    console.log('\nSpanned classes added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding spanned classes:', error);
    return false;
  }
}

// Run the script
console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI, options)
  .then(async () => {
    console.log('MongoDB Atlas connected successfully!');
    
    try {
      await addSpannedClasses();
      
      // Close the connection
      console.log('Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (error) {
      console.error('Error during script execution:', error);
      
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
