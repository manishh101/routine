const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    specializations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
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
    phoneNumber: {
      type: String,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
// Note: email index is handled by unique: true in field definition
TeacherSchema.index({ shortName: 1 });
TeacherSchema.index({ department: 1 });
TeacherSchema.index({ isActive: 1 });

module.exports = mongoose.model('Teacher', TeacherSchema);
