import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Spin, Alert, Empty, Tag, Typography } from 'antd';

const { Text } = Typography;

// Days of the week definition
const daysOfWeek = [
  { index: 0, name: 'Sunday' }, 
  { index: 1, name: 'Monday' }, 
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' }, 
  { index: 4, name: 'Thursday' }, 
  { index: 5, name: 'Friday' },
];

// API functions (replace with actual implementation)
const fetchTimeSlotDefinitions = async () => {
  // This should return time slot definitions from your API
  // For now, returning sample data structure
  return { 
    data: [
      { _id: 0, label: "P1 10:15-11:05", startTime: "10:15", endTime: "11:05", isBreak: false, sortOrder: 0 },
      { _id: 1, label: "P2 11:05-11:55", startTime: "11:05", endTime: "11:55", isBreak: false, sortOrder: 1 },
      { _id: 2, label: "BREAK", startTime: "11:55", endTime: "12:45", isBreak: true, sortOrder: 2 },
      { _id: 3, label: "P3 12:45-13:35", startTime: "12:45", endTime: "13:35", isBreak: false, sortOrder: 3 },
      { _id: 4, label: "P4 13:35-14:25", startTime: "13:35", endTime: "14:25", isBreak: false, sortOrder: 4 },
      { _id: 5, label: "P5 14:25-15:15", startTime: "14:25", endTime: "15:15", isBreak: false, sortOrder: 5 },
    ]
  };
};

