const express = require('express');
const router = express.Router();
const { 
  createClass, 
  getClasses, 
  getClassById, 
  updateClass, 
  deleteClass,
  getClassesByTeacherId,
  getClassesByProgramAndSemester,
  getClassesByProgramSemesterAndSection
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - subjectId
 *               - teacherId
 *               - day
 *               - startTime
 *               - endTime
 *               - roomNumber
 *               - semester
 *             properties:
 *               programId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               day:
 *                 type: string
 *                 enum: [sunday, monday, tuesday, wednesday, thursday, friday, saturday]
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [lecture, practical, tutorial]
 *               semester:
 *                 type: number
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Bad request or scheduling conflict
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    check('programId', 'Program ID is required').not().isEmpty(),
    check('subjectId', 'Subject ID is required').not().isEmpty(),
    check('teacherId', 'Teacher ID is required').not().isEmpty(),
    check('day', 'Day is required').isIn(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty(),
    check('roomNumber', 'Room number is required').not().isEmpty(),
    check('semester', 'Semester is required').isNumeric(),
  ],
  createClass
);

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get('/', getClasses);

/**
 * @swagger
 * /api/classes/teacher/{teacherId}:
 *   get:
 *     summary: Get classes by teacher ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of classes for a teacher
 */
router.get('/teacher/:teacherId', getClassesByTeacherId);

/**
 * @swagger
 * /api/classes/program/{programId}/semester/{semester}:
 *   get:
 *     summary: Get classes by program ID and semester
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: semester
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of classes for a program and semester
 */
router.get('/program/:programId/semester/:semester', getClassesByProgramAndSemester);

/**
 * @swagger
 * /api/classes/program/{programId}/semester/{semester}/section/{section}:
 *   get:
 *     summary: Get classes by program ID, semester, and section
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: semester
 *         required: true
 *         schema:
 *           type: number
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of classes for a program, semester, and section
 */
router.get('/program/:programId/semester/:semester/section/:section', getClassesByProgramSemesterAndSection);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class data
 *       404:
 *         description: Class not found
 */
router.get('/:id', getClassById);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               programId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               day:
 *                 type: string
 *                 enum: [sunday, monday, tuesday, wednesday, thursday, friday, saturday]
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [lecture, practical, tutorial]
 *               semester:
 *                 type: number
 *     responses:
 *       200:
 *         description: Class updated
 *       404:
 *         description: Class not found
 */
router.put(
  '/:id', 
  protect, 
  authorize('admin'), 
  updateClass
);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class removed
 *       404:
 *         description: Class not found
 */
router.delete('/:id', protect, authorize('admin'), deleteClass);

module.exports = router;
