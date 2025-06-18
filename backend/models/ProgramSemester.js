const mongoose = require('mongoose');

const programSemesterSchema = new mongoose.Schema({
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
  subjectsOffered: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    // Denormalized for read performance
    subjectCode_display: {
      type: String,
      trim: true
    },
    subjectName_display: {
      type: String,
      trim: true
    },
    courseType: {
      type: String,
      enum: ['Core', 'Elective Group A', 'Elective Group B', 'Audit'],
      default: 'Core'
    },
    isElective: {
      type: Boolean,
      default: false
    },
    defaultHoursTheory: {
      type: Number,
      min: 0,
      default: 3
    },
    defaultHoursPractical: {
      type: Number,
      min: 0,
      default: 0
    }
  }],
  academicYear: {
    type: String,
    trim: true,
    default: '2024-2025'
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Draft'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Primary functional index for fetching specific program-semester curriculum
programSemesterSchema.index({ 
  programCode: 1, 
  semester: 1,
  status: 1
}, { 
  unique: true,
  partialFilterExpression: { status: 'Active' }
});

// Multikey index for querying specific subjects within the array
programSemesterSchema.index({ 'subjectsOffered.subjectId': 1 });

// Performance indexes
programSemesterSchema.index({ programCode: 1 });
programSemesterSchema.index({ isActive: 1 });
programSemesterSchema.index({ academicYear: 1 });

module.exports = mongoose.model('ProgramSemester', programSemesterSchema);
