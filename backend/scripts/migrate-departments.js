const mongoose = require('mongoose');
const path = require('path');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');

// Load environment variables from the correct path
require('dotenv').config({ 
  path: path.join(__dirname, '..', '.env') 
});

/**
 * Migration Script: Create Department Collection and Migrate Existing Data
 * 
 * This script:
 * 1. Creates the Department collection
 * 2. Extracts unique departments from existing Teacher records
 * 3. Creates Department documents
 * 4. Updates Teacher records to reference Department ObjectIds
 */

async function migrateDepartments() {
  try {
    console.log('🚀 Starting Department Migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Get unique department names from existing teachers
    const uniqueDepartments = await Teacher.distinct('department', { department: { $exists: true, $ne: null } });
    console.log('📊 Found unique departments:', uniqueDepartments);
    
    // Step 2: Create Department mapping
    const departmentMapping = {
      'Electronics & Computer': {
        code: 'DOECE',
        name: 'Electronics & Computer',
        fullName: 'Department of Electronics & Computer Engineering',
        location: 'IOE Pulchowk Campus'
      },
      'Computer Engineering': {
        code: 'DOCE',
        name: 'Computer Engineering', 
        fullName: 'Department of Computer Engineering',
        location: 'IOE Pulchowk Campus'
      },
      'Electronics': {
        code: 'DOE',
        name: 'Electronics',
        fullName: 'Department of Electronics Engineering',
        location: 'IOE Pulchowk Campus'
      },
      'Civil': {
        code: 'DOCIV',
        name: 'Civil',
        fullName: 'Department of Civil Engineering',
        location: 'IOE Pulchowk Campus'
      },
      'Mechanical': {
        code: 'DOME',
        name: 'Mechanical',
        fullName: 'Department of Mechanical Engineering',
        location: 'IOE Pulchowk Campus'
      },
      'Electrical': {
        code: 'DOELE',
        name: 'Electrical',
        fullName: 'Department of Electrical Engineering',
        location: 'IOE Pulchowk Campus'
      }
    };
    
    // Step 3: Create departments
    const createdDepartments = new Map();
    
    for (const deptName of uniqueDepartments) {
      const deptConfig = departmentMapping[deptName] || {
        code: deptName.toUpperCase().replace(/\s+/g, '').substring(0, 10),
        name: deptName,
        fullName: `Department of ${deptName}`,
        location: 'IOE Pulchowk Campus'
      };
      
      try {
        let department = await Department.findOne({ code: deptConfig.code });
        
        if (!department) {
          department = new Department(deptConfig);
          await department.save();
          console.log(`✅ Created department: ${deptConfig.code} - ${deptConfig.name}`);
        } else {
          console.log(`⚠️  Department already exists: ${deptConfig.code}`);
        }
        
        createdDepartments.set(deptName, department._id);
        
      } catch (error) {
        console.error(`❌ Error creating department ${deptName}:`, error.message);
      }
    }
    
    // Step 4: Update Teacher records with departmentId
    console.log('\n🔄 Updating Teacher records...');
    
    for (const [deptName, departmentId] of createdDepartments) {
      const updateResult = await Teacher.updateMany(
        { department: deptName },
        { 
          $set: { departmentId: departmentId },
          // Keep original department field for backward compatibility during transition
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} teachers for department: ${deptName}`);
    }
    
    // Step 5: Verify migration
    console.log('\n📋 Migration Summary:');
    const totalDepartments = await Department.countDocuments();
    const teachersWithDepartmentId = await Teacher.countDocuments({ departmentId: { $exists: true } });
    const totalTeachers = await Teacher.countDocuments();
    
    console.log(`📊 Total Departments Created: ${totalDepartments}`);
    console.log(`📊 Teachers Updated: ${teachersWithDepartmentId}/${totalTeachers}`);
    
    // List all departments
    const departments = await Department.find({}).select('code name fullName');
    console.log('\n📋 Created Departments:');
    departments.forEach(dept => {
      console.log(`   ${dept.code}: ${dept.name}`);
    });
    
    console.log('\n✅ Department Migration Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDepartments();
}

module.exports = { migrateDepartments };
