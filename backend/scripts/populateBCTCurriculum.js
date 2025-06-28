const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');
const ProgramSemester = require('../models/ProgramSemester');
const Subject = require('../models/Subject');

// BCT Curriculum as per IOE Pulchowk Campus
const bctCurriculum = {
  1: [
    { code: 'MATH101', name: 'Engineering Mathematics I', theory: 3, practical: 1, credits: 3.5 },
    { code: 'PHYS101', name: 'Engineering Physics', theory: 3, practical: 1, credits: 3.5 },
    { code: 'CHEM101', name: 'Engineering Chemistry', theory: 3, practical: 1, credits: 3.5 },
    { code: 'ENG101', name: 'Basic English', theory: 3, practical: 0, credits: 3 },
    { code: 'DRAW101', name: 'Engineering Drawing I', theory: 1, practical: 3, credits: 2.5 },
    { code: 'COMP101', name: 'Computer Programming', theory: 2, practical: 3, credits: 3.5 }
  ],
  2: [
    { code: 'MATH102', name: 'Engineering Mathematics II', theory: 3, practical: 1, credits: 3.5 },
    { code: 'PHYS102', name: 'Applied Physics', theory: 3, practical: 1, credits: 3.5 },
    { code: 'ELEC101', name: 'Basic Electrical Engineering', theory: 3, practical: 1, credits: 3.5 },
    { code: 'DRAW102', name: 'Engineering Drawing II', theory: 1, practical: 3, credits: 2.5 },
    { code: 'MECH101', name: 'Applied Mechanics', theory: 3, practical: 1, credits: 3.5 },
    { code: 'WORK101', name: 'Workshop Technology', theory: 1, practical: 3, credits: 2.5 }
  ],
  3: [
    { code: 'MATH201', name: 'Engineering Mathematics III', theory: 3, practical: 1, credits: 3.5 },
    { code: 'STAT201', name: 'Probability and Statistics', theory: 3, practical: 1, credits: 3.5 },
    { code: 'ELEC201', name: 'Electric Circuit Theory', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP201', name: 'Object Oriented Programming', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP202', name: 'Data Structures and Algorithms', theory: 3, practical: 1, credits: 3.5 },
    { code: 'ELEC202', name: 'Electronic Devices and Circuits', theory: 3, practical: 1, credits: 3.5 }
  ],
  4: [
    { code: 'MATH202', name: 'Numerical Methods', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP301', name: 'Theory of Computation', theory: 3, practical: 0, credits: 3 },
    { code: 'COMP302', name: 'Computer Graphics', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP303', name: 'Instrumentation I', theory: 3, practical: 1, credits: 3.5 },
    { code: 'ELEC301', name: 'Logic Circuits', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP304', name: 'Software Engineering', theory: 3, practical: 0, credits: 3 }
  ],
  5: [
    { code: 'COMP401', name: 'Database Management System', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP402', name: 'Communication System', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP403', name: 'Operating System', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP404', name: 'Microprocessor', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP405', name: 'Data Communication', theory: 3, practical: 1, credits: 3.5 },
    { code: 'MGMT401', name: 'Engineering Economics', theory: 3, practical: 0, credits: 3 }
  ],
  6: [
    { code: 'COMP501', name: 'Artificial Intelligence', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP502', name: 'Computer Networks', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP503', name: 'Computer Organization and Architecture', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP504', name: 'Object Oriented Analysis and Design', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP505', name: 'Digital Signal Analysis and Processing', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP506', name: 'Minor Project', theory: 0, practical: 3, credits: 1.5 }
  ],
  7: [
    { code: 'COMP601', name: 'Simulation and Modeling', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP602', name: 'Web Technology', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP603', name: 'Distributed Systems', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP604', name: 'Digital System Design', theory: 3, practical: 1, credits: 3.5 },
    { code: 'ELEC601', name: 'Information Systems', theory: 3, practical: 0, credits: 3 },
    { code: 'COMP605', name: 'Elective I', theory: 3, practical: 0, credits: 3 }
  ],
  8: [
    { code: 'COMP701', name: 'Advanced Java Programming', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP702', name: 'Data Warehousing and Data Mining', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP703', name: 'Parallel Processing', theory: 3, practical: 0, credits: 3 },
    { code: 'COMP704', name: 'Project Work', theory: 0, practical: 3, credits: 1.5 },
    { code: 'COMP705', name: 'Network Security', theory: 3, practical: 1, credits: 3.5 },
    { code: 'COMP706', name: 'Elective II', theory: 3, practical: 0, credits: 3 }
  ]
};

async function populateBCTCurriculum() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');

    console.log('Starting BCT curriculum population...');

    // First, create/update all subjects
    for (let semester = 1; semester <= 8; semester++) {
      const subjects = bctCurriculum[semester];
      
      for (const subjectData of subjects) {
        // Create or update subject
        const subject = await Subject.findOneAndUpdate(
          { code: subjectData.code },
          {
            name: subjectData.name,
            code: subjectData.code,
            credits: subjectData.credits,
            courseType: subjectData.code.includes('ELEC') ? 'Elective' : 'Core',
            isElective: subjectData.name.includes('Elective'),
            department: 'Computer Engineering',
            description: subjectData.name,
            defaultHoursTheory: subjectData.theory,
            defaultHoursPractical: subjectData.practical,
            isActive: true
          },
          { 
            new: true, 
            upsert: true,
            setDefaultsOnInsert: true
          }
        );

        console.log(`✓ Subject created/updated: ${subject.code} - ${subject.name}`);
      }
    }

    // Now create/update program-semester records
    for (let semester = 1; semester <= 8; semester++) {
      const subjects = bctCurriculum[semester];
      
      // Get all subject IDs for this semester
      const subjectsOffered = [];
      for (const subjectData of subjects) {
        const subject = await Subject.findOne({ code: subjectData.code });
        if (subject) {
          subjectsOffered.push({
            subjectId: subject._id,
            subjectCode_display: subject.code,
            subjectName_display: subject.name,
            courseType: subject.courseType,
            isElective: subject.isElective,
            defaultHoursTheory: subjectData.theory,
            defaultHoursPractical: subjectData.practical
          });
        }
      }

      // Create or update program-semester record
      const programSemester = await ProgramSemester.findOneAndUpdate(
        { 
          programCode: 'BCT',
          semester: semester
        },
        {
          programCode: 'BCT',
          semester: semester,
          subjectsOffered: subjectsOffered,
          academicYear: '2024-2025',
          status: 'Active',
          isActive: true
        },
        { 
          new: true, 
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`✓ BCT Semester ${semester} updated with ${subjectsOffered.length} subjects`);
    }

    console.log('\n🎉 BCT curriculum population completed successfully!');
    console.log('📚 Summary:');
    
    for (let semester = 1; semester <= 8; semester++) {
      const count = bctCurriculum[semester].length;
      console.log(`   Semester ${semester}: ${count} subjects`);
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error populating BCT curriculum:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  console.log('🚀 Populating BCT Curriculum for IOE Pulchowk Campus...\n');
  populateBCTCurriculum();
}

module.exports = populateBCTCurriculum;
