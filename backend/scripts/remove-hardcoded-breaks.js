#!/usr/bin/env node

/**
 * Script: Remove Hardcoded Breaks from Time Slots
 * 
 * This script removes all hardcoded breaks from the time slots and replaces them
 * with regular periods, allowing admins to configure breaks manually through the UI.
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const TimeSlotDefinition = require('../models/TimeSlot');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/routine_management';

async function removeHardcodedBreaks() {
  try {
    console.log('🚀 Starting removal of hardcoded breaks from time slots...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // First, let's see what time slots currently exist
    const existingSlots = await TimeSlotDefinition.find({}).sort({ sortOrder: 1 });
    console.log('\n📋 Current Time Slots:');
    existingSlots.forEach(slot => {
      const type = slot.isBreak ? '[BREAK]' : '[PERIOD]';
      console.log(`   ${slot._id}: ${slot.label} ${type} (${slot.startTime} - ${slot.endTime})`);
    });
    
    // Delete all existing time slots
    console.log('\n🗑️  Deleting all existing time slots...');
    await TimeSlotDefinition.deleteMany({});
    console.log('✅ All existing time slots deleted');
    
    // Create new time slots without any hardcoded breaks
    console.log('\n🆕 Creating new time slots without hardcoded breaks...');
    
    const newTimeSlots = [
      {
        _id: 0,
        label: 'First Period',
        startTime: '07:00',
        endTime: '07:50',
        sortOrder: 0,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
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
        endTime: '10:20',
        sortOrder: 3,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 4,
        label: 'Fifth Period',
        startTime: '10:20',
        endTime: '11:10',
        sortOrder: 4,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 5,
        label: 'Sixth Period',
        startTime: '11:10',
        endTime: '12:00',
        sortOrder: 5,
        category: 'Morning',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 6,
        label: 'Seventh Period',
        startTime: '12:00',
        endTime: '12:50',
        sortOrder: 6,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 7,
        label: 'Eighth Period',
        startTime: '12:50',
        endTime: '13:40',
        sortOrder: 7,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 8,
        label: 'Ninth Period',
        startTime: '13:40',
        endTime: '14:30',
        sortOrder: 8,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      },
      {
        _id: 9,
        label: 'Tenth Period',
        startTime: '14:30',
        endTime: '15:20',
        sortOrder: 9,
        category: 'Afternoon',
        dayType: 'Regular',
        isBreak: false,
        applicableDays: [0, 1, 2, 3, 4, 5]
      }
    ];
    
    // Insert new time slots
    for (const slot of newTimeSlots) {
      try {
        const timeSlot = new TimeSlotDefinition(slot);
        await timeSlot.save();
        console.log(`✅ Created time slot: ${slot.label} (${slot.startTime} - ${slot.endTime})`);
      } catch (error) {
        console.error(`❌ Error creating time slot ${slot.label}:`, error.message);
      }
    }
    
    // Verify the new structure
    const finalSlots = await TimeSlotDefinition.find({}).sort({ sortOrder: 1 });
    const totalSlots = finalSlots.length;
    const breakSlots = finalSlots.filter(slot => slot.isBreak).length;
    const regularSlots = finalSlots.filter(slot => !slot.isBreak).length;
    
    console.log('\n📋 Updated Time Slots Summary:');
    console.log(`📊 Total Time Slots: ${totalSlots}`);
    console.log(`📊 Regular Periods: ${regularSlots}`);
    console.log(`📊 Hardcoded Break Periods: ${breakSlots}`);
    
    console.log('\n📋 New Time Slots Structure:');
    finalSlots.forEach(slot => {
      const type = slot.isBreak ? '[BREAK]' : '[PERIOD]';
      console.log(`   ${slot._id}: ${slot.label} ${type} (${slot.startTime} - ${slot.endTime})`);
    });
    
    console.log('\n✅ Hardcoded breaks removal completed successfully!');
    console.log('💡 Admins can now configure breaks manually using the "Break" class type in the UI');
    
  } catch (error) {
    console.error('❌ Error removing hardcoded breaks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  removeHardcodedBreaks();
}

module.exports = { removeHardcodedBreaks };
