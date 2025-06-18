/**
 * Script to create an IOE Pulchowk Campus administrator
 */

const bcrypt = require('bcrypt');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const connectDB = require('../config/db');
require('dotenv').config();

// Create IOE Pulchowk Campus admin user
const createPulchowkAdmin = async () => {
  try {
    await connectDB();
    
    const email = 'admin@ioe.edu.np';
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email });
    
    if (adminExists) {
      console.log('IOE Pulchowk Campus admin user already exists!');
      console.log('Email: admin@ioe.edu.np');
      console.log('Password: pulchowk123');
      return;
    }
    
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pulchowk123', salt);
    
    const admin = new User({
      name: 'IOE Pulchowk Administrator',
      email: email,
      password: hashedPassword,
      role: 'admin'
    });
    
    const savedAdmin = await admin.save();
    
    // Create teacher entry for the admin
    const teacher = new Teacher({
      name: 'IOE Pulchowk Administrator',
      shortName: 'ADMIN',
      email: email,
      department: 'Department of Administration',
      designation: 'Administrator',
      userId: savedAdmin._id
    });
    
    await teacher.save();
    
    console.log('IOE Pulchowk Campus admin user created successfully!');
    console.log('Email: admin@ioe.edu.np');
    console.log('Password: pulchowk123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating IOE Pulchowk admin user:', error);
    process.exit(1);
  }
};

createPulchowkAdmin();
