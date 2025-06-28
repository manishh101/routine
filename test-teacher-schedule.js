#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTeacherScheduleAPI() {
  console.log('🧪 Testing Teacher Schedule Functionality\n');

  try {
    // Test 1: Get all teachers
    console.log('1️⃣ Testing GET /api/teachers...');
    const teachersResponse = await axios.get(`${BASE_URL}/teachers`);
    const teachers = teachersResponse.data.data || [];
    console.log(`✅ Found ${teachers.length} teachers`);
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found in database. Please seed some teachers first.');
      return;
    }

    // Show first few teachers
    console.log('📝 Sample teachers:');
    teachers.slice(0, 3).forEach(teacher => {
      console.log(`   - ${teacher.fullName} (${teacher.shortName || 'No short name'}) - ID: ${teacher._id}`);
    });

    // Test 2: Get time slots
    console.log('\n2️⃣ Testing GET /api/timeslots...');
    const timeSlotsResponse = await axios.get(`${BASE_URL}/timeslots`);
    const timeSlots = timeSlotsResponse.data.data || [];
    console.log(`✅ Found ${timeSlots.length} time slots`);
    
    if (timeSlots.length > 0) {
      console.log('📝 Sample time slots:');
      timeSlots.slice(0, 3).forEach(slot => {
        console.log(`   - Slot ${slot._id}: ${slot.startTime} - ${slot.endTime}`);
      });
    }

    // Test 3: Get teacher schedule for first teacher
    if (teachers.length > 0) {
      const testTeacher = teachers[0];
      console.log(`\n3️⃣ Testing GET /api/teachers/${testTeacher._id}/schedule...`);
      
      try {
        const scheduleResponse = await axios.get(`${BASE_URL}/teachers/${testTeacher._id}/schedule`);
        const schedule = scheduleResponse.data.data;
        
        console.log(`✅ Successfully retrieved schedule for ${schedule.fullName}`);
        console.log(`📝 Schedule summary:`);
        
        let totalClasses = 0;
        Object.entries(schedule.schedule).forEach(([dayIndex, daySchedule]) => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const classes = Array.isArray(daySchedule) ? daySchedule.length : 0;
          totalClasses += classes;
          if (classes > 0) {
            console.log(`   - ${dayNames[dayIndex]}: ${classes} classes`);
          }
        });
        
        console.log(`   - Total classes: ${totalClasses}`);
        
        // Show format of schedule data
        const firstDay = Object.keys(schedule.schedule)[0];
        const firstDaySchedule = schedule.schedule[firstDay];
        if (Array.isArray(firstDaySchedule) && firstDaySchedule.length > 0) {
          console.log(`📋 Sample class data structure:`);
          const sampleClass = firstDaySchedule[0];
          console.log(`   {`);
          console.log(`     dayIndex: ${sampleClass.dayIndex},`);
          console.log(`     slotIndex: ${sampleClass.slotIndex},`);
          console.log(`     programCode: "${sampleClass.programCode}",`);
          console.log(`     semester: ${sampleClass.semester},`);
          console.log(`     section: "${sampleClass.section}",`);
          console.log(`     subjectName_display: "${sampleClass.subjectName_display}",`);
          console.log(`     roomName_display: "${sampleClass.roomName_display}",`);
          console.log(`     timeSlot_display: "${sampleClass.timeSlot_display}"`);
          console.log(`   }`);
        }
        
      } catch (error) {
        console.log(`❌ Error getting teacher schedule: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Teacher Schedule API testing completed!');
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 3000');
      console.log('   Run: cd backend && npm run dev');
    }
  }
}

testTeacherScheduleAPI();
