const mongoose = require('mongoose');
const RoutineSlot = require('../models/RoutineSlot');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const TimeSlotDefinition = require('../models/TimeSlot');
const { validationResult } = require('express-validator');
const { publishToQueue } = require('../services/queue.service');

// @desc    Clear class assignment
// @route   PATCH /api/routines/slots/:slotId/clear
// @access  Private/Admin
exports.clearClassAssignment = async (req, res) => {
  try {
    const { slotId } = req.params;

    // Validate slotId format
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot ID format'
      });
    }

    // Fetch existing slot to get old teacherIds
    const existingSlot = await RoutineSlot.findById(slotId);
    
    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Routine slot not found'
      });
    }

    // Store old teacher IDs for queue notification
    const oldTeacherIds = existingSlot.teacherIds || [];

    // Clear the slot
    const updatedSlot = await RoutineSlot.findByIdAndUpdate(
      slotId,
      {
        subjectId: null,
        teacherIds: [],
        roomId: null,
        classType: null,
        notes: '',
        updatedAt: new Date()
      },
      { new: true }
    );

    // Send message to RabbitMQ for teacher schedule regeneration
    // Include old teacher IDs so their schedules are updated
    if (oldTeacherIds.length > 0) {
      const queueMessage = {
        type: 'teacher_routine_update',
        affectedTeacherIds: oldTeacherIds,
        action: 'clear',
        slotId,
        timestamp: new Date().toISOString()
      };

      try {
        await publishToQueue('teacher_routine_updates', queueMessage);
        console.log('Published teacher schedule update to queue:', queueMessage);
      } catch (queueError) {
        console.error('Failed to publish to queue:', queueError);
        // Don't fail the request if queue fails
      }
    }

    res.status(200).json({
      success: true,
      data: updatedSlot,
      message: 'Class assignment cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing class assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing class assignment',
      error: error.message
    });
  }
};

