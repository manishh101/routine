/**
 * Create Admin User Script
 * Creates an admin user for the routine management system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const User = require('./models/User');

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGO_URI;

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  serverSelectionTimeoutMS: 60000
};

console.log('🔐 Creating Admin User...');

mongoose.connect(MONGODB_URI, options)
  .then(() => {
    console.log('✅ MongoDB Atlas connected to bctroutine database');
    createAdminUser();
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err);
    process.exit(1);
  });

/**
 * Create admin user function
 */
async function createAdminUser() {
  try {
    console.log('👤 Starting admin user creation...');
    
    // Admin user data
    const adminData = {
      name: 'System Administrator',
      email: 'admin@ioe.edu.np',
      password: 'admin123', // This will be hashed
      role: 'admin',
      isActive: true,
      preferences: {
        language: 'en',
        timezone: 'Asia/Kathmandu'
      }
    };
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminData.email }).exec();
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminData.email);
      console.log('🔑 You can login with:');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: admin123`);
      return;
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
    
    // Create admin user with hashed password
    const adminUser = new User({
      ...adminData,
      password: hashedPassword
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('🔑 Login credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${adminData.role}`);
    
    // Verify the user was created
    const verifyUser = await User.findOne({ email: adminData.email }).exec();
    if (verifyUser) {
      console.log(`✅ Verification: Admin user found in database with ID: ${verifyUser._id}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}
