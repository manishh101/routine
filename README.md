# BE Routine Management System

A comprehensive academic routine management system built with modern technologies for managing Bachelor of Engineering (BE) programs.

## 🚀 Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Teacher)
  - Secure password hashing with bcrypt

- **Core Entities Management**
  - Teachers management with profiles
  - Academic programs/courses management
  - Subjects with semester and credit information
  - Class scheduling with collision detection

- **Smart Scheduling**
  - Automatic collision detection for teachers, rooms, and class times
  - Time slot validation
  - Visual timetable representation

- **Modern UI/UX**
  - Responsive design for all devices
  - Clean and intuitive interface
  - Real-time data updates
  - Professional styling with Tailwind CSS and Ant Design

- **Data Visualization**
  - Interactive timetable view
  - Filter by teacher, program, or semester
  - Statistics dashboard
  - Export and print functionality

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
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
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
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd be-routine-management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your configuration
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   
   npm run dev
   ```
   The backend will start on `http://localhost:7102`

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will start on `http://localhost:7101`

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
```

## 📖 API Documentation

Once the backend is running, visit `http://localhost:7102/api-docs` to view the Swagger API documentation.

### Main API Endpoints

- **Authentication**
  - `POST /api/auth/login` - User login
  - `GET /api/auth/me` - Get current user

- **Users**
  - `POST /api/users` - Register new user
  - `GET /api/users` - Get all users (Admin only)

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

- **Classes**
  - `GET /api/classes` - Get all classes
  - `GET /api/classes/teacher/:teacherId` - Get classes by teacher
  - `GET /api/classes/program/:programId/semester/:semester` - Get classes by program and semester
  - `POST /api/classes` - Create class with collision detection (Admin only)
  - `PUT /api/classes/:id` - Update class (Admin only)
  - `DELETE /api/classes/:id` - Delete class (Admin only)

## 🔧 Key Features Explained

### Collision Detection
The system automatically prevents scheduling conflicts by checking:
- Teacher availability (same teacher, same time)
- Room availability (same room, same time)  
- Class conflicts (same program/semester, same time)

### Role-Based Access
- **Admin**: Full access to all features
- **Teacher**: View access to schedules and limited profile management

### Responsive Design
The application works seamlessly across:
- Desktop computers
- Tablets
- Mobile devices

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
