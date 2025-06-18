const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    day: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['lecture', 'practical', 'tutorial'],
      default: 'lecture',
    },
    semester: {
      type: Number,
      required: true,
    },
    section: {
      type: String,
      enum: ['AB', 'CD'],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Class', ClassSchema);
