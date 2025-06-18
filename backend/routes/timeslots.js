const express = require('express');
const router = express.Router();
const {
  getTimeSlots,
  getTimeSlot,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  initializeTimeSlots
} = require('../controllers/timeSlotDefinitionController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

// Validation rules
const timeSlotValidation = [
  check('startTime', 'Start time is required').notEmpty(),
  check('endTime', 'End time is required').notEmpty(),
  check('label', 'Label is required').notEmpty(),
  check('isBreak', 'isBreak must be a boolean').isBoolean()
];

// @route   GET /api/timeslots
// @desc    Get all time slots
// @access  Public
router.get('/', getTimeSlots);

// @route   GET /api/timeslots/:id
// @desc    Get single time slot
// @access  Public
router.get('/:id', getTimeSlot);

// @route   POST /api/timeslots
// @desc    Create new time slot
// @access  Private/Admin
router.post('/', [protect, authorize('admin'), timeSlotValidation], createTimeSlot);

// @route   PUT /api/timeslots/:id
// @desc    Update time slot
// @access  Private/Admin
router.put('/:id', [protect, authorize('admin'), timeSlotValidation], updateTimeSlot);

// @route   DELETE /api/timeslots/:id
// @desc    Delete time slot
// @access  Private/Admin
router.delete('/:id', [protect, authorize('admin')], deleteTimeSlot);

// @route   POST /api/timeslots/init
// @desc    Initialize default time slots
// @access  Private/Admin
router.post('/init', [protect, authorize('admin')], initializeTimeSlots);

module.exports = router;
