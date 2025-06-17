## Project: BE Routine Management System (Modern Stack)

### Goal:
Develop a comprehensive 


BE Routine Management System that is modern, professional, and fully functional, with a focus on a clean UI/UX across all sections.

### Up-to-date Tech Stack:

**Frontend:**
*   **Framework:** React (latest stable version, e.g., React 18+)
*   **Build Tool:** Vite (latest stable version, e.g., Vite 5+)
*   **Styling:** Tailwind CSS for utility-first styling, and Ant Design (latest stable version) for UI components. Consider using CSS-in-JS solutions like Styled Components or Emotion for component-specific styling if needed.
*   **State Management:** React Context API or Zustand/Jotai for lightweight global state management. Redux Toolkit if complex global state is required.
*   **Routing:** React Router DOM (latest stable version, e.g., v6+)
*   **Data Fetching:** React Query (TanStack Query) or SWR for efficient data fetching, caching, and synchronization.

**Backend:**
*   **Framework:** Node.js with Express.js (latest stable versions)
*   **Database:** MongoDB (latest stable version) with Mongoose (latest stable version) ODM.
*   **Authentication:** Passport.js for local authentication (username/password) with JWT (JSON Web Tokens) for stateless authentication.
*   **API Documentation:** Swagger/OpenAPI for API documentation.
*   **Validation:** Joi or Express-validator for request payload validation.

**Deployment (Optional but Recommended for a complete project):**
*   **Frontend:** Vercel or Netlify
*   **Backend:** Render, Railway, or Fly.io
*   **Database:** MongoDB Atlas (cloud-hosted MongoDB)

### Project Structure (Recommended):

```
/project-root
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/ (for React Context API)
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/ (for API calls)
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/
│   │   ├── db.js (MongoDB connection)
│   │   └── passport.js (Authentication setup)
│   ├── controllers/
│   ├── models/ (Mongoose schemas)
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── app.js
│   ├── server.js (or www file)
│   ├── package.json
│   └── .env
├── .gitignore
├── README.md
└── package.json (root for monorepo setup, if desired)
```

### Key Functionalities to Implement:

**User Management & Authentication:**
1.  **User Registration:** Allow new users to sign up with email and password.
2.  **User Login:** Implement secure login with password hashing (bcrypt).
3.  **Authentication:** Use JWT for session management and protect routes.
4.  **User Roles:** Implement basic roles (e.g., Admin, Teacher) to control access to different sections.

**Routine Management:**
1.  **CRUD Operations for Core Entities:**
    *   **Teachers:** Add, view, edit, delete teacher profiles.
    *   **Programs/Courses:** Add, view, edit, delete academic programs/courses.
    *   **Subjects:** Add, view, edit, delete subjects.
    *   **Classes/Lectures:** Schedule classes with details like subject, teacher, program, time, and room.
2.  **Collision Detection:** Implement logic to detect and warn about scheduling conflicts (e.g., a teacher assigned to two classes at the same time, or a room booked twice).
3.  **Teacher Routines View:** Allow viewing routines for individual teachers.

**Import/Export:**
1.  **Data Import:** Functionality to import routine data from a structured file format (e.g., CSV, Excel).
2.  **Data Export:** Functionality to export routine data to a structured file format (e.g., PDF, CSV, Excel).

**UI/UX Improvements (Modern & Professional Look):**
1.  **Responsive Design:** Ensure the application is fully responsive and works seamlessly across various devices (desktop, tablet, mobile).
2.  **Consistent Styling:** Apply a modern design system using Tailwind CSS and Ant Design for a consistent look and feel across all pages.
3.  **Intuitive Navigation:** Implement clear and easy-to-use navigation (sidebar, header).
4.  **Form Enhancements:** Improve form layouts, validation feedback, and user experience for data entry.
5.  **Data Visualization:** Consider using charts or visual aids for routine display (e.g., a timetable view).
6.  **Loading States & Feedback:** Provide clear loading indicators and user feedback for asynchronous operations.

### Development Steps:

1.  **Project Setup:**
    *   Initialize a new Vite React project for the frontend.
    *   Initialize a new Node.js Express project for the backend.
    *   Set up a monorepo if you prefer (e.g., using Lerna or npm/yarn workspaces).

2.  **Backend Development:**
    *   Configure MongoDB connection using Mongoose.
    *   Define Mongoose schemas for User, Teacher, Program, Subject, Class.
    *   Implement user authentication routes (register, login) with Passport.js and JWT.
    *   Create API endpoints for CRUD operations on all core entities.
    *   Implement collision detection logic in the class scheduling API.
    *   Add API endpoints for import/export functionalities.
    *   Implement error handling and validation for all API endpoints.

3.  **Frontend Development:**
    *   Set up React Router DOM for navigation.
    *   Design and implement responsive layouts using Tailwind CSS and Ant Design components.
    *   Create pages for Login, Signup, Home, Routine View, Manage Teachers, Manage Programs, Import/Export.
    *   Develop forms for adding/editing teachers, programs, subjects, and classes.
    *   Integrate with backend APIs using React Query or SWR.
    *   Implement state management for user authentication and routine data.
    *   Display collision warnings prominently.
    *   Implement import/export UI and integrate with backend endpoints.

4.  **UI/UX Refinement:**
    *   Continuously review and refine the UI based on modern design principles.
    *   Pay attention to typography, color palette, spacing, and component consistency.
    *   Ensure accessibility standards are met.

5.  **Testing:**
    *   Implement unit and integration tests for both frontend and backend.
    *   Manually test all functionalities and UI interactions.

6.  **Deployment:**
    *   Deploy the backend API to a cloud platform.
    *   Deploy the frontend application to a static hosting service.
    *   Connect the frontend to the deployed backend API.

### How to Run the Project (General Steps for your laptop):

**Prerequisites:**
*   Node.js (LTS version recommended) and npm/yarn installed.
*   MongoDB installed locally or access to a MongoDB Atlas cluster.

**1. Clone the Project:**
```bash
git clone <repository-url>
cd <project-root-directory>
```

**2. Backend Setup:**
```bash
cd backend
npm install
# Create a .env file in the backend directory with your MongoDB connection string
# Example .env content:
# MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database?retryWrites=true&w=majority
npm start
# The backend should start on port 7102 (or as configured)
```

**3. Frontend Setup:**
```bash
cd frontend
npm install
# Ensure vite.config.js points to your backend URL (e.g., http://localhost:7102 for local development)
npm run dev
# The frontend should start on port 7101 (or as configured) and open in your browser
```



This detailed prompt provides a roadmap for building a robust and modern BE Routine Management System. Good luck!

