const mongoose = require('mongoose');
const Program = require('../models/Program');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');
const ProgramSemester = require('../models/ProgramSemester');
const RoutineSlot = require('../models/RoutineSlot');
const { validationResult } = require('express-validator');
const { publishToQueue } = require('../services/queue.service');
const { generateClassRoutineExcel } = require('../utils/excelGeneration');
const { generateRoutineImportTemplate } = require('../utils/excelTemplate');
const multer = require('multer');
const path = require('path');
const ExcelJS = require('exceljs');

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store files in memory for processing

const fileFilter = (req, file, cb) => {
  // Accept only Excel files
  const allowedMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel files (.xls, .xlsx) are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Enhanced validation helper functions
const validateAssignClassData = async (data) => {
  const errors = [];
  const { programCode, semester, section, dayIndex, slotIndex, subjectId, teacherIds, roomId, classType } = data;

  // Basic data validation
  if (!programCode || typeof programCode !== 'string') {
    errors.push('Valid program code is required');
  }

  if (!semester || !Number.isInteger(semester) || semester < 1 || semester > 8) {
    errors.push('Semester must be between 1 and 8');
  }

  if (!section || !['AB', 'CD'].includes(section.toUpperCase())) {
    errors.push('Section must be either AB or CD');
  }

  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    errors.push('Day index must be between 0 and 6');
  }

  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    errors.push('Slot index must be a non-negative integer');
  }

  if (!classType || !['L', 'P', 'T'].includes(classType)) {
    errors.push('Class type must be L (Lecture), P (Practical), or T (Tutorial)');
  }

  // Validate IDs exist
  try {
    const [program, subject, teachers, room, timeSlot] = await Promise.all([
      Program.findOne({ code: programCode.toUpperCase() }),
      Subject.findById(subjectId),
      Teacher.find({ _id: { $in: teacherIds } }),
      Room.findById(roomId),
      TimeSlot.findOne({ _id: slotIndex })
    ]);

    if (!program) {
      errors.push(`Program with code ${programCode} not found`);
    }

    if (!subject) {
      errors.push('Subject not found');
    }

    if (!teachers || teachers.length !== teacherIds.length) {
      errors.push('One or more teachers not found');
    }

    if (!room) {
      errors.push('Room not found');
    }

    if (!timeSlot) {
      errors.push('Time slot not found');
    } else if (timeSlot.isBreak) {
      errors.push('Cannot assign classes during break time');
    }

    // Business rule validations
    if (room && classType === 'P' && room.type && !room.type.toLowerCase().includes('lab')) {
      errors.push('Practical classes should typically be assigned to lab rooms');
    }

    if (teachers && teachers.length > 1 && classType !== 'P') {
      errors.push('Multiple teachers are typically only allowed for practical/lab classes');
    }

  } catch (dbError) {
    errors.push('Error validating data against database');
    console.error('Database validation error:', dbError);
  }

  return errors;
};

