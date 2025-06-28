# Smart Class Routine Management System

> **✨ Clean, Optimized Codebase** - Recently cleaned and optimized for maintainability and performance

A comprehensive web application for managing university class schedules with Excel integration, conflict detection, and automated teacher schedule generation.

## 🚀 Features

### Core Routine Management
- **Single Source of Truth**: RoutineSlot model as the central data store
- **Denormalized Caching**: TeacherSchedule for optimized read operations
- **Smart Collision Detection**: Real-time conflict checking for teachers, rooms, and time slots
- **Flexible Scheduling**: Support for lectures, practicals, and tutorials
- **Teacher Schedule Synchronization**: Automatic teacher schedule updates with real-time sync

### Professional Teacher Management
- **Dynamic Schedule Generation**: Teacher schedules automatically generated from routine data
- **Real-time Synchronization**: Instant updates when routine assignments change
- **Professional Schedule Display**: Clean, comprehensive weekly schedule view
- **Advanced Cache Management**: Intelligent React Query cache invalidation
- **Excel Export**: Professional teacher schedule export functionality

### Professional Data Operations
- **Excel Import/Export**: Professional workflow with template download and validation
- **Bulk Operations**: Efficient handling of large routine imports
- **Data Integrity**: Comprehensive validation against master data
- **Transaction Safety**: Dry-run validation with commit workflow

### User Management
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and Teacher roles with appropriate permissions
- **Profile Management**: User profiles with academic credentials

### Advanced Architecture
- **Async Processing**: RabbitMQ queue for teacher schedule regeneration
- **Worker Services**: Background processing for intensive operations
- **Health Monitoring**: API and queue health check endpoints
- **Database Optimization**: Compound indexes for performance

### Modern UI/UX
- **Responsive Design**: Works on all devices and screen sizes
- **Excel-like Grid**: Intuitive spreadsheet-style routine display
- **Real-time Updates**: Live data synchronization
- **Professional Styling**: Clean interface with Tailwind CSS and Ant Design

## 🛠 Tech Stack

### Frontend
- **React 18+** - Modern React with hooks
- **Vite 5+** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Ant Design** - Professional UI components
- **React Router DOM v6+** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with GridFS support
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **ExcelJS** - Excel file generation and parsing
- **RabbitMQ** - Message queue for async processing
- **Multer** - File upload middleware
- **bcrypt** - Password hashing

### Development & Architecture
- **Professional Workflows**: Template download → validation → commit
- **Message Queues**: Async teacher schedule regeneration
- **Worker Services**: Background task processing
- **Health Monitoring**: API and queue status endpoints
- **Database Optimization**: Compound indexes and efficient queries
- **Error Handling**: Comprehensive validation and error reporting

## 📁 Project Structure

```
/project-root
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── RoutineGrid.jsx          # Excel-like routine display
│   │   │   ├── TeacherRoutine.jsx       # Teacher schedule view
│   │   │   └── ...
│   │   ├── contexts/        # Global state management
│   │   ├── pages/          # Page components
│   │   ├── services/       # API integration
│   │   └── utils/          # Utility functions
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js backend API
│   ├── config/             # Database and authentication config
│   ├── controllers/        # Route handlers with business logic
│   ├── models/            # Mongoose schemas
│   │   ├── RoutineSlot.js  # Single source of truth
│   │   ├── TeacherSchedule.js # Denormalized cache
│   │   └── ...
│   ├── routes/            # API endpoints
│   ├── services/          # External service integrations
│   │   └── queue.service.js # RabbitMQ messaging
│   ├── utils/             # Utility functions
│   │   ├── excelGeneration.js # Excel export logic
│   │   ├── scheduleGeneration.js # Teacher schedule calc
│   │   └── conflictDetection.js # Collision detection
│   ├── scripts/           # Database management scripts
│   ├── worker.js          # Background worker process
│   └── server.js          # Server entry point
├── md/                     # Architecture documentation
│   ├── architecture.md     # System architecture spec
│   ├── database_design.md  # Database schema design
│   └── ...
└── README.md              # Project documentation
```
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Passport.js** - Authentication middleware
- **bcrypt** - Password hashing
- **Swagger/OpenAPI** - API documentation

## 📁 Project Structure

```
/project-root
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # Global state management
│   │   ├── pages/          # Page components
│   │   ├── services/       # API integration
│   │   └── App.jsx         # Main application component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js backend API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route handlers
│   ├── models/            # Database schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── server.js          # Server entry point
└── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS version recommended)
- MongoDB (local installation or MongoDB Atlas)
- RabbitMQ (for async processing)
- npm or yarn package manager

### Quick Start with VS Code Tasks

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd routine
   ```

