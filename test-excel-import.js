#!/usr/bin/env node

/**
 * Test Excel Import Functionality
 * This script tests the Excel import endpoint directly
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testExcelImport() {
  try {
    console.log('🧪 Testing Excel Import Functionality...\n');

    // Test parameters
    const programCode = 'BCT';
    const semester = '5';
    const section = 'AB';

    console.log(`📋 Test Parameters:
    - Program: ${programCode}
    - Semester: ${semester}
    - Section: ${section}\n`);

    // First, let's check the current routine
    console.log('📊 Checking current routine...');
    try {
      const currentResponse = await axios.get(`${BASE_URL}/routines/${programCode}/${semester}/${section}`);
      const currentSlots = Object.values(currentResponse.data?.data?.routine || {})
        .reduce((total, day) => total + Object.keys(day).length, 0);
      console.log(`✅ Current slots in routine: ${currentSlots}\n`);
    } catch (error) {
      console.log('ℹ️  No existing routine found (this is normal for new routines)\n');
    }

    // Check if we have a sample Excel file to test with
    const sampleExcelPath = path.join(__dirname, 'sample-routine.xlsx');
    
    if (!fs.existsSync(sampleExcelPath)) {
      console.log('⚠️  No sample Excel file found at:', sampleExcelPath);
      console.log('📝 To test Excel import:');
      console.log('   1. Export a routine first to get a sample Excel file');
      console.log('   2. Or create a properly formatted Excel file');
      console.log('   3. Place it at:', sampleExcelPath);
      return;
    }

    console.log('📁 Sample Excel file found, proceeding with import test...');

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(sampleExcelPath));
    formData.append('programCode', programCode);
    formData.append('semester', semester);
    formData.append('section', section);

    // Perform the import
    console.log('📤 Uploading Excel file...');
    const importResponse = await axios.post(
      `${BASE_URL}/routines/${programCode}/${semester}/${section}/import`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ Import completed successfully!');
    console.log('📊 Import Results:', {
      success: importResponse.data.success,
      message: importResponse.data.message,
      data: importResponse.data.data
    });

    // Verify the data was imported by checking the routine again
    console.log('\n🔍 Verifying imported data...');
    const verifyResponse = await axios.get(`${BASE_URL}/routines/${programCode}/${semester}/${section}`);
    const importedSlots = Object.values(verifyResponse.data?.data?.routine || {})
      .reduce((total, day) => total + Object.keys(day).length, 0);
    
    console.log(`✅ Verification complete: ${importedSlots} slots found in routine`);

    if (importedSlots > 0) {
      console.log('🎉 Excel import test PASSED! Classes are visible in the routine.');
    } else {
      console.log('❌ Excel import test FAILED! No classes found after import.');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Export a sample routine first for testing
async function createSampleRoutine() {
  try {
    console.log('📝 Creating sample routine for testing...');
    
    const programCode = 'BCT';
    const semester = '5';
    const section = 'AB';

    // Add a sample class
    const sampleClass = {
      dayIndex: 1, // Monday
      slotIndex: '60a1234567890123456789ab', // You'll need to replace this with actual slot ID
      subjectId: '60a1234567890123456789ac', // You'll need to replace this with actual subject ID
      teacherIds: ['60a1234567890123456789ad'], // You'll need to replace this with actual teacher ID
      roomId: '60a1234567890123456789ae', // You'll need to replace this with actual room ID
      classType: 'L',
      notes: 'Sample class for testing'
    };

    const response = await axios.post(
      `${BASE_URL}/routines/${programCode}/${semester}/${section}/assign`,
      sampleClass
    );

    console.log('✅ Sample class created');

    // Now export it to Excel
    const exportResponse = await axios.get(
      `${BASE_URL}/routines/${programCode}/${semester}/${section}/export`,
      { responseType: 'stream' }
    );

    const sampleExcelPath = path.join(__dirname, 'sample-routine.xlsx');
    const writer = fs.createWriteStream(sampleExcelPath);
    exportResponse.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('✅ Sample Excel file created at:', sampleExcelPath);
        resolve();
      });
      writer.on('error', reject);
    });

  } catch (error) {
    console.log('ℹ️  Could not create sample routine (this is normal if no data exists yet)');
    console.log('   You can create sample data using: npm run seed');
  }
}

// Run the test
if (require.main === module) {
  testExcelImport();
}

module.exports = { testExcelImport, createSampleRoutine };
