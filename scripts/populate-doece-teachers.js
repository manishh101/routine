/**
 * DoECE Teachers Population Script for Routine Management System
 * 
 * This script populates the database with DoECE department and teachers data.
 * 
 * Usage: node scripts/populate-doece-teachers.js
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

// Connection options with increased timeouts (removed deprecated options)
const options = {
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000
};

console.log('Connecting to MongoDB Atlas...');
// Connect with a more robust approach
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('MongoDB Atlas connected to bctroutine database');
    return true;
  } catch (err) {
    console.error('MongoDB Atlas connection error:', err);
    return false;
  }
}

// DoECE Teachers Data - Based on typical IOE DoECE department structure

const doeceDepartmentData = {
  code: 'DOECE',
  name: 'Electronics & Computer',
  fullName: 'Department of Electronics and Computer Engineering',
  contactEmail: 'doece@ioe.edu.np',
  location: 'DoECE Building, Pulchowk Campus',
  isActive: true
};

const doeceTeachers = [
  {
    fullName: 'Dr. Subarna Shakya',
    shortName: 'SS',
    designation: 'Professor',
    email: 'subarna.shakya@ioe.edu.np',
    phone: '+977-9851032303',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Ram Krishna Maharjan',
    shortName: 'RKM',
    designation: 'Professor',
    email: 'ramkrishna.maharjan@ioe.edu.np',
    phone: '+977-9851232355',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Jyoti Tandukar',
    shortName: 'JT',
    designation: 'Associate Professor',
    email: 'jyoti.tandukar@ioe.edu.np',
    phone: '+977-9851026199',
    department: 'DOECE',
    specialization: 'Head of Department'
  },
  {
    fullName: 'Dr. Surendra Shrestha',
    shortName: 'SS',
    designation: 'Associate Professor',
    email: 'surendra.shrestha@ioe.edu.np',
    phone: '+977-9851198713',
    department: 'DOECE',
    specialization: 'On Leave'
  },
  {
    fullName: 'Dr. Dibakar Raj Pant',
    shortName: 'DRP',
    designation: 'Associate Professor',
    email: 'dibakarraj.pant@ioe.edu.np',
    phone: '+977-9841500525',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Sanjib Prasad Pandey',
    shortName: 'SPP',
    designation: 'Associate Professor',
    email: 'sanjibprasad.pandey@ioe.edu.np',
    phone: '+977-9840052621',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Nand Bikram Adhikari',
    shortName: 'NBA',
    designation: 'Associate Professor',
    email: 'nandbikram.adhikari@ioe.edu.np',
    phone: '+977-9841741053',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Arun Kumar Timilsina',
    shortName: 'AKT',
    designation: 'Associate Professor',
    email: 'arunkumar.timilsina@ioe.edu.np',
    phone: '+977-9851148555',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Anand Kumar Sah',
    shortName: 'AKS',
    designation: 'Associate Professor',
    email: 'anandkumar.sah@ioe.edu.np',
    phone: '+977-9849664988',
    department: 'DOECE',
    specialization: 'On Study Leave'
  },
  {
    fullName: 'Er. Sharad Kumar Ghimire',
    shortName: 'SKG',
    designation: 'Associate Professor',
    email: 'sharadkumar.ghimire@ioe.edu.np',
    phone: '+977-9841284474',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Jitendra Kumar Manandhar',
    shortName: 'JKM',
    designation: 'Assistant Professor',
    email: 'jitendrakumar.manandhar@ioe.edu.np',
    phone: '+977-9841291845',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Aman Shakya',
    shortName: 'AS',
    designation: 'Assistant Professor',
    email: 'aman.shakya@ioe.edu.np',
    phone: '+977-9841218877',
    department: 'DOECE',
    specialization: 'MSc Coordinator (DSA)'
  },
  {
    fullName: 'Er. Bibha Sthapit',
    shortName: 'BS',
    designation: 'Assistant Professor',
    email: 'bibha.sthapit@ioe.edu.np',
    phone: '+977-9841340250',
    department: 'DOECE',
    specialization: 'MSc Coordinator (CSKE)'
  },
  {
    fullName: 'Dr. Babu Ram Dawadi',
    shortName: 'BRD',
    designation: 'Assistant Professor',
    email: 'baburam.dawadi@ioe.edu.np',
    phone: '+977-9841340354',
    department: 'DOECE',
    specialization: 'MSc Coordinator (NCS)'
  },
  {
    fullName: 'Er. Banshee Ram Pradhan',
    shortName: 'BRP',
    designation: 'Assistant Professor',
    email: 'bansheeram.pradhan@ioe.edu.np',
    phone: '+977-9841317451',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Daya Sagar Baral',
    shortName: 'DSB',
    designation: 'Assistant Professor',
    email: 'dayasagar.baral@ioe.edu.np',
    phone: '+977-9851049546',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Dr. Basanta Joshi',
    shortName: 'BJ',
    designation: 'Assistant Professor',
    email: 'basanta.joshi@ioe.edu.np',
    phone: '+977-9851190040',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Ranju Kumari Siwakoti',
    shortName: 'RKS',
    designation: 'Assistant Professor',
    email: 'ranjukumari.siwakoti@ioe.edu.np',
    phone: '+977-9851233734',
    department: 'DOECE',
    specialization: 'On Study Leave'
  },
  {
    fullName: 'Er. Suman Sharma',
    shortName: 'SS',
    designation: 'Assistant Professor',
    email: 'suman.sharma@ioe.edu.np',
    phone: '+977-9851081030',
    department: 'DOECE',
    specialization: 'On Study Leave'
  },
  {
    fullName: 'Er. Lok Nath Regmi',
    shortName: 'LNR',
    designation: 'Assistant Professor',
    email: 'loknath.regmi@ioe.edu.np',
    phone: '+977-9851176568',
    department: 'DOECE',
    specialization: 'On Study Leave'
  },
  {
    fullName: 'Dr. Ganesh Gautam',
    shortName: 'GG',
    designation: 'Assistant Professor',
    email: 'ganesh.gautam@ioe.edu.np',
    phone: '+977-9851054980',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Sanjivan Satyal',
    shortName: 'SS',
    designation: 'Assistant Professor',
    email: 'sanjivan.satyal@ioe.edu.np',
    phone: '+977-9847376464',
    department: 'DOECE',
    specialization: 'Deputy Head'
  },
  {
    fullName: 'Er. Santosh Giri',
    shortName: 'SG',
    designation: 'Assistant Professor',
    email: 'santosh.giri@ioe.edu.np',
    phone: '+977-9846269053',
    department: 'DOECE',
    specialization: 'Deputy Head'
  },
  {
    fullName: 'Er. Anku Jaiswal',
    shortName: 'AJ',
    designation: 'Assistant Professor',
    email: 'anku.jaiswal@ioe.edu.np',
    phone: '+977-9849336528',
    department: 'DOECE',
    specialization: 'IC Chair (Project Management)'
  },
  {
    fullName: 'Er. Nischal Acharya',
    shortName: 'NA',
    designation: 'Assistant Professor',
    email: 'nischal.acharya@ioe.edu.np',
    phone: '+977-9841280247',
    department: 'DOECE',
    specialization: 'MSc Coordinator (ICE)'
  },
  {
    fullName: 'Er. Prakash Chandra Prasad',
    shortName: 'PCP',
    designation: 'Assistant Professor',
    email: 'prakashchandra.prasad@ioe.edu.np',
    phone: '+977-9840143772',
    department: 'DOECE',
    specialization: '1st Year Coordinator'
  },
    {
    fullName: 'Er. Bikal Adhikari',
    shortName: 'BA',
    designation: 'Assistant Professor',
    email: 'bikal.adhikari@ioe.edu.np',
    phone: '+977-9846518168',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Anuj Ghimire',
    shortName: 'AG',
    designation: 'Assistant Professor',
    email: 'anuj.ghimire@ioe.edu.np',
    phone: '+977-9851254079',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Anila Kansakar',
    shortName: 'AK',
    designation: 'Assistant Professor',
    email: 'anila.kansakar@ioe.edu.np',
    phone: '+977-9843760911',
    department: 'DOECE',
    specialization: 'IC Chair (Project Management)'
  },
  {
    fullName: 'Er. Kamal Prasad Nepal',
    shortName: 'KPN',
    designation: 'Sr. Instructor',
    email: 'kamalprasad.nepal@ioe.edu.np',
    phone: '+977-9851026608',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Deepak Lal Shrestha',
    shortName: 'DLS',
    designation: 'Instructor',
    email: 'deepaklal.shrestha@ioe.edu.np',
    phone: '+977-9851084380',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Suresh Jha',
    shortName: 'SJ',
    designation: 'Deputy Instructor',
    email: 'suresh.jha@ioe.edu.np',
    phone: '+977-9851189597',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Ram Ekbal Yadav',
    shortName: 'REY',
    designation: 'Asst. Instuctor',
    email: 'ramekbal.yadav@ioe.edu.np',
    phone: '+977-9841563290',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Antim Prasiddha Dhital',
    shortName: 'APD',
    designation: 'Chief Technical Assistant',
    email: 'antimprasiddha.dhital@ioe.edu.np',
    phone: '+977-9848264308',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Santosh Chaulagain',
    shortName: 'SC',
    designation: 'Chief Technical Assistant',
    email: 'santosh.chaulagain@ioe.edu.np',
    phone: '+977-9851230526',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Anish Adhikari',
    shortName: 'AA',
    designation: 'Chief Technical Assistant',
    email: 'anish.adhikari@ioe.edu.np',
    phone: '+977-9846391029',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Rojina Baral',
    shortName: 'RB',
    designation: 'RA',
    email: 'rojina.baral@ioe.edu.np',
    phone: '+977-9867825994',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Nanu Maya Kafle',
    shortName: 'NMK',
    designation: 'TA',
    email: 'nanumaya.kafle@ioe.edu.np',
    phone: '+977-9842983459',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Chitran Pokhrel',
    shortName: 'CP',
    designation: 'TA',
    email: 'chitran.pokhrel@ioe.edu.np',
    phone: '+977-9842628014',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Sijal Baral',
    shortName: 'SB',
    designation: 'TA',
    email: 'sijal.baral@ioe.edu.np',
    phone: '+977-9851318173',
    department: 'DOECE',
    specialization: ''
  },
  {
    fullName: 'Er. Nikesh DC',
    shortName: 'ND',
    designation: 'RA',
    email: 'nikesh.dc@ioe.edu.np',
    phone: '+977-9863666646',
    department: 'DOECE',
    specialization: ''
  }
];
/**
 * Main population function
 */
