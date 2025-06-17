const mongoose = require('mongoose');
const Class = require("../Schema/classSchema.js");
const Program = require("../Schema/programSchema.js");
const Teacher = require("../Schema/teacherSchema.js");
const Subject = require("../Schema/subjectSchema.js");

const {dummyteacherID, dummySubjectID} = require("../defines/defines.js");

const Excel = require('exceljs');
const { subjects, courseCode } = require('../dbdata/subjects.js');

// Load environment variables
require('dotenv').config();

const dburl = process.env.MONGODB_URI || 'mongodb://localhost:27017/be-routine-management';

var teacherData = [
    {
        name: "Loknath Regmi",
        abv: "LNR",
    },
    {
        name: "Prof. Dr. Subarna Shakya",
        abv: "Prof. Dr. SS",
    },
    {
        name: "Bikal Adhikari",
        abv: "BA",
    },
    {
        name: "Dr. Nanda Bikram Adhikari",
        abv: "Dr. NBA",
    },
    {
        name: "Anand Kumar Sah",
        abv: "AKS",
    },
    {
        name: "Dr. Aman Shakya",
        abv: "Dr. AS",
    },
    {
        name: "Sajana Shakya",
        abv: "SS",
    },
    {
        name: "Kiran Bhattarai",
        abv: "KB",
    },
    {
        name: "Vijay Kumar Yadav",
        abv: "VKY",
    },
    {
        name: "Mahesh Bhatta",
        abv: "MB",
    },
    {
        name: "Santosh Jha",
        abv: "SJ",
    },
    {
        name: "Madhav Dahal",
        abv: "MD",
    }
];



var routineData = [
    // BCTY3S1AB,
];





const importDataFromExcel = async ()=>{
    
    const excel_file = new Excel.Workbook();
    await excel_file.xlsx.readFile('dbdata/routine_input.xlsx');
    
    let teachers = []
    
    for(let j = 0; j < excel_file.worksheets.length; j++){
        
        if(excel_file.worksheets[j].name.indexOf('Teachers')!=-1){
            let teachers_sheet = excel_file.worksheets[j];
            console.log('Now reading worksheet : ',teachers_sheet.name);

            teachers_sheet.eachRow(function(row, row_num){
                teachers.push({
                    name: row.getCell(2).value,
                    abv: row.getCell(1).value
                });
                //console.log(teachers[teachers.length-1]);
            });
        }
    }
    //console.log("Now the teachers array");
    //console.log(teachers);


    let routines_data = [];

    let curr_program = "";
    let curr_year = 0;
    let curr_part = "";
    let curr_section = "";
    let curr_classentries = [];
    let curr_day = "Sunday";
    let curr_classes= [];
    
    for(let j = 0; j < excel_file.worksheets.length; j++){
        
        if(excel_file.worksheets[j].name.indexOf('Classes')!=-1){
            
            let classes_sheet = excel_file.worksheets[j];
            console.log('Now reading worksheet : ',classes_sheet.name);
            for(let i = 1; i <= classes_sheet.rowCount; i++){

                let row = classes_sheet.getRow(i);
                //Case for new class section
                if(row.getCell(1).value != null){
                    if(curr_classes.length > 0){
                        curr_classentries.push(
                            {
                                day: curr_day,
                                classes: curr_classes
                            }
                        );
                    }
                    curr_day = row.getCell(2).value;
                    curr_classes = [];
                    //console.log(curr_classentries);

                    if(curr_classentries.length > 0){
                        routines_data.push(
                            {
                                program: curr_program,
                                year: curr_year,
                                part: curr_part,
                                section: curr_section,
                                classentries: curr_classentries
                            }
                        );
                    }
                    curr_program = row.getCell(1).value;
                    curr_year = parseInt( row.getCell(2).value);
                    curr_part = row.getCell(3).value;
                    curr_section = row.getCell(4).value;
                    curr_classentries = [];
                }
                else{

                    //Case for new day
                    if(row.getCell(2).value != null){
                        if(curr_classes.length > 0){
                            curr_classentries.push(
                                {
                                    day: curr_day,
                                    classes: curr_classes
                                }
                            );
                        }
                        curr_day = row.getCell(2).value;
                        curr_classes = [];
                        //console.log(curr_classentries);
                    }
                    let sub = row.getCell(3).value;
                    i++;
                    row = classes_sheet.getRow(i);
                    let lec_type = row.getCell(3).value;
                    i++;
                    row = classes_sheet.getRow(i);
                    let teachers_names = row.values.slice(3,row.cellCount+1);
                    i++;
                    row = classes_sheet.getRow(i);
                    let slt_no = parseInt( row.getCell(3).value);
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
                    //console.log(curr_classes[curr_classes.length-1])

                }

            }

            //For last case
            if(curr_classes.length > 0){
                curr_classentries.push(
                    {
                        day: curr_day,
                        classes: curr_classes
                    }
                );
            }
            if(curr_classentries.length > 0){
                routines_data.push(
                    {
                        program: curr_program,
                        year: curr_year,
                        part: curr_part,
                        section: curr_section,
                        classentries: curr_classentries
                    }
                );
                //console.log(curr_classentries);

            }
            curr_classes = [];
            curr_classentries = [];
        }
    }    
    //console.log("Now period data ")
    //console.log(routines_data)
    teacherData = teachers;
    routineData = routines_data;
}

