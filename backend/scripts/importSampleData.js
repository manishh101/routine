const mongoose = require('mongoose');
const Class = require("../Schema/classSchema.js");
const Program = require("../Schema/programSchema.js");
const Teacher = require("../Schema/teacherSchema.js");
const Subject = require("../Schema/subjectSchema.js");

const {dummyteacherID, dummySubjectID} = require("../defines/defines.js");
const { subjects, courseCode } = require('../dbdata/subjects.js');

// Load environment variables
require('dotenv').config();

const dburl = process.env.MONGODB_URI || 'mongodb://localhost:27017/be-routine-management';

// Hardcoded teacher data
var teacherData = [
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

// Sample routine data (BCTY3S1AB)
var routineData = [
    {
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
    }
];

const setData = async () => {
    console.log("Starting data import...");
    
    // Clear existing data
    console.log("Clearing existing data...");
    await mongoose.connection.dropDatabase();
    console.log("Database cleared successfully");
    
    // Add teachers
    const teacherObjs = [];
    try {
        console.log("Adding teachers...");
        for(const item of teacherData){
            const teach = new Teacher({
                teacherName: item.name,
                shortName: item.abv
            });
            teacherObjs.push(teach);
            await teach.save();
        }
        console.log(`Added ${teacherObjs.length} teachers successfully`);
    }
    catch(err) {
        console.log("Error adding teachers:", err);
    }

    // Add subjects
    const subjectObjs = [];
    try {
        console.log("Adding subjects...");
        for (let i = 0; i < subjects.length; i++){
            const sub = new Subject({
                subjectName: subjects[i],
                subjectCode: courseCode[i]
            });
            subjectObjs.push(sub);
            await sub.save();
        }
        console.log(`Added ${subjectObjs.length} subjects successfully`);
    }
    catch(err) {
        console.log("Error adding subjects:", err);
    }

    // Add programs and classes
    console.log("Adding programs and classes...");
    
    for(let routine of routineData){
        let programObj = new Program({
            programName: routine.program,
            year: routine.year,
            part: routine.part,
            section: routine.section,
        });

        await programObj.save();
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
                        teacherIds.push(dummyteacherID);
                    }
                }
                
                // Find subject by name
                const subjectObj = subjectObjs.find(s => s.subjectName === singleClass.subject);
                if (!subjectObj){
                    console.log("Subject not found:", singleClass.subject);
                }
                
                let classObj = new Class({
                    routineFor: programObj._id,
                    subject: subjectObj ? subjectObj._id : dummySubjectID,
                    teacherName: teacherIds,
                    startingPeriod: singleClass.slotNo,
                    noOfPeriod: singleClass.nperiods,
                    weekDay: dayAndClass.day,
                    classType: singleClass.type
                });

                await classObj.save();
            }
        }
    }
    console.log("Added classes successfully");

    // Add dummy entries
    const dummyTeacher = new Teacher({
        _id: dummyteacherID,
        teacherName: "TBA",
        shortName: "TBA",
        designation: "To Be Assigned"
    });
    await dummyTeacher.save();
    console.log("Added dummy teacher");

    const dummySubject = new Subject({
        _id: dummySubjectID,
        subjectName: "TBA Subject",
        subjectCode: "TBA"
    });
    await dummySubject.save();
    console.log("Added dummy subject");

    console.log("Data import completed successfully!");
    process.exit(0);
};

mongoose.connect(dburl)
.then(() => {
    console.log("Database connected successfully");
    setData();
})
.catch((err) => {
    console.log("Database connection error:", err);
    process.exit(1);
});
