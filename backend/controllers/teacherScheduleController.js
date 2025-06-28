const mongoose = require('mongoose');
const RoutineSlot = require('../models/RoutineSlot');
const Teacher = require('../models/Teacher');
const TimeSlot = require('../models/TimeSlot');
const ExcelJS = require('exceljs');

/**
 * @desc    Get a teacher's dynamically generated schedule from routine slots
 * @route   GET /api/teachers/:id/schedule
 * @access  Private
 */
exports.getTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.params.id;

    // Validate teacherId format
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID format'
      });
    }
    
    // Make sure teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Find all routine slots that contain this teacher
    const routineSlots = await RoutineSlot.find({
      teacherIds: teacherId
    })
    .populate('subjectId', 'name code')
    .populate('roomId', 'name')
    .populate('teacherIds', 'fullName shortName');

    // Get time slots for display
    const timeSlots = await TimeSlot.find({}).sort({ startTime: 1 });
    const timeSlotsMap = {};
    timeSlots.forEach(slot => {
      timeSlotsMap[slot._id.toString()] = slot;
    });

    // Transform routine slots into the SAME format as routine manager
    // This ensures consistency across the application
    const routine = {};
    for (let day = 0; day <= 6; day++) {
      routine[day] = {};
    }

    routineSlots.forEach(slot => {
      if (!routine[slot.dayIndex]) {
        routine[slot.dayIndex] = {};
      }
      
      // Use the EXACT same structure as routineController.js
      routine[slot.dayIndex][slot.slotIndex] = {
        _id: slot._id,
        subjectId: slot.subjectId?._id,
        subjectName: slot.subjectName_display || slot.subjectId?.name,
        subjectCode: slot.subjectCode_display || slot.subjectId?.code,
        teacherIds: slot.teacherIds.map(t => ({
          _id: t._id,
          fullName: t.fullName || t.name,
          shortName: t.shortName || t.fullName?.split(' ').map(n => n[0]).join('.') || 'T'
        })),
        teacherNames: slot.teacherNames_display || slot.teacherIds.map(t => t.fullName || t.name),
        teacherShortNames: slot.teacherShortNames_display || slot.teacherIds.map(t => t.shortName || t.fullName?.split(' ').map(n => n[0]).join('.') || 'T'),
        roomId: slot.roomId?._id,
        roomName: slot.roomName_display || slot.roomId?.name,
        classType: slot.classType,
        notes: slot.notes,
        timeSlot_display: slot.timeSlot_display,
        // Additional teacher-specific context
        programCode: slot.programCode,
        semester: slot.semester,
        section: slot.section,
        programSemesterSection: `${slot.programCode} ${slot.semester} ${slot.section}`
      };
    });

    // Return the schedule in the SAME format as routine manager
    return res.status(200).json({
      success: true,
      data: {
        teacherId,
        fullName: teacher.fullName,
        shortName: teacher.shortName,
        programCode: 'TEACHER_VIEW', // Special identifier for teacher view
        semester: 'ALL',
        section: 'ALL',
        routine  // Same key name as routine manager!
      },
      message: 'Teacher schedule generated successfully'
    });
  } catch (error) {
    console.error('Error generating teacher schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * @desc    Export a teacher's schedule to Excel
 * @route   GET /api/teachers/:id/schedule/excel
 * @access  Private
 */
exports.exportTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Validate teacherId format
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID format'
      });
    }

    // Find the teacher's information
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Find all routine slots that contain this teacher
    const routineSlots = await RoutineSlot.find({
      teacherIds: teacherId
    })
    .populate('subjectId', 'name code')
    .populate('roomId', 'name');
    
    if (!routineSlots || routineSlots.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No scheduled classes found for this teacher'
      });
    }
    
    // Get time slots for organizing the schedule
    const timeSlots = await TimeSlot.find({}).sort({ startTime: 1 });
    
    // Build the teacher schedule from routine slots
    const schedule = {};
    routineSlots.forEach(slot => {
      const dayIndex = slot.dayIndex.toString();
      if (!schedule[dayIndex]) {
        schedule[dayIndex] = [];
      }
      schedule[dayIndex].push({
        subjectName: slot.subjectId?.name || 'Unknown Subject',
        subjectCode: slot.subjectId?.code || 'UNKNOWN',
        roomName: slot.roomId?.name || 'Unknown Room',
        slotIndex: slot.slotIndex,
        programCode: slot.programCode,
        semester: slot.semester,
        section: slot.section,
        classType: slot.classType
      });
    });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${teacher.shortName || teacher.fullName} Schedule`);

    // Day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Create headers - exactly like class routine
    const headers = ['Day/Time'];
    timeSlots.forEach(slot => {
      headers.push(`${slot.startTime}-${slot.endTime}`);
    });

    // Add header row
    worksheet.addRow(headers);
    
    // Style header row - exactly like class routine
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF366EF7' }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Create routine data structure
    const routineGrid = {};
    dayNames.forEach((day, dayIndex) => {
      routineGrid[dayIndex] = {};
    });

    // Populate routine grid
    Object.keys(schedule).forEach(dayIndex => {
      schedule[dayIndex].forEach(classInfo => {
        const classTypeDisplay = classInfo.classType === 'L' ? 'Lecture' : 
                                classInfo.classType === 'P' ? 'Practical' : 'Tutorial';
        
        routineGrid[dayIndex][classInfo.slotIndex] = {
          subject: `${classInfo.subjectCode}\n${classInfo.subjectName}`,
          program: `${classInfo.programCode}-${classInfo.semester}-${classInfo.section}`,
          room: classInfo.roomName,
          type: classTypeDisplay
        };
      });
    });

    // Add data rows - exactly like class routine
    dayNames.forEach((dayName, dayIndex) => {
      const row = [dayName];
      
      timeSlots.forEach((slot) => {
        const classData = routineGrid[dayIndex][slot._id];
        
        if (classData) {
          const cellContent = `${classData.subject}\n${classData.program}\n${classData.room}\n[${classData.type}]`;
          row.push(cellContent);
        } else {
          row.push(''); // Empty cell instead of 'Free'
        }
      });
      
      worksheet.addRow(row);
    });

    // Style data rows - exactly like class routine
    for (let rowIndex = 2; rowIndex <= dayNames.length + 1; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      row.height = 80;
      
      row.eachCell((cell, colNumber) => {
        if (colNumber === 1) {
          // Day name column
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F0F0' }
          };
          cell.font = { bold: true, size: 10 };
        } else {
          if (!cell.value || cell.value === '') {
            // Empty cell styling
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' }
            };
          } else {
            // Cell with class data
            cell.font = { size: 9 };
          }
        }
        
        cell.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }

    // Set column widths - like class routine
    worksheet.getColumn(1).width = 15; // Day column
    for (let i = 2; i <= headers.length; i++) {
      worksheet.getColumn(i).width = 20;
    }

    // Add title - exactly like class routine
    worksheet.insertRow(1, [`${teacher.fullName} (${teacher.shortName || ''}) - Teacher Schedule`]);
    worksheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' }
    };
    titleCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Set workbook properties
    workbook.creator = 'Routine Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Set content type and disposition for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Teacher_Schedule_${teacher.shortName || teacherId}.xlsx"`);
    
    // Write to response
    await workbook.xlsx.write(res);
    
    // End the response
    res.end();
  } catch (error) {
    console.error('Error exporting teacher schedule to Excel:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};