// Enhanced conflict detection
const checkAdvancedConflicts = async (data, existingSlotId = null) => {
  const conflicts = [];
  const { programCode, semester, section, dayIndex, slotIndex, teacherIds, roomId } = data;

  try {
    // Check for teacher conflicts
    for (const teacherId of teacherIds) {
      const teacherConflicts = await RoutineSlot.find({
        dayIndex,
        slotIndex,
        teacherIds: teacherId,
        ...(existingSlotId ? { _id: { $ne: existingSlotId } } : {})
      }).populate('subjectId', 'name code')
        .populate('roomId', 'name');

      for (const conflict of teacherConflicts) {
        const teacher = await Teacher.findById(teacherId);
        conflicts.push({
          type: 'teacher',
          resourceId: teacherId,
          resourceName: teacher?.fullName || 'Unknown Teacher',
          conflictDetails: {
            programCode: conflict.programCode,
            semester: conflict.semester,
            section: conflict.section,
            subjectName: conflict.subjectName_display || conflict.subjectId?.name,
            subjectCode: conflict.subjectCode_display || conflict.subjectId?.code,
            roomName: conflict.roomName_display || conflict.roomId?.name,
            timeSlot: conflict.timeSlot_display
          }
        });
      }
    }

    // Check for room conflicts
    const roomConflicts = await RoutineSlot.find({
      dayIndex,
      slotIndex,
      roomId,
      ...(existingSlotId ? { _id: { $ne: existingSlotId } } : {})
    }).populate('subjectId', 'name code')
      .populate('teacherIds', 'fullName');

    for (const conflict of roomConflicts) {
      const room = await Room.findById(roomId);
      conflicts.push({
        type: 'room',
        resourceId: roomId,
        resourceName: room?.name || 'Unknown Room',
        conflictDetails: {
          programCode: conflict.programCode,
          semester: conflict.semester,
          section: conflict.section,
          subjectName: conflict.subjectName_display || conflict.subjectId?.name,
          subjectCode: conflict.subjectCode_display || conflict.subjectId?.code,
          teacherNames: conflict.teacherIds?.map(t => t.fullName) || [],
          timeSlot: conflict.timeSlot_display
        }
      });
    }

    // Check for program-section conflicts (shouldn't happen but good to validate)
    const sectionConflicts = await RoutineSlot.find({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex,
      ...(existingSlotId ? { _id: { $ne: existingSlotId } } : {})
    });

    if (sectionConflicts.length > 0) {
      conflicts.push({
        type: 'section',
        resourceId: `${programCode}-${semester}-${section}`,
        resourceName: `${programCode} Semester ${semester} Section ${section}`,
        conflictDetails: {
          message: 'This program-semester-section already has a class scheduled at this time'
        }
      });
    }

  } catch (error) {
    console.error('Error checking conflicts:', error);
    throw new Error('Failed to check for scheduling conflicts');
  }

  return conflicts;
};

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

    // Fetch routine slots from the single source of truth (RoutineSlot collection)
    const routineSlots = await RoutineSlot.find({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      isActive: true
    })
      .populate('subjectId', 'name code')
      .populate('teacherIds', 'fullName shortName')
      .populate('roomId', 'name')
      .sort({ dayIndex: 1, slotIndex: 1 });

    console.log(`Found ${routineSlots.length} routine slots for ${programCode}-${semester}-${section}`);

    // Group by days and slots for easier frontend consumption
    const routine = {};
    for (let day = 0; day <= 6; day++) {
      routine[day] = {};
    }

    routineSlots.forEach(slot => {
      if (!routine[slot.dayIndex]) {
        routine[slot.dayIndex] = {};
      }
      
      routine[slot.dayIndex][slot.slotIndex] = {
        _id: slot._id,
        subjectId: slot.subjectId?._id,
        subjectName: slot.subjectName_display || slot.subjectId?.name,
        subjectCode: slot.subjectCode_display || slot.subjectId?.code,
        teacherIds: slot.teacherIds,
        teacherNames: slot.teacherIds.map(t => t.fullName),
        teacherShortNames: slot.teacherShortNames_display || slot.teacherIds.map(t => t.shortName || t.fullName.split(' ').map(n => n[0]).join('.')),
        roomId: slot.roomId?._id,
        roomName: slot.roomName_display || slot.roomId?.name,
        classType: slot.classType,
        notes: slot.notes,
        timeSlot_display: slot.timeSlot_display
      };
    });

    console.log(`Built routine object with ${Object.keys(routine).length} days, total slots: ${Object.values(routine).reduce((total, day) => total + Object.keys(day).length, 0)}`);

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
    console.error('Error in getRoutine:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Enhanced assign class to routine slot with comprehensive validation
// @route   POST /api/routines/:programCode/:semester/:section/assign
// @access  Private/Admin
exports.assignClass = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Determine if we're in test environment with memory server (transactions may not be supported)
  const isTestEnvironment = process.env.NODE_ENV === 'test';

  try {
    const { programCode, semester, section } = req.params;
    const { dayIndex, slotIndex, subjectId, teacherIds, roomId, classType, notes } = req.body;

    console.log('assignClass called with:', {
      programCode,
      semester,
      section,
      dayIndex,
      slotIndex,
      subjectId,
      teacherIds,
      roomId,
      classType,
      notes
    });

    // Enhanced validation
    const validationData = {
      programCode,
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex,
      subjectId,
      teacherIds,
      roomId,
      classType,
      notes
    };

    const validationErrors = await validateAssignClassData(validationData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Validate input arrays
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one teacher must be assigned'
      });
    }

    // Check if slot already exists for this program/semester/section (Update vs Create)
    const existingSlot = await RoutineSlot.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex
    });

    // Enhanced conflict detection
    const conflicts = await checkAdvancedConflicts(validationData, existingSlot?._id);
    
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Scheduling conflicts detected',
        conflicts: conflicts,
        conflictCount: conflicts.length
      });
    }

    // Get reference data for denormalized fields
    const [subject, teachers, room, timeSlot] = await Promise.all([
      Subject.findById(subjectId),
      Teacher.find({ _id: { $in: teacherIds } }),
      Room.findById(roomId),
      TimeSlot.findOne({ _id: slotIndex })
    ]);

    // Final validation (should have been caught earlier but double-check)
    if (!subject || teachers.length !== teacherIds.length || !room || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reference data - subject, teachers, room, or time slot not found'
      });
    }

    const slotData = {
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      dayIndex,
      slotIndex,
      subjectId,
      teacherIds,
      roomId,
      classType: classType || 'L',
      notes: notes || '',
      // Denormalized display fields for performance
      subjectName_display: subject.name,
      subjectCode_display: subject.code,
      teacherShortNames_display: teachers.map(t => 
        t.shortName || t.fullName.split(' ').map(n => n[0]).join('.')
      ),
      roomName_display: room.name,
      timeSlot_display: `${timeSlot.startTime} - ${timeSlot.endTime}`,
      updatedAt: new Date()
    };

    let routineSlot;
    if (existingSlot) {
      // Update existing slot
      console.log('Updating existing slot:', existingSlot._id);
      routineSlot = await RoutineSlot.findByIdAndUpdate(
        existingSlot._id,
        slotData,
        { new: true, runValidators: true }
      );
    } else {
      // Create new slot
      console.log('Creating new slot');
      routineSlot = await RoutineSlot.create(slotData);
    }

    if (!routineSlot) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save class assignment'
      });
    }

    // Queue teacher schedule updates
    try {
      const oldTeacherIds = existingSlot ? (existingSlot.teacherIds || []) : [];
      const newTeacherIds = teacherIds || [];
      const affectedTeacherIds = [...new Set([...oldTeacherIds, ...newTeacherIds])]
        .filter(id => id != null && id.toString());
      
      if (affectedTeacherIds.length > 0) {
        const { publishToQueue } = require('../services/queue.service');
        await publishToQueue('teacher_routine_updates', { 
          affectedTeacherIds,
          action: existingSlot ? 'update' : 'create',
          programCode,
          semester,
          section,
          dayIndex,
          slotIndex
        });
        console.log(`[Queue] Queued schedule updates for teachers: ${affectedTeacherIds.join(', ')}`);
      }
    } catch (queueError) {
      console.error('CRITICAL: Failed to queue teacher schedule updates:', queueError);
      // Continue execution - the main operation was successful
    }

    // Return success response
    res.status(existingSlot ? 200 : 201).json({
      success: true,
      data: routineSlot,
      message: existingSlot ? 'Class assignment updated successfully' : 'Class assigned successfully',
      metadata: {
        operation: existingSlot ? 'update' : 'create',
        conflictsChecked: true,
        teachersAffected: teacherIds.length,
        queuedForUpdate: true
      }
    });

  } catch (error) {
    console.error('Error in assignClass:', error);
    
    // Handle specific error types
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate class assignment detected',
        error: 'A class is already scheduled for this program/semester/section at this time slot'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while assigning class',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
};

