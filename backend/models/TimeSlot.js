const mongoose = require('mongoose');

const timeSlotDefinitionSchema = new mongoose.Schema({
  _id: {
    type: Number, // slotIndex as per MD
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String, // HH:MM format as per MD
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String, // HH:MM format as per MD
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  isBreak: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    required: true
  }
}, {
  _id: false, // Disable auto-generation since we're using custom _id
  versionKey: false
});

// Index for sortOrder to ensure correct display order
timeSlotDefinitionSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('TimeSlotDefinition', timeSlotDefinitionSchema);
