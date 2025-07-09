/**
 * API-based DoECE Teachers Population Script
 * Uses the backend API to populate teachers
 */

const axios = require('axios');

const API_BASE = 'http://localhost:7102/api';

// DoECE Teachers Data with proper validation rules
const doeceTeachers = [
  // Professors
  {
    fullName: 'Dr. Subarna Shakya',
    shortName: 'SS',
    designation: 'Professor',
    email: 'subarna.shakya@ioe.edu.np',
    phoneNumber: '+977-9851032303',
    expertise: ['Computer Engineering', 'Machine Learning'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Ram Krishna Maharjan',
    shortName: 'RKM',
    designation: 'Professor',
    email: 'ramkrishna.maharjan@ioe.edu.np',
    phoneNumber: '+977-9851232355',
    expertise: ['Electronics Engineering', 'Signal Processing'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  
  // Associate Professors
  {
    fullName: 'Dr. Jyoti Tandukar',
    shortName: 'JT',
    designation: 'Associate Professor',
    email: 'jyoti.tandukar@ioe.edu.np',
    phoneNumber: '+977-9851026199',
    expertise: ['Head of Department', 'Digital Systems'],
    isFullTime: true,
    maxWeeklyHours: 14, // HOD has reduced teaching load
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Surendra Shrestha',
    shortName: 'SHS',
    designation: 'Associate Professor',
    email: 'surendra.shrestha@ioe.edu.np',
    phoneNumber: '+977-9841295428',
    expertise: ['Communication Systems', 'Antenna Design'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Dibakar Raj Pant',
    shortName: 'DRP',
    designation: 'Associate Professor',
    email: 'dibakar.pant@ioe.edu.np',
    phoneNumber: '+977-9841574509',
    expertise: ['Power Electronics', 'Renewable Energy'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Sanjib Prasad Pandey',
    shortName: 'SPP',
    designation: 'Associate Professor',
    email: 'sanjib.pandey@ioe.edu.np',
    phoneNumber: '+977-9841214045',
    expertise: ['Control Systems', 'Automation'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Nand Bikram Adhikari',
    shortName: 'NBA',
    designation: 'Associate Professor',
    email: 'nanda.adhikari@ioe.edu.np',
    phoneNumber: '+977-9841285979',
    expertise: ['Digital Signal Processing', 'Image Processing'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Arun Kumar Timalsina',
    shortName: 'AKT',
    designation: 'Associate Professor',
    email: 'arun.timalsina@ioe.edu.np',
    phoneNumber: '+977-9841605424',
    expertise: ['Network Security', 'Cryptography'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  
  // Assistant Professors
  {
    fullName: 'Er. Ananda Kumar Sah',
    shortName: 'AKS',
    designation: 'Assistant Professor',
    email: 'ananda.sah@ioe.edu.np',
    phoneNumber: '+977-9851042652',
    expertise: ['Embedded Systems', 'IoT'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Sharad Kumar Ghimire',
    shortName: 'SKG',
    designation: 'Assistant Professor',
    email: 'sharad.ghimire@ioe.edu.np',
    phoneNumber: '+977-9841366600',
    expertise: ['Software Engineering', 'Database Systems'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Jitendra Kumar Manandhar',
    shortName: 'JKM',
    designation: 'Assistant Professor',
    email: 'jitendra.manandhar@ioe.edu.np',
    phoneNumber: '+977-9841275746',
    expertise: ['Computer Networks', 'Network Programming'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Aman Shakya',
    shortName: 'AS',
    designation: 'Assistant Professor',
    email: 'aman.shakya@ioe.edu.np',
    phoneNumber: '+977-9841386085',
    expertise: ['MSc Coordinator DSA', 'Data Science'],
    isFullTime: true,
    maxWeeklyHours: 14, // Coordinator has reduced teaching load
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Bibha Sthapit',
    shortName: 'BS',
    designation: 'Assistant Professor',
    email: 'bibha.sthapit@ioe.edu.np',
    phoneNumber: '+977-9841275333',
    expertise: ['MSc Coordinator CSKE', 'Software Engineering'],
    isFullTime: true,
    maxWeeklyHours: 14, // Coordinator has reduced teaching load
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Dr. Babu Ram Dawadi',
    shortName: 'BRD',
    designation: 'Assistant Professor',
    email: 'baburama.dawadi@ioe.edu.np',
    phoneNumber: '+977-9841285982',
    expertise: ['MSc Coordinator NCS', 'Network Security'],
    isFullTime: true,
    maxWeeklyHours: 14, // Coordinator has reduced teaching load
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Rashesh Khanal',
    shortName: 'RK',
    designation: 'Assistant Professor',
    email: 'rashesh.khanal@ioe.edu.np',
    phoneNumber: '+977-9841367820',
    expertise: ['Digital Electronics', 'VLSI Design'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Manish Jung Thapa',
    shortName: 'MJT',
    designation: 'Assistant Professor',
    email: 'manish.thapa@ioe.edu.np',
    phoneNumber: '+977-9841234567',
    expertise: ['Computer Programming', 'Software Development'],
    isFullTime: true,
    maxWeeklyHours: 16,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Kamal Prasad Nepal',
    shortName: 'KPN',
    designation: 'Instructor',
    email: 'kamal.nepal@ioe.edu.np',
    phoneNumber: '+977-9841123456',
    expertise: ['Laboratory Instruction', 'Electronics Lab'],
    isFullTime: true,
    maxWeeklyHours: 18, // Instructors have higher lab hours
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Deepak Lal Shrestha',
    shortName: 'DLS',
    designation: 'Instructor',
    email: 'deepak.shrestha@ioe.edu.np',
    phoneNumber: '+977-9841789012',
    expertise: ['Laboratory Instruction', 'Computer Lab'],
    isFullTime: true,
    maxWeeklyHours: 18,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Suresh Jha',
    shortName: 'SJ',
    designation: 'Instructor',
    email: 'suresh.jha@ioe.edu.np',
    phoneNumber: '+977-9841345678',
    expertise: ['Laboratory Instruction', 'Digital Lab'],
    isFullTime: true,
    maxWeeklyHours: 18,
    availableDays: [0, 1, 2, 3, 4, 5],
    isActive: true
  },
  {
    fullName: 'Er. Sabita Maharjan',
    shortName: 'SM',
    designation: 'Teaching Assistant',
    email: 'sabita.maharjan@ioe.edu.np',
    phoneNumber: '+977-9841567890',
    expertise: ['Research Assistant', 'Signal Processing'],
    isFullTime: false, // TAs are usually part-time
    maxWeeklyHours: 10,
    availableDays: [0, 1, 2, 3, 4],
    isActive: true
  },
  {
    fullName: 'Er. Bikash Poudel',
    shortName: 'BP',
    designation: 'Teaching Assistant',
    email: 'bikash.poudel@ioe.edu.np',
    phoneNumber: '+977-9841234890',
    expertise: ['Research Assistant', 'Communication Systems'],
    isFullTime: false,
    maxWeeklyHours: 10,
    availableDays: [0, 1, 2, 3, 4],
    isActive: true
  },
  {
    fullName: 'Er. Sushma Joshi',
    shortName: 'SJ2',
    designation: 'Teaching Assistant',
    email: 'sushma.joshi@ioe.edu.np',
    phoneNumber: '+977-9841678901',
    expertise: ['Research Assistant', 'Embedded Systems'],
    isFullTime: false,
    maxWeeklyHours: 10,
    availableDays: [0, 1, 2, 3, 4],
    isActive: true
  },
  {
    fullName: 'Er. Raj Kumar Poudel',
    shortName: 'RKP',
    designation: 'Research Assistant',
    email: 'rajkumar.poudel@ioe.edu.np',
    phoneNumber: '+977-9841789234',
    expertise: ['PhD Research', 'Machine Learning'],
    isFullTime: false,
    maxWeeklyHours: 8,
    availableDays: [0, 1, 2, 3, 4],
    isActive: true
  }
];

// Function to get department ID
async function getDepartmentId() {
  try {
    const response = await axios.get(`${API_BASE}/departments`);
    const doeceDept = response.data.find(dept => dept.code === 'DOECE');
    if (!doeceDept) {
      console.log('❌ DoECE department not found. Creating it...');
      const createResponse = await axios.post(`${API_BASE}/departments`, {
        code: 'DOECE',
        name: 'Electronics & Computer',
        fullName: 'Department of Electronics and Computer Engineering',
        contactEmail: 'doece@ioe.edu.np',
        location: 'DoECE Building, Pulchowk Campus',
        isActive: true
      });
      return createResponse.data._id;
    }
    return doeceDept._id;
  } catch (error) {
    console.error('Error getting department:', error.message);
    throw error;
  }
}

// Function to create teacher
async function createTeacher(teacherData, departmentId) {
  try {
    const response = await axios.post(`${API_BASE}/teachers`, {
      ...teacherData,
      departmentId: departmentId
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.msg?.includes('duplicate')) {
      console.log(`⚠️  Teacher ${teacherData.shortName} already exists, skipping...`);
      return null;
    }
    throw error;
  }
}

// Main function
async function seedTeachers() {
  try {
    console.log('🚀 Starting DoECE Teachers population via API...');
    
    // Get department ID
    const departmentId = await getDepartmentId();
    console.log(`✅ Using department ID: ${departmentId}`);
    
    // Create teachers
    let successCount = 0;
    let skipCount = 0;
    
    for (const teacherData of doeceTeachers) {
      try {
        const result = await createTeacher(teacherData, departmentId);
        if (result) {
          console.log(`✅ Created: ${teacherData.fullName} (${teacherData.shortName})`);
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating teacher ${teacherData.fullName}:`, error.response?.data?.msg || error.message);
      }
    }
    
    console.log(`\n🎉 Population completed!`);
    console.log(`✅ Successfully created: ${successCount} teachers`);
    console.log(`⚠️  Skipped (already exists): ${skipCount} teachers`);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the script
seedTeachers();