// @desc    Assign class spanning multiple slots
// @route   POST /api/routines/assign-class-spanned
// @access  Private/Admin
exports.assignClassSpanned = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  // Determine if we're in test environment with memory server (transactions may not be supported)
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  
  // Start a session if we're not in test environment
  let session = null;
  if (!isTestEnvironment) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const { 
      programCode, 
      semester, 
      section, 
      dayIndex, 
      slotIndexes, 
      subjectId, 
      teacherIds, 
      roomId, 
      classType, 
      notes 
    } = req.body;

    // 1. Validate input
    if (!Array.isArray(slotIndexes) || slotIndexes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one slot must be specified'
      });
    }

    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one teacher must be assigned'
      });
    }

    // 2. Check for collisions for each slotIndex
    for (const slotIndex of slotIndexes) {
      // Check for teacher conflicts
      for (const teacherId of teacherIds) {
        const teacherConflict = await RoutineSlot.findOne({
          dayIndex,
          slotIndex,
          teacherIds: teacherId
        })
        .populate('subjectId', 'name')
        .populate('roomId', 'name');

        if (teacherConflict) {
          const teacher = await Teacher.findById(teacherId);
          return res.status(409).json({
            success: false,
            message: 'Teacher conflict detected',
            conflict: {
              type: 'teacher',
              teacherName: teacher?.fullName,
              slotIndex,
              conflictDetails: {
                programCode: teacherConflict.programCode,
                semester: teacherConflict.semester,
                section: teacherConflict.section,
                subjectName: teacherConflict.subjectName_display || teacherConflict.subjectId?.name,
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
            slotIndex,
            conflictDetails: {
              programCode: roomConflict.programCode,
              semester: roomConflict.semester,
              section: roomConflict.section,
              subjectName: roomConflict.subjectName_display || roomConflict.subjectId?.name
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

      if (existingSlot) {
        return res.status(409).json({
          success: false,
          message: 'Slot already occupied',
          conflict: {
            type: 'slot',
            slotIndex,
            conflictDetails: {
              programCode: existingSlot.programCode,
              semester: existingSlot.semester,
              section: existingSlot.section,
              subjectName: existingSlot.subjectName_display || existingSlot.subjectId?.name
            }
          }
        });
      }
    }

    // 3. Get denormalized display data
    const subject = await Subject.findById(subjectId);
    const teachers = await Teacher.find({ _id: { $in: teacherIds } });
    const room = await Room.findById(roomId);
    
    // Get time slot displays for denormalized fields
    const timeSlots = await TimeSlot.find({
      _id: { $in: slotIndexes }
    });
    
    const timeSlotMap = new Map(timeSlots.map(ts => [ts._id.toString(), ts]));

    if (!subject || teachers.length !== teacherIds.length || !room) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject, teacher, or room ID provided'
      });
    }

    // 4. Generate a single spanId to link all slots
    const spanId = new mongoose.Types.ObjectId();
    
    // 5. Create routine slots for each slotIndex within transaction
    const createdSlots = [];
    
    for (let i = 0; i < slotIndexes.length; i++) {
      const slotIndex = slotIndexes[i];
      const isSpanMaster = i === 0; // First slot is the span master
      
      // Get time slot for this slotIndex
      const timeSlot = timeSlotMap.get(slotIndex.toString());
      
      const slotData = {
        programCode: programCode.toUpperCase(),
        semester: parseInt(semester),
        section: section.toUpperCase(),
        dayIndex,
        slotIndex,
        subjectId,
        teacherIds,
        roomId,
        classType: classType || 'L',
        notes: notes || '',
        // Span fields
        spanMaster: isSpanMaster,
        spanId: spanId,
        // Denormalized display fields
        subjectName_display: subject.name,
        subjectCode_display: subject.code,
        teacherShortNames_display: teachers.map(t => t.shortName || t.fullName.split(' ').map(n => n[0]).join('.')),
        roomName_display: room.name,
        timeSlot_display: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : ''
      };

      // Create new slot
      const routineSlot = session ?
        await RoutineSlot.create([slotData], { session }) :
        await RoutineSlot.create(slotData);
      
      createdSlots.push(session ? routineSlot[0] : routineSlot);
    }

    // 6. Commit transaction if session exists
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // 7. Publish message to queue for teacher schedule regeneration
    try {
      // For spanned class creation, there are no old teachers (new assignment)
      const oldTeacherIds = []; // No existing teachers for new spanned class
      const newTeacherIds = teacherIds || [];
      
      const affectedTeacherIds = [...new Set([...oldTeacherIds, ...newTeacherIds])]
        .filter(id => id != null && id.toString()); // Ensure IDs are valid
      
      if (affectedTeacherIds.length > 0) {
        const { publishToQueue } = require('../services/queue.service');
        await publishToQueue(
          'teacher_routine_updates', 
          { affectedTeacherIds }
        );
        console.log(`[Queue] Queued schedule updates for teachers: ${affectedTeacherIds.join(', ')}`);
      }
    } catch (queueError) {
      console.error('CRITICAL: Failed to queue teacher schedule updates. Manual regeneration may be required.', queueError);
      // Do not re-throw; the user's action was successful.
      
      // Fallback: Direct asynchronous teacher schedule regeneration (only if not in test environment)
      if (!isTestEnvironment) {
        setImmediate(async () => {
          for (const teacherId of teacherIds) {
            try {
              // Teacher schedule generation has been disabled
              console.log(`Teacher schedule generation disabled for teacher ${teacherId}`);
            } catch (error) {
              console.error(`Error in disabled teacher schedule generation for teacher ${teacherId}:`, error);
            }
          }
        });
      }
    }

    // 8. Return successful response
    res.status(201).json({
      success: true,
      data: {
        spanId,
        slots: createdSlots,
        spanMaster: createdSlots.find(slot => slot.spanMaster === true)
      },
      message: `Spanned class successfully assigned across ${slotIndexes.length} slots`
    });
  } catch (error) {
    // Abort transaction on error if session exists
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    
    console.error('Error in assignClassSpanned:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A class is already scheduled for this program/semester/section at one of these time slots'
      });
    }
    
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

    // Store the affected teachers before deletion
    const affectedTeachers = routineSlot.teacherIds;

    await RoutineSlot.findByIdAndDelete(routineSlot._id);

    // Publish message to queue for teacher schedule regeneration (following architecture documentation)
    try {
      // For deletions, we only need the teachers that were in the deleted slot
      const oldTeacherIds = affectedTeachers || [];
      const newTeacherIds = []; // No new teachers for deletion
      
      const affectedTeacherIds = [...new Set([...oldTeacherIds, ...newTeacherIds])]
        .filter(id => id != null && id.toString()); // Ensure IDs are valid
      
      if (affectedTeacherIds.length > 0) {
        const { publishToQueue } = require('../services/queue.service');
        await publishToQueue(
          'teacher_routine_updates', 
          { affectedTeacherIds }
        );
        console.log(`[Queue] Queued schedule updates for teachers: ${affectedTeacherIds.join(', ')}`);
      }
    } catch (queueError) {
      console.error('CRITICAL: Failed to queue teacher schedule updates. Manual regeneration may be required.', queueError);
      // Do not re-throw; the user's action was successful.
      
      // Fallback: Direct asynchronous teacher schedule regeneration
      setImmediate(async () => {
        for (const teacherId of affectedTeachers) {
          try {
            // Teacher schedule generation has been disabled
            console.log(`Teacher schedule generation disabled for teacher ${teacherId}`);
          } catch (error) {
            console.error(`Error in disabled teacher schedule generation for teacher ${teacherId}:`, error);
          }
        }
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'Class cleared successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Clear entire weekly routine for a section
// @route   DELETE /api/routines/:programCode/:semester/:section/clear-all
// @access  Private/Admin
exports.clearEntireRoutine = async (req, res) => {
  try {
    const { programCode, semester, section } = req.params;

    // Find all routine slots for this program/semester/section
    const routineSlots = await RoutineSlot.find({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase()
    });

    if (!routineSlots || routineSlots.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No routine found for ${programCode.toUpperCase()} Semester ${semester} Section ${section.toUpperCase()}`
      });
    }

    // Store all affected teachers before deletion
    const allAffectedTeachers = routineSlots.reduce((teachers, slot) => {
      if (slot.teacherIds && slot.teacherIds.length > 0) {
        teachers.push(...slot.teacherIds);
      }
      return teachers;
    }, []);

    // Get unique teacher IDs
    const uniqueTeacherIds = [...new Set(allAffectedTeachers.map(id => id.toString()))];

    // Delete all routine slots for this program/semester/section
    const deleteResult = await RoutineSlot.deleteMany({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase()
    });

    // Publish message to queue for teacher schedule regeneration
    try {
      if (uniqueTeacherIds.length > 0) {
        const { publishToQueue } = require('../services/queue.service');
        await publishToQueue(
          'teacher_routine_updates', 
          { affectedTeacherIds: uniqueTeacherIds }
        );
        console.log(`[Queue] Queued schedule updates for teachers: ${uniqueTeacherIds.join(', ')}`);
      }
    } catch (queueError) {
      console.error('CRITICAL: Failed to queue teacher schedule updates. Manual regeneration may be required.', queueError);
      
      // Fallback: Direct asynchronous teacher schedule regeneration
      setImmediate(async () => {
        for (const teacherId of uniqueTeacherIds) {
          try {
            // Teacher schedule generation has been disabled
            console.log(`Teacher schedule generation disabled for teacher ${teacherId}`);
          } catch (error) {
            console.error(`Error in disabled teacher schedule generation for teacher ${teacherId}:`, error);
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        deletedCount: deleteResult.deletedCount,
        programCode: programCode.toUpperCase(),
        semester,
        section: section.toUpperCase(),
        affectedTeachers: uniqueTeacherIds.length
      },
      message: `Successfully cleared the entire routine for ${programCode.toUpperCase()} Semester ${semester} Section ${section.toUpperCase()} (${deleteResult.deletedCount} classes removed)`
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

// @desc    Export routine to Excel
// @route   GET /api/routines/:programCode/:semester/:section/export
// @access  Public
exports.exportRoutineToExcel = async (req, res) => {
  try {
    const { programCode, semester, section } = req.params;

    // Validate program exists
    const program = await Program.findOne({ code: programCode.toUpperCase() });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    // Generate Excel file
    const excelBuffer = await generateClassRoutineExcel(programCode, semester, section);

    // Set response headers for file download
    const filename = `${programCode.toUpperCase()}_Sem${semester}_${section.toUpperCase()}_Routine.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting routine to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Excel file'
    });
  }
};

// @desc    Import routine from Excel file for specific program/semester/section
// @route   POST /api/routines/:programCode/:semester/:section/import
// @access  Private/Admin
exports.importRoutineFromExcel = async (req, res) => {
  try {
    console.log('Starting Excel import...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { programCode, semester, section } = req.params;
    
    // Validate parameters
    if (!programCode || !semester || !section) {
      return res.status(400).json({
        success: false,
        message: 'Program code, semester, and section are required'
      });
    }

    // Parse Excel file
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: 'Excel file must contain at least one worksheet'
      });
    }

    console.log('Excel file loaded successfully');

    // Get time slots and create mapping
    const TimeSlotDefinition = require('../models/TimeSlot');
    const Subject = require('../models/Subject');
    const Teacher = require('../models/Teacher');
    const Room = require('../models/Room');
    const RoutineSlot = require('../models/RoutineSlot');
    
    const timeSlots = await TimeSlotDefinition.find().sort({ sortOrder: 1 });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Parse Excel structure
    // Row 1: Title (merged)
    // Row 2: Headers (Day/Time, Time Slot 1, Time Slot 2, etc.)
    // Row 3+: Day data
    
    const headerRow = worksheet.getRow(2);
    const timeSlotColumns = [];
    
    // Map time slots to columns (skip first column which is Day/Time)
    for (let col = 2; col <= headerRow.cellCount; col++) {
      const headerCell = headerRow.getCell(col);
      if (headerCell.value && typeof headerCell.value === 'string') {
        const slotIndex = col - 2; // 0-based index
        if (slotIndex < timeSlots.length) {
          timeSlotColumns.push({
            columnIndex: col,
            slotIndex: timeSlots[slotIndex]._id,
            isBreak: timeSlots[slotIndex].isBreak
          });
        }
      }
    }

    console.log(`Found ${timeSlotColumns.length} time slot columns`);

    // Get all subjects, teachers, and rooms for ID resolution
    const [allSubjects, allTeachers, allRooms] = await Promise.all([
      Subject.find({}).select('_id name code'),
      Teacher.find({}).select('_id fullName shortName'),
      Room.find({}).select('_id name')
    ]);

    // Create lookup maps
    const subjectByCode = {};
    const subjectByName = {};
    allSubjects.forEach(subject => {
      subjectByCode[subject.code.toUpperCase()] = subject;
      subjectByName[subject.name.toUpperCase()] = subject;
    });

    const teacherByShortName = {};
    const teacherByFullName = {};
    allTeachers.forEach(teacher => {
      if (teacher.shortName) {
        teacherByShortName[teacher.shortName.toUpperCase()] = teacher;
      }
      teacherByFullName[teacher.fullName.toUpperCase()] = teacher;
    });

    const roomByName = {};
    allRooms.forEach(room => {
      roomByName[room.name.toUpperCase()] = room;
    });

    console.log(`Loaded ${allSubjects.length} subjects, ${allTeachers.length} teachers, ${allRooms.length} rooms`);

    // Clear existing routine slots for this program/semester/section
    await RoutineSlot.deleteMany({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase()
    });

    console.log('Existing routine slots cleared');

    const newSlots = [];
    let skippedCells = 0;
    let errorCells = 0;

    // Parse each day row (starting from row 3)
    for (let rowIndex = 3; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const dayCell = row.getCell(1);
      
      if (!dayCell.value) continue;
      
      const dayName = dayCell.value.toString().trim();
      const dayIndex = dayNames.findIndex(day => 
        day.toLowerCase() === dayName.toLowerCase()
      );
      
      if (dayIndex === -1) {
        console.log(`Skipping unknown day: ${dayName}`);
        continue;
      }

      // Parse each time slot column for this day
      for (const timeSlotCol of timeSlotColumns) {
        if (timeSlotCol.isBreak) {
          continue; // Skip break columns
        }

        const cell = row.getCell(timeSlotCol.columnIndex);
        if (!cell.value || cell.value.toString().trim() === '') {
          continue; // Empty cell - no class
        }

        try {
          const cellContent = cell.value.toString().trim();
          
          // Skip if it's just "BREAK" or empty
          if (cellContent.toUpperCase() === 'BREAK' || cellContent === '') {
            continue;
          }

          // Parse cell content format:
          // Line 1: Subject Code
          // Line 2: Subject Name
          // Line 3: Teacher Short Name
          // Line 4: Room Name
          // Line 5: [Class Type]
          
          const lines = cellContent.split('\n').map(line => line.trim()).filter(line => line);
          
          if (lines.length < 4) {
            console.log(`Skipping malformed cell at ${dayName}, slot ${timeSlotCol.slotIndex}: ${cellContent}`);
            skippedCells++;
            continue;
          }

          // Parse subject (first two lines)
          const subjectCode_display = lines[0] || '';
          const subjectName_display = lines[1] || '';
          let subjectId = null;

          // Find subject by code first, then by name
          const subject = subjectByCode[subjectCode_display.toUpperCase()] || 
                         subjectByName[subjectName_display.toUpperCase()];
          
          if (subject) {
            subjectId = subject._id;
          } else {
            console.log(`Warning: Subject not found for "${subjectCode_display} - ${subjectName_display}"`);
            // Continue with display values even if subject not found
          }

          // Parse teachers (third line)
          const teacherLine = lines[2] || '';
          const teacherNames = teacherLine.split(',').map(name => name.trim()).filter(name => name);
          const teacherIds = [];
          const teacherShortNames_display = [];

          for (const teacherName of teacherNames) {
            const teacher = teacherByShortName[teacherName.toUpperCase()] || 
                           teacherByFullName[teacherName.toUpperCase()];
            if (teacher) {
              teacherIds.push(teacher._id);
              teacherShortNames_display.push(teacher.shortName || teacher.fullName);
            } else {
              console.log(`Warning: Teacher not found for "${teacherName}"`);
              teacherShortNames_display.push(teacherName);
            }
          }

          // Parse room (fourth line)
          const roomLine = lines[3] || 'TBA';
          let roomId = null;
          let roomName_display = roomLine;

          // Clean room name (remove parentheses and extra text)
          const cleanRoomName = roomLine.replace(/\s*\([^)]*\)\s*/g, '').trim();
          
          const room = roomByName[cleanRoomName.toUpperCase()] || roomByName[roomLine.toUpperCase()];
          if (room) {
            roomId = room._id;
            roomName_display = room.name;
          } else if (roomLine !== 'TBA') {
            console.log(`Warning: Room not found for "${roomLine}" (cleaned: "${cleanRoomName}")`);
          }

          // Parse class type (fifth line in brackets, or default)
          let classType = 'L'; // Default to Lecture
          if (lines[4] && lines[4].includes('[') && lines[4].includes(']')) {
            const typeMatch = lines[4].match(/\[([^\]]+)\]/);
            if (typeMatch) {
              const typeText = typeMatch[1].toLowerCase();
              if (typeText.includes('practical') || typeText.includes('pra')) classType = 'P';
              else if (typeText.includes('tutorial') || typeText.includes('tut')) classType = 'T';
              else classType = 'L';
            }
          }

          // Create routine slot only if we have minimum required data
          if (subjectId && teacherIds.length > 0 && roomId) {
            const routineSlot = new RoutineSlot({
              programCode: programCode.toUpperCase(),
              semester: parseInt(semester),
              section: section.toUpperCase(),
              dayIndex: dayIndex,
              slotIndex: timeSlotCol.slotIndex,
              subjectId: subjectId,
              teacherIds: teacherIds,
              roomId: roomId,
              classType: classType,
              notes: '', // Don't add 'Imported from Excel' note by default
              subjectName_display: subjectName_display,
              subjectCode_display: subjectCode_display,
              teacherShortNames_display: teacherShortNames_display,
              roomName_display: roomName_display,
              isActive: true // Ensure the slot is active
            });
            
            newSlots.push(routineSlot);
            console.log(`Created slot for ${dayName}, slot ${timeSlotCol.slotIndex}: ${subjectCode_display} - ${subjectName_display}`);
          } else {
            console.log(`Skipping incomplete slot at ${dayName}, slot ${timeSlotCol.slotIndex}: subject=${!!subjectId}, teachers=${teacherIds.length}, room=${!!roomId}`);
            skippedCells++;
          }

        } catch (cellError) {
          console.error(`Error parsing cell at ${dayName}, slot ${timeSlotCol.slotIndex}:`, cellError);
          errorCells++;
        }
      }
    }

    // Save all new slots
    if (newSlots.length > 0) {
      console.log(`Attempting to save ${newSlots.length} routine slots...`);
      const savedSlots = await RoutineSlot.insertMany(newSlots);
      console.log(`Successfully saved ${savedSlots.length} routine slots to database`);
    } else {
      console.log('No valid slots to save');
    }

    console.log(`Import completed: ${newSlots.length} slots imported, ${skippedCells} skipped, ${errorCells} errors`);

    // Verify the data was saved by checking the count
    const savedCount = await RoutineSlot.countDocuments({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase(),
      isActive: true
    });
    
    console.log(`Database verification: ${savedCount} active slots found for ${programCode}-${semester}-${section}`);

    res.json({
      success: true,
      message: 'Routine imported successfully from Excel',
      data: {
        programCode: programCode.toUpperCase(),
        semester: parseInt(semester),
        section: section.toUpperCase(),
        slotsImported: newSlots.length,
        skippedCells: skippedCells,
        errorCells: errorCells,
        totalSlotsInDatabase: savedCount
      }
    });

  } catch (error) {
    console.error('Error importing routine from Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import routine from Excel',
      error: error.message
    });
  }
};

