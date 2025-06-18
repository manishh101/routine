const Room = require('../models/Room');
const { validationResult } = require('express-validator');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ building: 1, name: 1 });
    res.json({ success: true, data: rooms });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Public
exports.getRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ success: false, msg: 'Room not found' });
    }
    
    res.json({ success: true, data: room });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, msg: 'Room not found' });
    }
    res.status(500).send('Server error');
  }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, code, capacity, roomType, building, floor, facilities, notes } = req.body;
    
    // Check if room code already exists
    const existingRoom = await Room.findOne({ code });
    if (existingRoom) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Room with this code already exists' 
      });
    }

    const room = new Room({
      name,
      code: code.toUpperCase(),
      capacity,
      roomType,
      building,
      floor,
      facilities,
      notes
    });

    await room.save();
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, code, capacity, roomType, building, floor, facilities, notes } = req.body;
    
    let room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, msg: 'Room not found' });
    }

    // Check if new code conflicts with existing room
    if (code && code.toUpperCase() !== room.code) {
      const existingRoom = await Room.findOne({ code: code.toUpperCase() });
      if (existingRoom) {
        return res.status(400).json({ 
          success: false, 
          msg: 'Room with this code already exists' 
        });
      }
    }

    const updateFields = {
      name: name || room.name,
      code: code ? code.toUpperCase() : room.code,
      capacity: capacity || room.capacity,
      roomType: roomType || room.roomType,
      building: building || room.building,
      floor: floor !== undefined ? floor : room.floor,
      facilities: facilities || room.facilities,
      notes: notes !== undefined ? notes : room.notes
    };

    room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: room });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ success: false, msg: 'Room not found' });
    }

    // Soft delete by setting isActive to false
    await Room.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    res.json({ success: true, msg: 'Room deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
