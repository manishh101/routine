const express = require('express');
const router = express.Router();
const { 
  createSubject, 
  getSubjects, 
  getSubjectById, 
  updateSubject, 
  deleteSubject,
  getSubjectsByProgramId,
  getSubjectsBySemester
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

/**
 * @swagger
 * /api/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - programId
 *               - semester
 *               - creditHours
 *               - lectureHoursPerWeek
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               programId:
 *                 type: string
 *               semester:
 *                 type: number
 *               creditHours:
 *                 type: number
 *               lectureHoursPerWeek:
 *                 type: number
 *               practicalHoursPerWeek:
 *                 type: number
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    check('name', 'Name is required').not().isEmpty(),
    check('code', 'Code is required').not().isEmpty(),
    check('programId', 'Program ID is required').not().isEmpty(),
    check('semester', 'Semester is required').isNumeric(),
    check('creditHours', 'Credit hours is required').isNumeric(),
    check('lectureHoursPerWeek', 'Lecture hours per week is required').isNumeric(),
  ],
  createSubject
);

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/', getSubjects);

/**
 * @swagger
 * /api/subjects/program/{programId}:
 *   get:
 *     summary: Get subjects by program ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subjects for a program
 */
router.get('/program/:programId', getSubjectsByProgramId);

/**
 * @swagger
 * /api/subjects/semester/{semester}:
 *   get:
 *     summary: Get subjects by semester
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: semester
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of subjects for a semester
 */
router.get('/semester/:semester', getSubjectsBySemester);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
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
 *         description: Subject data
 *       404:
 *         description: Subject not found
 */
router.get('/:id', getSubjectById);

/**
 * @swagger
 * /api/subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     tags: [Subjects]
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               programId:
 *                 type: string
 *               semester:
 *                 type: number
 *               creditHours:
 *                 type: number
 *               lectureHoursPerWeek:
 *                 type: number
 *               practicalHoursPerWeek:
 *                 type: number
 *     responses:
 *       200:
 *         description: Subject updated
 *       404:
 *         description: Subject not found
 */
router.put('/:id', protect, authorize('admin'), updateSubject);

/**
 * @swagger
 * /api/subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
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
 *         description: Subject removed
 *       404:
 *         description: Subject not found
 */
router.delete('/:id', protect, authorize('admin'), deleteSubject);

module.exports = router;
