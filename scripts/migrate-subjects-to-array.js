const mongoose = require('mongoose');
const Subject = require('../models/Subject');
require('dotenv').config();

async function migrateSubjectsToArray() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all subjects where programId is not an array
    const subjects = await Subject.find({
      $or: [
        { programId: { $exists: false } },
        { programId: { $type: "objectId" } } // Single ObjectId, not array
      ]
    });

    console.log(`Found ${subjects.length} subjects to migrate`);

    for (let subject of subjects) {
      if (subject.programId && !Array.isArray(subject.programId)) {
        // Convert single programId to array
        subject.programId = [subject.programId];
        await subject.save();
        console.log(`Migrated subject: ${subject.code} - ${subject.name}`);
      } else if (!subject.programId) {
        // Set empty array for subjects without programId
        subject.programId = [];
        await subject.save();
        console.log(`Set empty array for subject: ${subject.code} - ${subject.name}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateSubjectsToArray();
