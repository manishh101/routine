#!/usr/bin/env node

/**
 * Migration script to update the unique index on RoutineSlot collection
 * to include labGroup field, allowing separate slots for Group A and Group B
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrateUniqueIndex() {
  try {
    console.log('🔄 Starting unique index migration...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('routineslots');
    
    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Find the old unique index
    const oldUniqueIndex = indexes.find(idx => 
      idx.name.includes('programCode_1_semester_1_section_1_dayIndex_1_slotIndex_1') && 
      idx.unique === true &&
      !idx.key.labGroup
    );
    
    if (oldUniqueIndex) {
      console.log('🗑️  Dropping old unique index:', oldUniqueIndex.name);
      await collection.dropIndex(oldUniqueIndex.name);
      console.log('✅ Old unique index dropped');
    } else {
      console.log('ℹ️  Old unique index not found or already updated');
    }
    
    // Check if new index already exists
    const newUniqueIndex = indexes.find(idx => 
      idx.key.programCode === 1 &&
      idx.key.semester === 1 &&
      idx.key.section === 1 &&
      idx.key.dayIndex === 1 &&
      idx.key.slotIndex === 1 &&
      idx.key.labGroup === 1 &&
      idx.unique === true
    );
    
    if (!newUniqueIndex) {
      console.log('🔧 Creating new unique index with labGroup...');
      await collection.createIndex(
        {
          programCode: 1,
          semester: 1,
          section: 1,
          dayIndex: 1,
          slotIndex: 1,
          labGroup: 1
        },
        { 
          unique: true,
          name: 'programCode_1_semester_1_section_1_dayIndex_1_slotIndex_1_labGroup_1'
        }
      );
      console.log('✅ New unique index created');
    } else {
      console.log('ℹ️  New unique index already exists');
    }
    
    // Update existing documents to have labGroup field if missing
    console.log('🔄 Updating existing documents to include labGroup field...');
    const updateResult = await collection.updateMany(
      { labGroup: { $exists: false } },
      { $set: { labGroup: null } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} documents with labGroup field`);
    
    console.log('📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    });
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUniqueIndex()
    .then(() => {
      console.log('🎉 Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}

module.exports = migrateUniqueIndex;
