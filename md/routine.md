# Smart Class Routine Management System

## 1. Overview

This document outlines the design for an advanced Class Routine Management System. The system enables administrators to create, manage, and view weekly class routines for academic programs. Key features include smart scheduling with automatic collision detection, dynamic generation of individual teacher routines, and a user-friendly interface for both admins and general users.

**Assumed Program Structure:**
*   **Programs:** BCT (Computer Engineering), BEI (Electronics Engineering), BEE (Electrical Engineering).
*   **Semesters:** Each program has 8 semesters.
*   **Sections:** Each semester has 2 sections: "AB" and "CD". Each section has its own distinct routine.
*   **Teachers:** A pool of approximately 25 teachers available for assignment.

## 2. Core Features

*   **Programmatic Routine Creation & Management (Admin):**
    *   Admins select Program, Semester, and Section to work on a specific routine.
    *   Interactive "Excel-like" grid for assigning classes to Day/Time Slots.
    *   Ability to assign Subjects, Teacher(s), Rooms, and Class Types to each slot.
*   **Smart Scheduling & Collision Detection:**
    *   **Teacher Collision:** Prevents assigning the same teacher to multiple classes occurring simultaneously across *any* program/section.
    *   **Room Collision:** Prevents assigning the same room to multiple classes occurring simultaneously.
    *   **Class Time Validation:** Ensures class assignments adhere to predefined time slots and program rules.
    *   Real-time feedback or validation warnings during routine creation.
*   **Automatic Teacher Routine Generation:**
    *   When an admin saves/updates a program routine, the system automatically updates the individual schedules for all involved teachers. (See `TEACHER_ROUTINE.md` for details).
*   **Routine Viewing (General Users & Admin):**
    *   Read-only view of finalized program routines for all users.
    *   Visual display mirroring traditional university timetables.
*   **User Interface:**
    *   Built with React and Ant Design for an intuitive experience.
    *   Clear visual cues for scheduled classes, breaks, and potential conflicts.

## 3. User Roles

*   **General User (Student/Faculty):**
    *   Views published class routines for selected programs/semesters/sections.
*   **Administrator:**
    *   Creates, edits, and publishes class routines.
    *   Manages master data (Subjects, Teachers, Rooms).
    *   Receives smart scheduling assistance (collision detection).

## 4. Technical Design - Routine Creation & Management (Admin Focus)

### 4.1. Frontend (`Routine.js` and supporting components)

*   **Routine Selection:** Admin selects Program, Semester (Year/Part), Section.
*   **Grid Interface:**
    *   Displays days (rows) and predefined time slots (columns).
    *   Admin clicks a cell (Day/Time Slot) to open an "Assign Class" modal.
*   **"Assign Class" Modal:**
    *   **Subject Selection:** Dropdown of available subjects.
    *   **Teacher Selection:**
        *   Dropdown of available teachers.
        *   **Smart Filtering:** The list of teachers should ideally be filtered to show only those *available* during the selected time slot (i.e., not already scheduled elsewhere). This requires a quick backend check or pre-fetched availability data.
    *   **Room Selection:**
        *   Dropdown of available rooms.
        *   **Smart Filtering:** Similar to teachers, filter for available rooms.
    *   **Class Type Selection:** (Lecture, Practical, Tutorial).
    *   **Notes/Additional Info:** Text field.
*   **Saving a Class Assignment:**
    *   **Client-Side Pre-validation (Optional but Recommended):** Basic checks.
    *   **Backend Validation & Collision Detection:**
        *   When the admin attempts to save, the backend performs rigorous collision checks:
            *   **Teacher Availability:** Is the selected teacher(s) already assigned to another class (any program/section) at this exact day/time?
            *   **Room Availability:** Is the selected room already booked for another class at this day/time?
        *   If a collision is detected, the backend returns an error message detailing the conflict. The frontend displays this to the admin.
        *   If no collisions, the class is saved to the program routine.
    *   **Teacher Routine Update:** After successful save, trigger update/regeneration of affected teachers' individual routines.
*   **Data Fetching (`@tanstack/react-query`):**
    *   Programs, Semesters, Sections.
    *   Subjects, Teachers, Rooms (for modal dropdowns).
    *   The main `weeklyRoutine` for the selected Program/Semester/Section.

### 4.2. Backend (Node.js/Express.js or similar)

*   **Master Data Management Endpoints:** CRUD for Subjects, Teachers, Rooms.
*   **Routine Management Endpoints:**
    *   `POST /api/routines/:programId/sem/:semester/sec/:section/assignClass`
        *   Request Body: `{ dayIndex, slotIndex, subjectId, teacherIds: [...], roomId, classType, notes }`
        *   **Logic:**
            1.  Validate input.
            2.  **Perform Collision Checks (Critical):**
                *   Query existing `classes` or `routineSlots` collection for the given `teacherIds` at `dayIndex` and `slotIndex`.
                *   Query for the given `roomId` at `dayIndex` and `slotIndex`.
            3.  If collisions: return 409 Conflict error with details.
            4.  If no collisions:
                *   Save/update the class details in the database for the specified program routine slot.
                *   Trigger an asynchronous job or event to update associated teacher routines.
    *   `GET /api/routines/:programId/sem/:semester/sec/:section`: Fetches the routine.
    *   `DELETE /api/routines/:programId/sem/:semester/sec/:section/clearClass`: Clears a class, also triggering teacher routine updates.
*   **Teacher Availability Check Endpoint (Optional for UI enhancement):**
    *   `GET /api/teachers/availability?teacherId=X&dayIndex=Y&slotIndex=Z`
    *   `GET /api/rooms/availability?roomId=X&dayIndex=Y&slotIndex=Z`

## 5. Smart Scheduling Logic (Backend)

*   **Centralized Class Data:** All scheduled classes (regardless of program) need to be queryable by time, teacher, and room. (See `DATABASE_DESIGN.md`).
*   **Time Slot Representation:** Consistent representation of days (e.g., 0 for Sunday, 1 for Monday) and time slots (e.g., 0 for 10:15-11:05, 1 for 11:05-11:55).
*   **Concurrency Control:** If multiple admins could potentially edit routines, a mechanism to handle concurrent updates might be needed (e.g., optimistic locking, though simpler for now might be to limit concurrent editing of the *same specific routine*).

## 6. Database Design Considerations

Refer to `DATABASE_DESIGN.md` for a detailed MongoDB Atlas schema proposal supporting smart scheduling.

## 7. Teacher Routine System Integration

Refer to `TEACHER_ROUTINE.md` for how individual teacher routines are generated and viewed.

## 8. Future Enhancements

*   Batch routine import/export.
*   Automatic suggestion of available teachers/rooms.
*   Advanced constraint rules (e.g., max teaching hours per teacher per day/week).
*   Visual representation of teacher/room load during scheduling.
---