// @desc    Update class assignment
// @route   PATCH /api/routines/slots/:slotId
// @access  Private/Admin
exports.updateClassAssignment = async (req, res) => {
  // Regular validation for update operations
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { slotId } = req.params;
    const {
      dayIndex,
      slotIndex,
      subjectId,
      teacherIds,
      roomId,
      classType = 'L',
      notes = ''
    } = req.body;

    // Validate slotId format
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot ID format'
      });
    }

    // Validate other MongoDB ObjectID inputs
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    // Validate teacher IDs array
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one teacher must be assigned'
      });
    }

    // Validate each teacher ID in the array
    for (const teacherId of teacherIds) {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid teacher ID format: ${teacherId}`
        });
      }
    }

    // Fetch existing slot to get old teacherIds
    const existingSlot = await RoutineSlot.findById(slotId);
    
    if (!existingSlot) {
      return res.status(404).json({
        success: false,
        message: 'Routine slot not found'
      });
    }

    // Keep track of old teacher IDs for queue publishing
    const oldTeacherIds = existingSlot.teacherIds || [];

    // Check for teacher conflicts (ignoring the current slot)
    for (const teacherId of teacherIds) {
      const teacherConflict = await RoutineSlot.findOne({
        _id: { $ne: slotId }, // Exclude the current slot
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
              subjectName: teacherConflict.subjectName_display || teacherConflict.subjectId?.name,
              roomName: teacherConflict.roomName_display || teacherConflict.roomId?.name
            }
          }
        });
      }
    }

    // Check for room conflict (ignoring the current slot)
    const roomConflict = await RoutineSlot.findOne({
      _id: { $ne: slotId }, // Exclude the current slot
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
            subjectName: roomConflict.subjectName_display || roomConflict.subjectId?.name
          }
        }
      });
    }

    // Get denormalized display data
    const subject = await Subject.findById(subjectId);
    const teachers = await Teacher.find({ _id: { $in: teacherIds } });
    const room = await Room.findById(roomId);
    
    // Get time slot display for denormalized field
    const timeSlot = await TimeSlotDefinition.findOne({ _id: slotIndex });

    if (!subject || teachers.length !== teacherIds.length || !room) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject, teacher, or room ID provided'
      });
    }

    // Prepare update data
    const updateData = {
      dayIndex,
      slotIndex,
      subjectId,
      teacherIds,
      roomId,
      classType: classType || 'L',
      notes: notes || '',
      // Denormalized display fields
      subjectName_display: subject.name,
      subjectCode_display: subject.code,
      teacherShortNames_display: teachers.map(t => t.shortName || t.fullName.split(' ').map(n => n[0]).join('.')),
      roomName_display: room.name,
      timeSlot_display: timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : ''
    };

    // Determine if we're in test environment with memory server (transactions may not be supported)
    const isTestEnvironment = process.env.NODE_ENV === 'test';
    
    // Start a transaction if not in test environment
    let session = null;
    let updatedSlot = null;
    
    if (!isTestEnvironment) {
      session = await mongoose.startSession();
      session.startTransaction();
    }
    
    try {
      // Update the routine slot with transaction support
      updatedSlot = await RoutineSlot.findByIdAndUpdate(
        slotId,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          session: session // Will be null in test environment
        }
      );
      
      // Commit the transaction if session exists
      if (session) {
        await session.commitTransaction();
        session.endSession();
      }
    } catch (txError) {
      // Abort transaction on error if session exists
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw txError; // Re-throw to be caught by the outer try/catch
    }

    // Combine old and new teacher IDs for queue notification
    const newTeacherIds = teacherIds || [];
    
    // Create a unique list of all affected teacher IDs
    const affectedTeacherIds = [...new Set([...oldTeacherIds, ...newTeacherIds])]
      .filter(id => id != null && id.toString()); // Ensure IDs are valid
    
    // Publish message to queue for teacher schedule regeneration if there are affected teachers
    if (affectedTeacherIds.length > 0) {
      try {
        // Only attempt to queue if RabbitMQ is enabled
        if (process.env.USE_RABBITMQ === 'true') {
          const queueResult = await publishToQueue(
            'teacher_routine_updates', 
            { affectedTeacherIds }
          );
          
          if (queueResult) {
            console.log(`[Queue] Successfully queued schedule updates for teachers: ${affectedTeacherIds.join(', ')}`);
          } else {
            console.warn(`[Queue] Failed to queue schedule updates for teachers: ${affectedTeacherIds.join(', ')}. Queue might be full or disconnected.`);
            
            // Log which teachers need manual schedule regeneration
            console.warn(`[Queue] The following teachers may require manual schedule regeneration: ${affectedTeacherIds.join(', ')}`);
          }
        } else {
          console.log(`[Queue] RabbitMQ disabled. Skipping queue for teachers: ${affectedTeacherIds.join(', ')}`);
          
          // Here you could add direct schedule regeneration if needed
          // For example:
          // if (!isTestEnvironment) {
          //   try {
          //     for (const teacherId of affectedTeacherIds) {
          //       await generateTeacherSchedule(teacherId);
          //       console.log(`Directly regenerated schedule for teacher ${teacherId}`);
          //     }
          //   } catch (regError) {
          //     console.error(`Error in direct teacher schedule regeneration:`, regError);
          //   }
          // }
        }
      } catch (queueError) {
        console.error('Failed to queue teacher schedule updates. Manual regeneration may be required.', queueError);
        // Don't re-throw; the user's action was successful.
        
        // Log detailed error for troubleshooting
        console.error('Queue error details:', {
          error: queueError.message,
          stack: queueError.stack,
          teacherIds: affectedTeacherIds
        });
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      data: updatedSlot,
      message: 'Class assignment updated successfully'
    });
  } catch (error) {
    console.error('Error in updateClassAssignment:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A class is already scheduled for this time slot'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
