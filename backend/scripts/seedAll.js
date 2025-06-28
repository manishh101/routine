const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const connectDB = require('../config/db');

// Import models
const Program = require('../models/Program');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');
const ProgramSemester = require('../models/ProgramSemester');
const RoutineSlot = require('../models/RoutineSlot');

const seedAll = async () => {
  try {
    console.log('🚀 Starting comprehensive database seeding...\n');

    // Connect to database
    await connectDB();

    // 1. Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Program.deleteMany({}),
      Subject.deleteMany({}),
      Teacher.deleteMany({}),
      Room.deleteMany({}),
      TimeSlot.deleteMany({}),
      ProgramSemester.deleteMany({}),
      RoutineSlot.deleteMany({})
    ]);
    console.log('✅ Cleared existing data\n');

    // 2. Seed Programs
    console.log('📚 Seeding Programs...');
    const programs = [
      {
        name: 'Bachelor in Computer Engineering',
        code: 'BCT',
        level: 'Bachelor',
        duration: 4,
        totalSemesters: 8,
        department: 'Computer Engineering',
        isActive: true
      },
      {
        name: 'Bachelor in Civil Engineering',
        code: 'BCE',
        level: 'Bachelor',
        duration: 4,
        totalSemesters: 8,
        department: 'Civil Engineering',
        isActive: true
      }
    ];
    const insertedPrograms = await Program.insertMany(programs);
    console.log(`✅ Seeded ${insertedPrograms.length} programs\n`);

    // 3. Seed Subjects
    console.log('📖 Seeding Subjects...');
    const subjects = [
      // Semester 1
      { code: 'MATH101', name: 'Engineering Mathematics I', theory: 3, practical: 1, credits: 3.5, semester: 1, programCode: 'BCT' },
      { code: 'PHYS101', name: 'Engineering Physics', theory: 3, practical: 1, credits: 3.5, semester: 1, programCode: 'BCT' },
      { code: 'CHEM101', name: 'Engineering Chemistry', theory: 3, practical: 1, credits: 3.5, semester: 1, programCode: 'BCT' },
      { code: 'ENG101', name: 'English', theory: 3, practical: 0, credits: 3, semester: 1, programCode: 'BCT' },
      { code: 'DRAW101', name: 'Engineering Drawing', theory: 2, practical: 3, credits: 3.5, semester: 1, programCode: 'BCT' },
      { code: 'COMP101', name: 'Programming in C', theory: 3, practical: 1.5, credits: 4, semester: 1, programCode: 'BCT' },
      
      // Semester 2
      { code: 'MATH102', name: 'Engineering Mathematics II', theory: 3, practical: 1, credits: 3.5, semester: 2, programCode: 'BCT' },
      { code: 'ELEC201', name: 'Electronic Devices and Circuits', theory: 3, practical: 1, credits: 3.5, semester: 2, programCode: 'BCT' },
      { code: 'ELEC202', name: 'Digital Electronics', theory: 3, practical: 1, credits: 3.5, semester: 2, programCode: 'BCT' },
      { code: 'ELEC203', name: 'Analog Electronics', theory: 3, practical: 1, credits: 3.5, semester: 2, programCode: 'BCT' },
      { code: 'COMP202', name: 'Object Oriented Programming', theory: 3, practical: 1.5, credits: 4, semester: 2, programCode: 'BCT' },
      { code: 'ELEC101', name: 'Circuit Analysis', theory: 3, practical: 1, credits: 3.5, semester: 2, programCode: 'BCT' },
      
      // Semester 3
      { code: 'MATH103', name: 'Engineering Mathematics III', theory: 3, practical: 1, credits: 3.5, semester: 3, programCode: 'BCT' },
      { code: 'COMP201', name: 'Data Structures and Algorithms', theory: 3, practical: 1.5, credits: 4, semester: 3, programCode: 'BCT' },
      { code: 'COMP203', name: 'Computer Organization and Architecture', theory: 3, practical: 1, credits: 3.5, semester: 3, programCode: 'BCT' },
      { code: 'ELEC301', name: 'Microprocessors', theory: 3, practical: 1, credits: 3.5, semester: 3, programCode: 'BCT' },
      { code: 'ELEC302', name: 'Communication Systems', theory: 3, practical: 1, credits: 3.5, semester: 3, programCode: 'BCT' },
      { code: 'ELEC303', name: 'Signal Processing', theory: 3, practical: 1, credits: 3.5, semester: 3, programCode: 'BCT' },
      
      // Semester 4
      { code: 'COMP301', name: 'Database Management System', theory: 3, practical: 1.5, credits: 4, semester: 4, programCode: 'BCT' },
      { code: 'COMP302', name: 'Computer Networks', theory: 3, practical: 1, credits: 3.5, semester: 4, programCode: 'BCT' },
      { code: 'COMP303', name: 'Operating Systems', theory: 3, practical: 1, credits: 3.5, semester: 4, programCode: 'BCT' },
      { code: 'COMP401', name: 'Software Engineering', theory: 3, practical: 1, credits: 3.5, semester: 4, programCode: 'BCT' },
      { code: 'COMP402', name: 'Web Technology', theory: 3, practical: 1.5, credits: 4, semester: 4, programCode: 'BCT' },
      { code: 'COMP403', name: 'Computer Graphics', theory: 3, practical: 1, credits: 3.5, semester: 4, programCode: 'BCT' }
    ];
    const insertedSubjects = await Subject.insertMany(subjects);
    console.log(`✅ Seeded ${insertedSubjects.length} subjects\n`);

    // 4. Seed Teachers
    console.log('👨‍🏫 Seeding Teachers...');
    const teachers = [
      {
        fullName: 'Dr. Shyam Kumar Shrestha',
        shortName: 'Dr. SK',
        name: 'Dr. Shyam Kumar Shrestha',
        email: 'shyam.shrestha@ioe.edu.np',
        department: 'Computer Science',
        designation: 'Professor',
        isActive: true
      },
      {
        fullName: 'Prof. Dr. Narayan Prasad Adhikari',
        shortName: 'Prof. NP',
        name: 'Prof. Dr. Narayan Prasad Adhikari',
        email: 'narayan.adhikari@ioe.edu.np',
        department: 'Electrical Engineering',
        designation: 'Professor',
        isActive: true
      },
      {
        fullName: 'Dr. Prakash Sayami',
        shortName: 'Dr. PS',
        name: 'Dr. Prakash Sayami',
        email: 'prakash.sayami@ioe.edu.np',
        department: 'Computer Science',
        designation: 'Associate Professor',
        isActive: true
      },
      {
        fullName: 'Er. Sita Sharma',
        shortName: 'Er. SS',
        name: 'Er. Sita Sharma',
        email: 'sita.sharma@ioe.edu.np',
        department: 'Electronics Engineering',
        designation: 'Lecturer',
        isActive: true
      },
      {
        fullName: 'Dr. Ram Bahadur Thapa',
        shortName: 'Dr. RB',
        name: 'Dr. Ram Bahadur Thapa',
        email: 'ram.thapa@ioe.edu.np',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isActive: true
      },
      {
        fullName: 'Er. Maya Devi Karki',
        shortName: 'Er. MD',
        name: 'Er. Maya Devi Karki',
        email: 'maya.karki@ioe.edu.np',
        department: 'Electronics Engineering',
        designation: 'Lecturer',
        isActive: true
      }
    ];
    const insertedTeachers = await Teacher.insertMany(teachers);
    console.log(`✅ Seeded ${insertedTeachers.length} teachers\n`);

    // 5. Seed Rooms
    console.log('🏫 Seeding Rooms...');
    const rooms = [
      { name: 'Room A-101 (Lecture Hall)', type: 'Lecture Hall', capacity: 60, isActive: true },
      { name: 'Room A-102 (Lecture Hall)', type: 'Lecture Hall', capacity: 60, isActive: true },
      { name: 'Room A-201 (Tutorial Room)', type: 'Tutorial Room', capacity: 30, isActive: true },
      { name: 'Computer Lab 1', type: 'Lab-Computer', capacity: 40, isActive: true },
      { name: 'Computer Lab 2', type: 'Lab-Computer', capacity: 40, isActive: true },
      { name: 'Electronics Lab 1', type: 'Lab-Electronics', capacity: 30, isActive: true },
      { name: 'Electronics Lab 2', type: 'Lab-Electronics', capacity: 30, isActive: true },
      { name: 'Main Auditorium', type: 'Auditorium', capacity: 200, isActive: true }
    ];
    const insertedRooms = await Room.insertMany(rooms);
    console.log(`✅ Seeded ${insertedRooms.length} rooms\n`);

    // 6. Seed Time Slots
    console.log('⏰ Seeding Time Slots...');
    const timeSlots = [
      { _id: 0, label: 'Period 1', startTime: '7:30', endTime: '8:15', sortOrder: 0, isBreak: false },
      { _id: 1, label: 'Period 2', startTime: '8:15', endTime: '9:00', sortOrder: 1, isBreak: false },
      { _id: 2, label: 'Break', startTime: '9:00', endTime: '9:15', sortOrder: 2, isBreak: true },
      { _id: 3, label: 'Period 3', startTime: '9:15', endTime: '10:00', sortOrder: 3, isBreak: false },
      { _id: 4, label: 'Period 4', startTime: '10:00', endTime: '10:45', sortOrder: 4, isBreak: false },
      { _id: 5, label: 'Period 5', startTime: '10:45', endTime: '11:30', sortOrder: 5, isBreak: false },
      { _id: 6, label: 'Lunch Break', startTime: '11:30', endTime: '12:30', sortOrder: 6, isBreak: true },
      { _id: 7, label: 'Period 6', startTime: '12:30', endTime: '1:15', sortOrder: 7, isBreak: false },
      { _id: 8, label: 'Period 7', startTime: '1:15', endTime: '2:00', sortOrder: 8, isBreak: false }
    ];
    const insertedTimeSlots = await TimeSlot.insertMany(timeSlots);
    console.log(`✅ Seeded ${insertedTimeSlots.length} time slots\n`);

    // 7. Create Program Semesters
    console.log('📅 Creating Program Semesters...');
    const programSemesters = [];
    for (let semester = 1; semester <= 4; semester++) {
      const semesterSubjects = subjects.filter(s => s.semester === semester);
      programSemesters.push({
        programCode: 'BCT',
        semester: semester,
        subjects: semesterSubjects.map(s => s._id),
        isActive: true
      });
    }
    const insertedProgramSemesters = await ProgramSemester.insertMany(programSemesters);
    console.log(`✅ Created ${insertedProgramSemesters.length} program semesters\n`);

    // 8. Create Sample Routine Data
    console.log('📋 Creating Sample Routine Data...');
    
    // Get inserted data for routine creation
    const allSubjects = await Subject.find();
    const allTeachers = await Teacher.find();
    const allRooms = await Room.find();
    const allTimeSlots = await TimeSlot.find({ isBreak: false }).sort({ sortOrder: 1 });

    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
    
    const getTeacherForSubject = (subjectCode) => {
      const subjectDepartmentMap = {
        'MATH': 'Computer Science',
        'PHYS': 'Electrical Engineering',
        'CHEM': 'Electronics Engineering',
        'ENG': 'Computer Science',
        'DRAW': 'Electronics Engineering',
        'COMP': 'Computer Science',
        'ELEC': 'Electronics Engineering'
      };
      
      const subjectPrefix = subjectCode.substring(0, 4);
      const preferredDept = subjectDepartmentMap[subjectPrefix] || 'Computer Science';
      const deptTeachers = allTeachers.filter(t => t.department === preferredDept);
      
      return deptTeachers.length > 0 ? getRandomItem(deptTeachers) : getRandomItem(allTeachers);
    };

    const getRoomForSubject = (subjectCode, classType) => {
      if (classType === 'P' || subjectCode.includes('COMP')) {
        const labs = allRooms.filter(r => r.type === 'Lab-Computer');
        return labs.length > 0 ? getRandomItem(labs) : getRandomItem(allRooms);
      } else if (subjectCode.includes('ELEC') || subjectCode.includes('DRAW')) {
        const labs = allRooms.filter(r => r.type === 'Lab-Electronics');
        return labs.length > 0 ? getRandomItem(labs) : getRandomItem(allRooms);
      } else {
        const lectureRooms = allRooms.filter(r => r.type === 'Lecture Hall');
        return lectureRooms.length > 0 ? getRandomItem(lectureRooms) : getRandomItem(allRooms);
      }
    };

    const routineSlots = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Create routines for BCT Semester 1, Sections AB and CD
    for (const section of ['AB', 'CD']) {
      console.log(`Creating routine for BCT Semester 1 Section ${section}...`);
      console.log(`Total subjects in database:`, allSubjects.length);
      console.log(`First 3 subjects:`, allSubjects.slice(0, 3).map(s => ({ code: s.code, semester: s.semester })));
      
      const semester1Subjects = allSubjects.filter(s => s.semester === 1);
      console.log(`Found ${semester1Subjects.length} subjects for semester 1`);
      
      if (semester1Subjects.length === 0) {
        console.log('⚠️  No semester 1 subjects found, using first 6 subjects');
        // Use first 6 subjects as fallback
        semester1Subjects.push(...allSubjects.slice(0, 6));
      }
      
      for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
        const daySubjects = semester1Subjects.slice(0, Math.min(4, semester1Subjects.length)); // Limit to 4 subjects per day
        
        for (let subjectIndex = 0; subjectIndex < daySubjects.length; subjectIndex++) {
          const subject = daySubjects[subjectIndex];
          const timeSlot = allTimeSlots[subjectIndex]; // Use first few non-break slots
          const teacher = getTeacherForSubject(subject.code);
          
          // Determine class type
          let classType = 'L'; // Default to Lecture
          if (subject.code.includes('COMP') && (dayIndex === 2 || dayIndex === 4)) {
            classType = 'P'; // Practical on Tuesday/Thursday
          } else if (subject.code.includes('DRAW')) {
            classType = 'P'; // Drawing is always practical
          }
          
          const room = getRoomForSubject(subject.code, classType);
          
          const routineSlot = {
            programCode: 'BCT',
            semester: 1,
            section: section,
            dayIndex: dayIndex,
            slotIndex: timeSlot._id, // Use timeSlot._id
            subjectId: subject._id,
            teacherIds: [teacher._id],
            roomId: room._id,
            classType: classType,
            notes: classType !== 'L' ? `${subject.name} ${classType === 'P' ? 'Practical' : 'Tutorial'}` : '',
            // Denormalized display fields
            subjectName_display: subject.name,
            subjectCode_display: subject.code,
            teacherShortNames_display: [teacher.shortName],
            roomName_display: room.name,
            timeSlot_display: `${timeSlot.startTime} - ${timeSlot.endTime}`,
            isActive: true
          };
          
          console.log(`Adding routine slot: ${subject.code} - ${timeSlot.label} - Day ${dayIndex}`);
          routineSlots.push(routineSlot);
        }
      }
    }

    if (routineSlots.length > 0) {
      await RoutineSlot.insertMany(routineSlots);
      console.log(`✅ Created ${routineSlots.length} routine slots\n`);
    }

    console.log('🎉 Database seeding completed successfully!\n');
    
    // Print summary
    console.log('📊 Summary:');
    console.log(`- Programs: ${insertedPrograms.length}`);
    console.log(`- Subjects: ${insertedSubjects.length}`);
    console.log(`- Teachers: ${insertedTeachers.length}`);
    console.log(`- Rooms: ${insertedRooms.length}`);
    console.log(`- Time Slots: ${insertedTimeSlots.length}`);
    console.log(`- Program Semesters: ${insertedProgramSemesters.length}`);
    console.log(`- Routine Slots: ${routineSlots.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
seedAll();
