/**
 * Clean all indexes and recreate them according to the new schema
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Found collections:', collections.map(c => c.name));

    // Drop all indexes from each collection (except _id)
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🧹 Cleaning indexes for ${collectionName}...`);
      
      try {
        const collectionObj = db.collection(collectionName);
        const indexes = await collectionObj.listIndexes().toArray();
        
        // Drop all indexes except _id_
        for (const index of indexes) {
          if (index.name !== '_id_') {
            await collectionObj.dropIndex(index.name);
            console.log(`  ✅ Dropped index: ${index.name}`);
          }
        }
      } catch (error) {
        console.log(`  ⚠️  Error cleaning ${collectionName}:`, error.message);
      }
    }

    console.log('🎉 All indexes cleaned successfully!');
    console.log('💡 Run your models again to recreate indexes according to new schema');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

cleanIndexes();
