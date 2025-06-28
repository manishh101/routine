const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Models
const Teacher = require('../models/Teacher');
const RoutineSlot = require('../models/RoutineSlot');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const Program = require('../models/Program');
const TimeSlot = require('../models/TimeSlot');

async function createMinimalTestData() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/routine';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Create a test teacher
    const teacher = await Teacher.findOneAndUpdate(
      { shortName: 'TEST' },
      {
        fullName: 'Test Teacher',
        shortName: 'TEST',
        department: 'Computer Engineering',
        designation: 'Lecturer'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Created test teacher:', teacher.fullName);

    // Create a test subject
    const subject = await Subject.findOneAndUpdate(
      { code: 'TEST101' },
      {
        name: 'Test Subject',
        code: 'TEST101',
        credits: 3
      },
      { upsert: true, new: true }
    );
    console.log('✅ Created test subject:', subject.name);

    // Create a test room
    const room = await Room.findOneAndUpdate(
      { name: 'Test Room' },
      {
        name: 'Test Room',
        capacity: 50
      },
      { upsert: true, new: true }
    );
    console.log('✅ Created test room:', room.name);

    // Create test time slots
    const timeSlots = [];
    const periods = [
      { label: 'Period 1', startTime: '7:30', endTime: '8:15', sortOrder: 0 },
      { label: 'Period 2', startTime: '8:15', endTime: '9:00', sortOrder: 1 },
      { label: 'Period 3', startTime: '9:15', endTime: '10:00', sortOrder: 2 },
      { label: 'Period 4', startTime: '10:00', endTime: '10:45', sortOrder: 3 }
    ];

    for (const period of periods) {
      const timeSlot = await TimeSlot.findOneAndUpdate(
        { label: period.label },
        period,
        { upsert: true, new: true }
      );
      timeSlots.push(timeSlot);
    }
    console.log('✅ Created time slots');

    // Create a test routine slot
    const routineSlot = await RoutineSlot.findOneAndUpdate(
      {
        programCode: 'BCT',
        semester: 1,
        section: 'AB',
        dayIndex: 1, // Monday
        slotIndex: 0 // First period
      },
      {
        programCode: 'BCT',
        semester: 1,
        section: 'AB',
        dayIndex: 1,
        slotIndex: 0,
        subjectId: subject._id,
        teacherIds: [teacher._id],
        roomId: room._id,
        classType: 'L',
        isActive: true,
        subjectName_display: subject.name,
        subjectCode_display: subject.code,
        roomName_display: room.name,
        teacherNames_display: [teacher.fullName],
        teacherShortNames_display: [teacher.shortName],
        timeSlot_display: `${timeSlots[0].startTime}-${timeSlots[0].endTime}`
      },
      { upsert: true, new: true }
    );
    console.log('✅ Created test routine slot');

    // Create another routine slot for testing
    const routineSlot2 = await RoutineSlot.findOneAndUpdate(
      {
        programCode: 'BCT',
        semester: 1,
        section: 'AB',
        dayIndex: 2, // Tuesday
        slotIndex: 1 // Second period
      },
      {
        programCode: 'BCT',
        semester: 1,
        section: 'AB',
        dayIndex: 2,
        slotIndex: 1,
        subjectId: subject._id,
        teacherIds: [teacher._id],
        roomId: room._id,
        classType: 'P',
        isActive: true,
        subjectName_display: subject.name,
        subjectCode_display: subject.code,
        roomName_display: room.name,
        teacherNames_display: [teacher.fullName],
        teacherShortNames_display: [teacher.shortName],
        timeSlot_display: `${timeSlots[1].startTime}-${timeSlots[1].endTime}`
      },
      { upsert: true, new: true }
    );
    console.log('✅ Created second test routine slot');

    console.log('\n🎉 Test data created successfully!');
    console.log(`Teacher ID: ${teacher._id}`);
    console.log(`Test this in your frontend by selecting teacher: ${teacher.fullName}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createMinimalTestData();
