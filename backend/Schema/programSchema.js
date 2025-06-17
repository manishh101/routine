const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  programName: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  part: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster searches
programSchema.index({ programName: 1, year: 1, part: 1, section: 1 });

module.exports = mongoose.model('ImportedProgram', programSchema);
