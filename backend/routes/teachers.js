const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const teacherController = require('../controllers/teacherController');
const routineController = require('../controllers/routineController');
const teacherScheduleController = require('../controllers/teacherScheduleController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/teachers:
 *   post:
 *     summary: Create a new teacher
 *     tags: [Teachers]
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
 *               - email
 *               - department
 *               - designation
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  verifyToken,
  requireAdmin,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('department', 'Department is required').not().isEmpty(),
    check('designation', 'Designation is required').not().isEmpty(),
  ],
  teacherController.createTeacher
);

/**
 * @swagger
 * /api/teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/', teacherController.getTeachers);

/**
 * @swagger
 * /api/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     tags: [Teachers]
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
 *         description: Teacher data
 *       404:
 *         description: Teacher not found
 */
router.get('/:id', verifyToken, teacherController.getTeacherById);

/**
 * @swagger
 * /api/teachers/{id}:
 *   put:
 *     summary: Update a teacher
 *     tags: [Teachers]
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
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher updated
 *       404:
 *         description: Teacher not found
 */
router.put(
  '/:id',
  verifyToken,
  requireAdmin,
  teacherController.updateTeacher
);

/**
 * @swagger
 * /api/teachers/{id}:
 *   delete:
 *     summary: Delete a teacher
 *     tags: [Teachers]
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
 *         description: Teacher removed
 *       404:
 *         description: Teacher not found
 */
router.delete('/:id', verifyToken, requireAdmin, teacherController.deleteTeacher);

/**
 * @swagger
 * /api/teachers/{id}/schedule:
 *   get:
 *     summary: Get a teacher's pre-generated schedule
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The teacher's ID
 *     responses:
 *       200:
 *         description: The teacher's schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: Teacher schedule not found
 */
router.get('/:id/schedule', teacherScheduleController.getTeacherSchedule);

/**
 * @swagger
 * /api/teachers/{id}/schedule/excel:
 *   get:
 *     summary: Export a teacher's schedule as Excel file
 *     tags: [Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The teacher's ID
 *     responses:
 *       200:
 *         description: Excel file containing the teacher's schedule
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Teacher or schedule not found
 */
router.get('/:id/schedule/excel', teacherScheduleController.exportTeacherSchedule);

module.exports = router;
