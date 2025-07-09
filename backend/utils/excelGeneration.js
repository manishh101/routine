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
    
    // Create headers - include ALL time slots (including breaks)
    const headers = ['Day/Time'];
    const timeSlotMap = new Map(); // Map slot._id to column index
    
    timeSlots.forEach((slot, index) => {
      timeSlotMap.set(slot._id.toString(), index + 1); // +1 because first column is Day/Time
      
      if (slot.isBreak) {
        headers.push('BREAK');
      } else {
        headers.push(`${slot.startTime}-${slot.endTime}`);
      }
    });

    console.log('TimeSlot mapping:', Array.from(timeSlotMap.entries()));
    console.log('Headers:', headers);

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

    // Create routine data structure using time slot IDs
    const routineGrid = {};
    const spanGroups = {}; // Track multi-period classes
    dayNames.forEach((day, dayIndex) => {
      routineGrid[dayIndex] = {};
      // Initialize all time slots for each day using their _id as key
      timeSlots.forEach(slot => {
        routineGrid[dayIndex][slot._id.toString()] = null;
      });
    });

    // Populate routine grid and track span groups
    routineSlots.forEach(slot => {
      const teacherNames = slot.teacherIds.map(t => t.shortName || t.fullName).join(', ');
      const roomName = slot.roomName_display || slot.roomId?.name || 'TBA';
      const classTypeDisplay = slot.classType === 'L' ? 'Lecture' : 
                              slot.classType === 'P' ? 'Practical' : 'Tutorial';
      
      const classData = {
        subject: `${slot.subjectCode_display || slot.subjectId?.code}\n${slot.subjectName_display || slot.subjectId?.name}`,
        teacher: teacherNames,
        room: roomName,
        type: classTypeDisplay,
        notes: slot.notes || '',
        spanId: slot.spanId,
        spanMaster: slot.spanMaster
      };
      
      // Use slot.slotIndex directly (it should match time slot _id)
      const slotKey = slot.slotIndex.toString();
      console.log(`Processing slot: dayIndex=${slot.dayIndex}, slotIndex=${slot.slotIndex}, subject=${slot.subjectName_display || slot.subjectId?.name}`);
      
      if (routineGrid[slot.dayIndex] && routineGrid[slot.dayIndex].hasOwnProperty(slotKey)) {
        routineGrid[slot.dayIndex][slotKey] = classData;
        console.log(`Added class to grid[${slot.dayIndex}][${slotKey}]`);
      } else {
        console.warn(`Invalid slot mapping: dayIndex=${slot.dayIndex}, slotIndex=${slot.slotIndex}`);
      }
      
      // Track span groups for multi-period classes
      if (slot.spanId) {
        if (!spanGroups[slot.spanId]) {
          spanGroups[slot.spanId] = [];
        }
        spanGroups[slot.spanId].push({
          dayIndex: slot.dayIndex,
          slotId: slotKey,
          slotIndex: parseInt(slotKey),
          spanMaster: slot.spanMaster
        });
      }
    });

    // Add data rows
    dayNames.forEach((dayName, dayIndex) => {
      const row = [dayName];
      
      timeSlots.forEach((timeSlot) => {
        const slotKey = timeSlot._id.toString();
        const classData = routineGrid[dayIndex][slotKey];
        
        if (timeSlot.isBreak) {
          row.push('BREAK');
        } else if (classData) {
          // Check if this is part of a multi-period class
          if (classData.spanId && !classData.spanMaster) {
            // This is a spanned slot but not the master - leave empty for merging
            row.push('');
          } else {
            const cellContent = `${classData.subject}\n${classData.teacher}\n${classData.room}\n[${classData.type}]`;
            row.push(cellContent);
          }
        } else {
          row.push(''); // Empty cell
        }
      });
      
      worksheet.addRow(row);
    });

    // Handle cell merging for multi-period classes
    Object.values(spanGroups).forEach(spanGroup => {
      if (spanGroup.length > 1) {
        // Sort span group by slot index to ensure proper merging
        spanGroup.sort((a, b) => a.slotIndex - b.slotIndex);
        
        // Find the master cell
        const masterCell = spanGroup.find(cell => cell.spanMaster);
        if (masterCell) {
          const startCol = masterCell.slotIndex + 2; // +2 because col 1 is day name and slots start from col 2
          const endCol = spanGroup[spanGroup.length - 1].slotIndex + 2;
          const rowNum = masterCell.dayIndex + 2; // +2 because row 1 is header and days start from row 2
          
          // Merge cells horizontally for multi-period classes
          if (startCol < endCol) {
            try {
              worksheet.mergeCells(rowNum, startCol, rowNum, endCol);
              
              // Set the merged cell content and styling
              const mergedCell = worksheet.getCell(rowNum, startCol);
              mergedCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              mergedCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6F7FF' } // Light blue for multi-period classes
              };
              mergedCell.font = { size: 9, bold: true };
              mergedCell.border = {
                top: { style: 'thick', color: { argb: 'FF1677FF' } },
                left: { style: 'thick', color: { argb: 'FF1677FF' } },
                bottom: { style: 'thick', color: { argb: 'FF1677FF' } },
                right: { style: 'thick', color: { argb: 'FF1677FF' } }
              };
            } catch (error) {
              console.warn('Warning: Could not merge cells for multi-period class:', error.message);
            }
          }
        }
      }
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
          const timeSlot = timeSlots[slotIndex];
          const isBreak = timeSlot?.isBreak;
          
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
