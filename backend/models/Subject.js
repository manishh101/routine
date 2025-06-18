const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true, // Globally unique subject code
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      default: 3
    },
    defaultClassType: {
      type: String,
      enum: ['L', 'P', 'T'],
      default: 'L'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Indexes as per MD specification
// Note: code index is handled by unique: true in field definition
SubjectSchema.index({ name: 1 });
SubjectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
