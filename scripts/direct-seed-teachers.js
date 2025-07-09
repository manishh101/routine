/**
 * Direct Database Seeding for DoECE Teachers
 * Uses direct database connection to bypass API authentication
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const Teacher = require('../backend/models/Teacher');
const Department = require('../backend/models/Department');

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URI;

// Connection options with increased timeouts
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000
};

// DoECE Teachers Data - using the same data from api-seed-teachers.js
const doeceTeachers = [
  // Professors
  {
    fullName: 'Dr. Subarna Shakya',
    shortName: 'SS',
    designation: 'Professor',
    email: 'subarna.shakya@ioe.edu.np',
    phone: '+977-9851032303',
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
    phone: '+977-9851232355',
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
    phone: '+977-9851026199',
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
    phone: '+977-9841295428',
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
    phone: '+977-9841574509',
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
    phone: '+977-9841214045',
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
    phone: '+977-9841285979',
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
    phone: '+977-9841605424',
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
    phone: '+977-9851042652',
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
    phone: '+977-9841366600',
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
    phone: '+977-9841275746',
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
    phone: '+977-9841386085',
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
    phone: '+977-9841275333',
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
    phone: '+977-9841285982',
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
    phone: '+977-9841367820',
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
    phone: '+977-9841234567',
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
    phone: '+977-9841123456',
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
    phone: '+977-9841789012',
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
    phone: '+977-9841345678',
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
    phone: '+977-9841567890',
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
    phone: '+977-9841234890',
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
    phone: '+977-9841678901',
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
    phone: '+977-9841789234',
    expertise: ['PhD Research', 'Machine Learning'],
    isFullTime: false,
    maxWeeklyHours: 8,
    availableDays: [0, 1, 2, 3, 4],
    isActive: true
  }
];

console.log('🚀 Starting Direct Database DoECE Teachers population...');

mongoose.connect(MONGODB_URI, options)
  .then(() => {
    console.log('✅ MongoDB Atlas connected to bctroutine database');
    seedTeachers();
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err);
    process.exit(1);
  });

/**
 * Main seeding function
 */
async function seedTeachers() {
  try {
    console.log('📋 Starting DoECE Teachers population...');
    
    // Step 1: Check if DOECE department exists
    let doeceDept = await Department.findOne({ code: 'DOECE' }).exec();
    
    if (!doeceDept) {
      console.log('🏢 Creating DoECE department...');
      doeceDept = await Department.create({
        code: 'DOECE',
        name: 'Electronics & Computer',
        fullName: 'Department of Electronics and Computer Engineering',
        contactEmail: 'doece@ioe.edu.np',
        location: 'DoECE Building, Pulchowk Campus',
        isActive: true
      });
      console.log(`✅ Department created with ID: ${doeceDept._id}`);
    } else {
      console.log(`✅ Using existing department with ID: ${doeceDept._id}`);
    }
    
    // Step 2: Clear existing DoECE teachers
    console.log('🧹 Clearing existing DoECE teachers...');
    const deleteResult = await Teacher.deleteMany({ departmentId: doeceDept._id }).exec();
    console.log(`✅ Cleared ${deleteResult.deletedCount} existing teachers`);
    
    // Step 3: Create teachers
    console.log('👨‍🏫 Creating teachers...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const teacherData of doeceTeachers) {
      try {
        // Add department ID to teacher data
        const completeTeacherData = {
          ...teacherData,
          departmentId: doeceDept._id
        };
        
        // Create new teacher
        const newTeacher = new Teacher(completeTeacherData);
        await newTeacher.save();
        console.log(`✅ Created: ${teacherData.fullName} (${teacherData.shortName})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating teacher ${teacherData.fullName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 DoECE Teachers population completed!`);
    console.log(`✅ Successfully created: ${successCount} teachers`);
    console.log(`❌ Errors: ${errorCount} teachers`);
    
    // Step 4: Show summary by designation
    console.log('\n📊 Summary by designation:');
    const summary = {};
    doeceTeachers.forEach(teacher => {
      summary[teacher.designation] = (summary[teacher.designation] || 0) + 1;
    });
    
    Object.entries(summary).forEach(([designation, count]) => {
      console.log(`   ${designation}: ${count}`);
    });
    
    // Step 5: Verify the data was inserted
    const totalTeachers = await Teacher.countDocuments({ departmentId: doeceDept._id }).exec();
    console.log(`\n🔍 Verification: ${totalTeachers} teachers found in database for DoECE department`);
    
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in seedTeachers:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}
