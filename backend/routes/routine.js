const express = require('express');
const router = express.Router();
const {
  getRoutine,
  assignClass,
  clearClass,
  getProgramRoutines,
  checkRoomAvailability
} = require('../controllers/routineController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

// Validation rules for class assignment
const assignClassValidation = [
  check('dayIndex', 'Day index must be between 0-5').isInt({ min: 0, max: 5 }),
  check('slotIndex', 'Slot index must be a non-negative integer').isInt({ min: 0 }),
  check('subjectId', 'Subject ID is required').notEmpty(),
  check('teacherIds', 'Teacher IDs must be an array').isArray({ min: 1 }),
  check('roomId', 'Room ID is required').notEmpty(),
  check('classType', 'Class type must be L, P, or T').isIn(['L', 'P', 'T'])
];

const clearClassValidation = [
  check('dayIndex', 'Day index must be between 0-5').isInt({ min: 0, max: 5 }),
  check('slotIndex', 'Slot index must be a non-negative integer').isInt({ min: 0 })
];

// @route   GET /api/routines/:programCode/:semester/:section
// @desc    Get routine for specific program/semester/section
// @access  Public
router.get('/:programCode/:semester/:section', getRoutine);

// @route   POST /api/routines/:programCode/:semester/:section/assign
// @desc    Assign class to routine slot with collision detection
// @access  Private/Admin
router.post('/:programCode/:semester/:section/assign', 
  [protect, authorize('admin'), assignClassValidation], 
  assignClass
);

// @route   DELETE /api/routines/:programCode/:semester/:section/clear
// @desc    Clear class from routine slot
// @access  Private/Admin
router.delete('/:programCode/:semester/:section/clear', 
  [protect, authorize('admin'), clearClassValidation], 
  clearClass
);

// @route   GET /api/routines/:programCode
// @desc    Get all routines for a program
// @access  Public
router.get('/:programCode', getProgramRoutines);

// @route   GET /api/routines/rooms/:roomId/availability
// @desc    Check room availability for specific time slot
// @access  Public
router.get('/rooms/:roomId/availability', checkRoomAvailability);

module.exports = router;
