const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  routineFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacherName: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  startingPeriod: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  noOfPeriod: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  weekDay: {
    type: String,
    required: true,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  classType: {
    type: String,
    required: true,
    enum: ['L', 'P', 'T', 'L+T', 'L+P', 'P+T'], // Lecture, Practical, Tutorial, combinations
    default: 'L'
  },
  room: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches and collision detection
classSchema.index({ routineFor: 1, weekDay: 1, startingPeriod: 1 });
classSchema.index({ teacherName: 1, weekDay: 1, startingPeriod: 1 });

module.exports = mongoose.model('ImportedClass', classSchema);
