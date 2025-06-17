const mongoose = require('mongoose');

// Define dummy IDs for default entries
const dummyteacherID = new mongoose.Types.ObjectId('000000000000000000000001');
const dummySubjectID = new mongoose.Types.ObjectId('000000000000000000000002');

module.exports = {
  dummyteacherID,
  dummySubjectID
};
