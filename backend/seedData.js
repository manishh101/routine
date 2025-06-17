require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Program = require('./models/Program');
const Subject = require('./models/Subject');
const Class = require('./models/Class');

const connectDB = require('./config/db');

const initializeData = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Program.deleteMany({});
    await Subject.deleteMany({});
    await Class.deleteMany({});
    
    console.log('👤 Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    
    const teacherUser = await User.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'teacher123',
      role: 'teacher'
    });
    
    console.log('👨‍🏫 Creating teachers...');
    const teachers = await Teacher.insertMany([
      {
        name: 'Dr. John Smith',
        email: 'john.smith@university.edu',
        department: 'Computer Science',
        designation: 'Professor',
        phoneNumber: '+1-234-567-8901',
        userId: teacherUser._id
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        department: 'Computer Science',
        designation: 'Associate Professor',
        phoneNumber: '+1-234-567-8902'
      },
      {
        name: 'Prof. Michael Brown',
        email: 'michael.brown@university.edu',
        department: 'Mathematics',
        designation: 'Professor',
        phoneNumber: '+1-234-567-8903'
      },
      {
        name: 'Dr. Emily Davis',
        email: 'emily.davis@university.edu',
        department: 'Physics',
        designation: 'Assistant Professor',
        phoneNumber: '+1-234-567-8904'
      },
      {
        name: 'Prof. Robert Wilson',
        email: 'robert.wilson@university.edu',
        department: 'Computer Science',
        designation: 'Associate Professor',
        phoneNumber: '+1-234-567-8905'
      }
    ]);
    
    console.log('📚 Creating programs...');
    const programs = await Program.insertMany([
      {
        name: 'Bachelor of Engineering in Computer Science',
        code: 'BE-CS',
        department: 'Computer Science',
        duration: 8
      },
      {
        name: 'Bachelor of Engineering in Information Technology',
        code: 'BE-IT',
        department: 'Information Technology',
        duration: 8
      },
      {
        name: 'Bachelor of Engineering in Electronics',
        code: 'BE-ECE',
        department: 'Electronics and Communication',
        duration: 8
      }
    ]);
    
    console.log('📖 Creating subjects...');
    const subjects = await Subject.insertMany([
      // Computer Science Program - Semester 1
      {
        name: 'Programming in C',
        code: 'CS101',
        programId: programs[0]._id,
        semester: 1,
        creditHours: 3,
        lectureHoursPerWeek: 3,
        practicalHoursPerWeek: 2
      },
      {
        name: 'Mathematics I',
        code: 'MATH101',
        programId: programs[0]._id,
        semester: 1,
        creditHours: 4,
        lectureHoursPerWeek: 4,
        practicalHoursPerWeek: 0
      },
      {
        name: 'Physics',
        code: 'PHY101',
        programId: programs[0]._id,
        semester: 1,
        creditHours: 3,
        lectureHoursPerWeek: 3,
        practicalHoursPerWeek: 1
      },
      // Computer Science Program - Semester 2
      {
        name: 'Object Oriented Programming',
        code: 'CS201',
        programId: programs[0]._id,
        semester: 2,
        creditHours: 3,
        lectureHoursPerWeek: 3,
        practicalHoursPerWeek: 2
      },
      {
        name: 'Data Structures',
        code: 'CS202',
        programId: programs[0]._id,
        semester: 2,
        creditHours: 3,
        lectureHoursPerWeek: 3,
        practicalHoursPerWeek: 2
      },
      {
        name: 'Mathematics II',
        code: 'MATH201',
        programId: programs[0]._id,
        semester: 2,
        creditHours: 4,
        lectureHoursPerWeek: 4,
        practicalHoursPerWeek: 0
      },
      // IT Program - Semester 1
      {
        name: 'Introduction to IT',
        code: 'IT101',
        programId: programs[1]._id,
        semester: 1,
        creditHours: 3,
        lectureHoursPerWeek: 3,
        practicalHoursPerWeek: 1
      },
      {
        name: 'Web Development',
        code: 'IT102',
        programId: programs[1]._id,
        semester: 1,
        creditHours: 3,
        lectureHoursPerWeek: 2,
        practicalHoursPerWeek: 3
      }
    ]);
    
    console.log('🕐 Creating classes...');
    const classes = await Class.insertMany([
      // Monday Classes
      {
        programId: programs[0]._id,
        subjectId: subjects[0]._id, // Programming in C
        teacherId: teachers[0]._id,
        day: 'monday',
        startTime: '09:00',
        endTime: '10:00',
        roomNumber: 'CS-101',
        type: 'lecture',
        semester: 1
      },
      {
        programId: programs[0]._id,
        subjectId: subjects[1]._id, // Mathematics I
        teacherId: teachers[2]._id,
        day: 'monday',
        startTime: '10:00',
        endTime: '11:00',
        roomNumber: 'MATH-201',
        type: 'lecture',
        semester: 1
      },
      {
        programId: programs[0]._id,
        subjectId: subjects[2]._id, // Physics
        teacherId: teachers[3]._id,
        day: 'monday',
        startTime: '11:00',
        endTime: '12:00',
        roomNumber: 'PHY-101',
        type: 'lecture',
        semester: 1
      },
      // Tuesday Classes
      {
        programId: programs[0]._id,
        subjectId: subjects[3]._id, // OOP
        teacherId: teachers[1]._id,
        day: 'tuesday',
        startTime: '09:00',
        endTime: '10:00',
        roomNumber: 'CS-102',
        type: 'lecture',
        semester: 2
      },
      {
        programId: programs[0]._id,
        subjectId: subjects[4]._id, // Data Structures
        teacherId: teachers[4]._id,
        day: 'tuesday',
        startTime: '10:00',
        endTime: '11:00',
        roomNumber: 'CS-103',
        type: 'lecture',
        semester: 2
      },
      // Wednesday Classes
      {
        programId: programs[0]._id,
        subjectId: subjects[0]._id, // Programming in C - Practical
        teacherId: teachers[0]._id,
        day: 'wednesday',
        startTime: '14:00',
        endTime: '16:00',
        roomNumber: 'CS-LAB-1',
        type: 'practical',
        semester: 1
      },
      {
        programId: programs[1]._id,
        subjectId: subjects[6]._id, // Introduction to IT
        teacherId: teachers[1]._id,
        day: 'wednesday',
        startTime: '09:00',
        endTime: '10:00',
        roomNumber: 'IT-101',
        type: 'lecture',
        semester: 1
      },
      // Thursday Classes
      {
        programId: programs[1]._id,
        subjectId: subjects[7]._id, // Web Development
        teacherId: teachers[4]._id,
        day: 'thursday',
        startTime: '10:00',
        endTime: '12:00',
        roomNumber: 'IT-LAB-1',
        type: 'practical',
        semester: 1
      },
      // Friday Classes
      {
        programId: programs[0]._id,
        subjectId: subjects[5]._id, // Mathematics II
        teacherId: teachers[2]._id,
        day: 'friday',
        startTime: '09:00',
        endTime: '10:00',
        roomNumber: 'MATH-201',
        type: 'lecture',
        semester: 2
      }
    ]);
    
    console.log('✅ Sample data created successfully!');
    console.log(`📊 Created:
    - ${teachers.length} teachers
    - ${programs.length} programs
    - ${subjects.length} subjects
    - ${classes.length} scheduled classes`);
    
    console.log('\n🔐 Test Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Teacher: john.doe@example.com / teacher123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing data:', error);
    process.exit(1);
  }
};

initializeData();
