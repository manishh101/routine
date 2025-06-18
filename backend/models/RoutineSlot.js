const mongoose = require('mongoose');

const routineSlotSchema = new mongoose.Schema({
  programCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  section: {
    type: String,
    required: true,
    enum: ['AB', 'CD'],
    uppercase: true
  },
  dayIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 5 // 0=Sunday, 1=Monday, ..., 5=Friday (as per MD spec)
  },
  slotIndex: {
    type: Number,
    required: true,
    min: 0
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacherIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  }],
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  classType: {
    type: String,
    required: true,
    enum: ['L', 'P', 'T'], // Lecture, Practical, Tutorial
    default: 'L'
  },
  notes: {
    type: String,
    trim: true
  },
  // Denormalized display fields (as per MD spec)
  subjectName_display: {
    type: String,
    trim: true
  },
  subjectCode_display: {
    type: String,
    trim: true
  },
  teacherShortNames_display: [{
    type: String,
    trim: true
  }],
  roomName_display: {
    type: String,
    trim: true
  },
  timeSlot_display: {
    type: String,
    trim: true // e.g., "10:15 - 11:05"
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for collision detection and fast queries (as per MD spec)
// Unique index to ensure only one class per program-sem-sec-day-slot
routineSlotSchema.index({ 
  programCode: 1, 
  semester: 1, 
  section: 1, 
  dayIndex: 1, 
  slotIndex: 1 
}, { unique: true });

// Teacher collision detection index
routineSlotSchema.index({ 
  dayIndex: 1, 
  slotIndex: 1, 
  teacherIds: 1 
});

// Room collision detection index
routineSlotSchema.index({ 
  dayIndex: 1, 
  slotIndex: 1, 
  roomId: 1 
});

// Performance indexes for common queries
routineSlotSchema.index({ programCode: 1, semester: 1, section: 1 });
routineSlotSchema.index({ teacherIds: 1 });
routineSlotSchema.index({ subjectId: 1 });

module.exports = mongoose.model('RoutineSlot', routineSlotSchema);
