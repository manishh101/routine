const express = require('express');
const router = express.Router();

// Import schema models for the imported data
const ImportedClass = require('../Schema/classSchema.js');
const ImportedProgram = require('../Schema/programSchema.js');
const ImportedTeacher = require('../Schema/teacherSchema.js');
const ImportedSubject = require('../Schema/subjectSchema.js');

/**
 * @swagger
 * /api/routine/weekly:
 *   get:
 *     summary: Get weekly routine for a program
 *     tags: [Routine]
 *     parameters:
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Program name (e.g., BCT)
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *         description: Year (e.g., 3)
 *       - in: query
 *         name: part
 *         schema:
 *           type: string
 *         description: Part (e.g., Odd, Even)
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Section (e.g., AB, CD)
 *     responses:
 *       200:
 *         description: Weekly routine data
 */
router.get('/weekly', async (req, res) => {
  try {
    const { program = 'BCT', year = 3, part = 'I', section = 'AB' } = req.query;
    
    // Find the program
    const programObj = await ImportedProgram.findOne({
      programName: program,
      year: parseInt(year),
      part: part,
      section: section
    });

    if (!programObj) {
      return res.status(404).json({ msg: 'Program not found' });
    }

    // Get all classes for this program
    const classes = await ImportedClass.find({ routineFor: programObj._id })
      .populate('subject')
      .populate('teacherName')
      .lean();

    // Organize by day and time
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeSlots = [
      { slot: 1, time: '7:00 - 7:50' },
      { slot: 2, time: '7:50 - 8:40' },
      { slot: 3, time: '8:40 - 9:30' },
      { slot: 4, time: '9:30 - 10:20' },
      { slot: 5, time: '10:35 - 11:25' },
      { slot: 6, time: '11:25 - 12:15' },
      { slot: 7, time: '12:15 - 1:05' },
      { slot: 8, time: '1:05 - 1:55' }
    ];

    const routine = {};
    
    weekDays.forEach(day => {
      routine[day] = [];
      timeSlots.forEach(timeSlot => {
        const classesAtThisTime = classes.filter(cls => 
          cls.weekDay === day && 
          cls.startingPeriod <= timeSlot.slot && 
          (cls.startingPeriod + cls.noOfPeriod - 1) >= timeSlot.slot
        );

        if (classesAtThisTime.length > 0) {
          const cls = classesAtThisTime[0]; // Take first if multiple
          routine[day].push({
            time: timeSlot.time,
            slot: timeSlot.slot,
            subject: cls.subject ? cls.subject.subjectName : 'Unknown Subject',
            subjectCode: cls.subject ? cls.subject.subjectCode : 'N/A',
            teachers: cls.teacherName.map(t => t.teacherName || 'Unknown Teacher'),
            type: cls.classType,
            duration: cls.noOfPeriod,
            room: cls.room || 'TBA'
          });
        } else {
          routine[day].push({
            time: timeSlot.time,
            slot: timeSlot.slot,
            subject: null,
            teachers: [],
            type: null,
            duration: 0,
            room: null
          });
        }
      });
    });

    res.json({
      program: programObj,
      routine: routine,
      metadata: {
        totalClasses: classes.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Routine error:', error);
    res.status(500).json({ 
      msg: 'Server error getting routine', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routine/programs:
 *   get:
 *     summary: Get all available programs
 *     tags: [Routine]
 *     responses:
 *       200:
 *         description: List of available programs
 */
router.get('/programs', async (req, res) => {
  try {
    const programs = await ImportedProgram.find({}, {
      programName: 1,
      year: 1,
      part: 1,
      section: 1
    }).sort({ programName: 1, year: 1, part: 1, section: 1 });

    res.json(programs);
  } catch (error) {
    console.error('Programs error:', error);
    res.status(500).json({ 
      msg: 'Server error getting programs', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routine/teachers:
 *   get:
 *     summary: Get all teachers from imported data
 *     tags: [Routine]
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await ImportedTeacher.find({ 
      teacherName: { $ne: 'dummy' } 
    }, {
      teacherName: 1,
      shortName: 1,
      designation: 1
    }).sort({ teacherName: 1 });

    res.json(teachers);
  } catch (error) {
    console.error('Teachers error:', error);
    res.status(500).json({ 
      msg: 'Server error getting teachers', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routine/subjects:
 *   get:
 *     summary: Get all subjects from imported data
 *     tags: [Routine]
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await ImportedSubject.find({ 
      subjectName: { $ne: 'dummy subject' } 
    }, {
      subjectName: 1,
      subjectCode: 1
    }).sort({ subjectName: 1 });

    res.json(subjects);
  } catch (error) {
    console.error('Subjects error:', error);
    res.status(500).json({ 
      msg: 'Server error getting subjects', 
      error: error.message 
    });
  }
});

module.exports = router;
