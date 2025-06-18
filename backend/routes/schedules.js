const express = require('express');
const router = express.Router();
const {
  getTeacherSchedule,
  regenerateTeacherSchedule,
  getAllTeacherSchedules,
  regenerateAllTeacherSchedules,
  checkTeacherAvailability
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/schedules/teacher/:teacherId
// @desc    Get teacher schedule
// @access  Public
router.get('/teacher/:teacherId', getTeacherSchedule);

// @route   POST /api/schedules/teacher/:teacherId/regenerate
// @desc    Regenerate teacher schedule
// @access  Private/Admin
router.post('/teacher/:teacherId/regenerate', [protect, authorize('admin')], regenerateTeacherSchedule);

// @route   GET /api/schedules/teacher/:teacherId/availability
// @desc    Check teacher availability for specific time slot
// @access  Public
router.get('/teacher/:teacherId/availability', checkTeacherAvailability);

// @route   GET /api/schedules/teachers
// @desc    Get all teacher schedules
// @access  Public
router.get('/teachers', getAllTeacherSchedules);

// @route   POST /api/schedules/regenerate-all
// @desc    Regenerate all teacher schedules
// @access  Private/Admin
router.post('/regenerate-all', [protect, authorize('admin')], regenerateAllTeacherSchedules);

module.exports = router;
