const TimeSlotDefinition = require('../models/TimeSlot');
const { validationResult } = require('express-validator');

// @desc    Get all time slots
// @route   GET /api/timeslots
// @access  Public
exports.getTimeSlots = async (req, res) => {
  try {
    const timeSlots = await TimeSlotDefinition.find().sort({ sortOrder: 1 });
    res.json({
      success: true,
      count: timeSlots.length,
      data: timeSlots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single time slot
// @route   GET /api/timeslots/:id
// @access  Public
exports.getTimeSlot = async (req, res) => {
  try {
    const timeSlot = await TimeSlotDefinition.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    res.json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create time slot
// @route   POST /api/timeslots
// @access  Private/Admin
exports.createTimeSlot = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Check if time slot with same _id already exists
    const existingSlot = await TimeSlotDefinition.findById(req.body._id);
    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: 'Time slot with this ID already exists'
      });
    }

    const timeSlot = await TimeSlotDefinition.create(req.body);

    res.status(201).json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update time slot
// @route   PUT /api/timeslots/:id
// @access  Private/Admin
exports.updateTimeSlot = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const timeSlot = await TimeSlotDefinition.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    res.json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete time slot
// @route   DELETE /api/timeslots/:id
// @access  Private/Admin
exports.deleteTimeSlot = async (req, res) => {
  try {
    const timeSlot = await TimeSlotDefinition.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    await TimeSlotDefinition.findByIdAndDelete(req.params.id);

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

// @desc    Initialize default time slots
// @route   POST /api/timeslots/init
// @access  Private/Admin
exports.initializeTimeSlots = async (req, res) => {
  try {
    // Check if time slots already exist
    const existingSlots = await TimeSlotDefinition.find();
    if (existingSlots.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slots already initialized'
      });
    }

    // Default time slots for a typical university schedule
    const defaultTimeSlots = [
      { _id: 0, startTime: "10:15", endTime: "11:05", isBreak: false, label: "Period 1" },
      { _id: 1, startTime: "11:05", endTime: "11:55", isBreak: false, label: "Period 2" },
      { _id: 2, startTime: "11:55", endTime: "12:45", isBreak: true, label: "BREAK" },
      { _id: 3, startTime: "12:45", endTime: "13:35", isBreak: false, label: "Period 3" },
      { _id: 4, startTime: "13:35", endTime: "14:25", isBreak: false, label: "Period 4" },
      { _id: 5, startTime: "14:25", endTime: "15:15", isBreak: false, label: "Period 5" },
      { _id: 6, startTime: "15:15", endTime: "16:05", isBreak: false, label: "Period 6" }
    ];

    const timeSlots = await TimeSlotDefinition.insertMany(defaultTimeSlots);

    res.status(201).json({
      success: true,
      count: timeSlots.length,
      data: timeSlots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
