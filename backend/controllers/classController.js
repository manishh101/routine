const Class = require('../models/Class');
const { validationResult } = require('express-validator');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin
exports.createClass = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check for collision by teacher
    const teacherConflict = await Class.findOne({
      teacherId: req.body.teacherId,
      day: req.body.day,
      $or: [
        {
          startTime: { $lte: req.body.startTime },
          endTime: { $gt: req.body.startTime }
        },
        {
          startTime: { $lt: req.body.endTime },
          endTime: { $gte: req.body.endTime }
        },
        {
          startTime: { $gte: req.body.startTime },
          endTime: { $lte: req.body.endTime }
        }
      ]
    });

    if (teacherConflict) {
      return res.status(400).json({ 
        msg: 'Teacher already has a class scheduled at this time',
        conflict: 'teacher',
        conflictDetails: teacherConflict
      });
    }

    // Check for collision by room
    const roomConflict = await Class.findOne({
      roomNumber: req.body.roomNumber,
      day: req.body.day,
      $or: [
        {
          startTime: { $lte: req.body.startTime },
          endTime: { $gt: req.body.startTime }
        },
        {
          startTime: { $lt: req.body.endTime },
          endTime: { $gte: req.body.endTime }
        },
        {
          startTime: { $gte: req.body.startTime },
          endTime: { $lte: req.body.endTime }
        }
      ]
    });

    if (roomConflict) {
      return res.status(400).json({ 
        msg: 'Room already booked at this time',
        conflict: 'room',
        conflictDetails: roomConflict
      });
    }

    // Check for collision by class (same program, semester)
    const classConflict = await Class.findOne({
      programId: req.body.programId,
      semester: req.body.semester,
      day: req.body.day,
      $or: [
        {
          startTime: { $lte: req.body.startTime },
          endTime: { $gt: req.body.startTime }
        },
        {
          startTime: { $lt: req.body.endTime },
          endTime: { $gte: req.body.endTime }
        },
        {
          startTime: { $gte: req.body.startTime },
          endTime: { $lte: req.body.endTime }
        }
      ]
    });

    if (classConflict) {
      return res.status(400).json({ 
        msg: 'This program/semester already has a class scheduled at this time',
        conflict: 'class',
        conflictDetails: classConflict
      });
    }

    const classObj = new Class(req.body);
    await classObj.save();
    res.status(201).json(classObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('programId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name');
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get classes by teacher ID
// @route   GET /api/classes/teacher/:teacherId
// @access  Private
exports.getClassesByTeacherId = async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.params.teacherId })
      .populate('programId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name');
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get classes by program ID and semester
// @route   GET /api/classes/program/:programId/semester/:semester
// @access  Private
exports.getClassesByProgramAndSemester = async (req, res) => {
  try {
    const classes = await Class.find({ 
      programId: req.params.programId,
      semester: req.params.semester
    })
      .populate('programId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name');
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
exports.getClassById = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('programId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name');
    
    if (!classObj) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    res.json(classObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private/Admin
exports.updateClass = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    // Check for collision by teacher (exclude current class)
    if (req.body.teacherId && req.body.day && req.body.startTime && req.body.endTime) {
      const teacherConflict = await Class.findOne({
        _id: { $ne: req.params.id },
        teacherId: req.body.teacherId,
        day: req.body.day,
        $or: [
          {
            startTime: { $lte: req.body.startTime },
            endTime: { $gt: req.body.startTime }
          },
          {
            startTime: { $lt: req.body.endTime },
            endTime: { $gte: req.body.endTime }
          },
          {
            startTime: { $gte: req.body.startTime },
            endTime: { $lte: req.body.endTime }
          }
        ]
      });

      if (teacherConflict) {
        return res.status(400).json({ 
          msg: 'Teacher already has a class scheduled at this time',
          conflict: 'teacher',
          conflictDetails: teacherConflict
        });
      }
    }

    // Check for collision by room (exclude current class)
    if (req.body.roomNumber && req.body.day && req.body.startTime && req.body.endTime) {
      const roomConflict = await Class.findOne({
        _id: { $ne: req.params.id },
        roomNumber: req.body.roomNumber,
        day: req.body.day,
        $or: [
          {
            startTime: { $lte: req.body.startTime },
            endTime: { $gt: req.body.startTime }
          },
          {
            startTime: { $lt: req.body.endTime },
            endTime: { $gte: req.body.endTime }
          },
          {
            startTime: { $gte: req.body.startTime },
            endTime: { $lte: req.body.endTime }
          }
        ]
      });

      if (roomConflict) {
        return res.status(400).json({ 
          msg: 'Room already booked at this time',
          conflict: 'room',
          conflictDetails: roomConflict
        });
      }
    }

    // Check for collision by class (same program, semester) (exclude current class)
    if (req.body.programId && req.body.semester && req.body.day && req.body.startTime && req.body.endTime) {
      const classConflict = await Class.findOne({
        _id: { $ne: req.params.id },
        programId: req.body.programId,
        semester: req.body.semester,
        day: req.body.day,
        $or: [
          {
            startTime: { $lte: req.body.startTime },
            endTime: { $gt: req.body.startTime }
          },
          {
            startTime: { $lt: req.body.endTime },
            endTime: { $gte: req.body.endTime }
          },
          {
            startTime: { $gte: req.body.startTime },
            endTime: { $lte: req.body.endTime }
          }
        ]
      });

      if (classConflict) {
        return res.status(400).json({ 
          msg: 'This program/semester already has a class scheduled at this time',
          conflict: 'class',
          conflictDetails: classConflict
        });
      }
    }

    classObj = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(classObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.deleteClass = async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ msg: 'Class not found' });
    }

    await classObj.remove();

    res.json({ msg: 'Class removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.status(500).send('Server error');
  }
};
