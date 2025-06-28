const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('../config/db')();

// Import models
const Program = require('../models/Program');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const TimeSlotDefinition = require('../models/TimeSlot');
const ProgramSemester = require('../models/ProgramSemester');
const RoutineSlot = require('../models/RoutineSlot');

const populateBCTRoutines = async () => {
  try {
    console.log('🏫 Populating BCT Routines for Semesters 1-4, Sections AB and CD...\n');

    // Clear existing routine slots for BCT Semesters 1-4
    console.log('🧹 Clearing existing BCT routine slots for semesters 1-4...');
    await RoutineSlot.deleteMany({ 
      programCode: 'BCT', 
      semester: { $in: [1, 2, 3, 4] },
      section: { $in: ['AB', 'CD'] } 
    });
    console.log('✅ Cleared existing routine slots\n');

    // Get required data
    const bctProgram = await Program.findOne({ code: 'BCT' });
    if (!bctProgram) {
      throw new Error('BCT Program not found');
    }
    
    const teachers = await Teacher.find();
    const rooms = await Room.find();
    const subjects = await Subject.find();
    const timeSlots = await TimeSlotDefinition.find().sort({ sortOrder: 1 });

    if (!bctProgram) {
      console.error('❌ BCT Program not found');
      return;
    }

    console.log(`👨‍🏫 Found ${teachers.length} teachers`);
    console.log(`📚 Found ${subjects.length} subjects`);
    console.log(`📚 First few subjects from DB:`, subjects.slice(0, 3).map(s => ({code: s.code, id: s._id})));
    console.log(`🏫 Found ${rooms.length} rooms`);
    console.log(`⏰ Found ${timeSlots.length} time slots\n`);

    // Helper functions
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
    
    const getTeacherForSubject = (subjectCode) => {
      const subjectDepartmentMap = {
        // Semester 1
        'MATH101': 'Computer Science',
        'PHYS101': 'Electrical Engineering', 
        'CHEM101': 'Electronics Engineering',
        'ENG101': 'Computer Science',
        'DRAW101': 'Electronics Engineering',
        'COMP101': 'Computer Science',
        // Semester 2
        'MATH102': 'Computer Science',
        'ELEC201': 'Electronics Engineering',
        'ELEC202': 'Electronics Engineering', 
        'ELEC203': 'Electronics Engineering',
        'COMP202': 'Computer Science',
        'ELEC101': 'Electronics Engineering',
        // Semester 3
        'MATH103': 'Computer Science',
        'COMP201': 'Computer Science',
        'COMP203': 'Computer Science',
        'ELEC301': 'Electronics Engineering',
        'ELEC302': 'Electronics Engineering',
        'ELEC303': 'Electronics Engineering',
        // Semester 4
        'COMP301': 'Computer Science',
        'COMP302': 'Computer Science',
        'COMP303': 'Computer Science',
        'COMP401': 'Computer Science',
        'COMP402': 'Computer Science',
        'COMP403': 'Computer Science'
      };
      
      const preferredDept = subjectDepartmentMap[subjectCode] || 'Computer Science';
      const deptTeachers = teachers.filter(t => t.department === preferredDept);
      
      return deptTeachers.length > 0 ? getRandomItem(deptTeachers) : getRandomItem(teachers);
    };

    const getRoomForSubject = (subjectCode, classType) => {
      if (classType === 'P' || subjectCode.includes('COMP') || subjectCode.includes('DATA') || 
          subjectCode.includes('WEB') || subjectCode.includes('DB')) {
        const labs = rooms.filter(r => r.type === 'Lab-Computer');
        return labs.length > 0 ? getRandomItem(labs) : getRandomItem(rooms);
      } else if (subjectCode.includes('ELEC') || subjectCode.includes('DRAW')) {
        const labs = rooms.filter(r => r.type === 'Lab-Electronics');
        return labs.length > 0 ? getRandomItem(labs) : getRandomItem(rooms);
      } else {
        const lectureRooms = rooms.filter(r => r.type === 'Lecture Hall');
        return lectureRooms.length > 0 ? getRandomItem(lectureRooms) : getRandomItem(rooms);
      }
    };

    // Define subjects for each semester (using actual database subject codes)
    const semesterSubjects = {
      1: [
        { code: 'MATH101', name: 'Engineering Mathematics I', credits: 3 },
        { code: 'PHYS101', name: 'Engineering Physics', credits: 3 },
        { code: 'CHEM101', name: 'Engineering Chemistry', credits: 3 },
        { code: 'ENG101', name: 'English', credits: 3 },
        { code: 'DRAW101', name: 'Engineering Drawing', credits: 3 },
        { code: 'COMP101', name: 'Programming in C', credits: 3 }
      ],
      2: [
        { code: 'MATH102', name: 'Engineering Mathematics II', credits: 3 },
        { code: 'ELEC201', name: 'Electronic Devices and Circuits', credits: 3 },
        { code: 'ELEC202', name: 'Digital Electronics', credits: 3 },
        { code: 'ELEC203', name: 'Analog Electronics', credits: 3 },
        { code: 'COMP202', name: 'Object Oriented Programming', credits: 3 },
        { code: 'ELEC101', name: 'Circuit Analysis', credits: 3 }
      ],
      3: [
        { code: 'MATH103', name: 'Engineering Mathematics III', credits: 3 },
        { code: 'COMP201', name: 'Data Structures and Algorithms', credits: 3 },
        { code: 'COMP203', name: 'Computer Organization and Architecture', credits: 3 },
        { code: 'ELEC301', name: 'Microprocessors', credits: 3 },
        { code: 'ELEC302', name: 'Communication Systems', credits: 3 },
        { code: 'ELEC303', name: 'Signal Processing', credits: 3 }
      ],
      4: [
        { code: 'COMP301', name: 'Database Management System', credits: 3 },
        { code: 'COMP302', name: 'Computer Networks', credits: 3 },
        { code: 'COMP303', name: 'Operating Systems', credits: 3 },
        { code: 'COMP401', name: 'Software Engineering', credits: 3 },
        { code: 'COMP402', name: 'Web Technology', credits: 3 },
        { code: 'COMP403', name: 'Computer Graphics', credits: 3 }
      ]
    };

    // Define different routine patterns for AB and CD sections
    const createSectionRoutines = (semester, semesterSubjectsArray, section) => {
      const routineSlots = [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      // Different patterns for AB and CD sections
      const sectionPatterns = {
        'AB': {
          1: [ // Semester 1 AB
            [0, 1, 3, 4, 5], // Sunday: MATH, PHYS, CHEM, ENG, DRAW
            [1, 0, 2, 5, -1], // Monday: PHYS, MATH, CHEM, COMP, -
            [2, 3, 0, 5, 1], // Tuesday: CHEM, ENG, MATH, COMP(P), PHYS
            [3, 4, 1, 0, 2], // Wednesday: ENG, DRAW(P), PHYS, MATH, CHEM
            [4, 5, 2, 1, 3], // Thursday: DRAW(P), COMP(P), CHEM(P), PHYS(P), ENG
            [0, 2, 4, 5, 1]  // Friday: MATH, CHEM, DRAW, COMP, PHYS
          ],
          2: [ // Semester 2 AB
            [0, 1, 3, 4, 5], // Sunday: MATH2, PHYS2, ENG2, COMP2, MECH
            [1, 0, 2, 4, -1], // Monday: PHYS2, MATH2, STAT, COMP2(P), -
            [2, 3, 0, 4, 1], // Tuesday: STAT, ENG2, MATH2, COMP2(P), PHYS2
            [3, 5, 1, 0, 2], // Wednesday: ENG2, MECH(P), PHYS2, MATH2, STAT
            [5, 4, 2, 1, 3], // Thursday: MECH(P), COMP2(P), STAT(P), PHYS2(P), ENG2
            [0, 2, 5, 4, 1]  // Friday: MATH2, STAT, MECH, COMP2, PHYS2
          ],
          3: [ // Semester 3 AB
            [0, 1, 3, 4, 5], // Sunday: MATH3, DATA, ELEC, SOFT, ARCH
            [1, 0, 2, 4, -1], // Monday: DATA(P), MATH3, ALGO, SOFT(P), -
            [2, 3, 0, 1, 4], // Tuesday: ALGO, ELEC(P), MATH3, DATA(P), SOFT
            [3, 5, 1, 0, 2], // Wednesday: ELEC(P), ARCH(P), DATA, MATH3, ALGO
            [5, 4, 2, 1, 3], // Thursday: ARCH(P), SOFT(P), ALGO(P), DATA(P), ELEC
            [0, 2, 5, 4, 1]  // Friday: MATH3, ALGO, ARCH, SOFT, DATA
          ],
          4: [ // Semester 4 AB
            [0, 1, 3, 4, 5], // Sunday: MATH4, DB, NET, WEB, AI
            [1, 0, 2, 4, -1], // Monday: DB(P), MATH4, OS, WEB(P), -
            [2, 3, 0, 1, 4], // Tuesday: OS, NET(P), MATH4, DB(P), WEB
            [3, 5, 1, 0, 2], // Wednesday: NET(P), AI(P), DB, MATH4, OS
            [5, 4, 2, 1, 3], // Thursday: AI(P), WEB(P), OS(P), DB(P), NET
            [0, 2, 5, 4, 1]  // Friday: MATH4, OS, AI, WEB, DB
          ]
        },
        'CD': {
          1: [ // Semester 1 CD (Different pattern)
            [1, 0, 4, 3, 2], // Sunday: PHYS, MATH, DRAW, ENG, CHEM
            [0, 2, 5, 1, -1], // Monday: MATH, CHEM, COMP, PHYS, -
            [3, 4, 0, 2, 5], // Tuesday: ENG, DRAW(P), MATH, CHEM, COMP(P)
            [2, 5, 3, 4, 0], // Wednesday: CHEM, COMP(P), ENG, DRAW(P), MATH
            [5, 1, 4, 2, 3], // Thursday: COMP(P), PHYS(P), DRAW(P), CHEM(P), ENG
            [1, 3, 0, 5, 2]  // Friday: PHYS, ENG, MATH, COMP, CHEM
          ],
          2: [ // Semester 2 CD
            [1, 0, 4, 3, 2], // Sunday: PHYS2, MATH2, COMP2, ENG2, STAT
            [0, 2, 4, 1, -1], // Monday: MATH2, STAT, COMP2(P), PHYS2, -
            [3, 5, 0, 2, 4], // Tuesday: ENG2, MECH(P), MATH2, STAT, COMP2(P)
            [2, 4, 3, 5, 0], // Wednesday: STAT, COMP2(P), ENG2, MECH(P), MATH2
            [4, 1, 5, 2, 3], // Thursday: COMP2(P), PHYS2(P), MECH(P), STAT(P), ENG2
            [1, 3, 0, 4, 2]  // Friday: PHYS2, ENG2, MATH2, COMP2, STAT
          ],
          3: [ // Semester 3 CD
            [1, 0, 4, 3, 2], // Sunday: DATA, MATH3, SOFT, ELEC, ALGO
            [0, 2, 4, 1, -1], // Monday: MATH3, ALGO, SOFT(P), DATA(P), -
            [3, 5, 0, 2, 4], // Tuesday: ELEC(P), ARCH(P), MATH3, ALGO, SOFT(P)
            [2, 4, 3, 5, 0], // Wednesday: ALGO, SOFT(P), ELEC(P), ARCH(P), MATH3
            [4, 1, 5, 2, 3], // Thursday: SOFT(P), DATA(P), ARCH(P), ALGO(P), ELEC
            [1, 3, 0, 4, 2]  // Friday: DATA, ELEC, MATH3, SOFT, ALGO
          ],
          4: [ // Semester 4 CD
            [1, 0, 4, 3, 2], // Sunday: DB, MATH4, WEB, NET, OS
            [0, 2, 4, 1, -1], // Monday: MATH4, OS, WEB(P), DB(P), -
            [3, 5, 0, 2, 4], // Tuesday: NET(P), AI(P), MATH4, OS, WEB(P)
            [2, 4, 3, 5, 0], // Wednesday: OS, WEB(P), NET(P), AI(P), MATH4
            [4, 1, 5, 2, 3], // Thursday: WEB(P), DB(P), AI(P), OS(P), NET
            [1, 3, 0, 4, 2]  // Friday: DB, NET, MATH4, WEB, OS
          ]
        }
      };

      const pattern = sectionPatterns[section][semester];
      
      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const dayPattern = pattern[dayIndex];
        
        let slotCounter = 0;
        for (let timeSlotIndex = 0; timeSlotIndex < timeSlots.length; timeSlotIndex++) {
          const timeSlot = timeSlots[timeSlotIndex];
          
          // Skip break slots
          if (timeSlot.isBreak) {
            continue;
          }
          
          // Check if this slot should have a class
          if (slotCounter >= dayPattern.length || dayPattern[slotCounter] === -1) {
            slotCounter++;
            continue;
          }
          
          const subjectIndex = dayPattern[slotCounter];
          const subject = semesterSubjectsArray[subjectIndex];
          
          if (!subject) {
            slotCounter++;
            continue;
          }
          
          // Determine class type
          let classType = 'L'; // Default to Lecture
          const isLabSubject = ['COMP', 'DRAW', 'DATA', 'SOFT', 'WEB', 'DB', 'AI'].some(code => subject.code.includes(code));
          const isPhysicsChemistry = ['PHYS', 'CHEM', 'ELEC', 'MECH', 'ARCH', 'NET', 'OS'].some(code => subject.code.includes(code));
          
          // Assign practicals based on day and subject
          if (isLabSubject && (dayIndex === 2 || dayIndex === 4)) { // Tuesday, Thursday
            classType = 'P';
          } else if (isPhysicsChemistry && dayIndex === 4) { // Thursday
            classType = 'P';
          } else if (subject.code.includes('DRAW')) {
            classType = 'P'; // Drawing is always practical
          } else if (dayIndex === 1 && slotCounter === 1) { // Monday 2nd period tutorial
            classType = 'T';
          }
          
          const teacher = getTeacherForSubject(subject.code);
          const room = getRoomForSubject(subject.code, classType);
          
          // Find the subject in database by code
          const dbSubject = subjects.find(s => s.code === subject.code);
          if (!dbSubject) {
            console.warn(`⚠️  Subject ${subject.code} not found in database, skipping...`);
            console.log(`Looking for: ${subject.code}, Available: ${subjects.map(s => s.code).join(', ')}`);
            slotCounter++;
            continue;
          }
          
          // Map class type to schema enum
          let type = 'lecture';
          if (classType === 'P') type = 'practical';
          else if (classType === 'T') type = 'tutorial';
          
          // Find day index
          const dayMap = {
            'sunday': 0, 
            'monday': 1, 
            'tuesday': 2, 
            'wednesday': 3, 
            'thursday': 4, 
            'friday': 5, 
            'saturday': 6
          };
          
          // No need to redefine - use the existing classType variable
          // Convert legacy type names to our schema format if needed
          if (type === 'practical' && classType !== 'P') classType = 'P';
          else if (type === 'tutorial' && classType !== 'T') classType = 'T';
          
          const routineSlot = {
            programCode: 'BCT',
            semester: semester,
            section: section,
            dayIndex: dayMap[day.toLowerCase()],
            slotIndex: timeSlot.sortOrder || timeSlots.findIndex(t => t._id.toString() === timeSlot._id.toString()),
            subjectId: dbSubject._id,
            teacherIds: [teacher._id],
            roomId: room._id,
            classType: classType,
            notes: type !== 'lecture' ? `${dbSubject.name} ${type}` : '',
            // Denormalized display fields
            subjectName_display: dbSubject.name,
            subjectCode_display: dbSubject.code,
            teacherShortNames_display: [teacher.shortName || teacher.name.split(' ').map(n => n[0]).join('')],
            roomName_display: room.name,
            timeSlot_display: `${timeSlot.startTime} - ${timeSlot.endTime}`
          };
          
          routineSlots.push(routineSlot);
          slotCounter++;
        }
      }
      
      return routineSlots;
    };

    // Create routines for all semesters and sections
    const allRoutineSlots = [];
    
    for (let semester = 1; semester <= 4; semester++) {
      const semesterSubjectsArray = semesterSubjects[semester];
      console.log(`📅 Creating routines for BCT Semester ${semester}...`);
      
      for (const section of ['AB', 'CD']) {
        console.log(`  📚 Section ${section}...`);
        const sectionRoutines = createSectionRoutines(semester, semesterSubjectsArray, section);
        allRoutineSlots.push(...sectionRoutines);
      }
    }

    // Insert all routine slots
    console.log(`\n💾 Inserting ${allRoutineSlots.length} routine slots...`);
    console.log('Sample routine slot:', JSON.stringify(allRoutineSlots[0], null, 2));
    await RoutineSlot.insertMany(allRoutineSlots);
    
    console.log('✅ Successfully populated BCT routines for semesters 1-4!\n');
    
    // Print summary
    for (let semester = 1; semester <= 4; semester++) {
      for (const section of ['AB', 'CD']) {
        const count = allRoutineSlots.filter(slot => 
          slot.semester === semester && slot.section === section
        ).length;
        console.log(`📊 BCT Semester ${semester} Section ${section}: ${count} classes scheduled`);
      }
    }
    
    console.log('\n🎉 BCT Routine population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating BCT routines:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
populateBCTRoutines();
