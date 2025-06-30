/**
 * Simple Mobile Responsive Verification for Dashboard
 */

const fs = require('fs');
const path = require('path');

// Read the CSS file to verify mobile responsive rules
const cssFilePath = path.join(__dirname, 'frontend/src/components/MobileResponsive.css');
const dashboardFilePath = path.join(__dirname, 'frontend/src/pages/Dashboard.jsx');

function verifyMobileResponsive() {
  console.log('🔍 Verifying Mobile Responsive Implementation...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Check if CSS file exists
  totalTests++;
  if (fs.existsSync(cssFilePath)) {
    console.log('✅ MobileResponsive.css file exists');
    passedTests++;
  } else {
    console.log('❌ MobileResponsive.css file not found');
  }
  
  // Test 2: Check CSS content for mobile rules
  totalTests++;
  try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    const mobileRules = [
      '@media (max-width: 768px)',
      '.ant-card',
      '.ant-btn',
      '.mobile-stack',
      '.dashboard-header',
      '.routine-grid'
    ];
    
    let foundRules = 0;
    mobileRules.forEach(rule => {
      if (cssContent.includes(rule)) {
        foundRules++;
      }
    });
    
    if (foundRules >= 5) {
      console.log(`✅ Mobile CSS rules found (${foundRules}/${mobileRules.length})`);
      passedTests++;
    } else {
      console.log(`❌ Insufficient mobile CSS rules (${foundRules}/${mobileRules.length})`);
    }
  } catch (error) {
    console.log('❌ Error reading CSS file:', error.message);
  }
  
  // Test 3: Check Dashboard component for mobile classes
  totalTests++;
  try {
    const dashboardContent = fs.readFileSync(dashboardFilePath, 'utf8');
    const requiredClasses = [
      'dashboard-header',
      'dashboard-stats',
      'quick-actions-list',
      'mobile-stack'
    ];
    
    let foundClasses = 0;
    requiredClasses.forEach(className => {
      if (dashboardContent.includes(className)) {
        foundClasses++;
      }
    });
    
    if (foundClasses >= 3) {
      console.log(`✅ Dashboard mobile classes found (${foundClasses}/${requiredClasses.length})`);
      passedTests++;
    } else {
      console.log(`❌ Dashboard missing mobile classes (${foundClasses}/${requiredClasses.length})`);
    }
  } catch (error) {
    console.log('❌ Error reading Dashboard file:', error.message);
  }
  
  // Test 4: Check Layout component for mobile implementation
  totalTests++;
  try {
    const layoutFilePath = path.join(__dirname, 'frontend/src/components/Layout.jsx');
    const layoutContent = fs.readFileSync(layoutFilePath, 'utf8');
    
    const mobileFeatures = [
      'isMobile',
      'mobileDrawerVisible',
      'width <= 768',
      'MobileResponsive.css'
    ];
    
    let foundFeatures = 0;
    mobileFeatures.forEach(feature => {
      if (layoutContent.includes(feature)) {
        foundFeatures++;
      }
    });
    
    if (foundFeatures >= 3) {
      console.log(`✅ Layout mobile features found (${foundFeatures}/${mobileFeatures.length})`);
      passedTests++;
    } else {
      console.log(`❌ Layout missing mobile features (${foundFeatures}/${mobileFeatures.length})`);
    }
  } catch (error) {
    console.log('❌ Error reading Layout file:', error.message);
  }
  
  // Test 5: Check for responsive grid components
  totalTests++;
  try {
    const routineGridPath = path.join(__dirname, 'frontend/src/components/RoutineGrid.jsx');
    const routineGridContent = fs.readFileSync(routineGridPath, 'utf8');
    
    if (routineGridContent.includes('routine-grid-container') && 
        routineGridContent.includes('overflowX') &&
        routineGridContent.includes('WebkitOverflowScrolling')) {
      console.log('✅ RoutineGrid mobile responsive features found');
      passedTests++;
    } else {
      console.log('❌ RoutineGrid missing mobile responsive features');
    }
  } catch (error) {
    console.log('❌ Error reading RoutineGrid file:', error.message);
  }
  
  // Results
  const successRate = (passedTests / totalTests) * 100;
  console.log('\n📊 RESULTS:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 80) {
    console.log('🎉 Mobile responsive implementation is GOOD!');
  } else {
    console.log('⚠️ Mobile responsive implementation needs improvement.');
  }
  
  return {
    success: successRate >= 80,
    passedTests,
    totalTests,
    successRate
  };
}

// Run verification
verifyMobileResponsive();
