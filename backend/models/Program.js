const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    totalSemesters: {
      type: Number,
      required: true,
      default: 8
    },
    description: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
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

module.exports = mongoose.model('Program', ProgramSchema);
