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
      unique: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    creditHours: {
      type: Number,
      required: true,
    },
    lectureHoursPerWeek: {
      type: Number,
      required: true,
    },
    practicalHoursPerWeek: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subject', SubjectSchema);
