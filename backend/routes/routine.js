const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream' // Sometimes Excel files are detected as this
    ];
    const allowedExtensions = ['.xls', '.xlsx'];
    const fileExtension = file.originalname.toLowerCase().slice(-5);
    
    if (allowedMimes.includes(file.mimetype) || 
        allowedExtensions.some(ext => fileExtension.includes(ext))) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. File: ${file.originalname}, MIME: ${file.mimetype}. Only Excel files (.xls, .xlsx) are allowed.`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const {
  getRoutine,
  assignClass,
  assignClassSpanned,
  clearClass,
  clearSpanGroup,
  clearEntireRoutine,
  getProgramRoutines,
  checkRoomAvailability,
  checkTeacherAvailability,
  getAvailableSubjects,
  exportRoutineToExcel,
  importRoutineFromExcel,
  validateRoutineImport,
  downloadImportTemplate
} = require('../controllers/routineController');
const { updateClassAssignment, clearClassAssignment } = require('../controllers/updateRoutineController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

// Validation rules for class assignment
const assignClassValidation = [
  check('dayIndex', 'Day index must be between 0-6').isInt({ min: 0, max: 6 }),
  check('slotIndex', 'Slot index must be a non-negative integer').isInt({ min: 0 }),
  check('subjectId', 'Subject ID is required').notEmpty(),
  check('teacherIds', 'Teacher IDs must be an array').isArray({ min: 1 }),
  check('roomId', 'Room ID is required').notEmpty(),
  check('classType', 'Class type must be L, P, or T').isIn(['L', 'P', 'T'])
];

// Validation rules for updating class assignment
const updateClassValidation = [
  check('dayIndex', 'Day index must be between 0-6').isInt({ min: 0, max: 6 }),
  check('slotIndex', 'Slot index must be a non-negative integer').isInt({ min: 0 }),
  check('subjectId', 'Subject ID is required').notEmpty(),
  check('teacherIds', 'Teacher IDs must be an array').isArray({ min: 1 }),
  check('roomId', 'Room ID is required').notEmpty(),
  check('classType', 'Class type must be L, P, or T').optional().isIn(['L', 'P', 'T'])
];

// Validation rules for spanned class assignment
const assignClassSpannedValidation = [
  check('dayIndex', 'Day index must be between 0-6').isInt({ min: 0, max: 6 }),
  check('slotIndexes', 'Slot indexes must be an array of at least 1 element').isArray({ min: 1 }),
  check('slotIndexes.*', 'Each slot index must be a non-negative integer').optional().isInt({ min: 0 }),
  check('programCode', 'Program code is required').notEmpty(),
  check('semester', 'Semester must be between 1-8').isInt({ min: 1, max: 8 }),
  check('section', 'Section must be either AB or CD').isIn(['AB', 'CD']),
  check('subjectId', 'Subject ID is required').notEmpty(),
  check('teacherIds', 'Teacher IDs must be an array').isArray({ min: 1 }),
  check('roomId', 'Room ID is required').notEmpty(),
  check('classType', 'Class type must be L, P, or T').isIn(['L', 'P', 'T'])
];

const clearClassValidation = [
  check('dayIndex', 'Day index must be between 0-6').isInt({ min: 0, max: 6 }),
  check('slotIndex', 'Slot index must be a non-negative integer').isInt({ min: 0 })
];

// @route   GET /api/routines/import/template
// @desc    Download Excel import template
// @access  Public
router.get('/import/template', downloadImportTemplate);

// @route   POST /api/routines/import/validate
// @desc    Validate uploaded routine Excel file
// @access  Private/Admin
router.post('/import/validate', 
  [protect, authorize('admin')], 
  validateRoutineImport
);

// @route   GET /api/routines/rooms/:roomId/availability
// @desc    Check room availability for specific time slot
// @access  Public
router.get('/rooms/:roomId/availability', checkRoomAvailability);

// @route   GET /api/routines/teachers/:teacherId/availability
// @desc    Check teacher availability for specific time slot
// @access  Public
router.get('/teachers/:teacherId/availability', checkTeacherAvailability);

// @route   GET /api/routines/:programCode/:semester/subjects
// @desc    Get available subjects for assignment
// @access  Public
router.get('/:programCode/:semester/subjects', getAvailableSubjects);

// @route   GET /api/routines/:programCode/:semester/:section/export
// @desc    Export routine to Excel format
// @access  Public
router.get('/:programCode/:semester/:section/export', exportRoutineToExcel);

// @route   POST /api/routines/:programCode/:semester/:section/import
// @desc    Import routine from Excel file
// @access  Private/Admin
router.post('/:programCode/:semester/:section/import', 
  upload.single('file'),
  [protect, authorize('admin')],
  importRoutineFromExcel
);

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

// @route   DELETE /api/routines/:programCode/:semester/:section/clear-all
// @desc    Clear entire weekly routine for a section
// @access  Private/Admin
router.delete('/:programCode/:semester/:section/clear-all',
  [protect, authorize('admin')],
  clearEntireRoutine
);

// @route   GET /api/routines/rooms/:roomId/availability
// @desc    Check room availability for specific time slot
// @access  Public
router.get('/rooms/:roomId/availability', checkRoomAvailability);

// @route   GET /api/routines/teachers/:teacherId/availability
// @desc    Check teacher availability for specific time slot
// @access  Public
router.get('/teachers/:teacherId/availability', checkTeacherAvailability);

// @route   GET /api/routines/:programCode
// @desc    Get all routines for a program
// @access  Public
router.get('/:programCode', getProgramRoutines);

// @route   POST /api/routines/assign-class-spanned
// @desc    Assign class spanning multiple slots with collision detection
// @access  Private/Admin
router.post('/assign-class-spanned',
  [protect, authorize('admin'), assignClassSpannedValidation],
  assignClassSpanned
);

// @route   DELETE /api/routines/clear-span-group/:spanId
// @desc    Clear all slots in a span group (multi-period class)
// @access  Private/Admin
router.delete('/clear-span-group/:spanId', 
  [protect, authorize('admin')], 
  clearSpanGroup
);

// @route   PATCH /api/routines/slots/:slotId/clear
// @desc    Clear a routine slot assignment
// @access  Private/Admin
router.patch('/slots/:slotId/clear', 
  [protect, authorize('admin')], 
  clearClassAssignment
);

// @route   PATCH /api/routines/slots/:slotId
// @desc    Update a routine slot assignment
// @access  Private/Admin
router.patch('/slots/:slotId', 
  [protect, authorize('admin'), updateClassValidation], 
  updateClassAssignment
);

// Teacher schedules are now handled by the schedules controller and routes

module.exports = router;
