const express = require('express');
const router = express.Router();

// Import schema models for the imported data
const ImportedClass = require('../Schema/classSchema.js');
const ImportedProgram = require('../Schema/programSchema.js');
const ImportedTeacher = require('../Schema/teacherSchema.js');
const ImportedSubject = require('../Schema/subjectSchema.js');
const { subjects, courseCode } = require('../dbdata/subjects.js');
const {dummyteacherID, dummySubjectID} = require("../defines/defines.js");

/**
 * @swagger
 * /api/data/import-excel:
 *   post:
 *     summary: Import data from Excel file
 *     tags: [Data Import]
 *     responses:
 *       200:
 *         description: Excel data imported successfully
 */
router.post('/import-excel', async (req, res) => {
  try {
    console.log("Starting Excel data import...");
    
    const Excel = require('exceljs');
    
    // Clear existing imported data
    await ImportedClass.deleteMany({});
    await ImportedProgram.deleteMany({});
    await ImportedTeacher.deleteMany({});
    await ImportedSubject.deleteMany({});

    let teacherData = [];
    let routineData = [];

    try {
      const excel_file = new Excel.Workbook();
      await excel_file.xlsx.readFile('dbdata/routine_input.xlsx');
      
      let teachers = [];
      
      // Read teachers from Excel
      for(let j = 0; j < excel_file.worksheets.length; j++){
        if(excel_file.worksheets[j].name.indexOf('Teachers') != -1){
          let teachers_sheet = excel_file.worksheets[j];
          console.log('Now reading worksheet:', teachers_sheet.name);

          teachers_sheet.eachRow(function(row, row_num){
            if(row.getCell(1).value && row.getCell(2).value) {
              teachers.push({
                name: row.getCell(2).value,
                abv: row.getCell(1).value
              });
            }
          });
        }
      }

      let routines_data = [];
      let curr_program = "";
      let curr_year = 0;
      let curr_part = "";
      let curr_section = "";
      let curr_classentries = [];
      let curr_day = "Sunday";
      let curr_classes = [];
      
      // Read classes from Excel
      for(let j = 0; j < excel_file.worksheets.length; j++){
        if(excel_file.worksheets[j].name.indexOf('Classes') != -1){
          let classes_sheet = excel_file.worksheets[j];
          console.log('Now reading worksheet:', classes_sheet.name);
          
          for(let i = 1; i <= classes_sheet.rowCount; i++){
            let row = classes_sheet.getRow(i);
            
            // Case for new class section
            if(row.getCell(1).value != null){
              if(curr_classes.length > 0){
                curr_classentries.push({
                  day: curr_day,
                  classes: curr_classes
                });
              }
              curr_day = row.getCell(2).value;
              curr_classes = [];

              if(curr_classentries.length > 0){
                routines_data.push({
                  program: curr_program,
                  year: curr_year,
                  part: curr_part,
                  section: curr_section,
                  classentries: curr_classentries
                });
              }
              curr_program = row.getCell(1).value;
              curr_year = parseInt(row.getCell(2).value);
              curr_part = row.getCell(3).value;
              curr_section = row.getCell(4).value;
              curr_classentries = [];
            }
            else {
              // Case for new day
              if(row.getCell(2).value != null){
                if(curr_classes.length > 0){
                  curr_classentries.push({
                    day: curr_day,
                    classes: curr_classes
                  });
                }
                curr_day = row.getCell(2).value;
                curr_classes = [];
              }
              
              let sub = row.getCell(3).value;
              if(sub) {
                i++;
                row = classes_sheet.getRow(i);
                let lec_type = row.getCell(3).value;
                i++;
                row = classes_sheet.getRow(i);
                let teachers_names = row.values.slice(3, row.cellCount + 1).filter(val => val != null);
                i++;
                row = classes_sheet.getRow(i);
                let slt_no = parseInt(row.getCell(3).value);
                i++;
                row = classes_sheet.getRow(i);
                let prd_count = parseInt(row.getCell(3).value);
                
                curr_classes.push({
                  teachers: teachers_names,
                  subject: sub,
                  slotNo: slt_no,
                  nperiods: prd_count,
                  type: lec_type
                });
              }
            }
          }

          // For last case
          if(curr_classes.length > 0){
            curr_classentries.push({
              day: curr_day,
              classes: curr_classes
            });
          }
          if(curr_classentries.length > 0){
            routines_data.push({
              program: curr_program,
              year: curr_year,
              part: curr_part,
              section: curr_section,
              classentries: curr_classentries
            });
          }
          curr_classes = [];
          curr_classentries = [];
        }
      }
      
      teacherData = teachers;
      routineData = routines_data;
      
      console.log(`Imported ${teachers.length} teachers and ${routines_data.length} routines from Excel`);
      
    } catch (excelError) {
      console.log("Excel file not found or error reading Excel:", excelError.message);
      return res.status(400).json({
        success: false,
        message: 'Excel file not found or error reading Excel file',
        error: excelError.message
      });
    }

    // Add teachers
    const teacherObjs = [];
    for(const item of teacherData){
      const teach = new ImportedTeacher({
        teacherName: item.name,
        shortName: item.abv
      });
      teacherObjs.push(teach);
      await teach.save();
    }
    console.log(`Added ${teacherObjs.length} teachers`);

    // Add subjects
    const subjectObjs = [];
    for (let i = 0; i < subjects.length; i++){
      const sub = new ImportedSubject({
        subjectName: subjects[i],
        subjectCode: courseCode[i]
      });
      subjectObjs.push(sub);
      await sub.save();
    }
    console.log(`Added ${subjectObjs.length} subjects`);

    // Add programs and classes
    let programCount = 0;
    let classCount = 0;
    
    for(let routine of routineData){
      let programObj = new ImportedProgram({
        programName: routine.program,
        year: routine.year,
        part: routine.part,
        section: routine.section,
      });
      await programObj.save();
      programCount++;
      console.log(`Added program: ${routine.program} Year ${routine.year} Part ${routine.part} Section ${routine.section}`);

      for (let dayAndClass of routine.classentries){
        for(let singleClass of dayAndClass.classes){
          // Convert teacher abbreviations to teacher IDs
          const teacherIds = [];
          for (let teacherAbv of singleClass.teachers){
            const foundTeacher = teacherObjs.find(t => t.shortName === teacherAbv);
            if(foundTeacher){
              teacherIds.push(foundTeacher._id);
            } else {
              console.log(`Teacher not found: ${teacherAbv}`);
            }
          }
          
          // Find subject by name
          const subjectObj = subjectObjs.find(s => s.subjectName === singleClass.subject);
          if (!subjectObj){
            console.log("Subject not found:", singleClass.subject);
          }
          
          let classObj = new ImportedClass({
            routineFor: programObj._id,
            subject: subjectObj ? subjectObj._id : null,
            teacherName: teacherIds,
            startingPeriod: singleClass.slotNo,
            noOfPeriod: singleClass.nperiods,
            weekDay: dayAndClass.day,
            classType: singleClass.type
          });

          await classObj.save();
          classCount++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Excel data imported successfully',
      data: {
        teachers: teacherObjs.length,
        subjects: subjectObjs.length,
        programs: programCount,
        classes: classCount
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error importing Excel data', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/data/import-sample:
 *   post:
 *     summary: Import sample routine data
 *     tags: [Data Import]
 *     responses:
 *       200:
 *         description: Sample data imported successfully
 */
router.post('/import-sample', async (req, res) => {
  try {
    console.log("Starting sample data import...");
    
    // Sample teacher data
    const teacherData = [
      { name: "Loknath Regmi", abv: "LNR" },
      { name: "Prof. Dr. Subarna Shakya", abv: "Prof. Dr. SS" },
      { name: "Bikal Adhikari", abv: "BA" },
      { name: "Dr. Nanda Bikram Adhikari", abv: "Dr. NBA" },
      { name: "Anand Kumar Sah", abv: "AKS" },
      { name: "Dr. Aman Shakya", abv: "Dr. AS" },
      { name: "Sajana Shakya", abv: "SS" },
      { name: "Kiran Bhattarai", abv: "KB" },
      { name: "Vijay Kumar Yadav", abv: "VKY" },
      { name: "Mahesh Bhatta", abv: "MB" },
      { name: "Santosh Jha", abv: "SJ" },
      { name: "Madhav Dahal", abv: "MD" }
    ];

    // Clear existing imported data
    await ImportedClass.deleteMany({});
    await ImportedProgram.deleteMany({});
    await ImportedTeacher.deleteMany({});
    await ImportedSubject.deleteMany({});

    // Add teachers
    const teacherObjs = [];
    for(const item of teacherData){
      const teach = new ImportedTeacher({
        teacherName: item.name,
        shortName: item.abv
      });
      teacherObjs.push(teach);
      await teach.save();
    }
    console.log(`Added ${teacherObjs.length} teachers`);

    // Add subjects
    const subjectObjs = [];
    for (let i = 0; i < subjects.length; i++){
      const sub = new ImportedSubject({
        subjectName: subjects[i],
        subjectCode: courseCode[i]
      });
      subjectObjs.push(sub);
      await sub.save();
    }
    console.log(`Added ${subjectObjs.length} subjects`);

    // Sample routine data
    const routineData = {
      program: "BCT",
      year: 3,
      part: "I",
      section: "AB",
      classentries: [
        {
          day: "Sunday",
          classes: [
            {
              teachers: ["LNR"],
              subject: "Computer Graphics",
              slotNo: 4,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["BA"],
              subject: "Computer Organization & Architecture",
              slotNo: 6,
              nperiods: 3,
              type: "P"
            }
          ]
        },
        {
          day: "Monday",
          classes: [
            {
              teachers: ["Prof. Dr. SS"],
              subject: "Computer Organization & Architecture",
              slotNo: 1,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["Dr. NBA"],
              subject: "Data Communication",
              slotNo: 3,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["LNR"],
              subject: "Computer Graphics",
              slotNo: 5,
              nperiods: 2,
              type: "L"
            }
          ]
        },
        {
          day: "Tuesday",
          classes: [
            {
              teachers: ["Dr. AS"],
              subject: "Software Engineering",
              slotNo: 1,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["KB"],
              subject: "Probability & Statistics",
              slotNo: 3,
              nperiods: 2,
              type: "L"
            }
          ]
        },
        {
          day: "Wednesday",
          classes: [
            {
              teachers: ["VKY"],
              subject: "Numerical Methods",
              slotNo: 1,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["Dr. AS"],
              subject: "Software Engineering",
              slotNo: 3,
              nperiods: 3,
              type: "P"
            }
          ]
        },
        {
          day: "Thursday",
          classes: [
            {
              teachers: ["KB"],
              subject: "Probability & Statistics",
              slotNo: 1,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["VKY"],
              subject: "Numerical Methods",
              slotNo: 3,
              nperiods: 3,
              type: "P"
            }
          ]
        },
        {
          day: "Friday",
          classes: [
            {
              teachers: ["Dr. AS"],
              subject: "Software Engineering",
              slotNo: 1,
              nperiods: 2,
              type: "L"
            },
            {
              teachers: ["VKY"],
              subject: "Numerical Methods",
              slotNo: 3,
              nperiods: 2,
              type: "L"
            }
          ]
        }
      ]
    };

    // Add program and classes
    let programObj = new ImportedProgram({
      programName: routineData.program,
      year: routineData.year,
      part: routineData.part,
      section: routineData.section,
    });
    await programObj.save();
    console.log(`Added program: ${routineData.program} Year ${routineData.year} Part ${routineData.part} Section ${routineData.section}`);

    let classCount = 0;
    for (let dayAndClass of routineData.classentries){
      for(let singleClass of dayAndClass.classes){
        // Convert teacher abbreviations to teacher IDs
        const teacherIds = [];
        for (let teacherAbv of singleClass.teachers){
          const foundTeacher = teacherObjs.find(t => t.shortName === teacherAbv);
          if(foundTeacher){
            teacherIds.push(foundTeacher._id);
          } else {
            console.log(`Teacher not found: ${teacherAbv}`);
          }
        }
        
        // Find subject by name
        const subjectObj = subjectObjs.find(s => s.subjectName === singleClass.subject);
        if (!subjectObj){
          console.log("Subject not found:", singleClass.subject);
        }
        
        let classObj = new ImportedClass({
          routineFor: programObj._id,
          subject: subjectObj ? subjectObj._id : null,
          teacherName: teacherIds,
          startingPeriod: singleClass.slotNo,
          noOfPeriod: singleClass.nperiods,
          weekDay: dayAndClass.day,
          classType: singleClass.type
        });

        await classObj.save();
        classCount++;
      }
    }

    res.json({
      success: true,
      message: 'Sample data imported successfully',
      data: {
        teachers: teacherObjs.length,
        subjects: subjectObjs.length,
        programs: 1,
        classes: classCount
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error importing sample data', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/data/clear:
 *   delete:
 *     summary: Clear all imported data
 *     tags: [Data Import]
 *     responses:
 *       200:
 *         description: Data cleared successfully
 */
router.delete('/clear', async (req, res) => {
  try {
    await ImportedClass.deleteMany({});
    await ImportedProgram.deleteMany({});
    await ImportedTeacher.deleteMany({});
    await ImportedSubject.deleteMany({});

    res.json({
      success: true,
      message: 'All imported data cleared successfully'
    });

  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing data', 
      error: error.message 
    });
  }
});

module.exports = router;
