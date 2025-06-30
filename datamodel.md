# Data Model Documentation for Routine Management System

This document provides a comprehensive overview of the data models in the Routine Management System, their relationships, and schema definitions.

## Table of Contents
1. [Overview](#overview)
2. [Data Model Diagram](#data-model-diagram)
3. [Core Entities](#core-entities)
   - [User](#user)
   - [Teacher](#teacher)
   - [Program](#program)
   - [ProgramSemester](#programsemester)
   - [Subject](#subject)
   - [Room](#room)
   - [TimeSlotDefinition](#timeslotdefinition)
   - [RoutineSlot](#routineslot)
4. [Relationships](#relationships)
5. [Indexing Strategy](#indexing-strategy)
6. [Data Denormalization](#data-denormalization)

## Overview

The Routine Management System is designed to manage academic class schedules for educational institutions. It features a comprehensive data model that supports program management, teacher scheduling, room allocation, and class scheduling across different days and time slots.

The system uses MongoDB as its database with Mongoose as the ODM (Object Document Mapper). The data model is built with performance, scalability, and usability in mind, incorporating strategic denormalization and indexing for optimal performance.

## Data Model Diagram

```
                  +----------------+
                  |      User      |
                  +-------+--------+
                          |
                          |
                  +-------v--------+
                  |    Teacher     |
                  +----------------+
                          |
                          |
      +------------------+--------------+
      |                  |              |
+-----v-----+     +------v------+     +-v----------+
|  Subject  |     | RoutineSlot |     |    Room    |
+-----+-----+     +------+------+     +------------+
      |                  |
      |                  |
+-----v-----+     +------v------+     +------------+
|  Program  +---->+ProgramSemester    |TimeSlotDef.|
+-----------+     +---------------+   +------------+
```

## Core Entities

### User

The User model represents system users who can authenticate and access the application.

**Schema:**
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Stored as bcrypt hash
  role: { type: String, enum: ['admin', 'teacher'], default: 'teacher' },
  timestamps: true
}
```

**Indexes:**
- `email`: Unique index (implicitly created by `unique: true`)

**Notes:**
- Password hashing is handled by a pre-save middleware using bcrypt
- Includes a `matchPassword` method for password validation

### Teacher

Represents faculty members who teach classes within the institution.

**Schema:**
```javascript
{
  fullName: { type: String, required: true, trim: true },
  shortName: { type: String, required: true, trim: true, uppercase: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  specializations: [{ type: ObjectId, ref: 'Subject' }],
  availabilityOverrides: [{
    dayIndex: { type: Number, min: 0, max: 6 }, // 0=Sunday to 6=Saturday
    slotIndex: { type: Number, min: 0 },
    reason: { type: String, trim: true }
  }],
  phoneNumber: { type: String, trim: true },
  userId: { type: ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes:**
- `shortName`: For quick lookups by abbreviated name
- `department`: For filtering teachers by department
- `isActive`: For filtering active/inactive teachers
- `email`: Unique index (implicitly created)

**Relationships:**
- One-to-One with `User` via `userId` field
- Many-to-Many with `Subject` via `specializations` array

### Program

Represents academic programs offered by the institution.

**Schema:**
```javascript
{
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  totalSemesters: { type: Number, required: true, default: 8 },
  description: { type: String, trim: true },
  department: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes:**
- `code`: Unique index (implicitly created)

**Notes:**
- Core entity representing a degree or certificate program
- The `code` field serves as a natural identifier (e.g., "BTECH-CSE", "BBA")

### ProgramSemester

Links programs to specific semester configurations and the subjects offered.

**Schema:**
```javascript
{
  programCode: { type: String, required: true, uppercase: true, trim: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  subjectsOffered: [{
    subjectId: { type: ObjectId, ref: 'Subject', required: true },
    // Denormalized fields
    subjectCode_display: { type: String, trim: true },
    subjectName_display: { type: String, trim: true },
    courseType: { 
      type: String, 
      enum: ['Core', 'Elective Group A', 'Elective Group B', 'Audit'], 
      default: 'Core' 
    },
    isElective: { type: Boolean, default: false },
    defaultHoursTheory: { type: Number, min: 0, default: 3 },
    defaultHoursPractical: { type: Number, min: 0, default: 0 }
  }],
  academicYear: { type: String, trim: true, default: '2024-2025' },
  status: { type: String, enum: ['Active', 'Archived', 'Draft'], default: 'Active' },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes:**
- Compound index on `{ programCode: 1, semester: 1, status: 1 }` (unique when status is 'Active')
- Multikey index on `subjectsOffered.subjectId` for efficient subject lookups
- Performance indexes on `programCode`, `isActive`, and `academicYear`

**Relationships:**
- Many-to-One with `Program` via `programCode` field
- Many-to-Many with `Subject` via `subjectsOffered.subjectId` array

**Notes:**
- Contains a critical partial unique index ensuring only one active curriculum per program-semester combination
- Includes denormalized subject information for performance

### Subject

Represents academic courses or subjects taught within programs.

**Schema:**
```javascript
{
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, trim: true },
  credits: { type: Number, required: true, min: 1, default: 3 },
  defaultClassType: { type: String, enum: ['L', 'P', 'T'], default: 'L' }, // Lecture, Practical, Tutorial
  semester: { type: Number, min: 1, max: 8 },
  programCode: { type: String, trim: true, uppercase: true },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes:**
- `code`: Unique index (implicitly created)
- `name`: For searching/filtering by subject name
- `isActive`: For filtering active/inactive subjects

**Notes:**
- The `defaultClassType` indicates the typical instruction method
- Optional `programCode` and `semester` if the subject is specific to one program

### Room

Represents physical spaces where classes can be conducted.

**Schema:**
```javascript
{
  name: { type: String, required: true, unique: true, trim: true },
  building: { type: String, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  type: { 
    type: String, 
    required: true, 
    enum: ['Lecture Hall', 'Lab-Computer', 'Lab-Electronics', 'Tutorial Room', 'Auditorium'], 
    default: 'Lecture Hall' 
  },
  features: [{ 
    type: String, 
    enum: ['Projector', 'Whiteboard', 'Microphone System', 'Computer', 'AC', 'Smart Board'] 
  }],
  availabilityOverrides: [{
    dayIndex: { type: Number, min: 0, max: 6 },
    slotIndex: { type: Number, min: 0 },
    reason: { type: String, trim: true }
  }],
  floor: { type: Number },
  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true },
  timestamps: true
}
```

**Indexes:**
- `name`: Unique index (implicitly created)
- `type`: For filtering rooms by type
- `isActive`: For filtering active/inactive rooms

**Notes:**
- The `availabilityOverrides` array stores time slots when the room is unavailable
- Features array allows tracking room amenities

### TimeSlotDefinition

Defines the standard time slots used across the institution's schedule.

**Schema:**
```javascript
{
  _id: { type: Number, required: true }, // slotIndex as identifier
  label: { type: String, required: true, trim: true },
  startTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  endTime: { type: String, required: true, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  isBreak: { type: Boolean, default: false },
  sortOrder: { type: Number, required: true },
  versionKey: false
}
```

**Indexes:**
- `sortOrder`: For retrieving slots in chronological order

**Notes:**
- Uses custom `_id` field as the `slotIndex` referenced by other models
- Times stored as strings in 24-hour "HH:MM" format with regex validation
- Special `isBreak` flag marks non-teaching periods like lunch breaks

### RoutineSlot

The central entity that represents a scheduled class in a specific time slot, connecting teachers, subjects, rooms, and programs.

**Schema:**
```javascript
{
  programCode: { type: String, required: true, uppercase: true, trim: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  section: { type: String, required: true, enum: ['AB', 'CD'], uppercase: true },
  dayIndex: { type: Number, required: true, min: 0, max: 6 }, // 0=Sunday to 6=Saturday
  slotIndex: { type: Number, required: true, min: 0 },
  subjectId: { type: ObjectId, ref: 'Subject', required: true },
  teacherIds: [{ type: ObjectId, ref: 'Teacher', required: true }],
  roomId: { type: ObjectId, ref: 'Room', required: true },
  classType: { type: String, required: true, enum: ['L', 'P', 'T'], default: 'L' },
  notes: { type: String, trim: true },
  // Multi-slot spanning support
  spanMaster: { type: Boolean, default: false },
  spanId: { type: ObjectId, ref: 'RoutineSlot', default: null },
  // Denormalized fields for display
  subjectName_display: { type: String, trim: true },
  subjectCode_display: { type: String, trim: true },
  teacherShortNames_display: [{ type: String, trim: true }],
  roomName_display: { type: String, trim: true },
  timeSlot_display: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes:**
- Unique compound index on `{ programCode, semester, section, dayIndex, slotIndex }` to prevent scheduling conflicts
- Compound index on `{ dayIndex, slotIndex, teacherIds }` for teacher availability checking
- Compound index on `{ dayIndex, slotIndex, roomId }` for room availability checking
- Performance indexes on multiple query patterns including:
  - `{ programCode, semester, section }` for retrieving a program's routine
  - `{ teacherIds }` for retrieving a teacher's schedule
  - `{ subjectId }` for subject-based queries
  - `{ teacherIds, dayIndex, slotIndex }` for teacher schedule lookups

**Relationships:**
- References `Program` via `programCode`
- References `Subject` via `subjectId`
- References `Teacher` via `teacherIds` array (supports team teaching)
- References `Room` via `roomId`
- References `TimeSlotDefinition` implicitly via `slotIndex`
- Self-references via `spanId` for multi-period classes

**Notes:**
- Central scheduling entity connecting all other models
- Extensive denormalization for UI performance
- Sophisticated indexing strategy for collision detection and efficient querying

## Relationships

1. **User-Teacher**: One-to-One
   - A Teacher can be linked to a User account for authentication

2. **Teacher-Subject**: Many-to-Many
   - Teachers have specializations in multiple subjects
   - Subjects can be taught by multiple teachers

3. **Program-ProgramSemester**: One-to-Many
   - A Program has multiple semesters
   - Each ProgramSemester belongs to exactly one Program

4. **ProgramSemester-Subject**: Many-to-Many
   - A ProgramSemester offers multiple subjects
   - Subjects can be offered in multiple ProgramSemesters

5. **RoutineSlot Connections**:
   - Links Program (via programCode) to a specific semester and section
   - Links to Subject being taught
   - Links to Teacher(s) conducting the class
   - Links to Room where the class is held
   - Links to TimeSlotDefinition (via slotIndex) for when the class occurs
   - Can link to other RoutineSlots via spanId for multi-period classes

## Indexing Strategy

The data model implements a comprehensive indexing strategy:

1. **Natural Keys** - Unique indexes on fields that serve as natural identifiers:
   - `code` for Program and Subject
   - `email` for User and Teacher
   - `name` for Room

2. **Compound Indexes** - For enforcing business rules and speeding up common queries:
   - Unique constraint on RoutineSlot's program+semester+section+day+slot
   - Teacher collision detection via day+slot+teacherId index
   - Room collision detection via day+slot+roomId index

3. **Performance Indexes** - For frequently used queries:
   - Filter indexes on `isActive` fields
   - Search indexes on name/label fields
   - Special-purpose composite indexes for complex queries

4. **Sorting Indexes** - For ordered retrieval:
   - `sortOrder` on TimeSlotDefinition

## Data Denormalization

The system uses strategic denormalization to improve read performance:

1. **Display Fields in RoutineSlot**:
   - `subjectName_display`, `subjectCode_display`, `roomName_display`, `teacherShortNames_display`
   - These fields eliminate the need for joins/lookups when rendering the routine grid

2. **Subject Information in ProgramSemester**:
   - Duplicates key subject details within the curriculum for read efficiency
   - Includes `subjectCode_display` and `subjectName_display`

This denormalization strategy substantially reduces the need for complex aggregate queries while keeping write operations manageable through proper service-layer design.