const setData = async ()=>{

    await importDataFromExcel();

    console.log("Dropping existing database...");
    await mongoose.connection.dropDatabase();
    console.log("Database dropped successfully");
    
    // make teacher objects and add to db
    const teacherObjs = []
    try{
        console.log("Adding teachers...");
        for(const item of teacherData){
            const teach = new Teacher({
                teacherName: item.name,
                shortName: item.abv
            });
            teacherObjs.push(teach)
            await teach.save();
        }
    }
    catch(err){console.log("Error adding teachers:", err);}

    console.log("Added teachers successfully")

    const subjectObjs = []
    try{
        console.log("Adding subjects...");
        for (let i = 0; i<subjects.length; i++){
            const sub = new Subject({
                subjectName: subjects[i],
                subjectCode: courseCode[i]
            })
            subjectObjs.push(sub);
            await sub.save();
        }
    }
    catch(err){console.log("Error adding subjects:", err);}

    console.log("Added subjects successfully")


    // make routine 
    console.log("Adding programs and classes...");
    
    for(let routine of routineData){

        let programObj = new Program({
            programName: routine.program,
            year: routine.year,
            part: routine.part,
            section: routine.section,
        })

        await programObj.save();
        console.log(`Added program: ${routine.program} Year ${routine.year} Part ${routine.part} Section ${routine.section}`);

        for (let dayAndClass of routine.classentries){
            for(let singleClass of dayAndClass.classes){
                // Convert teacher abbreviations to teacher IDs
                for (let teacherNo in singleClass.teachers){
                    const teacherAbv = singleClass.teachers[teacherNo];
                    const foundTeacher = teacherObjs.find(t => (teacherAbv == t.shortName));
                    if(foundTeacher){
                        singleClass.teachers[teacherNo] = foundTeacher._id.toString();
                    } else {
                        console.log(`Teacher not found: ${teacherAbv}`);
                        singleClass.teachers[teacherNo] = dummyteacherID.toString();
                    }
                }
                
                // Find subject by name
                const subjectID = subjectObjs.find(s => s.subjectName == singleClass.subject);
                if (subjectID == undefined){
                    console.log("Subject not found:", singleClass.subject);
                }
                
                let classObj = new Class({
                    routineFor: programObj._id,
                    subject: subjectID ? subjectID._id : dummySubjectID,
                    teacherName: singleClass.teachers,
                    startingPeriod: singleClass.slotNo,
                    noOfPeriod: singleClass.nperiods,
                    weekDay: dayAndClass.day,
                    classType: singleClass.type
                })

                await classObj.save();
            }
        }
    }
    console.log("Added classes successfully")


    const dummyTeacher = new Teacher({
        _id: dummyteacherID,
        teacherName: "dummy",
        shortName: "dummy",
        designation: "dummy"
    });
    await dummyTeacher.save();
    console.log("Added dummy teacher")

    const dummySubject = new Subject({
        _id: dummySubjectID,
        subjectName: "dummy subject",
        subjectCode: "BRRRRRR"
    });
    await dummySubject.save();
    console.log("Added dummy subject")

    console.log("Data import completed successfully!");
    process.exit(0);
}

mongoose.connect(dburl)
.then(() => {
    console.log("Database connected successfully");
    setData();
})
.catch((err) => console.log("Database connection error:", err));