// @desc    Validate uploaded routine Excel file
// @route   POST /api/routines/import/validate
// @access  Private/Admin
exports.validateRoutineImport = [
  upload.single('routineFile'),
  async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select a routine file.'
        });
      }

      // Log that file has been received
      console.log('📁 File upload received:');
      console.log('  - Original name:', req.file.originalname);
      console.log('  - MIME type:', req.file.mimetype);
      console.log('  - File size:', req.file.size, 'bytes');
      console.log('  - Field name:', req.file.fieldname);
      console.log('  - Buffer length:', req.file.buffer.length);

      // 1. Parse the uploaded file buffer using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      
      const worksheet = workbook.getWorksheet(1); // Get first worksheet
      if (!worksheet) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty or invalid'
        });
      }

      // Convert worksheet to array of rows
      const rows = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData = {
            rowNumber,
            programCode: row.getCell(1).value?.toString()?.trim()?.toUpperCase(),
            semester: parseInt(row.getCell(2).value),
            section: row.getCell(3).value?.toString()?.trim()?.toUpperCase(),
            dayIndex: parseInt(row.getCell(4).value),
            slotIndex: parseInt(row.getCell(5).value),
            subjectCode: row.getCell(6).value?.toString()?.trim()?.toUpperCase(),
            teacherShortName: row.getCell(7).value?.toString()?.trim(),
            roomName: row.getCell(8).value?.toString()?.trim(),
            classType: row.getCell(9).value?.toString()?.trim()?.toUpperCase() || 'L',
            notes: row.getCell(10).value?.toString()?.trim() || ''
          };
          rows.push(rowData);
        }
      });

      console.log(`📊 Parsed ${rows.length} data rows from Excel file`);

      // 3. Fetch all master data beforehand to avoid N+1 queries
      console.log('🔍 Fetching master data for validation...');
      const [subjects, teachers, rooms, programs, timeSlots] = await Promise.all([
        Subject.find({}, 'code name').lean(),
        Teacher.find({}, 'shortName fullName').lean(),
        Room.find({}, 'name').lean(),
        Program.find({}, 'code name').lean(),
        TimeSlot.find({}, '_id label startTime endTime').lean()
      ]);

      // Create lookup maps for efficient validation
      const subjectMap = new Map(subjects.map(s => [s.code, s]));
      const teacherMap = new Map(teachers.map(t => [t.shortName, t]));
      const roomMap = new Map(rooms.map(r => [r.name, r]));
      const programMap = new Map(programs.map(p => [p.code, p]));
      const timeSlotMap = new Map(timeSlots.map(ts => [ts._id, ts]));

      // Fetch existing routine slots for collision detection
      const existingSlots = await RoutineSlot.find({}, 
        'programCode semester section dayIndex slotIndex teacherIds roomId'
      ).populate('teacherIds', 'shortName').lean();

      console.log('✅ Master data loaded successfully');

      // 2. Create validation function and iterate through each row
      const errors = [];
      const processedSlots = new Map(); // For in-file collision detection

      for (const row of rows) {
        const rowErrors = [];

        // Basic data validation
        if (!row.programCode) {
          rowErrors.push('Program Code is required');
        } else if (!programMap.has(row.programCode)) {
          rowErrors.push(`Program Code '${row.programCode}' does not exist`);
        }

        if (!row.semester || row.semester < 1 || row.semester > 8) {
          rowErrors.push('Semester must be between 1 and 8');
        }

        if (!row.section || !['AB', 'CD'].includes(row.section)) {
          rowErrors.push('Section must be AB or CD');
        }

        if (row.dayIndex === undefined || row.dayIndex < 0 || row.dayIndex > 6) {
          rowErrors.push('Day Index must be between 0 and 6 (0=Sunday, 6=Saturday)');
        }

        if (row.slotIndex === undefined || !timeSlotMap.has(row.slotIndex)) {
          rowErrors.push(`Slot Index '${row.slotIndex}' does not exist in time slot definitions`);
        }

        if (!row.subjectCode) {
          rowErrors.push('Subject Code is required');
        } else if (!subjectMap.has(row.subjectCode)) {
          rowErrors.push(`Subject Code '${row.subjectCode}' does not exist`);
        }

        if (!row.teacherShortName) {
          rowErrors.push('Teacher Short Name is required');
        } else if (!teacherMap.has(row.teacherShortName)) {
          rowErrors.push(`Teacher '${row.teacherShortName}' does not exist`);
        }

        if (!row.roomName) {
          rowErrors.push('Room Name is required');
        } else if (!roomMap.has(row.roomName)) {
          rowErrors.push(`Room '${row.roomName}' does not exist`);
        }

        if (!['L', 'P', 'T'].includes(row.classType)) {
          rowErrors.push('Class Type must be L (Lecture), P (Practical), or T (Tutorial)');
        }

        // 4. Collision detection (only if basic validation passes)
        if (rowErrors.length === 0) {
          const slotKey = `${row.programCode}-${row.semester}-${row.section}-${row.dayIndex}-${row.slotIndex}`;
          
          // Check for in-file collision (same program/semester/section/day/slot)
          if (processedSlots.has(slotKey)) {
            rowErrors.push(`Duplicate slot: Another class is already scheduled for ${row.programCode} Sem${row.semester} ${row.section} at Day ${row.dayIndex} Slot ${row.slotIndex} (Row ${processedSlots.get(slotKey)})`);
          } else {
            processedSlots.set(slotKey, row.rowNumber);
          }

          // Check for teacher collision in file
          const teacherKey = `${row.dayIndex}-${row.slotIndex}-${row.teacherShortName}`;
          const teacherCollision = rows.find(r => 
            r !== row && 
            r.dayIndex === row.dayIndex && 
            r.slotIndex === row.slotIndex && 
            r.teacherShortName === row.teacherShortName
          );
          if (teacherCollision) {
            rowErrors.push(`Teacher collision in file: ${row.teacherShortName} is assigned to multiple classes at Day ${row.dayIndex} Slot ${row.slotIndex} (Row ${teacherCollision.rowNumber})`);
          }

          // Check for room collision in file
          const roomKey = `${row.dayIndex}-${row.slotIndex}-${row.roomName}`;
          const roomCollision = rows.find(r => 
            r !== row && 
            r.dayIndex === row.dayIndex && 
            r.slotIndex === row.slotIndex && 
            r.roomName === row.roomName
          );
          if (roomCollision) {
            rowErrors.push(`Room collision in file: ${row.roomName} is assigned to multiple classes at Day ${row.dayIndex} Slot ${row.slotIndex} (Row ${roomCollision.rowNumber})`);
          }

          // Check for database collisions
          const teacher = teacherMap.get(row.teacherShortName);
          if (teacher) {
            const teacherDbCollision = existingSlots.find(slot => 
              slot.dayIndex === row.dayIndex && 
              slot.slotIndex === row.slotIndex &&
              slot.teacherIds.some(t => t.shortName === row.teacherShortName)
            );
            if (teacherDbCollision) {
              rowErrors.push(`Teacher collision with existing schedule: ${row.teacherShortName} is already teaching at Day ${row.dayIndex} Slot ${row.slotIndex} for ${teacherDbCollision.programCode} Sem${teacherDbCollision.semester} ${teacherDbCollision.section}`);
            }
          }

          const room = roomMap.get(row.roomName);
          if (room) {
            const roomDbCollision = existingSlots.find(slot => 
              slot.dayIndex === row.dayIndex && 
              slot.slotIndex === row.slotIndex &&
              slot.roomId.toString() === room._id.toString()
            );
            if (roomDbCollision) {
              rowErrors.push(`Room collision with existing schedule: ${row.roomName} is already booked at Day ${row.dayIndex} Slot ${row.slotIndex} for ${roomDbCollision.programCode} Sem${roomDbCollision.semester} ${roomDbCollision.section}`);
            }
          }

          // Check for existing slot collision (program/semester/section/day/slot already exists)
          const existingSlotCollision = existingSlots.find(slot =>
            slot.programCode === row.programCode &&
            slot.semester === row.semester &&
            slot.section === row.section &&
            slot.dayIndex === row.dayIndex &&
            slot.slotIndex === row.slotIndex
          );
          if (existingSlotCollision) {
            rowErrors.push(`Slot already exists: A class is already scheduled for ${row.programCode} Sem${row.semester} ${row.section} at Day ${row.dayIndex} Slot ${row.slotIndex}`);
          }
        }

        // 5. Collect errors with row mapping
        if (rowErrors.length > 0) {
          errors.push({
            row: row.rowNumber,
            data: row,
            errors: rowErrors
          });
        }
      }

      // 6. Return error response if validation fails
      if (errors.length > 0) {
        console.log(`❌ Validation failed: ${errors.length} rows with errors`);
        return res.status(400).json({
          success: false,
          message: `Validation failed: ${errors.length} rows contain errors`,
          errors: errors,
          summary: {
            totalRows: rows.length,
            errorRows: errors.length,
            validRows: rows.length - errors.length
          }
        });
      }

      // 7. Return success response with transaction ID
      const transactionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Validation successful: ${rows.length} rows validated`);
      console.log(`🎫 Transaction ID generated: ${transactionId}`);

      res.json({
        success: true,
        message: `Validation successful: ${rows.length} rows are ready for import`,
        data: {
          transactionId,
          totalRows: rows.length,
          filename: req.file.originalname,
          preview: rows.slice(0, 5), // Show first 5 rows as preview
          validationSummary: {
            programsFound: [...new Set(rows.map(r => r.programCode))],
            semestersFound: [...new Set(rows.map(r => r.semester))],
            sectionsFound: [...new Set(rows.map(r => r.section))],
            teachersFound: [...new Set(rows.map(r => r.teacherShortName))],
            roomsFound: [...new Set(rows.map(r => r.roomName))],
            subjectsFound: [...new Set(rows.map(r => r.subjectCode))]
          }
        }
      });

    } catch (error) {
      console.error('Error in validateRoutineImport:', error);
      
      // Handle specific ExcelJS errors
      if (error.message.includes('xlsx')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel file format. Please ensure the file is a valid .xlsx or .xls file.'
        });
      }
      
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum file size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `File upload error: ${error.message}`
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error during file validation'
      });
    }
  }
];

// @desc    Download Excel import template
// @route   GET /api/routines/import/template
// @access  Public
exports.downloadImportTemplate = async (req, res) => {
  try {
    console.log('📥 Generating Excel import template...');
    
    // Generate the template file
    const templateBuffer = await generateRoutineImportTemplate();
    
    // Set response headers for file download
    const filename = 'Routine_Import_Template.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', templateBuffer.length);
    
    console.log('✅ Template generated successfully');
    
    // Send the Excel template file
    res.send(templateBuffer);
  } catch (error) {
    console.error('Error generating import template:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating import template'
    });
  }
};

// Clear a span group (multi-period class)
exports.clearSpanGroup = async (req, res) => {
  const { spanId } = req.params;

  if (!spanId || !mongoose.Types.ObjectId.isValid(spanId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid span ID'
    });
  }

  try {
    // Find all slots in the span group to get teacher IDs for cache invalidation
    const spanSlots = await RoutineSlot.find({ spanId });
    
    if (!spanSlots || spanSlots.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Span group not found'
      });
    }
    
    // Extract unique teacher IDs from all slots for cache invalidation
    const teacherIds = Array.from(new Set(
      spanSlots.flatMap(slot => slot.teacherIds)
    ));
    
    // Delete all slots with this spanId
    const deleteResult = await RoutineSlot.deleteMany({ spanId });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No slots found for this span group'
      });
    }
    
    // Publish message to queue for teacher schedule regeneration
    try {
      // For span group deletion, we only need the teachers that were in the deleted slots
      const oldTeacherIds = teacherIds || [];
      const newTeacherIds = []; // No new teachers for deletion
      
      const affectedTeacherIds = [...new Set([...oldTeacherIds, ...newTeacherIds])]
        .filter(id => id != null && id.toString()); // Ensure IDs are valid
      
      if (affectedTeacherIds.length > 0) {
        const { publishToQueue } = require('../services/queue.service');
        await publishToQueue(
          'teacher_routine_updates', 
          { affectedTeacherIds }
        );
        console.log(`[Queue] Queued schedule updates for teachers: ${affectedTeacherIds.join(', ')}`);
      }
    } catch (queueError) {
      console.error('CRITICAL: Failed to queue teacher schedule updates. Manual regeneration may be required.', queueError);
      // Do not re-throw; the user's action was successful.
      
      // Fallback: Teacher schedule regeneration disabled
      setImmediate(async () => {
        for (const teacherId of teacherIds) {
          try {
            console.log(`Teacher schedule generation disabled for teacher ${teacherId}`);
          } catch (error) {
            console.error(`Error in disabled teacher schedule generation for teacher ${teacherId}:`, error);
          }
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Multi-period class cleared successfully (${deleteResult.deletedCount} periods)`,
      deletedCount: deleteResult.deletedCount
    });
    
  } catch (error) {
    console.error('Error clearing span group:', error);
    return res.status(500).json({
      success: false,
      message: 'Error clearing multi-period class',
      error: error.message
    });
  }
};

