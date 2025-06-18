const { validationResult } = require('express-validator');

// DEPRECATED: This controller is for legacy Class model
// New routine management should use routineController.js and RoutineSlot model

const deprecatedMessage = {
  success: false,
  message: 'This endpoint is deprecated. Please use the new routine management endpoints:',
  newEndpoints: {
    getRoutine: 'GET /api/routines/:programCode/:semester/:section',
    assignClass: 'POST /api/routines/:programCode/:semester/:section/assign',
    clearClass: 'DELETE /api/routines/:programCode/:semester/:section/clear',
    teacherSchedule: 'GET /api/schedules/teacher/:teacherId'
  }
};

// @desc    Create a new class (DEPRECATED)
// @route   POST /api/classes
// @access  Private/Admin
exports.createClass = async (req, res) => {
  res.status(410).json(deprecatedMessage);
};

// @desc    Get all classes (DEPRECATED)
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
  res.status(410).json(deprecatedMessage);
};

// @desc    Get class by ID (DEPRECATED)
// @route   GET /api/classes/:id
// @access  Private
exports.getClassById = async (req, res) => {
  res.status(410).json(deprecatedMessage);
};

// @desc    Update class (DEPRECATED)
// @route   PUT /api/classes/:id
// @access  Private/Admin
exports.updateClass = async (req, res) => {
  res.status(410).json(deprecatedMessage);
};

// @desc    Delete class (DEPRECATED)
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.deleteClass = async (req, res) => {
  res.status(410).json(deprecatedMessage);
};

// @desc    Get classes by teacher ID (DEPRECATED)
// @route   GET /api/classes/teacher/:teacherId
// @access  Private
exports.getClassesByTeacherId = async (req, res) => {
  res.status(410).json({
    ...deprecatedMessage,
    message: 'Use GET /api/schedules/teacher/:teacherId instead'
  });
};

// @desc    Get classes by program and semester (DEPRECATED)
// @route   GET /api/classes/program/:programId/semester/:semester
// @access  Private
exports.getClassesByProgramAndSemester = async (req, res) => {
  res.status(410).json({
    ...deprecatedMessage,
    message: 'Use GET /api/routines/:programCode instead'
  });
};

// @desc    Get classes by program, semester and section (DEPRECATED)
// @route   GET /api/classes/program/:programId/semester/:semester/section/:section
// @access  Private
exports.getClassesByProgramSemesterAndSection = async (req, res) => {
  res.status(410).json({
    ...deprecatedMessage,
    message: 'Use GET /api/routines/:programCode/:semester/:section instead'
  });
};
