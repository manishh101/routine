const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
subjectSchema.index({ subjectName: 1 });
subjectSchema.index({ subjectCode: 1 });

module.exports = mongoose.model('ImportedSubject', subjectSchema);