// @desc    Check teacher availability
// @route   GET /api/routines/teachers/:teacherId/availability
// @access  Public
exports.checkTeacherAvailability = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { dayIndex, slotIndex } = req.query;

    if (dayIndex === undefined || slotIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'dayIndex and slotIndex are required'
      });
    }

    // Validate teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const conflict = await RoutineSlot.findOne({
      dayIndex: parseInt(dayIndex),
      slotIndex: parseInt(slotIndex),
      teacherIds: teacherId
    }).populate('subjectId', 'name')
      .populate('roomId', 'name');

    const isAvailable = !conflict;

    res.json({
      success: true,
      data: {
        teacherId,
        teacherName: teacher.fullName,
        dayIndex: parseInt(dayIndex),
        slotIndex: parseInt(slotIndex),
        isAvailable,
        conflict: conflict ? {
          programCode: conflict.programCode,
          semester: conflict.semester,
          section: conflict.section,
          subjectName: conflict.subjectName_display || conflict.subjectId?.name,
          roomName: conflict.roomName_display || conflict.roomId?.name
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

// @desc    Get available subjects for assignment
// @route   GET /api/routines/:programCode/:semester/subjects
// @access  Public
exports.getAvailableSubjects = async (req, res) => {
  try {
    const { programCode, semester } = req.params;

    // Get curriculum for the specific program-semester
    const programSemesterDoc = await ProgramSemester.findOne({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      status: 'Active'
    });

    if (!programSemesterDoc) {
      return res.status(404).json({
        success: false,
        message: `No curriculum found for ${programCode} Semester ${semester}`
      });
    }

    // Return the subjects offered for this program-semester
    const subjects = programSemesterDoc.subjectsOffered.map(subject => ({
      _id: subject.subjectId,
      name: subject.subjectName_display,
      code: subject.subjectCode_display,
      courseType: subject.courseType,
      isElective: subject.isElective
    }));

    res.json({
      success: true,
      data: subjects,
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester)
    });

  } catch (error) {
    console.error('Error in getAvailableSubjects:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// NOTE: Teacher schedule functionality has been moved to teacherScheduleController.js
// All related functions (getTeacherSchedule and exportTeacherScheduleToExcel) have been moved
// to maintain proper separation of concerns and avoid duplicate code.