const fetchRoutine = async (programCode, semester, section) => {
  // This should call your actual routine API
  // For demonstration, returning complete weekly sample data structure
  return { 
    data: [
      // Sunday
      {
        _id: "sun_slot0",
        programCode,
        semester,
        section,
        dayIndex: 0,
        slotIndex: 0,
        subjectName_display: "Engineering Mathematics I",
        teacherShortNames_display: ["Dr. SK"],
        roomName_display: "Room A-101",
        classType: "L",
        notes: "",
        timeSlot_display: "10:15 - 11:05"
      },
      {
        _id: "sun_slot1",
        programCode,
        semester,
        section,
        dayIndex: 0,
        slotIndex: 1,
        subjectName_display: "Engineering Physics",
        teacherShortNames_display: ["Prof. NP"],
        roomName_display: "Room A-102",
        classType: "L",
        notes: "",
        timeSlot_display: "11:05 - 11:55"
      },
      {
        _id: "sun_slot3",
        programCode,
        semester,
        section,
        dayIndex: 0,
        slotIndex: 3,
        subjectName_display: "Engineering Chemistry",
        teacherShortNames_display: ["Dr. RK"],
        roomName_display: "Chemistry Lab",
        classType: "P",
        notes: "Lab session",
        timeSlot_display: "12:45 - 13:35"
      },
      {
        _id: "sun_slot4",
        programCode,
        semester,
        section,
        dayIndex: 0,
        slotIndex: 4,
        subjectName_display: "Programming in C",
        teacherShortNames_display: ["Asst. MP"],
        roomName_display: "Computer Lab 1",
        classType: "L",
        notes: "",
        timeSlot_display: "13:35 - 14:25"
      },
      {
        _id: "sun_slot5",
        programCode,
        semester,
        section,
        dayIndex: 0,
        slotIndex: 5,
        subjectName_display: "Engineering Drawing",
        teacherShortNames_display: ["Prof. JS"],
        roomName_display: "Drawing Hall",
        classType: "P",
        notes: "Practical session",
        timeSlot_display: "14:25 - 15:15"
      },

      // Monday
      {
        _id: "mon_slot0",
        programCode,
        semester,
        section,
        dayIndex: 1,
        slotIndex: 0,
        subjectName_display: "English",
        teacherShortNames_display: ["Dr. PS"],
        roomName_display: "Room A-201",
        classType: "L",
        notes: "",
        timeSlot_display: "10:15 - 11:05"
      },
      {
        _id: "mon_slot1",
        programCode,
        semester,
        section,
        dayIndex: 1,
        slotIndex: 1,
        subjectName_display: "Engineering Mathematics I",
        teacherShortNames_display: ["Dr. SK"],
        roomName_display: "Room A-101",
        classType: "T",
        notes: "Tutorial",
        timeSlot_display: "11:05 - 11:55"
      },
      {
        _id: "mon_slot3",
        programCode,
        semester,
        section,
        dayIndex: 1,
        slotIndex: 3,
        subjectName_display: "Programming in C",
        teacherShortNames_display: ["Asst. MP"],
        roomName_display: "Computer Lab 1",
        classType: "P",
        notes: "Lab work",
        timeSlot_display: "12:45 - 13:35"
      },
      {
        _id: "mon_slot4",
        programCode,
        semester,
        section,
        dayIndex: 1,
        slotIndex: 4,
        subjectName_display: "Engineering Chemistry",
        teacherShortNames_display: ["Dr. RK"],
        roomName_display: "Room A-102",
        classType: "L",
        notes: "",
        timeSlot_display: "13:35 - 14:25"
      },

      // Tuesday
      {
        _id: "tue_slot0",
        programCode,
        semester,
        section,
        dayIndex: 2,
        slotIndex: 0,
        subjectName_display: "Engineering Mathematics I",
        teacherShortNames_display: ["Dr. SK"],
        roomName_display: "Room A-101",
        classType: "L",
        notes: "",
        timeSlot_display: "10:15 - 11:05"
      },
      {
        _id: "tue_slot1",
        programCode,
        semester,
        section,
        dayIndex: 2,
        slotIndex: 1,
        subjectName_display: "Engineering Physics",
        teacherShortNames_display: ["Prof. NP"],
        roomName_display: "Physics Lab",
        classType: "P",
        notes: "Lab experiment",
        timeSlot_display: "11:05 - 11:55"
      },
      {
        _id: "tue_slot3",
        programCode,
        semester,
        section,
        dayIndex: 2,
        slotIndex: 3,
        subjectName_display: "Engineering Chemistry",
        teacherShortNames_display: ["Dr. RK"],
        roomName_display: "Room A-102",
        classType: "L",
        notes: "",
        timeSlot_display: "12:45 - 13:35"
      },
      {
        _id: "tue_slot4",
        programCode,
        semester,
        section,
        dayIndex: 2,
        slotIndex: 4,
        subjectName_display: "English",
        teacherShortNames_display: ["Dr. PS"],
        roomName_display: "Room A-201",
        classType: "T",
        notes: "Writing practice",
        timeSlot_display: "13:35 - 14:25"
      },
      {
        _id: "tue_slot5",
        programCode,
        semester,
        section,
        dayIndex: 2,
        slotIndex: 5,
        subjectName_display: "Programming in C",
        teacherShortNames_display: ["Asst. MP"],
        roomName_display: "Room A-101",
        classType: "L",
        notes: "",
        timeSlot_display: "14:25 - 15:15"
      },

      // Wednesday
      {
        _id: "wed_slot0",
        programCode,
        semester,
        section,
        dayIndex: 3,
        slotIndex: 0,
        subjectName_display: "Engineering Physics",
        teacherShortNames_display: ["Prof. NP"],
        roomName_display: "Room A-102",
        classType: "L",
        notes: "",
        timeSlot_display: "10:15 - 11:05"
      },
      {
        _id: "wed_slot1",
        programCode,
        semester,
        section,
        dayIndex: 3,
        slotIndex: 1,
        subjectName_display: "Engineering Drawing",
        teacherShortNames_display: ["Prof. JS"],
        roomName_display: "Drawing Hall",
        classType: "L",
        notes: "",
        timeSlot_display: "11:05 - 11:55"
      },
      {
        _id: "wed_slot3",
        programCode,
        semester,
        section,
        dayIndex: 3,
        slotIndex: 3,
        subjectName_display: "Engineering Mathematics I",
        teacherShortNames_display: ["Dr. SK"],
        roomName_display: "Room A-102",
        classType: "T",
        notes: "Problem solving",
        timeSlot_display: "12:45 - 13:35"
      },
      {
        _id: "wed_slot4",
        programCode,
        semester,
        section,
        dayIndex: 3,
        slotIndex: 4,
        subjectName_display: "Programming in C",
        teacherShortNames_display: ["Asst. MP"],
        roomName_display: "Computer Lab 2",
        classType: "P",
        notes: "Assignment work",
        timeSlot_display: "13:35 - 14:25"
      },
      {
        _id: "wed_slot5",
        programCode,
        semester,
        section,
        dayIndex: 3,
        slotIndex: 5,
        subjectName_display: "Engineering Drawing",
        teacherShortNames_display: ["Prof. JS"],
        roomName_display: "Drawing Hall",
        classType: "P",
        notes: "Drawing practice",
        timeSlot_display: "14:25 - 15:15"
      },

      // Thursday
      {
        _id: "thu_slot0",
        programCode,
        semester,
        section,
        dayIndex: 4,
        slotIndex: 0,
        subjectName_display: "English",
        teacherShortNames_display: ["Dr. PS"],
        roomName_display: "Room A-101",
        classType: "L",
        notes: "",
        timeSlot_display: "10:15 - 11:05"
      },
      {
        _id: "thu_slot1",
        programCode,
        semester,
        section,
        dayIndex: 4,
        slotIndex: 1,
        subjectName_display: "Engineering Physics",
        teacherShortNames_display: ["Prof. NP"],
        roomName_display: "Physics Lab",
        classType: "P",
        notes: "Lab report",
        timeSlot_display: "11:05 - 11:55"
      },
      {
        _id: "thu_slot3",
        programCode,
        semester,
        section,
        dayIndex: 4,
        slotIndex: 3,
        subjectName_display: "Engineering Chemistry",
        teacherShortNames_display: ["Dr. RK"],
        roomName_display: "Chemistry Lab",
        classType: "P",
        notes: "Experiment",
        timeSlot_display: "12:45 - 13:35"
      },
      {
        _id: "thu_slot4",
        programCode,
        semester,
        section,
        dayIndex: 4,
        slotIndex: 4,
        subjectName_display: "Engineering Mathematics I",
        teacherShortNames_display: ["Dr. SK"],
        roomName_display: "Room A-101",
        classType: "L",
        notes: "",
        timeSlot_display: "13:35 - 14:25"
      },
      {
        _id: "thu_slot5",
        programCode,
        semester,
        section,
        dayIndex: 4,
        slotIndex: 5,
        subjectName_display: "Programming in C",
        teacherShortNames_display: ["Asst. MP"],
        roomName_display: "Computer Lab 2",
        classType: "P",
        notes: "Project work",
        timeSlot_display: "14:25 - 15:15"
      },

      // Friday
      {
        _id: "fri_slot0",
        programCode,
        semester,
        section,
        dayIndex: 5,
        slotIndex: 0,
        subjectName_display: "Engineering Drawing",
        teacherShortNames_display: ["Prof. JS"],
        roomName_display: "Drawing Hall",
        classType: "L",
        notes: "",
        timeSlot_display: "10:15 - 11:05"
      },
      {
        _id: "fri_slot1",
        programCode,
        semester,
        section,
        dayIndex: 5,
        slotIndex: 1,
        subjectName_display: "English",
        teacherShortNames_display: ["Dr. PS"],
        roomName_display: "Room A-201",
        classType: "T",
        notes: "Presentation",
        timeSlot_display: "11:05 - 11:55"
      },
      {
        _id: "fri_slot3",
        programCode,
        semester,
        section,
        dayIndex: 5,
        slotIndex: 3,
        subjectName_display: "Engineering Physics",
        teacherShortNames_display: ["Prof. NP"],
        roomName_display: "Room A-102",
        classType: "L",
        notes: "",
        timeSlot_display: "12:45 - 13:35"
      },
      {
        _id: "fri_slot4",
        programCode,
        semester,
        section,
        dayIndex: 5,
        slotIndex: 4,
        subjectName_display: "Programming in C",
        teacherShortNames_display: ["Asst. MP"],
        roomName_display: "Room A-101",
        classType: "L",
        notes: "",
        timeSlot_display: "13:35 - 14:25"
      },
      {
        _id: "fri_slot5",
        programCode,
        semester,
        section,
        dayIndex: 5,
        slotIndex: 5,
        subjectName_display: "Engineering Chemistry",
        teacherShortNames_display: ["Dr. RK"],
        roomName_display: "Room A-102",
        classType: "T",
        notes: "Review session",
        timeSlot_display: "14:25 - 15:15"
      }
    ]
  };
};

