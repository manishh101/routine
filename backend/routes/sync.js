const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import both schema types
const ImportedTeacher = require('../Schema/teacherSchema.js');
const ImportedSubject = require('../Schema/subjectSchema.js');
const ImportedClass = require('../Schema/classSchema.js');
const ImportedProgram = require('../Schema/programSchema.js');

// Import app models
const Teacher = require('../models/Teacher.js');
const Subject = require('../models/Subject.js');
const Class = require('../models/Class.js');
const Program = require('../models/Program.js');

const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /api/sync/import-to-app:
 *   post:
 *     summary: Sync imported data to application models (Admin only)
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data synced successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/import-to-app', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Starting data synchronization...');

    // Sync Teachers
    const importedTeachers = await ImportedTeacher.find({ teacherName: { $ne: 'dummy' } });
    const teacherMap = new Map();
    
    for (const impTeacher of importedTeachers) {
      const existingTeacher = await Teacher.findOne({ name: impTeacher.teacherName });
      if (!existingTeacher) {
        const newTeacher = new Teacher({
          name: impTeacher.teacherName,
          email: `${impTeacher.shortName.toLowerCase().replace(/\s+/g, '')}@college.edu`,
          phone: '',
          department: 'Computer Engineering',
          designation: impTeacher.designation || 'Lecturer'
        });
        await newTeacher.save();
        teacherMap.set(impTeacher._id.toString(), newTeacher._id);
        console.log(`Created teacher: ${impTeacher.teacherName}`);
      } else {
        teacherMap.set(impTeacher._id.toString(), existingTeacher._id);
      }
    }

    // Sync Programs
    const importedPrograms = await ImportedProgram.find();
    const programMap = new Map();
    
    for (const impProgram of importedPrograms) {
      const existingProgram = await Program.findOne({ 
        name: impProgram.programName,
        year: impProgram.year,
        semester: impProgram.part === 'Odd' ? 1 : 2
      });
      
      if (!existingProgram) {
        const newProgram = new Program({
          name: impProgram.programName,
          year: impProgram.year,
          semester: impProgram.part === 'Odd' ? 1 : 2,
          duration: 4,
          totalSemesters: 8
        });
        await newProgram.save();
        programMap.set(impProgram._id.toString(), newProgram._id);
        console.log(`Created program: ${impProgram.programName} Year ${impProgram.year}`);
      } else {
        programMap.set(impProgram._id.toString(), existingProgram._id);
      }
    }

    // Sync Subjects
    const importedSubjects = await ImportedSubject.find({ subjectName: { $ne: 'dummy subject' } });
    const subjectMap = new Map();
    
    for (const impSubject of importedSubjects) {
      const existingSubject = await Subject.findOne({ code: impSubject.subjectCode });
      if (!existingSubject) {
        // Get a random program for the subject (in real scenario, this should be mapped properly)
        const randomProgram = await Program.findOne();
        if (randomProgram) {
          const newSubject = new Subject({
            name: impSubject.subjectName,
            code: impSubject.subjectCode,
            programId: randomProgram._id,
            semester: Math.ceil(Math.random() * 8), // Random semester for demo
            creditHours: 3, // Default credit hours
            lectureHoursPerWeek: 3,
            practicalHoursPerWeek: 0
          });
          await newSubject.save();
          subjectMap.set(impSubject._id.toString(), newSubject._id);
          console.log(`Created subject: ${impSubject.subjectName}`);
        }
      } else {
        subjectMap.set(impSubject._id.toString(), existingSubject._id);
      }
    }

    console.log('Data synchronization completed successfully');
    
    res.json({
      message: 'Data synchronized successfully',
      stats: {
        teachers: teacherMap.size,
        programs: programMap.size,
        subjects: subjectMap.size
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      msg: 'Server error during sync', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/stats:
 *   get:
 *     summary: Get statistics of imported vs app data
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      imported: {
        teachers: await ImportedTeacher.countDocuments({ teacherName: { $ne: 'dummy' } }),
        subjects: await ImportedSubject.countDocuments({ subjectName: { $ne: 'dummy subject' } }),
        programs: await ImportedProgram.countDocuments(),
        classes: await ImportedClass.countDocuments()
      },
      app: {
        teachers: await Teacher.countDocuments(),
        subjects: await Subject.countDocuments(),
        programs: await Program.countDocuments(),
        classes: await Class.countDocuments()
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      msg: 'Server error getting stats', 
      error: error.message 
    });
  }
});

module.exports = router;
