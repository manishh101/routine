const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const Program = require('../models/Program');
const TimeSlotDefinition = require('../models/TimeSlot');
const { generateTeacherSchedule } = require('../utils/scheduleGeneration');
const { validationResult } = require('express-validator');

// @desc    Get routine for specific program/semester/section
// @route   GET /api/routines/:programCode/:semester/:section
// @access  Public
exports.getRoutine = async (req, res) => {
  try {
    const { programCode, semester, section } = req.params;

    // Get program to validate programCode
    const program = await Program.findOne({ code: programCode.toUpperCase() });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    // Get time slots for mapping
    const timeSlots = await TimeSlotDefinition.find().sort({ sortOrder: 1 });
    
    // Create day mapping
    const dayMapping = {
      'sunday': 0,
      'monday': 1, 
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5
    };

    const classes = await Class.find({
      programId: program._id,
      semester: parseInt(semester),
      section: section.toUpperCase()
    })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'fullName shortName')
      .populate('programId', 'name code');

    // Group by days and slots for easier frontend consumption
    const routine = {};
    for (let day = 0; day <= 5; day++) {
      routine[day] = {};
    }

    classes.forEach(classItem => {
      const dayIndex = dayMapping[classItem.day];
      const slotIndex = timeSlots.findIndex(slot => 
        slot.startTime === classItem.startTime && slot.endTime === classItem.endTime
      );
      
      if (dayIndex !== undefined && slotIndex !== -1) {
        if (!routine[dayIndex]) {
          routine[dayIndex] = {};
        }
        
        routine[dayIndex][slotIndex] = {
          _id: classItem._id,
          subjectId: classItem.subjectId?._id,
          subjectName: classItem.subjectId?.name,
          subjectCode: classItem.subjectId?.code,
          teacherIds: [classItem.teacherId._id],
          teacherNames: [classItem.teacherId.fullName],
          teacherShortNames: [classItem.teacherId.shortName || classItem.teacherId.fullName.split(' ').map(n => n[0]).join('.')],
          roomId: null, // We don't have room ID in Class model, just roomNumber
          roomName: classItem.roomNumber,
          classType: classItem.type === 'practical' ? 'P' : classItem.type === 'tutorial' ? 'T' : 'L',
          notes: classItem.type === 'practical' ? `${classItem.subjectId?.name} Practical` : 
                 classItem.type === 'tutorial' ? `${classItem.subjectId?.name} Tutorial` : ''
        };
      }
    });

    res.json({
      success: true,
      data: {
        programCode: programCode.toUpperCase(),
        semester: parseInt(semester),
        section: section.toUpperCase(),
        routine
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Assign class to routine slot
// @route   POST /api/routines/:programCode/:semester/:section/assign
// @access  Private/Admin
exports.assignClass = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { programCode, semester, section } = req.params;
    const { dayIndex, slotIndex, subjectId, teacherIds, roomId, classType, notes } = req.body;

    // Validate input
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one teacher must be assigned'
      });
    }

    // Check for teacher conflicts
    for (const teacherId of teacherIds) {
      const teacherConflict = await RoutineSlot.findOne({
        dayIndex,
        slotIndex,
        teacherIds: teacherId
      }).populate('subjectId', 'name')
        .populate('roomId', 'name');

      if (teacherConflict) {
        const teacher = await Teacher.findById(teacherId);
        return res.status(409).json({
          success: false,
          message: 'Teacher conflict detected',
          conflict: {
            type: 'teacher',
            teacherName: teacher?.fullName,
            conflictDetails: {
              programCode: teacherConflict.programCode,
              semester: teacherConflict.semester,
              section: teacherConflict.section,
              subjectName: teacherConflict.subjectName || teacherConflict.subjectId?.name,
              roomName: teacherConflict.roomName_display || teacherConflict.roomId?.name
            }
          }
        });
      }
    }

    // Check for room conflict
    const roomConflict = await RoutineSlot.findOne({
      dayIndex,
      slotIndex,
      roomId
    }).populate('subjectId', 'name');

    if (roomConflict) {
      const room = await Room.findById(roomId);
      return res.status(409).json({
        success: false,
        message: 'Room conflict detected',
        conflict: {
          type: 'room',
          roomName: room?.name,
          conflictDetails: {
            programCode: roomConflict.programCode,
            semester: roomConflict.semester,
            section: roomConflict.section,
            subjectName: roomConflict.subjectName || roomConflict.subjectId?.name
          }
        }
      });
    }

    // Check if slot already exists for this program/semester/section
    const existingSlot = await RoutineSlot.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex
    });

    // Get denormalized display data
    const subject = await Subject.findById(subjectId);
    const teachers = await Teacher.find({ _id: { $in: teacherIds } });
    const room = await Room.findById(roomId);

    const slotData = {
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex,
      subjectId,
      teacherIds,
      roomId,
      classType,
      notes,
      // Denormalized display fields
      subjectName: subject?.name,
      subjectCode_display: subject?.code,
      teacherShortNames_display: teachers.map(t => t.shortName),
      roomName_display: room?.name
    };

    let routineSlot;
    if (existingSlot) {
      // Update existing slot
      routineSlot = await RoutineSlot.findByIdAndUpdate(
        existingSlot._id,
        slotData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new slot
      routineSlot = await RoutineSlot.create(slotData);
    }

    // Trigger teacher schedule regeneration for affected teachers
    const allTeacherIds = [...new Set([...teacherIds, ...(existingSlot?.teacherIds || [])])];
    
    // Asynchronously regenerate teacher schedules
    setImmediate(async () => {
      for (const teacherId of allTeacherIds) {
        try {
          await generateTeacherSchedule(teacherId, true);
        } catch (error) {
          console.error(`Failed to regenerate schedule for teacher ${teacherId}:`, error);
        }
      }
    });

    res.json({
      success: true,
      data: routineSlot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Clear class from routine slot
// @route   DELETE /api/routines/:programCode/:semester/:section/clear
// @access  Private/Admin
exports.clearClass = async (req, res) => {
  try {
    const { programCode, semester, section } = req.params;
    const { dayIndex, slotIndex } = req.body;

    const routineSlot = await RoutineSlot.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex
    });

    if (!routineSlot) {
      return res.status(404).json({
        success: false,
        message: 'Routine slot not found'
      });
    }

    const affectedTeachers = routineSlot.teacherIds;

    await RoutineSlot.findByIdAndDelete(routineSlot._id);

    // Trigger teacher schedule regeneration for affected teachers
    setImmediate(async () => {
      for (const teacherId of affectedTeachers) {
        try {
          await generateTeacherSchedule(teacherId, true);
        } catch (error) {
          console.error(`Failed to regenerate schedule for teacher ${teacherId}:`, error);
        }
      }
    });

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all routines for a program
// @route   GET /api/routines/:programCode
// @access  Public
exports.getProgramRoutines = async (req, res) => {
  try {
    const { programCode } = req.params;

    const routineSlots = await RoutineSlot.find({
      programCode: programCode.toUpperCase()
    })
      .populate('subjectId', 'name code')
      .populate('teacherIds', 'fullName shortName')
      .populate('roomId', 'name')
      .sort({ semester: 1, section: 1, dayIndex: 1, slotIndex: 1 });

    // Group by semester and section
    const routines = {};
    routineSlots.forEach(slot => {
      const key = `${slot.semester}-${slot.section}`;
      if (!routines[key]) {
        routines[key] = {
          semester: slot.semester,
          section: slot.section,
          slots: {}
        };
      }
      
      if (!routines[key].slots[slot.dayIndex]) {
        routines[key].slots[slot.dayIndex] = {};
      }
      
      routines[key].slots[slot.dayIndex][slot.slotIndex] = {
        _id: slot._id,
        subjectName: slot.subjectName || slot.subjectId?.name,
        teacherShortNames: slot.teacherShortNames_display || slot.teacherIds.map(t => t.shortName),
        roomName: slot.roomName_display || slot.roomId?.name,
        classType: slot.classType
      };
    });

    res.json({
      success: true,
      data: {
        programCode: programCode.toUpperCase(),
        routines: Object.values(routines)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Check room availability
// @route   GET /api/routines/rooms/:roomId/availability
// @access  Public
exports.checkRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { dayIndex, slotIndex } = req.query;

    if (dayIndex === undefined || slotIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'dayIndex and slotIndex are required'
      });
    }

    const conflict = await RoutineSlot.findOne({
      dayIndex: parseInt(dayIndex),
      slotIndex: parseInt(slotIndex),
      roomId
    }).populate('subjectId', 'name');

    const isAvailable = !conflict;

    res.json({
      success: true,
      data: {
        roomId,
        dayIndex: parseInt(dayIndex),
        slotIndex: parseInt(slotIndex),
        isAvailable,
        conflict: conflict ? {
          programCode: conflict.programCode,
          semester: conflict.semester,
          section: conflict.section,
          subjectName: conflict.subjectName || conflict.subjectId?.name
        } : null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
