# Quick Backend Setup Guide

## Current Status
✅ **Teacher Schedule Frontend**: Ready and unified with routine manager
⚠️ **Backend Connection**: Needs MongoDB connection to show real data

## To See Real Teachers Data

### Option 1: Quick Demo Setup (Recommended)

If you want to quickly see the teacher functionality working, you can:

1. **Set up a simple MongoDB instance**:
   ```bash
   # Using Docker (easiest)
   docker run --name routine-mongo -p 27017:27017 -d mongo:latest
   ```

2. **Set environment variables**:
   ```bash
   # In the backend directory
   cd backend
   echo "MONGODB_URI=mongodb://localhost:27017/routine-db" > .env
   echo "JWT_SECRET=your-secret-key-here" >> .env
   echo "PORT=7102" >> .env
   ```

3. **Install dependencies and start**:
   ```bash
   npm install
   npm run dev
   ```

4. **Add some sample teachers** (run this script):
   ```bash
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect('mongodb://localhost:27017/routine-db');
   const teacherSchema = new mongoose.Schema({
     fullName: String,
     shortName: String,
     department: String,
     email: String
   });
   const Teacher = mongoose.model('Teacher', teacherSchema);
   const teachers = [
     { fullName: 'Dr. Shyam Kumar Shrestha', shortName: 'Dr. SK', department: 'Computer Engineering', email: 'sk@college.edu' },
     { fullName: 'Prof. Dr. Narayan Prasad Adhikari', shortName: 'Prof. NP', department: 'Physics', email: 'np@college.edu' },
     { fullName: 'Dr. Prakash Sayami', shortName: 'Dr. PS', department: 'English', email: 'ps@college.edu' }
   ];
   Teacher.insertMany(teachers).then(() => { console.log('Teachers added!'); process.exit(); });
   "
   ```

### Option 2: Use Existing Database

If you have an existing MongoDB connection:

1. **Set your MongoDB URI**:
   ```bash
   export MONGODB_URI="your-mongodb-connection-string"
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

## What You'll See

Once the backend is connected:

1. **Real Teachers Dropdown**: You'll see actual teachers from the database
2. **Live Teacher Schedules**: Real schedule data from the RoutineSlot collection  
3. **Same Data Source**: Teacher schedules will show the exact same data as the routine manager
4. **Real-time Updates**: Changes in routine manager will reflect in teacher schedules

## Architecture Achievement

✅ **Unified Data Access**: Both routine manager and teacher schedule now access the **same RoutineSlot collection**
✅ **Consistent API Format**: Teacher schedule API returns data in the **same format** as routine API  
✅ **Component Reuse**: Teacher schedule uses the **same RoutineGrid component** as routine manager
✅ **Single Source of Truth**: All schedule data comes from one database collection

The implementation is now fully unified! 🚀
