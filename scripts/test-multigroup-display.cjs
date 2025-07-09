const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const RoutineSlot = require('../backend/models/RoutineSlot');
const Subject = require('../backend/models/Subject');
const Teacher = require('../backend/models/Teacher');
const Room = require('../backend/models/Room');

async function createTestMultiGroupData() {
  try {
    console.log('🔄 Creating test multi-group lab data...');

    // First, let's find an existing subject or create one
    let subject = await Subject.findOne({ subjectCode: 'COE341' });
    if (!subject) {
      subject = new Subject({
        subjectCode: 'COE341',
        subjectName: 'Computer Networks Lab',
        credit: 1.5,
        isElective: false,
        hasLab: true,
        isActive: true,
        department: 'Computer Engineering'
      });
      await subject.save();
      console.log('✅ Created test subject:', subject.subjectName);
    }

    // Find or create teachers
    let teacher1 = await Teacher.findOne({ teacherCode: 'NET01' });
    if (!teacher1) {
      teacher1 = new Teacher({
        teacherCode: 'NET01',
        firstName: 'Lab',
        lastName: 'Instructor',
        shortName: 'Lab Inst',
        email: 'lab.instructor@test.com',
        department: 'Computer Engineering',
        isActive: true
      });
      await teacher1.save();
    }

    // Find or create rooms
    let room1 = await Room.findOne({ roomCode: 'LAB01' });
    if (!room1) {
      room1 = new Room({
        roomCode: 'LAB01',
        roomName: 'Computer Lab 1',
        capacity: 30,
        roomType: 'Lab',
        building: 'New Block',
        isActive: true
      });
      await room1.save();
    }

    let room2 = await Room.findOne({ roomCode: 'LAB02' });
    if (!room2) {
      room2 = new Room({
        roomCode: 'LAB02',
        roomName: 'Computer Lab 2',
        capacity: 30,
        roomType: 'Lab',
        building: 'New Block',
        isActive: true
      });
      await room2.save();
    }

    // Clear any existing routine slots for our test case
    await RoutineSlot.deleteMany({
      programCode: 'BCT',
      semester: 5,
      section: 'A',
      dayIndex: 1, // Tuesday
      slotIndex: 4, // 5th slot
      subjectId: subject._id
    });

    // Create Group A lab slot
    const groupASlot = new RoutineSlot({
      programCode: 'BCT',
      semester: 5,
      section: 'A',
      dayIndex: 1, // Tuesday
      slotIndex: 4, // 5th slot
      subjectId: subject._id,
      teacherIds: [teacher1._id],
      roomId: room1._id,
      classType: 'lab',
      labGroup: 'A', // This is the key field
      isActive: true,
      createdBy: 'test-script'
    });

    // Create Group B lab slot (same time, different room)
    const groupBSlot = new RoutineSlot({
      programCode: 'BCT',
      semester: 5,
      section: 'A',
      dayIndex: 1, // Tuesday
      slotIndex: 4, // 5th slot
      subjectId: subject._id,
      teacherIds: [teacher1._id],
      roomId: room2._id,
      classType: 'lab',
      labGroup: 'B', // This is the key field
      isActive: true,
      createdBy: 'test-script'
    });

    // Save both slots
    await groupASlot.save();
    await groupBSlot.save();

    console.log('✅ Successfully created multi-group lab slots:');
    console.log(`   - Group A: ${subject.subjectName} in ${room1.roomName}`);
    console.log(`   - Group B: ${subject.subjectName} in ${room2.roomName}`);
    console.log(`   - Day: Tuesday (index 1), Slot: 5 (index 4)`);
    console.log(`   - Program: BCT, Semester: 5, Section: A`);

    // Verify the data
    const allSlots = await RoutineSlot.find({
      programCode: 'BCT',
      semester: 5,
      section: 'A',
      dayIndex: 1,
      slotIndex: 4,
      isActive: true
    });

    console.log(`\n🔍 Verification: Found ${allSlots.length} slots in the target time slot`);
    allSlots.forEach(slot => {
      console.log(`   - Lab Group: ${slot.labGroup}, Room: ${slot.roomId}`);
    });

    console.log('\n🎯 Test data created successfully!');
    console.log('   You can now test the multi-group display in the frontend');
    console.log('   Navigate to BCT 5th semester section A to see the result');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createTestMultiGroupData();
