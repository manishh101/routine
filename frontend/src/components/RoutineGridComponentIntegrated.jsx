import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Spin, Alert, Empty, Tag, Typography } from 'antd';
import { routinesAPI, timeslotsAPI } from '../services/api';

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

// API function adapters to match the expected format
const fetchTimeSlotDefinitions = async () => {
  const response = await timeslotsAPI.getTimeSlots();
  // Transform to match expected format
  const timeSlots = response.data?.data || [];
  return {
    data: timeSlots.map(slot => ({
      _id: slot._id,
      label: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBreak: slot.isBreak || false,
      sortOrder: slot.sortOrder || 0
    }))
  };
};

const fetchRoutine = async (programCode, semester, section) => {
  const response = await routinesAPI.getRoutine(programCode, semester, section);
  const routineData = response.data?.data?.routine || {};
  
  // Transform from 2D object to flat array format
  const scheduledClasses = [];
  Object.keys(routineData).forEach(dayIndex => {
    Object.keys(routineData[dayIndex]).forEach(slotIndex => {
      const classData = routineData[dayIndex][slotIndex];
      if (classData) {
        scheduledClasses.push({
          _id: classData._id,
          programCode,
          semester: parseInt(semester),
          section,
          dayIndex: parseInt(dayIndex),
          slotIndex: slotIndex,
          subjectName_display: classData.subjectName || classData.subjectCode,
          teacherShortNames_display: classData.teacherShortNames || classData.teacherNames || [],
          roomName_display: classData.roomName,
          classType: classData.classType,
          notes: classData.notes || "",
          timeSlot_display: `${classData.startTime || ''} - ${classData.endTime || ''}`
        });
      }
    });
  });
  
  return { data: scheduledClasses };
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
