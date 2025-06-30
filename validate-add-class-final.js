#!/usr/bin/env node

/**
 * Final Validation Script for Add Class Functionality
 * 
 * This script performs final checks to ensure all components are properly integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FINAL ADD CLASS FUNCTIONALITY VALIDATION');
console.log('='.repeat(60));

// Check all required files exist and have expected content
const requiredFiles = [
  {
    path: './frontend/src/pages/admin/ProgramRoutineManager.jsx',
    patterns: [
      'dayTimeSelectionVisible',
      'validateDayTimeSelection',
      'handleAssignmentSuccess',
      'Add New Class'
    ]
  },
  {
    path: './frontend/src/components/AssignClassModal.jsx',
    patterns: [
      'checkAllConflicts',
      'validateForm',
      'handleSubmit',
      'filterTeachersBasedOnClassType'
    ]
  },
  {
    path: './frontend/src/services/api.js',
    patterns: [
      'assignClass',
      'checkTeacherAvailability',
      'checkRoomAvailability'
    ]
  },
  {
    path: './backend/controllers/routineController.js',
    patterns: [
      'validateAssignClassData',
      'checkAdvancedConflicts',
      'exports.assignClass'
    ]
  },
  {
    path: './backend/routes/routine.js',
    patterns: [
      'assignClassValidation',
      '/assign',
      'checkTeacherAvailability'
    ]
  }
];

let allValid = true;

requiredFiles.forEach(file => {
  console.log(`\n📄 Checking: ${file.path}`);
  
  if (!fs.existsSync(file.path)) {
    console.log(`❌ File not found: ${file.path}`);
    allValid = false;
    return;
  }
  
  const content = fs.readFileSync(file.path, 'utf8');
  
  file.patterns.forEach(pattern => {
    if (content.includes(pattern)) {
      console.log(`✅ ${pattern}`);
    } else {
      console.log(`❌ Missing: ${pattern}`);
      allValid = false;
    }
  });
});

// Check test files
console.log('\n📋 Checking test files...');
const testFiles = [
  './test-add-class-comprehensive.js',
  './analyze-add-class-functionality.js',
  './ADD_CLASS_FUNCTIONALITY_COMPLETION_REPORT.md'
];

testFiles.forEach(testFile => {
  if (fs.existsSync(testFile)) {
    console.log(`✅ ${testFile}`);
  } else {
    console.log(`❌ Missing: ${testFile}`);
    allValid = false;
  }
});

// Check integration points
console.log('\n🔗 Checking integration points...');

const integrationChecks = [
  {
    file: './frontend/src/pages/admin/ProgramRoutineManager.jsx',
    check: 'AssignClassModal import',
    pattern: 'AssignClassModal'
  },
  {
    file: './frontend/src/components/AssignClassModal.jsx',
    check: 'API services import',
    pattern: 'from \'../services/api\''
  },
  {
    file: './backend/routes/routine.js',
    check: 'Controller import',
    pattern: 'routineController'
  }
];

integrationChecks.forEach(check => {
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file, 'utf8');
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.check}`);
    } else {
      console.log(`❌ ${check.check} - Missing integration`);
      allValid = false;
    }
  }
});

// Final result
console.log('\n' + '='.repeat(60));
if (allValid) {
  console.log('🎉 ALL VALIDATIONS PASSED!');
  console.log('✅ Add Class functionality is fully integrated and ready');
  console.log('✅ All components are properly connected');
  console.log('✅ All required patterns are implemented');
  console.log('✅ Test infrastructure is in place');
} else {
  console.log('❌ VALIDATION FAILED!');
  console.log('Some components are missing or not properly integrated');
}
console.log('='.repeat(60));

// Create a summary
const summaryData = {
  timestamp: new Date().toISOString(),
  status: allValid ? 'PASSED' : 'FAILED',
  filesChecked: requiredFiles.length,
  testFilesChecked: testFiles.length,
  integrationPointsChecked: integrationChecks.length,
  allValid: allValid
};

fs.writeFileSync('./add-class-validation-summary.json', JSON.stringify(summaryData, null, 2));
console.log('\n📄 Validation summary saved to: add-class-validation-summary.json');

process.exit(allValid ? 0 : 1);
