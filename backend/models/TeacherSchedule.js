const mongoose = require('mongoose');

const teacherScheduleSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    unique: true
  },
  teacherShortName: {
    type: String,
    required: true,
    trim: true
  },
  teacherFullName_display: {
    type: String,
    required: true,
    trim: true
  },
  schedule: {
    type: Map,
    of: [{
      slotIndex: {
        type: Number,
        required: true
      },
      timeSlot_display: {
        type: String,
        required: true
      },
      programCode: {
        type: String,
        required: true
      },
      semester: {
        type: Number,
        required: true
      },
      section: {
        type: String,
        required: true
      },
      subjectName_display: {
        type: String,
        required: true
      },
      subjectCode_display: {
        type: String,
        required: true
      },
      roomName_display: {
        type: String,
        required: true
      },
      classType: {
        type: String,
        enum: ['L', 'P', 'T'],
        required: true
      },
      notes: String
    }],
    default: {}
  },
  lastGeneratedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance as per MD specification
// Note: teacherId index is handled by unique: true in field definition
teacherScheduleSchema.index({ teacherShortName: 1 });
teacherScheduleSchema.index({ lastGeneratedAt: -1 });
teacherScheduleSchema.index({ isActive: 1 });

module.exports = mongoose.model('TeacherSchedule', teacherScheduleSchema);
