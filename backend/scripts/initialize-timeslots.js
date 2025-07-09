const mongoose = require('mongoose');
const TimeSlotDefinition = require('../models/TimeSlot');
require('dotenv').config();

/**
 * Migration Script: Initialize TimeSlot data with IOE Pulchowk schedule
 * 
 * This script creates the standard time slots used at IOE Pulchowk Campus
 */

async function initializeTimeSlots() {
  try {
    console.log('🚀 Starting TimeSlot Initialization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if time slots already exist
    const existingCount = await TimeSlotDefinition.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} time slots already exist. Skipping initialization.`);
      return;
    }
    
    // Standard IOE Pulchowk time slots
    const timeSlots = [
      {
        _id: 0,
        label: 'First Period',
        startTime: '07:00',
        endTime: '07:50',
        sortOrder: 0,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5] // Sun-Fri
      },
      {
        _id: 1,
        label: 'Second Period',
        startTime: '07:50',
        endTime: '08:40',
        sortOrder: 1,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 2,
        label: 'Third Period',
        startTime: '08:40',
        endTime: '09:30',
        sortOrder: 2,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 3,
        label: 'Fourth Period',
        startTime: '09:30',
        endTime: '09:45',
        sortOrder: 3,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 4,
        label: 'Fifth Period',
        startTime: '09:45',
        endTime: '10:35',
        sortOrder: 4,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 5,
        label: 'Sixth Period',
        startTime: '10:35',
        endTime: '11:25',
        sortOrder: 5,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 6,
        label: 'Seventh Period',
        startTime: '11:25',
        endTime: '12:15',
        sortOrder: 6,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 7,
        label: 'Eighth Period',
        startTime: '12:15',
        endTime: '13:00',
        sortOrder: 7,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 8,
        label: 'Ninth Period',
        startTime: '13:00',
        endTime: '13:50',
        sortOrder: 8,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 9,
        label: 'Tenth Period',
        startTime: '13:50',
        endTime: '14:40',
        sortOrder: 9,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 10,
        label: 'Eleventh Period',
        startTime: '14:40',
        endTime: '15:30',
        sortOrder: 10,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      }
    ];
    
    // Insert time slots
    for (const slot of timeSlots) {
      try {
        const timeSlot = new TimeSlotDefinition(slot);
        await timeSlot.save();
        console.log(`✅ Created time slot: ${slot.label} (${slot.startTime} - ${slot.endTime})`);
      } catch (error) {
        console.error(`❌ Error creating time slot ${slot.label}:`, error.message);
      }
    }
    
    // Verify initialization
    const totalSlots = await TimeSlotDefinition.countDocuments();
    const breakSlots = await TimeSlotDefinition.countDocuments({ isBreak: true });
    const regularSlots = await TimeSlotDefinition.countDocuments({ isBreak: false });
    
    console.log('\n📋 TimeSlot Initialization Summary:');
    console.log(`📊 Total Time Slots: ${totalSlots}`);
    console.log(`📊 Regular Periods: ${regularSlots}`);
    console.log(`📊 Break Periods: ${breakSlots}`);
    
    // List all time slots
    const allSlots = await TimeSlotDefinition.find({}).sort({ sortOrder: 1 });
    console.log('\n📋 Created Time Slots:');
    allSlots.forEach(slot => {
      const type = slot.isBreak ? '[BREAK]' : '[PERIOD]';
      console.log(`   ${slot._id}: ${slot.label} ${type} (${slot.startTime} - ${slot.endTime})`);
    });
    
    console.log('\n✅ TimeSlot Initialization Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Initialization Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeTimeSlots();
}

module.exports = { initializeTimeSlots };
