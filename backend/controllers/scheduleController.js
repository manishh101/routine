const TeacherSchedule = require('../models/TeacherSchedule');
const RoutineSlot = require('../models/RoutineSlot');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');

// @desc    Get teacher schedule
// @route   GET /api/schedules/teacher/:teacherId
// @access  Public
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    let schedule = await TeacherSchedule.findOne({ teacherId });

    // If no cached schedule exists, generate it dynamically
    if (!schedule) {
      schedule = await generateTeacherSchedule(teacherId);
      if (schedule) {
        await schedule.save();
      }
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Regenerate teacher schedule
// @route   POST /api/schedules/teacher/:teacherId/regenerate
// @access  Private/Admin
exports.regenerateTeacherSchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const schedule = await generateTeacherSchedule(teacherId, true);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all teacher schedules
// @route   GET /api/schedules/teachers
// @access  Public
exports.getAllTeacherSchedules = async (req, res) => {
  try {
    const schedules = await TeacherSchedule.find()
      .populate('teacherId', 'fullName shortName email');

    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Regenerate all teacher schedules
// @route   POST /api/schedules/regenerate-all
// @access  Private/Admin
exports.regenerateAllTeacherSchedules = async (req, res) => {
  try {
    const teachers = await Teacher.find({}, '_id');
    const results = [];

    for (const teacher of teachers) {
      try {
        const schedule = await generateTeacherSchedule(teacher._id, true);
        results.push({
          teacherId: teacher._id,
          success: true,
          schedule: schedule ? schedule._id : null
        });
      } catch (error) {
        results.push({
          teacherId: teacher._id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Regenerated ${successCount} schedules successfully, ${failureCount} failed`,
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Check teacher availability for a specific time slot
// @route   GET /api/schedules/teacher/:teacherId/availability
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

    // Check if teacher exists
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
    }).populate('subjectId', 'name');

    const isAvailable = !conflict;

    res.json({
      success: true,
      data: {
        teacherId,
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

// Helper function to generate teacher schedule
async function generateTeacherSchedule(teacherId, forceRegenerate = false) {
  try {
    // If not forcing regeneration, check if recent schedule exists
    if (!forceRegenerate) {
      const existingSchedule = await TeacherSchedule.findOne({ teacherId });
      if (existingSchedule && 
          existingSchedule.lastGeneratedAt && 
          (Date.now() - existingSchedule.lastGeneratedAt.getTime()) < 60000) { // Less than 1 minute old
        return existingSchedule;
      }
    }

    // Get all routine slots for this teacher
    const routineSlots = await RoutineSlot.find({
      teacherIds: teacherId
    }).populate('subjectId', 'name code')
      .populate('roomId', 'name')
      .sort({ dayIndex: 1, slotIndex: 1 });

    // Initialize schedule structure
    const schedule = {
      0: [], // Sunday
      1: [], // Monday
      2: [], // Tuesday
      3: [], // Wednesday
      4: [], // Thursday
      5: []  // Friday
    };

    // Populate schedule with routine slots
    routineSlots.forEach(slot => {
      const dayIndex = slot.dayIndex.toString();
      if (schedule[dayIndex]) {
        schedule[dayIndex].push({
          slotIndex: slot.slotIndex,
          programCode: slot.programCode,
          semester: slot.semester,
          section: slot.section,
          subjectName: slot.subjectName || slot.subjectId?.name,
          subjectCode: slot.subjectId?.code,
          roomName: slot.roomName_display || slot.roomId?.name,
          classType: slot.classType,
          notes: slot.notes
        });
      }
    });

    // Sort each day's schedule by slot index
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => a.slotIndex - b.slotIndex);
    });

    // Update or create teacher schedule
    const teacherSchedule = await TeacherSchedule.findOneAndUpdate(
      { teacherId },
      {
        teacherId,
        schedule,
        lastGeneratedAt: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return teacherSchedule;
  } catch (error) {
    console.error('Error generating teacher schedule:', error);
    throw error;
  }
}

// Export the helper function for use in other controllers
exports.generateTeacherSchedule = generateTeacherSchedule;
