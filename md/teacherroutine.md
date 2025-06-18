## 1. Overview

This document describes the system for generating and viewing individual weekly routines for each teacher. These routines are automatically derived from the main class schedules created by administrators for various academic programs, semesters, and sections.

## 2. Core Features

*   **Automatic Generation:** Teacher routines are not manually created but are a direct reflection of their assignments in the program routines.
*   **Centralized View:** A dedicated section in the application where users (admins, and potentially teachers themselves if authenticated) can select a teacher and view their weekly schedule.
*   **Read-Only Display:** Teacher routines are typically read-only, as their content is dictated by the program schedules.
*   **Consistent Formatting:** Displayed in a grid similar to program routines (Days vertical, Time horizontal).

## 3. Data Flow and Generation

1.  **Trigger for Update:**
    *   Whenever an administrator successfully saves or modifies a class assignment in any program routine (e.g., assigns Teacher X to a class on Monday, Period 1 for BCT/Sem1/SecAB).
    *   Whenever a class involving a teacher is cleared from a program routine.
2.  **Generation/Update Logic (Backend):**
    *   Upon a trigger, the backend identifies all teachers involved in the changed class(es).
    *   For each affected teacher, their individual routine data is re-calculated or updated.
    *   **Method A (Full Recalculation):** Query *all* `classes` or `routineSlots` across *all* programs/semesters/sections where the specific teacher is assigned. Reconstruct their entire weekly schedule.
    *   **Method B (Incremental Update - More Complex):** If only one class changed, update only that specific entry in the teacher's stored routine. This requires careful handling if a teacher's routine is stored denormalized.
    *   The generated teacher routine data is then stored in a dedicated collection or dynamically assembled on request.
3.  **Data Storage (for Teacher Routines):**
    *   **Option 1 (Denormalized Storage):** A separate collection `teacherSchedules` where each document represents a teacher's full weekly schedule.
        *   `{ teacherId: "...", schedule: { "Sunday": [slotDetails...], "Monday": [...] } }`
        *   `slotDetails` would include: `programCode`, `semester`, `section`, `subjectName`, `roomName`, `classType`.
    *   **Option 2 (Dynamic Assembly):** Teacher routines are always generated on-the-fly by querying the main `classes` collection filtered by `teacherId`. This avoids data duplication but might be slower for frequent views if many classes exist.
    *   Given the need for quick viewing, a denormalized approach (Option 1) with updates on program routine changes is often preferred for performance, despite the denormalization.

## 4. Frontend - Viewing Teacher Routines

*   **Teacher Selection:** A dropdown list to select a teacher (populated by `teachersAPI.getTeachers()`).
*   **API Call:**
    *   `GET /api/teachers/:teacherId/routine`
    *   The backend either retrieves the pre-generated/stored routine for that teacher or dynamically assembles it.
*   **Display:**
    *   Uses the same "Excel-like" grid component as the program routines.
    *   Cells display:
        *   Subject Name
        *   Program Code (e.g., BCT)
        *   Semester & Section (e.g., Sem 1 / AB)
        *   Room Name
        *   Class Type
    *   This provides teachers with a clear overview of where they need to be and when.

## 5. Key Considerations

*   **Data Consistency:** Ensuring that updates to program routines reliably and accurately reflect in teacher routines is paramount. Transactional updates or robust event-driven mechanisms are important if using denormalized storage.
*   **Performance:** If routines are generated dynamically, optimize the queries on the main `classes` collection.
*   **User Access:** Determine if teachers should have direct login access to view their own schedules or if it's primarily an admin/general view.
---