const express = require('express');
const router = express.Router();

// Import schema models for the imported data
const ImportedClass = require('../Schema/classSchema.js');
const ImportedProgram = require('../Schema/programSchema.js');
const ImportedTeacher = require('../Schema/teacherSchema.js');
const ImportedSubject = require('../Schema/subjectSchema.js');
const { subjects, courseCode } = require('../dbdata/subjects.js');

/**
 * @swagger
 * /api/sample/import-bcty3s1ab:
 *   post:
 *     summary: Import BCTY3S1AB sample data
 *     tags: [Sample Data]
 *     responses:
 *       200:
 *         description: BCTY3S1AB data imported successfully
 */
router.post('/import-bcty3s1ab', async (req, res) => {
  try {
    console.log("Starting BCTY3S1AB data import...");
    
    // Complete BCTY3S1AB data from the original file
    const BCTY3S1AB = {
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
            },
            {
              teachers: ["AKS"],
              subject: "Instrumentation II",
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
            },
            {
              teachers: ["AKS"],
              subject: "Instrumentation II",
              slotNo: 7,
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
            },
            {
              teachers: ["Dr. NBA"],
              subject: "Data Communication",
              slotNo: 5,
              nperiods: 3,
              type: "P"
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
            },
            {
              teachers: ["LNR"],
              subject: "Computer Graphics",
              slotNo: 6,
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
            },
            {
              teachers: ["Prof. Dr. SS"],
              subject: "Computer Organization & Architecture",
              slotNo: 6,
              nperiods: 2,
              type: "L"
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
            },
            {
              teachers: ["AKS"],
              subject: "Instrumentation II",
              slotNo: 5,
              nperiods: 2,
              type: "L"
            }
          ]
        }
      ]
    };

    // Teacher data from the original file
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

    // Add program and classes
    let programObj = new ImportedProgram({
      programName: BCTY3S1AB.program,
      year: BCTY3S1AB.year,
      part: BCTY3S1AB.part,
      section: BCTY3S1AB.section,
    });
    await programObj.save();
    console.log(`Added program: ${BCTY3S1AB.program} Year ${BCTY3S1AB.year} Part ${BCTY3S1AB.part} Section ${BCTY3S1AB.section}`);

    let classCount = 0;
    for (let dayAndClass of BCTY3S1AB.classentries){
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
      message: 'BCTY3S1AB data imported successfully',
      data: {
        teachers: teacherObjs.length,
        subjects: subjectObjs.length,
        programs: 1,
        classes: classCount,
        program: `${BCTY3S1AB.program} Year ${BCTY3S1AB.year} Part ${BCTY3S1AB.part} Section ${BCTY3S1AB.section}`
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error importing BCTY3S1AB data', 
      error: error.message 
    });
  }
});

module.exports = router;