const RoutineGridComponent = ({ programCode, semester, section }) => {
  // Fetch time slot definitions
  const { 
    data: timeSlotData, 
    isLoading: timeSlotsLoading,
    error: timeSlotsError 
  } = useQuery({
    queryKey: ['timeSlotDefinitions'],
    queryFn: fetchTimeSlotDefinitions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sort time slots by sortOrder
  const timeSlotDefinitions = useMemo(() => {
    if (!timeSlotData?.data) return [];
    return [...timeSlotData.data].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [timeSlotData]);

  // Fetch routine data
  const { 
    data: routineData, 
    isLoading: routineLoading,
    error: routineError 
  } = useQuery({
    queryKey: ['routine', programCode, semester, section],
    queryFn: () => fetchRoutine(programCode, semester, section),
    enabled: !!(programCode && semester && section && timeSlotDefinitions.length > 0),
    retry: 1
  });

  // Transform routine data into 2D grid structure
  const routineGridData = useMemo(() => {
    if (!routineData?.data || !timeSlotDefinitions.length) return {};

    // Initialize grid with null values
    const grid = {};
    daysOfWeek.forEach(day => {
      grid[day.index] = {};
      timeSlotDefinitions.forEach(slot => {
        grid[day.index][slot._id] = null;
      });
    });

    // Populate grid with scheduled classes
    const scheduledClasses = routineData.data;
    scheduledClasses.forEach(classSlot => {
      if (grid[classSlot.dayIndex] && grid[classSlot.dayIndex].hasOwnProperty(classSlot.slotIndex)) {
        grid[classSlot.dayIndex][classSlot.slotIndex] = classSlot;
      }
    });

    return grid;
  }, [routineData, timeSlotDefinitions]);

  // Helper function to get class type color
  const getClassTypeColor = (classType) => {
    switch (classType) {
      case 'L': return 'blue';   // Lecture
      case 'P': return 'green';  // Practical
      case 'T': return 'orange'; // Tutorial
      default: return 'default';
    }
  };

  // Helper function to get cell background color based on class type
  const getCellBackgroundColor = (classType) => {
    switch (classType) {
      case 'L': return '#e6f7ff'; // Light blue for Lecture
      case 'P': return '#f6ffed'; // Light green for Practical
      case 'T': return '#fff7e6'; // Light orange for Tutorial
      default: return '#ffffff';
    }
  };

  // Styling objects
  const tableHeaderStyle = {
    padding: '12px 8px',
    border: '1px solid #d9d9d9',
    backgroundColor: '#fafafa',
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: '120px'
  };

  const dayCellStyle = {
    padding: '12px 8px',
    border: '1px solid #d9d9d9',
    backgroundColor: '#fafafa',
    fontWeight: 'bold',
    textAlign: 'center',
    verticalAlign: 'middle',
    minWidth: '100px'
  };

  const tableCellStyle = {
    padding: '8px',
    border: '1px solid #d9d9d9',
    verticalAlign: 'top',
    height: '80px',
    minWidth: '120px'
  };

  const breakCellStyle = {
    ...tableCellStyle,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666'
  };

  const classCellContentStyle = {
    fontSize: '12px',
    lineHeight: '1.3'
  };

  // Render class cell content
  const renderClassContent = (classData) => {
    if (!classData) {
      return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
    }

    return (
      <div style={classCellContentStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1677ff' }}>
          {classData.subjectName_display}
        </div>
        <div style={{ marginBottom: '2px' }}>
          <Tag color={getClassTypeColor(classData.classType)} size="small">
            {classData.classType === 'L' ? 'Lecture' : 
             classData.classType === 'P' ? 'Practical' : 
             classData.classType === 'T' ? 'Tutorial' : classData.classType}
          </Tag>
        </div>
        <div style={{ marginBottom: '2px', fontSize: '11px' }}>
          👨‍🏫 {Array.isArray(classData.teacherShortNames_display) 
            ? classData.teacherShortNames_display.join(', ')
            : classData.teacherShortNames_display || 'No Teacher'}
        </div>
        <div style={{ fontSize: '11px' }}>
          🏫 {classData.roomName_display || 'No Room'}
        </div>
        {classData.notes && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
            📝 {classData.notes}
          </div>
        )}
      </div>
    );
  };

  // Handle loading states
  if (!programCode || !semester || !section) {
    return (
      <Card>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Please select program, semester, and section to view routine"
        />
      </Card>
    );
  }

  if (timeSlotsLoading || routineLoading) {
    return (
      <Card>
        <Spin tip="Loading routine..." style={{ width: '100%', textAlign: 'center', padding: '40px' }} />
      </Card>
    );
  }

  if (timeSlotsError || routineError) {
    return (
      <Card>
        <Alert
          message="Error Loading Routine"
          description={
            timeSlotsError?.message || routineError?.message || 'Failed to load routine data'
          }
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title={`Routine Grid: ${programCode} - Semester ${semester} - Section ${section}`}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>
                Day / Time
              </th>
              {timeSlotDefinitions.map((timeSlot) => (
                <th 
                  key={timeSlot._id} 
                  style={{
                    ...tableHeaderStyle,
                    backgroundColor: timeSlot.isBreak ? '#f0f0f0' : '#fafafa'
                  }}
                >
                  <div>{timeSlot.label}</div>
                  {!timeSlot.isBreak && (
                    <div style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day) => (
              <tr key={day.index}>
                <td style={dayCellStyle}>
                  {day.name}
                </td>
                {timeSlotDefinitions.map((slot) => {
                  const classData = routineGridData[day.index]?.[slot._id];
                  
                  if (slot.isBreak) {
                    return (
                      <td key={`${day.index}-${slot._id}`} style={breakCellStyle}>
                        BREAK
                      </td>
                    );
                  }

                  return (
                    <td 
                      key={`${day.index}-${slot._id}`} 
                      style={{
                        ...tableCellStyle,
                        backgroundColor: classData ? getCellBackgroundColor(classData.classType) : '#ffffff'
                      }}
                    >
                      {renderClassContent(classData)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RoutineGridComponent;
