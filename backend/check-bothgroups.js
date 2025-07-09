const mongoose = require('mongoose');
require('./config/bctroutine');
const RoutineSlot = require('./models/RoutineSlot');

async function checkBothGroups() {
  try {
    await mongoose.connection.once('open', () => {
      console.log('Connected to MongoDB');
    });

    // Check for slots in day 5, slots 1 and 2 (Friday)
    const slots = await RoutineSlot.find({
      programCode: 'BCT',
      semester: 5,
      section: 'AB',
      dayIndex: 5,
      slotIndex: { $in: [1, 2] }
    }).sort({ dayIndex: 1, slotIndex: 1, labGroup: 1 });

    console.log(`\nFound ${slots.length} slots for BCT-5-AB on Friday (day 5):`);
    
    slots.forEach((slot, index) => {
      console.log(`\n${index + 1}. Slot ${slot.slotIndex}:`);
      console.log(`   - ID: ${slot._id}`);
      console.log(`   - Lab Group: ${slot.labGroup}`);
      console.log(`   - Subject ID: ${slot.subjectId}`);
      console.log(`   - Span ID: ${slot.spanId}`);
      console.log(`   - Span Master: ${slot.spanMaster}`);
      console.log(`   - Class Type: ${slot.classType}`);
    });

    // Check for bothGroups specifically
    const bothGroupsSlots = await RoutineSlot.find({
      programCode: 'BCT',
      semester: 5,
      section: 'AB',
      dayIndex: 5,
      slotIndex: { $in: [1, 2] },
      labGroup: { $in: ['A', 'B'] }
    }).sort({ slotIndex: 1, labGroup: 1 });

    console.log(`\nFound ${bothGroupsSlots.length} bothGroups slots:`);
    bothGroupsSlots.forEach((slot, index) => {
      console.log(`${index + 1}. Group ${slot.labGroup} - Slot ${slot.slotIndex} - Subject: ${slot.subjectId}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkBothGroups();
