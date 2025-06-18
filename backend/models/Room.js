const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  building: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    required: true,
    enum: ['Lecture Hall', 'Lab-Computer', 'Lab-Electronics', 'Tutorial Room', 'Auditorium'],
    default: 'Lecture Hall'
  },
  features: [{
    type: String,
    enum: ['Projector', 'Whiteboard', 'Microphone System', 'Computer', 'AC', 'Smart Board']
  }],
  availabilityOverrides: [{
    dayIndex: {
      type: Number,
      min: 0,
      max: 6
    },
    slotIndex: {
      type: Number,
      min: 0
    },
    reason: {
      type: String,
      trim: true
    }
  }],
  floor: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
// Note: name index is handled by unique: true in field definition
roomSchema.index({ type: 1 });
roomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Room', roomSchema);
