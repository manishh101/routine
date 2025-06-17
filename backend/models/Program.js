const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // In semesters
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Program', ProgramSchema);
