/**
 * Routine Seeding Script
 * This script seeds routine data from a predefined structure
 */

const axios = require('axios');

const API_BASE = 'http://localhost:7102/api';

// Admin credentials
const adminCredentials = {
  email: 'admin@ioe.edu.np',
  password: 'admin123'
};

let authToken = null;

// Sample routine data structure
const sampleRoutineData = [
  // Regular classes - Theory
  {
    dayIndex: 0, // Sunday
    slotIndex: 0, 
    displayName: '10:15-11:00',
    subjectCode: 'CT461',
    subjectName: 'Software Engineering',
    teacherShortName: 'BS', // Bibha Sthapit
    roomNumber: 'LH-101',
    year: 4,
    section: 'A',
    semester: 7,
    sessionType: 'THEORY',
    academicSessionId: null, // Will be set during seeding
    isSpanned: false
  },
  {
    dayIndex: 0, // Sunday
    slotIndex: 1,
    displayName: '11:00-11:45',
    subjectCode: 'CT462',
    subjectName: 'Software Project',
    teacherShortName: 'RPS', // Ram Prasad Sharma
    roomNumber: 'LH-101',
    year: 4,
    section: 'A',
    semester: 7,
    sessionType: 'THEORY',
    academicSessionId: null,
    isSpanned: false
  }
];

// Function to login
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

// Function to test API connectivity
async function testApiConnectivity() {
  try {
    console.log('🔍 Testing API connectivity...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ API health check successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API connectivity failed:', error.message);
    return false;
  }
}

// Function to get teacher by short name
async function getTeacherByShortName(shortName) {
  try {
    const response = await axios.get(`${API_BASE}/teachers`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const teachers = response.data;
    const teacher = teachers.find(t => 
      t.shortName && t.shortName.toLowerCase() === shortName.toLowerCase()
    );
    
    if (teacher) {
      console.log(`✅ Found teacher: ${teacher.shortName} - ${teacher.fullName}`);
      return teacher;
    } else {
      console.log(`⚠️ Teacher not found: ${shortName}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching teacher ${shortName}:`, error.message);
    return null;
  }
}

// Function to create a time slot with correct schema
async function createTimeSlot(timeSlotData) {
  try {
    console.log(`Creating time slot: ${timeSlotData.label}`);
    const response = await axios.post(`${API_BASE}/time-slots`, timeSlotData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log(`✅ Created time slot: ${response.data.label}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.msg?.includes('already exists')) {
      console.log(`⚠️ Time slot ${timeSlotData.label} already exists, skipping...`);
      return { _id: timeSlotData._id, label: timeSlotData.label };
    }
    console.error(`❌ Error creating time slot ${timeSlotData.label}:`, error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return null;
  }
}

// Function to test time slot creation
async function testTimeSlotCreation() {
  console.log('\n⏰ Testing time slot creation...');
  
  // Create a few test time slots with correct schema
  const testTimeSlots = [
    {
      _id: 101,
      label: 'Test Period 1',
      startTime: '09:00',
      endTime: '09:45',
      sortOrder: 101,
      category: 'Morning',
      isBreak: false,
      dayType: 'Regular',
      applicableDays: [0, 1, 2, 3, 4, 5]
    },
    {
      _id: 102,
      label: 'Test Period 2', 
      startTime: '10:00',
      endTime: '10:45',
      sortOrder: 102,
      category: 'Morning',
      isBreak: false,
      dayType: 'Regular',
      applicableDays: [0, 1, 2, 3, 4, 5]
    }
  ];
  
  let successCount = 0;
  for (const slot of testTimeSlots) {
    const result = await createTimeSlot(slot);
    if (result) successCount++;
  }
  
  console.log(`✅ Successfully created/verified ${successCount}/${testTimeSlots.length} time slots`);
  return successCount > 0;
}

// Main function
async function seedRoutine() {
  try {
    console.log('🚀 Starting routine seeding...');
    
    // Step 1: Test API connectivity
    const isConnected = await testApiConnectivity();
    if (!isConnected) {
      throw new Error('API is not accessible');
    }
    
    // Step 2: Login
    await loginAsAdmin();
    
    // Step 3: Test time slot creation
    await testTimeSlotCreation();
    
    // Step 4: Test teacher lookup
    console.log('\n👥 Testing teacher lookup...');
    for (const routineItem of sampleRoutineData) {
      const teacher = await getTeacherByShortName(routineItem.teacherShortName);
      if (teacher) {
        console.log(`✅ Teacher found for ${routineItem.subjectCode}: ${teacher.shortName}`);
      } else {
        console.log(`⚠️ Teacher not found for ${routineItem.subjectCode}: ${routineItem.teacherShortName}`);
      }
    }
    
    console.log('\n✅ Routine seeding test completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  seedRoutine()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script error:', error.message);
      process.exit(1);
    });
}

module.exports = {
  seedRoutine,
  testApiConnectivity,
  loginAsAdmin,
  getTeacherByShortName,
  createTimeSlot,
  testTimeSlotCreation
};
