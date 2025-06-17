const bcrypt = require('bcrypt');
const User = require('../models/User');
const connectDB = require('../config/db');
require('dotenv').config();

// Create initial admin user
const createAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@routine.com' });
    
    if (adminExists) {
      console.log('Admin user already exists!');
      return;
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@routine.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@routine.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
