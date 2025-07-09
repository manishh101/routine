/**
 * Excel Routine Import Script
 * This script imports routine data from Excel file (BCT_ROUTINE_Updated.xlsx)
 */

const ExcelJS = require('exceljs');
const axios = require('axios');
const path = require('path');

const API_BASE = 'http://localhost:7102/api';

// Admin credentials
const adminCredentials = {
  email: 'admin@ioe.edu.np',
  password: 'admin123'
};

let authToken = null;

// Function to login
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

// Function to read Excel file
async function readExcelFile(filePath) {
  try {
    console.log(`📖 Reading Excel file: ${filePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log(`📄 Found sheets: ${workbook.worksheets.map(ws => ws.name).join(', ')}`);
    
    const routineData = [];
    
    // Process each worksheet
    workbook.worksheets.forEach(worksheet => {
      console.log(`\n🔄 Processing sheet: ${worksheet.name}`);
      
      // Skip empty sheets
      if (worksheet.rowCount < 2) {
        console.log(`⚠️  Sheet ${worksheet.name} is empty or has no data, skipping...`);
        return;
      }
      
      // Parse the sheet data
      const sheetRoutine = parseSheetData(worksheet);
      routineData.push(...sheetRoutine);
    });
    
    console.log(`✅ Total routine slots found: ${routineData.length}`);
    return routineData;
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    throw error;
  }
}

// Function to parse sheet data
function parseSheetData(jsonData, sheetName) {
  const routineSlots = [];
  
  // Extract year and semester from sheet name (e.g., "BCT 4-1" -> year: 4, semester: 7)
  const yearSemesterMatch = sheetName.match(/(\d+)-(\d+)/);
  if (!yearSemesterMatch) {
    console.log(`⚠️  Cannot parse year/semester from sheet name: ${sheetName}`);
    return routineSlots;
  }
  
  const year = parseInt(yearSemesterMatch[1]);
  const semesterPart = parseInt(yearSemesterMatch[2]);
  const semester = (year - 1) * 2 + semesterPart; // Convert to semester number
  
  console.log(`📊 Processing Year ${year}, Semester ${semester}`);
  
  // Assume first row is headers and first column is time slots
  const headers = jsonData[0];
  const timeColumn = 0;
  
  // Days mapping (assuming columns after time are days)
  const dayColumns = {
    'Sunday': 1,
    'Monday': 2,
    'Tuesday': 3,
    'Wednesday': 4,
    'Thursday': 5,
    'Friday': 6
  };
  
  // Process each time row
  for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
    const row = jsonData[rowIndex];
    const timeSlot = row[timeColumn];
    
    if (!timeSlot || timeSlot.trim() === '') continue;
    
    // Process each day column
    Object.entries(dayColumns).forEach(([dayName, columnIndex]) => {
      if (columnIndex < row.length && row[columnIndex]) {
        const cellData = row[columnIndex].toString().trim();
        
        if (cellData && cellData !== '' && cellData !== '-') {
          // Parse cell data (format might be: "Subject Code - Teacher Name - Room")
          const routineSlot = parseCellData(cellData, {
            dayName,
            dayIndex: Object.keys(dayColumns).indexOf(dayName),
            timeSlot,
            year,
            semester,
            section: 'A' // Default to section A, can be modified
          });
          
          if (routineSlot) {
            routineSlots.push(routineSlot);
          }
        }
      }
    });
  }
  
  return routineSlots;
}

// Function to parse individual cell data
function parseCellData(cellData, context) {
  try {
    // Common patterns in routine cells:
    // "CT461 - Software Engineering - BS - CR101"
    // "CT462/Information Systems/NA/CR102"
    // "Database Systems (CT463) - SKG - Lab1"
    
    // Split by common delimiters
    let parts = cellData.split(/[-\/\|]/).map(part => part.trim());
    
    // If only one part, might be just subject name
    if (parts.length === 1) {
      return {
        subjectName: parts[0],
        subjectCode: extractSubjectCode(parts[0]),
        teacherShortName: null,
        roomNumber: null,
        ...context,
        sessionType: 'THEORY'
      };
    }
    
    // Try to identify components
    let subjectCode = null;
    let subjectName = null;
    let teacherShortName = null;
    let roomNumber = null;
    
    parts.forEach(part => {
      // Subject code pattern (e.g., CT461, ME101)
      if (/^[A-Z]{2}\d{3}$/.test(part)) {
        subjectCode = part;
      }
      // Room pattern (e.g., CR101, Lab1, Room-101)
      else if (/^(CR|Lab|Room)[-\s]?\d+$/i.test(part)) {
        roomNumber = part;
      }
      // Teacher short name pattern (2-3 uppercase letters)
      else if (/^[A-Z]{2,4}$/.test(part)) {
        teacherShortName = part;
      }
      // Remaining is likely subject name
      else if (!subjectName && part.length > 3) {
        subjectName = part;
      }
    });
    
    // Extract subject code from subject name if not found
    if (!subjectCode && subjectName) {
      subjectCode = extractSubjectCode(subjectName);
    }
    
    return {
      subjectCode: subjectCode || 'UNKNOWN',
      subjectName: subjectName || cellData,
      teacherShortName,
      roomNumber: roomNumber || 'TBD',
      ...context,
      sessionType: cellData.toLowerCase().includes('lab') ? 'LAB' : 'THEORY'
    };
    
  } catch (error) {
    console.error(`❌ Error parsing cell data "${cellData}":`, error.message);
    return null;
  }
}

// Function to extract subject code from text
function extractSubjectCode(text) {
  const match = text.match(/([A-Z]{2}\d{3})/);
  return match ? match[1] : null;
}

// Main import function
async function importFromExcel() {
  try {
    console.log('🚀 Starting Excel routine import...');
    
    // Step 1: Login
    await loginAsAdmin();
    
    // Step 2: Read Excel file
    const excelPath = path.join(__dirname, '../../BCT_ROUTINE_Updated.xlsx');
    const routineData = readExcelFile(excelPath);
    
    if (routineData.length === 0) {
      console.log('⚠️  No routine data found in Excel file');
      return;
    }
    
    // Step 3: Display sample data for verification
    console.log('\n📋 Sample routine data:');
    routineData.slice(0, 5).forEach((slot, index) => {
      console.log(`${index + 1}. ${slot.subjectName} (${slot.subjectCode}) - ${slot.teacherShortName} - ${slot.roomNumber}`);
    });
    
    console.log(`\n📊 Total slots to import: ${routineData.length}`);
    console.log('💡 To continue with import, you can modify this script to call the seeding functions from seed-routine.js');
    
    // Optional: Save parsed data to JSON for review
    const fs = require('fs');
    fs.writeFileSync('parsed-routine-data.json', JSON.stringify(routineData, null, 2));
    console.log('💾 Parsed data saved to parsed-routine-data.json for review');
    
  } catch (error) {
    console.error('❌ Import error:', error.message);
  }
}

// Export functions for use in other scripts
module.exports = {
  readExcelFile,
  parseSheetData,
  parseCellData,
  extractSubjectCode
};

// Run the script if called directly
if (require.main === module) {
  console.log('🚀 Excel import script starting...');
  importFromExcel();
}
