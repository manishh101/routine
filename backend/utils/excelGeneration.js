const ExcelJS = require('exceljs');
const RoutineSlot = require('../models/RoutineSlot');
const TimeSlotDefinition = require('../models/TimeSlot');

/**
 * Generate Excel file for class routine
 * @param {String} programCode - Program code (e.g., 'BCT')
 * @param {Number} semester - Semester number
 * @param {String} section - Section (e.g., 'AB', 'CD')
 * @returns {Buffer} - Excel file buffer
 */
async function generateClassRoutineExcel(programCode, semester, section) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${programCode} Sem ${semester} ${section} Routine`);

    // Get time slots for headers
    const timeSlots = await TimeSlotDefinition.find().sort({ sortOrder: 1 });
    
    // Get routine slots
    const routineSlots = await RoutineSlot.find({
      programCode: programCode.toUpperCase(),
      semester: parseInt(semester),
      section: section.toUpperCase()
    })
      .populate('subjectId', 'name code')
      .populate('teacherIds', 'fullName shortName')
      .populate('roomId', 'name')
      .sort({ dayIndex: 1, slotIndex: 1 });

    // Day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Create headers
    const headers = ['Day/Time'];
    timeSlots.forEach(slot => {
      if (!slot.isBreak) {
        headers.push(`${slot.label}\n(${slot.startTime}-${slot.endTime})`);
      } else {
        headers.push(slot.label);
      }
    });

    // Add header row
    worksheet.addRow(headers);
    
    // Style header row
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
    routineSlots.forEach(slot => {
      const teacherNames = slot.teacherIds.map(t => t.shortName || t.fullName).join(', ');
      const roomName = slot.roomName_display || slot.roomId?.name || 'TBA';
      const classTypeDisplay = slot.classType === 'L' ? 'Lecture' : 
                              slot.classType === 'P' ? 'Practical' : 'Tutorial';
      
      routineGrid[slot.dayIndex][slot.slotIndex] = {
        subject: `${slot.subjectCode_display || slot.subjectId?.code}\n${slot.subjectName_display || slot.subjectId?.name}`,
        teacher: teacherNames,
        room: roomName,
        type: classTypeDisplay,
        notes: slot.notes || ''
      };
    });

    // Add data rows
    dayNames.forEach((dayName, dayIndex) => {
      const row = [dayName];
      
      timeSlots.forEach((slot, slotIndex) => {
        const classData = routineGrid[dayIndex][slotIndex];
        
        if (slot.isBreak) {
          row.push('BREAK');
        } else if (classData) {
          const cellContent = `${classData.subject}\n${classData.teacher}\n${classData.room}\n[${classData.type}]`;
          row.push(cellContent);
        } else {
          row.push(''); // Empty cell instead of 'Free'
        }
      });
      
      worksheet.addRow(row);
    });

    // Style data rows
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
          // Check if it's a break column
          const slotIndex = colNumber - 2;
          const isBreak = timeSlots[slotIndex]?.isBreak;
          
          if (isBreak) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFECB3' }
            };
            cell.font = { bold: true, size: 10 };
          } else if (!cell.value || cell.value === '') {
            // Empty cell styling - clean white background
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' }
            };
          } else {
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

    // Set column widths
    worksheet.getColumn(1).width = 15; // Day column
    for (let i = 2; i <= headers.length; i++) {
      worksheet.getColumn(i).width = 20;
    }

    // Add title
    worksheet.insertRow(1, [`${programCode.toUpperCase()} Semester ${semester} Section ${section.toUpperCase()} - Class Routine`]);
    worksheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' }
    };
    titleCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error('Error generating class routine Excel:', error);
    throw error;
  }
}

module.exports = {
  generateClassRoutineExcel
};
