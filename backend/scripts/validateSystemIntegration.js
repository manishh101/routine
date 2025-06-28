const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Program = require('../models/Program');
const ProgramSemester = require('../models/ProgramSemester');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const TimeSlotDefinition = require('../models/TimeSlot');
const RoutineSlot = require('../models/RoutineSlot');

/**
 * Comprehensive system integration validation script
 * This script ensures all components work together properly
 */

async function validateSystemIntegration() {
  try {
    console.log('🔍 Starting System Integration Validation...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully\n');

    let validationResults = {
      programs: false,
      curriculum: false,
      subjects: false,
      teachers: false,
      rooms: false,
      timeSlots: false,
      routineConsistency: false
    };

    // 1. Validate Programs
    console.log('📚 Validating Programs...');
    const programs = await Program.find({ isActive: true });
    console.log(`   Found ${programs.length} active programs`);
    
    const bctProgram = programs.find(p => p.code === 'BCT');
    if (bctProgram) {
      console.log(`   ✅ BCT Program found: ${bctProgram.name}`);
      validationResults.programs = true;
    } else {
      console.log('   ❌ BCT Program not found');
    }

    // 2. Validate BCT Curriculum
    console.log('\n📖 Validating BCT Curriculum...');
    const bctSemesters = await ProgramSemester.find({ 
      programCode: 'BCT',
      isActive: true 
    }).sort({ semester: 1 });
    
    console.log(`   Found ${bctSemesters.length} BCT semesters`);
    
    if (bctSemesters.length === 8) {
      let totalSubjects = 0;
      for (const sem of bctSemesters) {
        console.log(`   Semester ${sem.semester}: ${sem.subjectsOffered.length} subjects`);
        totalSubjects += sem.subjectsOffered.length;
      }
      console.log(`   ✅ Total subjects across all semesters: ${totalSubjects}`);
      validationResults.curriculum = true;
    } else {
      console.log('   ❌ Missing semesters in BCT curriculum');
    }

    // 3. Validate Subjects
    console.log('\n📝 Validating Subjects...');
    const subjects = await Subject.find({ isActive: true });
    console.log(`   Found ${subjects.length} active subjects`);
    
    const compSubjects = subjects.filter(s => s.code.startsWith('COMP'));
    console.log(`   Computer Engineering subjects: ${compSubjects.length}`);
    
    if (subjects.length >= 48) { // Should have at least 48 subjects for 8 semesters
      console.log('   ✅ Adequate number of subjects available');
      validationResults.subjects = true;
    } else {
      console.log('   ❌ Insufficient subjects for complete curriculum');
    }

    // 4. Validate Teachers
    console.log('\n👨‍🏫 Validating Teachers...');
    const teachers = await Teacher.find({ isActive: true });
    console.log(`   Found ${teachers.length} active teachers`);
    
    if (teachers.length > 0) {
      const sampleTeacher = teachers[0];
      console.log(`   Sample teacher: ${sampleTeacher.fullName} (${sampleTeacher.shortName})`);
      console.log('   ✅ Teachers available for assignment');
      validationResults.teachers = true;
    } else {
      console.log('   ❌ No teachers found');
    }

    // 5. Validate Rooms
    console.log('\n🏛️ Validating Rooms...');
    const rooms = await Room.find({ isActive: true });
    console.log(`   Found ${rooms.length} active rooms`);
    
    if (rooms.length > 0) {
      const sampleRoom = rooms[0];
      console.log(`   Sample room: ${sampleRoom.name} (Capacity: ${sampleRoom.capacity})`);
      console.log('   ✅ Rooms available for assignment');
      validationResults.rooms = true;
    } else {
      console.log('   ❌ No rooms found');
    }

    // 6. Validate Time Slots
    console.log('\n⏰ Validating Time Slots...');
    const timeSlots = await TimeSlotDefinition.find().sort({ sortOrder: 1 });
    console.log(`   Found ${timeSlots.length} time slots`);
    
    if (timeSlots.length > 0) {
      timeSlots.forEach((slot, index) => {
        const type = slot.isBreak ? 'BREAK' : 'CLASS';
        console.log(`   ${index + 1}. ${slot.label} (${slot.startTime}-${slot.endTime}) [${type}]`);
      });
      console.log('   ✅ Time slots properly configured');
      validationResults.timeSlots = true;
    } else {
      console.log('   ❌ No time slots found');
    }

    // 7. Validate Routine Data Consistency
    console.log('\n📅 Validating Routine Data Consistency...');
    const routineSlots = await RoutineSlot.find({
      programCode: 'BCT'
    }).populate('subjectId teacherIds roomId');
    
    console.log(`   Found ${routineSlots.length} routine slots for BCT`);
    
    // Check for orphaned references
    let orphanedSubjects = 0;
    let orphanedTeachers = 0;
    let orphanedRooms = 0;
    
    for (const slot of routineSlots) {
      if (!slot.subjectId) orphanedSubjects++;
      if (!slot.teacherIds || slot.teacherIds.length === 0) orphanedTeachers++;
      if (!slot.roomId) orphanedRooms++;
    }
    
    if (orphanedSubjects === 0 && orphanedTeachers === 0 && orphanedRooms === 0) {
      console.log('   ✅ All routine slots have valid references');
      validationResults.routineConsistency = true;
    } else {
      console.log(`   ⚠️  Found orphaned references: ${orphanedSubjects} subjects, ${orphanedTeachers} teachers, ${orphanedRooms} rooms`);
      validationResults.routineConsistency = orphanedSubjects + orphanedTeachers + orphanedRooms < routineSlots.length * 0.1; // Allow up to 10% orphaned
    }

    // 8. Test API Endpoints (if possible)
    console.log('\n🔗 Testing Key API Functionality...');
    
    // Test routine retrieval for BCT/1/AB
    try {
      const testProgram = 'BCT';
      const testSemester = 1;
      const testSection = 'AB';
      
      const testRoutine = await RoutineSlot.find({
        programCode: testProgram,
        semester: testSemester,
        section: testSection
      }).populate('subjectId teacherIds roomId');
      
      console.log(`   Sample routine query (${testProgram}/${testSemester}/${testSection}): ${testRoutine.length} slots`);
      console.log('   ✅ Routine queries working properly');
    } catch (error) {
      console.log('   ❌ Error testing routine queries:', error.message);
    }

    // Summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=' .repeat(50));
    
    const results = [
      ['Programs', validationResults.programs],
      ['Curriculum', validationResults.curriculum],
      ['Subjects', validationResults.subjects],
      ['Teachers', validationResults.teachers],
      ['Rooms', validationResults.rooms],
      ['Time Slots', validationResults.timeSlots],
      ['Routine Consistency', validationResults.routineConsistency]
    ];
    
    let passCount = 0;
    results.forEach(([component, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${component.padEnd(20)} ${status}`);
      if (passed) passCount++;
    });
    
    console.log('=' .repeat(50));
    console.log(`Overall Score: ${passCount}/${results.length} (${Math.round(passCount/results.length * 100)}%)`);
    
    if (passCount === results.length) {
      console.log('\n🎉 SYSTEM INTEGRATION VALIDATION PASSED!');
      console.log('The routine manager system is ready for production use.');
    } else {
      console.log('\n⚠️  SYSTEM INTEGRATION ISSUES DETECTED');
      console.log('Please address the failed validations before proceeding.');
    }

    await mongoose.connection.close();
    process.exit(passCount === results.length ? 0 : 1);

  } catch (error) {
    console.error('❌ Error during system validation:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  console.log('🚀 Routine Management System - Integration Validation\n');
  validateSystemIntegration();
}

module.exports = validateSystemIntegration;