async function populateDoECEData() {
  try {
    console.log('Starting DoECE Department and Teachers population...');
    
    // 1. Create or update DoECE department
    console.log('Creating/Updating DoECE Department...');
    
    let doeceDept = await Department.findOne({ code: 'DOECE' }).lean().maxTimeMS(30000);
    
    if (!doeceDept) {
      doeceDept = new Department(doeceDepartmentData);
      await doeceDept.save();
      console.log('DoECE Department created successfully');
    } else {
      // Update existing department
      await Department.updateOne({ code: 'DOECE' }, doeceDepartmentData).maxTimeMS(30000);
      doeceDept = await Department.findOne({ code: 'DOECE' }).lean().maxTimeMS(30000);
      console.log('DoECE Department updated successfully');
    }

    console.log(`Department ID: ${doeceDept._id}`);

    // 2. Clear existing DoECE teachers
    console.log('Clearing existing DoECE teachers...');
    try {
      const deleteResult = await Teacher.deleteMany({ 
        $or: [
          { departmentId: doeceDept._id },
          { department: 'DOECE' }
        ]
      }).maxTimeMS(30000);
      console.log(`Deleted ${deleteResult.deletedCount} existing DoECE teachers`);
    } catch (error) {
      console.error('Error clearing existing teachers:', error.message);
      console.log('Continuing with population...');
    }

    // 3. Populate teachers
    console.log('Populating DoECE Teachers...');
    
    const teachersToInsert = doeceTeachers.map(teacherData => ({
      ...teacherData,
      departmentId: doeceDept._id,
      isFullTime: true,
      maxWeeklyHours: 16,
      availableDays: [0, 1, 2, 3, 4, 5], // Sunday to Friday
      isActive: true
    }));

    // Insert teachers in batches
    const BATCH_SIZE = 5;
    let createdCount = 0;
    
    for (let i = 0; i < teachersToInsert.length; i += BATCH_SIZE) {
      const batch = teachersToInsert.slice(i, i + BATCH_SIZE);
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(teachersToInsert.length / BATCH_SIZE)}...`);
      
      try {
        await Teacher.insertMany(batch, { timeout: false });
        createdCount += batch.length;
        
        // Log each teacher created
        batch.forEach(teacher => {
          console.log(`✅ Created: ${teacher.fullName} (${teacher.shortName}) - ${teacher.designation}`);
        });
      } catch (error) {
        console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        console.log('Continuing with next batch...');
      }
    }

    // 4. Display summary
    console.log('\n📊 Population Summary:');
    console.log(`✅ Created: ${createdCount} teachers`);
    console.log(`📊 Total Processed: ${doeceTeachers.length} teachers`);

    // Verify results
    const totalTeachers = await Teacher.countDocuments({ departmentId: doeceDept._id, isActive: true });
    console.log(`\n📈 DoECE Department Statistics:`);
    console.log(`👥 Total Active Teachers: ${totalTeachers}`);
    
    // Count by designation
    const designationCounts = await Teacher.aggregate([
      { $match: { departmentId: doeceDept._id, isActive: true } },
      { $group: { _id: '$designation', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).option({ maxTimeMS: 30000 });
    
    console.log(`\n👨‍🏫 Teachers by Designation:`);
    designationCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
    });

    console.log('\n🎉 DoECE Teachers population completed successfully!');
    return true;

  } catch (error) {
    console.error('Error populating DoECE data:', error);
    return false;
  }
}

// Run the population script and disconnect afterwards
async function main() {
  try {
    // Connect to database
    const isConnected = await connectToDatabase();
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Run population
    const result = await populateDoECEData();
    if (result) {
      console.log('Population completed successfully.');
    } else {
      console.error('Population failed.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    process.exit(0);
  }
}

main();
