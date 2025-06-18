const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of all rooms
 */
router.get('/', getRooms);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details
 *       404:
 *         description: Room not found
 */
router.get('/:id', getRoom);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
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
 *               - capacity
 *               - roomType
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               capacity:
 *                 type: number
 *               roomType:
 *                 type: string
 *                 enum: [LECTURE, LAB, TUTORIAL, AUDITORIUM]
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.post(
  '/',
  [
    protect,
    authorize('admin'),
    [
      check('name', 'Room name is required').not().isEmpty(),
      check('code', 'Room code is required').not().isEmpty(),
      check('capacity', 'Capacity must be a positive number').isInt({ min: 1 }),
      check('roomType', 'Room type is required').isIn(['LECTURE', 'LAB', 'TUTORIAL', 'AUDITORIUM'])
    ]
  ],
  createRoom
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update room
 *     tags: [Rooms]
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
 *         description: Room updated successfully
 */
router.put(
  '/:id',
  [
    protect,
    authorize('admin'),
    [
      check('capacity', 'Capacity must be a positive number').optional().isInt({ min: 1 }),
      check('roomType', 'Invalid room type').optional().isIn(['LECTURE', 'LAB', 'TUTORIAL', 'AUDITORIUM'])
    ]
  ],
  updateRoom
);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete room
 *     tags: [Rooms]
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
 *         description: Room deleted successfully
 */
router.delete('/:id', protect, authorize('admin'), deleteRoom);

module.exports = router;