2. **Use VS Code Tasks (Recommended)**
   - Open project in VS Code
   - Use `Ctrl+Shift+P` → "Tasks: Run Task"
   - Run "Start Backend" (installs dependencies and starts server)
   - Run "Start Frontend" (installs dependencies and starts dev server)

3. **Manual Setup**

   **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your configuration
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   
   npm run dev
   ```
   The backend will start on `http://localhost:7102`

   **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will start on `http://localhost:7101`

4. **Start Background Services**
   ```bash
   # Start RabbitMQ (if using Docker)
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   
   # Start worker service for async processing
   cd backend
   npm run worker
   ```

## 🔐 Authentication

### Initial Admin Setup
After setting up the backend, create an admin user:
```bash
cd backend
node scripts/createAdmin.js
```

### Default Admin Credentials
- **Email**: admin@routine.com
- **Password**: admin123
- **Role**: Admin

### Access Information
- **Public Access**: No login required for viewing routines, teachers, programs, and subjects
- **Admin Access**: Login through the "Admin Login" button in the top-right corner
- **Teacher Accounts**: Created by admins; for record-keeping only (no direct login)

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=7102
MONGODB_URI=mongodb://localhost:27017/be-routine-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
RABBITMQ_URL=amqp://localhost:5672
NODE_ENV=development
```

## 📖 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/login` - Admin login with JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout (clear token)

#### Health Monitoring
- `GET /api/health` - API health status
- `GET /api/health/queue` - RabbitMQ health status

#### Routine Management
- `GET /api/routines/:program/:semester/:section` - Get class routine
- `POST /api/routines/assign` - Assign class to slot (Admin only)
- `DELETE /api/routines/clear` - Clear slot assignment (Admin only)
- `GET /api/routines/teacher/:teacherId` - Get teacher schedule

#### Excel Operations
- `GET /api/routines/export/class/:program/:semester/:section` - Export class routine to Excel
- `GET /api/routines/export/teacher/:teacherId` - Export teacher schedule to Excel
- `GET /api/routines/import/template` - Download Excel import template
- `POST /api/routines/import/validate` - Validate Excel file for import (Admin only)

#### Master Data
- **Teachers**
  - `GET /api/teachers` - Get all teachers
  - `POST /api/teachers` - Create teacher (Admin only)
  - `PUT /api/teachers/:id` - Update teacher (Admin only)
  - `DELETE /api/teachers/:id` - Delete teacher (Admin only)

- **Programs**
  - `GET /api/programs` - Get all programs
  - `POST /api/programs` - Create program (Admin only)
  - `PUT /api/programs/:id` - Update program (Admin only)
  - `DELETE /api/programs/:id` - Delete program (Admin only)

- **Subjects**
  - `GET /api/subjects` - Get all subjects
  - `GET /api/subjects/program/:programId` - Get subjects by program
  - `POST /api/subjects` - Create subject (Admin only)
  - `PUT /api/subjects/:id` - Update subject (Admin only)
  - `DELETE /api/subjects/:id` - Delete subject (Admin only)

- **Rooms**
  - `GET /api/rooms` - Get all rooms
  - `POST /api/rooms` - Create room (Admin only)
  - `PUT /api/rooms/:id` - Update room (Admin only)
  - `DELETE /api/rooms/:id` - Delete room (Admin only)

- **Time Slots**
  - `GET /api/timeslots` - Get all time slot definitions
  - `POST /api/timeslots` - Create time slot (Admin only)
  - `PUT /api/timeslots/:id` - Update time slot (Admin only)
  - `DELETE /api/timeslots/:id` - Delete time slot (Admin only)

### Architecture Features

#### Single Source of Truth
- **RoutineSlot**: Central model for all routine data
- **Denormalized Cache**: TeacherSchedule for optimized queries
- **Async Updates**: Worker service regenerates teacher schedules

#### Professional Excel Workflow
1. **Template Download**: Get properly formatted Excel template
2. **Data Entry**: Fill template with routine data
3. **Validation**: Upload for comprehensive validation
4. **Commit**: Import validated data (transaction-safe)

#### Advanced Collision Detection
- **In-file Conflicts**: Duplicate assignments within upload
- **Database Conflicts**: Existing schedule conflicts
- **Multi-level Validation**: Teacher, room, and slot availability

#### Background Processing
- **Message Queue**: RabbitMQ for async operations
- **Worker Service**: Background teacher schedule regeneration
- **Fallback Mode**: Direct processing if queue unavailable

## 👨‍🏫 Teacher Schedule System

The system features a comprehensive teacher schedule management module with real-time synchronization and professional UI.

### Key Features

