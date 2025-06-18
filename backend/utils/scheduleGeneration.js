const RoutineSlot = require('../models/RoutineSlot');
const TeacherSchedule = require('../models/TeacherSchedule');

/**
 * Generate or update teacher schedule from routine slots
 * @param {String} teacherId - Teacher ObjectId
 * @param {Boolean} forceRegenerate - Force regeneration even if schedule exists
 * @returns {Object} - Generated teacher schedule document
 */
async function generateTeacherSchedule(teacherId, forceRegenerate = false) {
  try {
    // Check if schedule already exists
    let existingSchedule = await TeacherSchedule.findOne({ teacherId });
    
    if (existingSchedule && !forceRegenerate) {
      return existingSchedule;
    }

    // Fetch all routine slots for this teacher
    const routineSlots = await RoutineSlot.find({
      teacherIds: teacherId
    })
      .populate('subjectId', 'name code')
      .populate('roomId', 'name')
      .sort({ dayIndex: 1, slotIndex: 1 });

    // Initialize weekly schedule structure
    const weeklySchedule = {};
    for (let day = 0; day <= 5; day++) {
      weeklySchedule[day] = [];
    }

    // Populate schedule with routine slots
    routineSlots.forEach(slot => {
      const scheduleEntry = {
        slotIndex: slot.slotIndex,
        programCode: slot.programCode,
        semester: slot.semester,
        section: slot.section,
        subjectName: slot.subjectName || slot.subjectId?.name,
        subjectCode: slot.subjectId?.code,
        roomName: slot.roomName_display || slot.roomId?.name,
        classType: slot.classType,
        notes: slot.notes
      };

      weeklySchedule[slot.dayIndex].push(scheduleEntry);
    });

    // Sort each day's schedule by slot index
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => a.slotIndex - b.slotIndex);
    });

    const scheduleData = {
      teacherId,
      schedule: weeklySchedule,
      lastGeneratedAt: new Date()
    };

    // Update or create teacher schedule
    if (existingSchedule) {
      existingSchedule.schedule = weeklySchedule;
      existingSchedule.lastGeneratedAt = new Date();
      await existingSchedule.save();
      return existingSchedule;
    } else {
      const newSchedule = new TeacherSchedule(scheduleData);
      await newSchedule.save();
      return newSchedule;
    }
  } catch (error) {
    console.error(`Error generating teacher schedule for ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Regenerate all teacher schedules
 * @returns {Number} - Number of schedules regenerated
 */
async function regenerateAllTeacherSchedules() {
  try {
    const Teacher = require('../models/Teacher');
    const teachers = await Teacher.find({}, '_id');
    
    let regeneratedCount = 0;
    
    for (const teacher of teachers) {
      try {
        await generateTeacherSchedule(teacher._id, true);
        regeneratedCount++;
      } catch (error) {
        console.error(`Failed to regenerate schedule for teacher ${teacher._id}:`, error);
      }
    }

    return regeneratedCount;
  } catch (error) {
    console.error('Error regenerating all teacher schedules:', error);
    throw error;
  }
}

/**
 * Get teacher load statistics
 * @param {String} teacherId - Teacher ObjectId
 * @returns {Object} - Load statistics
 */
async function getTeacherLoadStatistics(teacherId) {
  try {
    const slots = await RoutineSlot.find({ teacherIds: teacherId });
    
    const stats = {
      totalClasses: slots.length,
      classesByDay: {},
      classesByType: { L: 0, P: 0, T: 0 },
      programDistribution: {}
    };

    // Initialize daily stats
    for (let day = 0; day <= 5; day++) {
      stats.classesByDay[day] = 0;
    }

    slots.forEach(slot => {
      // Count by day
      stats.classesByDay[slot.dayIndex]++;
      
      // Count by class type
      if (stats.classesByType.hasOwnProperty(slot.classType)) {
        stats.classesByType[slot.classType]++;
      }
      
      // Count by program
      const programKey = `${slot.programCode}-${slot.semester}`;
      stats.programDistribution[programKey] = (stats.programDistribution[programKey] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error(`Error getting teacher load statistics for ${teacherId}:`, error);
    throw error;
  }
}

/**
 * Validate schedule consistency
 * @param {String} teacherId - Teacher ObjectId
 * @returns {Object} - Validation results
 */
async function validateTeacherSchedule(teacherId) {
  try {
    const conflicts = await getTeacherScheduleConflicts(teacherId);
    const loadStats = await getTeacherLoadStatistics(teacherId);
    
    const issues = [];
    
    // Check for time conflicts
    if (conflicts.length > 0) {
      issues.push({
        type: 'TIME_CONFLICT',
        message: `Teacher has ${conflicts.length} time conflicts`,
        details: conflicts
      });
    }
    
    // Check for excessive daily load (more than 6 classes per day)
    Object.entries(loadStats.classesByDay).forEach(([day, count]) => {
      if (count > 6) {
        issues.push({
          type: 'EXCESSIVE_DAILY_LOAD',
          message: `Too many classes on day ${day}: ${count} classes`,
          day: parseInt(day),
          count
        });
      }
    });
    
    // Check for excessive weekly load (more than 25 classes per week)
    if (loadStats.totalClasses > 25) {
      issues.push({
        type: 'EXCESSIVE_WEEKLY_LOAD',
        message: `Too many classes per week: ${loadStats.totalClasses} classes`,
        count: loadStats.totalClasses
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      loadStats
    };
  } catch (error) {
    console.error(`Error validating teacher schedule for ${teacherId}:`, error);
    throw error;
  }
}

module.exports = {
  generateTeacherSchedule,
  regenerateAllTeacherSchedules,
  getTeacherLoadStatistics,
  validateTeacherSchedule
};
