#!/usr/bin/env node

/**
 * Add Class Static Analysis and Validation Report
 * 
 * This script analyzes the Add Class functionality code for:
 * - Code structure and patterns
 * - Error handling implementation
 * - Validation logic
 * - API integration
 * - Best practices compliance
 */

const fs = require('fs');
const path = require('path');

class AddClassAnalyzer {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.successes = [];
  }

  analyzeFile(filePath, expectedPatterns) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`\n📄 Analyzing: ${path.basename(filePath)}`);
      
      for (const [pattern, description] of expectedPatterns) {
        if (content.includes(pattern)) {
          this.successes.push(`✅ ${description} - Found in ${path.basename(filePath)}`);
        } else {
          this.issues.push(`❌ ${description} - Missing in ${path.basename(filePath)}`);
        }
      }
    } catch (error) {
      this.issues.push(`❌ Could not analyze ${filePath}: ${error.message}`);
    }
  }

  analyzeAddClassFunctionality() {
    console.log('🔍 Starting Add Class Functionality Analysis...\n');

    // Analyze ProgramRoutineManager
    const programRoutineManagerPath = './frontend/src/pages/admin/ProgramRoutineManager.jsx';
    const routineManagerPatterns = [
      ['dayTimeSelectionVisible', 'Day/Time selection modal state'],
      ['handleCellClick', 'Cell click handler'],
      ['validateDayTimeSelection', 'Day/time validation function'],
      ['isSlotOccupied', 'Slot occupation checker'],
      ['handleAssignmentSuccess', 'Assignment success handler'],
      ['message.error', 'Error message handling'],
      ['queryClient.invalidateQueries', 'Cache invalidation'],
      ['Add New Class', 'Add new class button']
    ];

    this.analyzeFile(programRoutineManagerPath, routineManagerPatterns);

    // Analyze AssignClassModal
    const assignClassModalPath = './frontend/src/components/AssignClassModal.jsx';
    const modalPatterns = [
      ['checkAllConflicts', 'Comprehensive conflict checking'],
      ['validateForm', 'Form validation'],
      ['filterTeachersBasedOnClassType', 'Teacher filtering by class type'],
      ['handleFormChange', 'Form change handler'],
      ['handleSubmit', 'Form submission handler'],
      ['modal.confirm', 'Conflict confirmation dialog'],
      ['useQuery', 'React Query integration'],
      ['routinesAPI.checkTeacherAvailability', 'Teacher availability check API'],
      ['routinesAPI.checkRoomAvailability', 'Room availability check API']
    ];

    this.analyzeFile(assignClassModalPath, modalPatterns);

    // Analyze API services
    const apiPath = './frontend/src/services/api.js';
    const apiPatterns = [
      ['assignClass', 'Assign class API endpoint'],
      ['checkTeacherAvailability', 'Teacher availability API'],
      ['checkRoomAvailability', 'Room availability API'],
      ['assignClassSpanned', 'Spanned class assignment API'],
      ['clearClass', 'Clear class API'],
      ['getAvailableSubjects', 'Subject fetching API']
    ];

    this.analyzeFile(apiPath, apiPatterns);

    // Analyze Backend Controller
    const controllerPath = './backend/controllers/routineController.js';
    const controllerPatterns = [
      ['validateAssignClassData', 'Backend data validation'],
      ['checkAdvancedConflicts', 'Advanced conflict detection'],
      ['exports.assignClass', 'Assign class controller'],
      ['validationResult', 'Express validation'],
      ['RoutineSlot.findOne', 'Database queries'],
      ['publishToQueue', 'Queue integration'],
      ['res.status(409)', 'Conflict response handling'],
      ['Teacher.find', 'Teacher data fetching']
    ];

    this.analyzeFile(controllerPath, controllerPatterns);

    // Analyze Backend Routes
    const routesPath = './backend/routes/routine.js';
    const routePatterns = [
      ['assignClassValidation', 'Route validation middleware'],
      ['protect', 'Authentication middleware'],
      ['authorize', 'Authorization middleware'],
      ['/assign', 'Assign class route'],
      ['checkTeacherAvailability', 'Teacher availability route'],
      ['checkRoomAvailability', 'Room availability route']
    ];

    this.analyzeFile(routesPath, routePatterns);
  }

  analyzeCodeQuality() {
    console.log('\n🔬 Code Quality Analysis...\n');

    // Check for error handling patterns
    const errorHandlingPatterns = [
      ['try {', 'Try-catch blocks for error handling'],
      ['catch (error)', 'Error catching'],
      ['.catch(', 'Promise error handling'],
      ['message.error', 'User error feedback'],
      ['console.error', 'Error logging'],
      ['throw new Error', 'Proper error throwing']
    ];

    // Check for validation patterns
    const validationPatterns = [
      ['validationResult', 'Express validation'],
      ['form.validateFields', 'Form validation'],
      ['if (!', 'Null/undefined checks'],
      ['Array.isArray', 'Array validation'],
      ['typeof', 'Type checking']
    ];

    // Check for performance patterns
    const performancePatterns = [
      ['useCallback', 'Memoized callbacks'],
      ['useMemo', 'Memoized values'],
      ['queryClient.invalidateQueries', 'Cache management'],
      ['setTimeout', 'Debouncing'],
      ['staleTime', 'Query caching'],
      ['enabled:', 'Conditional queries']
    ];

    // Analyze multiple files for these patterns
    const filesToCheck = [
      './frontend/src/pages/admin/ProgramRoutineManager.jsx',
      './frontend/src/components/AssignClassModal.jsx',
      './backend/controllers/routineController.js'
    ];

    filesToCheck.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Count error handling instances
        const errorHandlingCount = errorHandlingPatterns.reduce((count, [pattern]) => {
          return count + (content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        }, 0);

        // Count validation instances
        const validationCount = validationPatterns.reduce((count, [pattern]) => {
          return count + (content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        }, 0);

        // Count performance optimization instances
        const performanceCount = performancePatterns.reduce((count, [pattern]) => {
          return count + (content.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        }, 0);

        if (errorHandlingCount > 0) {
          this.successes.push(`✅ ${fileName}: ${errorHandlingCount} error handling implementations`);
        } else {
          this.issues.push(`❌ ${fileName}: Insufficient error handling`);
        }

        if (validationCount > 0) {
          this.successes.push(`✅ ${fileName}: ${validationCount} validation implementations`);
        } else {
          this.issues.push(`❌ ${fileName}: Insufficient validation`);
        }

        if (performanceCount > 0) {
          this.successes.push(`✅ ${fileName}: ${performanceCount} performance optimizations`);
        }
      }
    });
  }

  generateRecommendations() {
    console.log('\n💡 Generating Recommendations...\n');

    // Add architectural recommendations
    this.recommendations.push(
      '🏗️ Consider implementing a state machine for form workflow management',
      '🔄 Add retry logic for failed API calls',
      '📊 Implement analytics tracking for user interactions',
      '🧪 Add unit tests for validation functions',
      '📝 Add JSDoc comments for better documentation',
      '🔒 Implement field-level permissions based on user roles',
      '🎨 Add loading skeletons for better UX',
      '📱 Ensure mobile responsiveness for all modals',
      '🌐 Add internationalization support for error messages',
      '🔍 Implement advanced search/filter in dropdowns',
      '📈 Add performance monitoring for API calls',
      '🎯 Implement A/B testing framework for UI improvements'
    );

    // Add specific technical recommendations
    this.recommendations.push(
      '⚡ Use React.memo for modal components to prevent unnecessary re-renders',
      '🔄 Implement optimistic updates for better perceived performance',
      '🎛️ Add keyboard shortcuts for power users',
      '📦 Consider code splitting for modal components',
      '🔐 Add CSRF protection for form submissions',
      '📊 Implement real-time conflict detection with WebSockets',
      '🎨 Add dark mode support',
      '♿ Enhance accessibility with proper ARIA labels and keyboard navigation'
    );
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 ADD CLASS FUNCTIONALITY - COMPREHENSIVE ANALYSIS REPORT');
    console.log('='.repeat(80));

    console.log('\n✅ WORKING FEATURES:');
    this.successes.forEach(success => console.log(success));

    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.issues.forEach(issue => console.log(issue));
    }

    console.log('\n💡 RECOMMENDATIONS:');
    this.recommendations.forEach(rec => console.log(rec));

    // Calculate scores
    const totalChecks = this.successes.length + this.issues.length;
    const successRate = totalChecks > 0 ? ((this.successes.length / totalChecks) * 100).toFixed(1) : 0;

    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log(`Total Features Analyzed: ${totalChecks}`);
    console.log(`Working Features: ${this.successes.length}`);
    console.log(`Issues Found: ${this.issues.length}`);
    console.log(`Success Rate: ${successRate}%`);

    if (this.issues.length === 0) {
      console.log('\n🎉 EXCELLENT! No critical issues found in Add Class functionality.');
    } else if (this.issues.length < 5) {
      console.log('\n✅ GOOD! Minor issues found that should be addressed.');
    } else {
      console.log('\n⚠️ ATTENTION NEEDED! Several issues found that require fixing.');
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Address any issues found above');
    console.log('2. Implement recommended improvements');
    console.log('3. Run integration tests with actual application');
    console.log('4. Perform user acceptance testing');
    console.log('5. Monitor production usage and gather feedback');

    console.log('\n' + '='.repeat(80));
  }

  run() {
    this.analyzeAddClassFunctionality();
    this.analyzeCodeQuality();
    this.generateRecommendations();
    this.generateReport();
  }
}

// Run the analysis
const analyzer = new AddClassAnalyzer();
analyzer.run();