#### Automatic Schedule Generation
- **Dynamic Creation**: Teacher schedules are automatically generated from routine assignments
- **Single Source of Truth**: RoutineSlot collection serves as the authoritative data source
- **Real-time Updates**: Schedules update instantly when routine changes occur
- **Queue-based Processing**: Background workers handle schedule regeneration

#### Professional Interface
- **Modern UI**: Clean, responsive design matching the routine manager
- **Comprehensive Display**: Shows subjects, programs, rooms, timings, and class types
- **Schedule Statistics**: Real-time summary of classes, hours, subjects, and programs
- **Excel Export**: Professional schedule export with proper formatting

#### Real-time Synchronization
- **Cache Management**: Intelligent React Query cache invalidation
- **Automatic Updates**: Teacher schedules refresh when routine data changes
- **Performance Optimized**: Minimal API calls with smart caching strategies
- **Error Handling**: Robust error recovery and retry mechanisms

### Usage

#### Teacher Schedule Manager
```jsx
// Simple integration in any React component
import TeacherScheduleManager from '../components/TeacherScheduleManager';

const TeacherPage = () => (
  <TeacherScheduleManager />
);
```

#### Cache Integration
```javascript
// Automatic teacher schedule sync in routine mutations
import { handleRoutineChangeCache } from '../utils/teacherScheduleCache';

const mutation = useMutation({
  mutationFn: assignClass,
  onSuccess: async (result) => {
    await handleRoutineChangeCache(queryClient, result);
  }
});
```

### API Endpoints

#### Teacher Schedules
- `GET /api/teachers/:id/schedule` - Get teacher's weekly schedule
- `GET /api/teachers/:id/schedule/excel` - Export teacher schedule to Excel
- `GET /api/teachers` - List all teachers for selection

### Technical Implementation

#### Backend Infrastructure
- **Dynamic Generation**: Schedules computed in real-time from RoutineSlot data
- **Queue Service**: RabbitMQ handles teacher schedule invalidation messages
- **Performance**: Optimized queries with proper indexing
- **Excel Export**: Server-side Excel generation with professional formatting

#### Frontend Architecture
- **Component Structure**: Modular, reusable components
- **State Management**: React Query for data fetching and caching
- **Real-time Updates**: Automatic cache invalidation and refresh
- **Responsive Design**: Works on all devices and screen sizes

For detailed information, see [TEACHER_SCHEDULE_SYSTEM.md](./TEACHER_SCHEDULE_SYSTEM.md).

## 🔧 Key Features Explained

### Smart Collision Detection
The system prevents scheduling conflicts by checking:
- Teacher availability (same teacher, same time slot)
- Room availability (same room, same time slot)
- Slot conflicts (same program/semester/section, same time)
- Cross-validation during bulk imports

### Excel Import/Export
- **Template-based Import**: Professional workflow with validation
- **Bulk Operations**: Efficient handling of large datasets
- **Error Reporting**: Row-by-row validation feedback
- **Transaction Safety**: Dry-run validation before commit

### Async Processing
- **Queue-based Updates**: Teacher schedules updated asynchronously
- **Worker Services**: Background processing for intensive operations
- **Health Monitoring**: Queue and API status endpoints

### Role-Based Access
- **Admin**: Full CRUD access to all entities and bulk operations
- **Teacher**: View access to schedules and profiles
- **Public**: Read-only access to basic routine information

### Database Architecture
- **Single Source of Truth**: RoutineSlot as central data store
- **Denormalized Caching**: TeacherSchedule for read optimization
- **Compound Indexes**: Optimized queries for common operations
- **Data Integrity**: Comprehensive validation and referential integrity

## 📚 Documentation

- [Architecture Overview](md/architecture.md) - System design and data flow
- [Database Design](md/database_design.md) - Schema and relationships
- [Queue Setup Guide](backend/QUEUE_SETUP.md) - RabbitMQ configuration
- [File Upload Documentation](backend/FILE_UPLOAD_DOCS.md) - Excel import/export workflow

## 🛠 Development Scripts

```bash
# Backend scripts
npm run dev          # Start development server
npm run worker       # Start background worker
npm run test         # Run test suite

# Database management
node scripts/createAdmin.js      # Create admin user
node scripts/clearDatabase.js   # Clear all data
node scripts/seedFaculty.js     # Seed with sample data

# VS Code tasks (recommended)
# Use Ctrl+Shift+P → "Tasks: Run Task"
# - Start Backend
# - Start Frontend
# - Restart Project
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Ant Design team for the beautiful UI components
- MongoDB team for the flexible database
- All open-source contributors who made this project possible

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Happy Coding!** 🎉
