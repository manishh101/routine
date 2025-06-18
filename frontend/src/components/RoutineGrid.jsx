import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Tooltip,
  message,
  Popconfirm,
  Empty,
  Spin,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AssignClassModal from './AssignClassModal';
import { routinesAPI, timeslotsAPI } from '../services/api';

const { Title, Text } = Typography;

// Demo data functions for comprehensive routine demonstration
const getDemoTimeSlots = () => {
  return {
    data: {
      data: [
        { _id: '0', label: "P1 10:15-11:05", startTime: "10:15", endTime: "11:05", isBreak: false, sortOrder: 0 },
        { _id: '1', label: "P2 11:05-11:55", startTime: "11:05", endTime: "11:55", isBreak: false, sortOrder: 1 },
        { _id: '2', label: "BREAK", startTime: "11:55", endTime: "12:45", isBreak: true, sortOrder: 2 },
        { _id: '3', label: "P3 12:45-13:35", startTime: "12:45", endTime: "13:35", isBreak: false, sortOrder: 3 },
        { _id: '4', label: "P4 13:35-14:25", startTime: "13:35", endTime: "14:25", isBreak: false, sortOrder: 4 },
        { _id: '5', label: "P5 14:25-15:15", startTime: "14:25", endTime: "15:15", isBreak: false, sortOrder: 5 },
      ]
    }
  };
};

const getDemoRoutineData = (programCode, semester, section) => {
  return {
    data: {
      routine: {
        // Sunday
        '0': {
          '0': {
            _id: "demo_sun_0",
            subjectName: "Engineering Mathematics I",
            subjectCode: "MATH101",
            teacherNames: ["Dr. Shyam Kumar Shrestha"],
            teacherShortNames: ["Dr. SK"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '1': {
            _id: "demo_sun_1",
            subjectName: "Engineering Physics",
            subjectCode: "PHYS101",
            teacherNames: ["Prof. Dr. Narayan Prasad Adhikari"],
            teacherShortNames: ["Prof. NP"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '3': {
            _id: "demo_sun_3",
            subjectName: "Engineering Chemistry",
            subjectCode: "CHEM101",
            teacherNames: ["Dr. Ravi Kant Joshi"],
            teacherShortNames: ["Dr. RK"],
            roomName: "Chemistry Lab",
            classType: "P",
            notes: "Lab session"
          },
          '4': {
            _id: "demo_sun_4",
            subjectName: "Programming in C",
            subjectCode: "COMP101",
            teacherNames: ["Asst. Prof. Manish Pokhrel"],
            teacherShortNames: ["Asst. MP"],
            roomName: "Computer Lab 1",
            classType: "L",
            notes: ""
          },
          '5': {
            _id: "demo_sun_5",
            subjectName: "Engineering Drawing",
            subjectCode: "DRAW101",
            teacherNames: ["Prof. Jivan Shrestha"],
            teacherShortNames: ["Prof. JS"],
            roomName: "Drawing Hall",
            classType: "P",
            notes: "Practical session"
          }
        },
        // Monday
        '1': {
          '0': {
            _id: "demo_mon_0",
            subjectName: "English",
            subjectCode: "ENG101",
            teacherNames: ["Dr. Prakash Sayami"],
            teacherShortNames: ["Dr. PS"],
            roomName: "Room A-201 (Tutorial Room)",
            classType: "L",
            notes: ""
          },
          '1': {
            _id: "demo_mon_1",
            subjectName: "Engineering Mathematics I",
            subjectCode: "MATH101",
            teacherNames: ["Dr. Shyam Kumar Shrestha"],
            teacherShortNames: ["Dr. SK"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "T",
            notes: "Tutorial"
          },
          '3': {
            _id: "demo_mon_3",
            subjectName: "Programming in C",
            subjectCode: "COMP101",
            teacherNames: ["Asst. Prof. Manish Pokhrel"],
            teacherShortNames: ["Asst. MP"],
            roomName: "Computer Lab 1",
            classType: "P",
            notes: "Lab work"
          },
          '4': {
            _id: "demo_mon_4",
            subjectName: "Engineering Chemistry",
            subjectCode: "CHEM101",
            teacherNames: ["Dr. Ravi Kant Joshi"],
            teacherShortNames: ["Dr. RK"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "L",
            notes: ""
          }
        },
        // Tuesday
        '2': {
          '0': {
            _id: "demo_tue_0",
            subjectName: "Engineering Mathematics I",
            subjectCode: "MATH101",
            teacherNames: ["Dr. Shyam Kumar Shrestha"],
            teacherShortNames: ["Dr. SK"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '1': {
            _id: "demo_tue_1",
            subjectName: "Engineering Physics",
            subjectCode: "PHYS101",
            teacherNames: ["Prof. Dr. Narayan Prasad Adhikari"],
            teacherShortNames: ["Prof. NP"],
            roomName: "Physics Lab",
            classType: "P",
            notes: "Lab experiment"
          },
          '3': {
            _id: "demo_tue_3",
            subjectName: "Engineering Chemistry",
            subjectCode: "CHEM101",
            teacherNames: ["Dr. Ravi Kant Joshi"],
            teacherShortNames: ["Dr. RK"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '4': {
            _id: "demo_tue_4",
            subjectName: "English",
            subjectCode: "ENG101",
            teacherNames: ["Dr. Prakash Sayami"],
            teacherShortNames: ["Dr. PS"],
            roomName: "Room A-201 (Tutorial Room)",
            classType: "T",
            notes: "Writing practice"
          },
          '5': {
            _id: "demo_tue_5",
            subjectName: "Programming in C",
            subjectCode: "COMP101",
            teacherNames: ["Asst. Prof. Manish Pokhrel"],
            teacherShortNames: ["Asst. MP"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "L",
            notes: ""
          }
        },
        // Wednesday
        '3': {
          '0': {
            _id: "demo_wed_0",
            subjectName: "Engineering Physics",
            subjectCode: "PHYS101",
            teacherNames: ["Prof. Dr. Narayan Prasad Adhikari"],
            teacherShortNames: ["Prof. NP"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '1': {
            _id: "demo_wed_1",
            subjectName: "Engineering Drawing",
            subjectCode: "DRAW101",
            teacherNames: ["Prof. Jivan Shrestha"],
            teacherShortNames: ["Prof. JS"],
            roomName: "Drawing Hall",
            classType: "L",
            notes: ""
          },
          '3': {
            _id: "demo_wed_3",
            subjectName: "Engineering Mathematics I",
            subjectCode: "MATH101",
            teacherNames: ["Dr. Shyam Kumar Shrestha"],
            teacherShortNames: ["Dr. SK"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "T",
            notes: "Problem solving"
          },
          '4': {
            _id: "demo_wed_4",
            subjectName: "Programming in C",
            subjectCode: "COMP101",
            teacherNames: ["Asst. Prof. Manish Pokhrel"],
            teacherShortNames: ["Asst. MP"],
            roomName: "Computer Lab 2",
            classType: "P",
            notes: "Assignment work"
          },
          '5': {
            _id: "demo_wed_5",
            subjectName: "Engineering Drawing",
            subjectCode: "DRAW101",
            teacherNames: ["Prof. Jivan Shrestha"],
            teacherShortNames: ["Prof. JS"],
            roomName: "Drawing Hall",
            classType: "P",
            notes: "Drawing practice"
          }
        },
        // Thursday
        '4': {
          '0': {
            _id: "demo_thu_0",
            subjectName: "English",
            subjectCode: "ENG101",
            teacherNames: ["Dr. Prakash Sayami"],
            teacherShortNames: ["Dr. PS"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '1': {
            _id: "demo_thu_1",
            subjectName: "Engineering Physics",
            subjectCode: "PHYS101",
            teacherNames: ["Prof. Dr. Narayan Prasad Adhikari"],
            teacherShortNames: ["Prof. NP"],
            roomName: "Physics Lab",
            classType: "P",
            notes: "Lab report"
          },
          '3': {
            _id: "demo_thu_3",
            subjectName: "Engineering Chemistry",
            subjectCode: "CHEM101",
            teacherNames: ["Dr. Ravi Kant Joshi"],
            teacherShortNames: ["Dr. RK"],
            roomName: "Chemistry Lab",
            classType: "P",
            notes: "Experiment"
          },
          '4': {
            _id: "demo_thu_4",
            subjectName: "Engineering Mathematics I",
            subjectCode: "MATH101",
            teacherNames: ["Dr. Shyam Kumar Shrestha"],
            teacherShortNames: ["Dr. SK"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '5': {
            _id: "demo_thu_5",
            subjectName: "Programming in C",
            subjectCode: "COMP101",
            teacherNames: ["Asst. Prof. Manish Pokhrel"],
            teacherShortNames: ["Asst. MP"],
            roomName: "Computer Lab 2",
            classType: "P",
            notes: "Project work"
          }
        },
        // Friday
        '5': {
          '0': {
            _id: "demo_fri_0",
            subjectName: "Engineering Drawing",
            subjectCode: "DRAW101",
            teacherNames: ["Prof. Jivan Shrestha"],
            teacherShortNames: ["Prof. JS"],
            roomName: "Drawing Hall",
            classType: "L",
            notes: ""
          },
          '1': {
            _id: "demo_fri_1",
            subjectName: "English",
            subjectCode: "ENG101",
            teacherNames: ["Dr. Prakash Sayami"],
            teacherShortNames: ["Dr. PS"],
            roomName: "Room A-201 (Tutorial Room)",
            classType: "T",
            notes: "Presentation"
          },
          '3': {
            _id: "demo_fri_3",
            subjectName: "Engineering Physics",
            subjectCode: "PHYS101",
            teacherNames: ["Prof. Dr. Narayan Prasad Adhikari"],
            teacherShortNames: ["Prof. NP"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '4': {
            _id: "demo_fri_4",
            subjectName: "Programming in C",
            subjectCode: "COMP101",
            teacherNames: ["Asst. Prof. Manish Pokhrel"],
            teacherShortNames: ["Asst. MP"],
            roomName: "Room A-101 (Lecture Hall)",
            classType: "L",
            notes: ""
          },
          '5': {
            _id: "demo_fri_5",
            subjectName: "Engineering Chemistry",
            subjectCode: "CHEM101",
            teacherNames: ["Dr. Ravi Kant Joshi"],
            teacherShortNames: ["Dr. RK"],
            roomName: "Room A-102 (Lecture Hall)",
            classType: "T",
            notes: "Review session"
          }
        }
      }
    }
  };
};

const RoutineGrid = ({ 
  programCode, 
  semester, 
  section, 
  isEditable = false,
  demoMode = false  // New prop for demo mode
}) => {
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ dayIndex: null, slotIndex: null });
  const [existingClass, setExistingClass] = useState(null);
  
  const queryClient = useQueryClient();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Fetch routine data (use demo data if in demo mode)
  const { 
    data: routineData, 
    isLoading: routineLoading,
    error: routineError 
  } = useQuery({
    queryKey: ['routine', programCode, semester, section],
    queryFn: async () => {
      if (demoMode) {
        return getDemoRoutineData(programCode, semester, section);
      } else {
        // Use the same transformation as RoutineGridComponentIntegrated
        const response = await routinesAPI.getRoutine(programCode, semester, section);
        const routineDataFromAPI = response.data?.data?.routine || {};
        
        // Transform from 2D object to the same structure as demo data
        const transformedData = { routine: routineDataFromAPI };
        
        return { data: transformedData };
      }
    },
    enabled: demoMode || !!(programCode && semester && section),
    retry: 1
  });

  // Fetch time slots (use demo data if in demo mode)
  const { 
    data: timeSlotsData, 
    isLoading: timeSlotsLoading 
  } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: async () => {
      if (demoMode) {
        return getDemoTimeSlots();
      } else {
        return timeslotsAPI.getTimeSlots();
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Memoized data processing for performance
  const routine = useMemo(() => {
    return routineData?.data?.routine || {};
  }, [routineData]);

  const timeSlots = useMemo(() => {
    return (timeSlotsData?.data?.data || []).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [timeSlotsData]);

  // Transform routine data into 2D grid structure for easier rendering
  const routineGridData = useMemo(() => {
    if (!routine || !timeSlots.length) return {};

    // Initialize grid with null values
    const grid = {};
    dayNames.forEach((dayName, dayIndex) => {
      grid[dayIndex] = {};
      timeSlots.forEach(slot => {
        grid[dayIndex][slot._id] = null;
      });
    });

    // Populate grid with scheduled classes
    Object.keys(routine).forEach(dayIndex => {
      Object.keys(routine[dayIndex]).forEach(slotIndex => {
        const classData = routine[dayIndex][slotIndex];
        if (classData && grid[dayIndex] && grid[dayIndex].hasOwnProperty(slotIndex)) {
          grid[dayIndex][slotIndex] = classData;
        }
      });
    });

    return grid;
  }, [routine, timeSlots]);

  // Helper function to get class type color
  const getClassTypeColor = (classType) => {
    switch (classType) {
      case 'L': return 'blue';   // Lecture
      case 'P': return 'green';  // Practical
      case 'T': return 'orange'; // Tutorial
      default: return 'default';
    }
  };

  // Helper function to get class type text
  const getClassTypeText = (classType) => {
    switch (classType) {
      case 'L': return 'Lecture';
      case 'P': return 'Practical';
      case 'T': return 'Tutorial';
      default: return classType;
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

  // Clear class mutation
  const clearClassMutation = useMutation({
    mutationFn: ({ dayIndex, slotIndex }) => 
      routinesAPI.clearClass(programCode, semester, section, { dayIndex, slotIndex }),
    onSuccess: () => {
      message.success('Class cleared successfully!');
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
      queryClient.invalidateQueries(['teacherSchedules']); // Refresh teacher schedules
    },
    onError: (error) => {
      console.error('Clear class error:', error);
      message.error(error.response?.data?.message || 'Failed to clear class');
    },
  });

  const handleSlotClick = (dayIndex, slotIndex) => {
    if (!isEditable || demoMode) return;
    
    const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
    if (timeSlot?.isBreak) {
      message.info('Cannot assign classes during break time');
      return;
    }

    setSelectedSlot({ dayIndex, slotIndex });
    
    // Check if there's an existing class in this slot
    const existingClassData = routine[dayIndex]?.[slotIndex];
    
    setExistingClass(existingClassData || null);
    setAssignModalVisible(true);
  };

  const handleClearClass = (dayIndex, slotIndex) => {
    clearClassMutation.mutate({ dayIndex, slotIndex });
  };

  const onModalClose = () => {
    setAssignModalVisible(false);
    setSelectedSlot({ dayIndex: null, slotIndex: null });
    setExistingClass(null);
  };

  // Render class cell content - clean Excel-like format
  const renderClassContent = (classData) => {
    if (!classData) {
      return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
    }

    const classCellContentStyle = {
      fontSize: '12px',
      lineHeight: '1.3'
    };

    return (
      <div style={classCellContentStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1677ff' }}>
          {classData.subjectName || classData.subjectCode}
        </div>
        <div style={{ marginBottom: '2px' }}>
          <Tag color={getClassTypeColor(classData.classType)} size="small">
            {getClassTypeText(classData.classType)}
          </Tag>
        </div>
        <div style={{ marginBottom: '2px', fontSize: '11px' }}>
          👨‍🏫 {Array.isArray(classData.teacherShortNames) 
            ? classData.teacherShortNames.join(', ')
            : classData.teacherShortNames || 'No Teacher'}
        </div>
        <div style={{ fontSize: '11px' }}>
          🏫 {classData.roomName || 'No Room'}
        </div>
        {classData.notes && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
            📝 {classData.notes}
          </div>
        )}
      </div>
    );
  };

  const renderCell = (dayIndex, slotIndex) => {
    const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
    const isBreak = timeSlot?.isBreak;
    const classData = routineGridData[dayIndex]?.[slotIndex];

    // For break slots, show simple break text
    if (isBreak) {
      return (
        <div style={{
          textAlign: 'center',
          fontStyle: 'italic',
          color: '#666',
          padding: '8px'
        }}>
          BREAK
        </div>
      );
    }

    // For regular slots, show class content or empty
    return (
      <div style={{ padding: '8px' }}>
        {renderClassContent(classData)}
      </div>
    );
  };

  const handleSaveClass = async (classData) => {
    try {
      const fullClassData = {
        ...classData,
        dayIndex: selectedSlot.dayIndex,
        slotIndex: selectedSlot.slotIndex
      };
      
      await routinesAPI.assignClass(programCode, semester, section, fullClassData);
      message.success('Class assigned successfully!');
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
      queryClient.invalidateQueries(['teacherSchedules']); // Refresh teacher schedules
      onModalClose();
    } catch (error) {
      console.error('Assign class error:', error);
      message.error(error.response?.data?.message || 'Failed to assign class');
    }
  };

  // Show loading or empty state
  if (!demoMode && (!programCode || !semester || !section)) {
    return (
      <Card>
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Please select program, semester, and section to view routine"
        />
      </Card>
    );
  }

  if (routineLoading || timeSlotsLoading) {
    return (
      <Card>
        <Spin tip="Loading routine..." style={{ width: '100%', textAlign: 'center', padding: '40px' }} />
      </Card>
    );
  }

  if (!demoMode && routineError) {
    return (
      <Card>
        <Alert
          message="Error Loading Routine"
          description={routineError.response?.data?.message || routineError.message || 'Failed to load routine data'}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Routine Grid */}
      <Card title={demoMode ? 'BCT - Semester 1 - Section A (Demo)' : `${programCode} - Semester ${semester} - Section ${section}`}>
        {/* Debug info */}
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
          <strong>Debug Info:</strong> 
          {demoMode ? ' Demo Mode' : ' Live Mode'} | 
          Routine Data: {Object.keys(routine).length} days | 
          Time Slots: {timeSlots.length} slots |
          Grid Data: {Object.keys(routineGridData).length} days
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ 
                  padding: '12px 8px', 
                  border: '1px solid #d9d9d9', 
                  backgroundColor: '#fafafa',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  minWidth: '100px'
                }}>
                  Day / Time
                </th>
                {timeSlots.map((timeSlot) => (
                  <th 
                    key={timeSlot._id} 
                    style={{ 
                      padding: '12px 8px', 
                      border: '1px solid #d9d9d9', 
                      backgroundColor: timeSlot.isBreak ? '#f0f0f0' : '#fafafa',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      minWidth: '120px'
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
              {dayNames.map((dayName, dayIndex) => (
                <tr key={dayIndex}>
                  <td style={{ 
                    padding: '12px 8px', 
                    border: '1px solid #d9d9d9', 
                    backgroundColor: '#fafafa',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    minWidth: '100px'
                  }}>
                    {dayName}
                  </td>
                  {timeSlots.map((timeSlot) => {
                    const classData = routineGridData[dayIndex]?.[timeSlot._id];
                    
                    if (timeSlot.isBreak) {
                      return (
                        <td key={`${dayIndex}-${timeSlot._id}`} style={{
                          padding: '8px',
                          border: '1px solid #d9d9d9',
                          backgroundColor: '#f5f5f5',
                          textAlign: 'center',
                          fontStyle: 'italic',
                          color: '#666',
                          height: '80px',
                          minWidth: '120px',
                          verticalAlign: 'middle'
                        }}>
                          BREAK
                        </td>
                      );
                    }

                    return (
                      <td 
                        key={`${dayIndex}-${timeSlot._id}`} 
                        style={{ 
                          padding: '0', 
                          border: '1px solid #d9d9d9',
                          verticalAlign: 'top',
                          backgroundColor: classData ? getCellBackgroundColor(classData.classType) : '#ffffff',
                          height: '80px',
                          minWidth: '120px',
                          cursor: isEditable && !demoMode ? 'pointer' : 'default'
                        }}
                        onClick={() => isEditable && !demoMode && handleSlotClick(dayIndex, timeSlot._id)}
                      >
                        <div style={{ padding: '8px', height: '100%' }}>
                          {renderClassContent(classData)}
                          {isEditable && !demoMode && classData && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '2px', 
                              right: '2px',
                              display: 'flex',
                              gap: '2px'
                            }}>
                              <Tooltip title="Edit Class">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<EditOutlined />}
                                  style={{ fontSize: '10px', padding: '2px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlotClick(dayIndex, timeSlot._id);
                                  }}
                                />
                              </Tooltip>
                              <Popconfirm
                                title="Clear this class?"
                                description="This will remove the class assignment from this time slot."
                                onConfirm={(e) => {
                                  e.stopPropagation();
                                  handleClearClass(dayIndex, timeSlot._id);
                                }}
                                okText="Yes"
                                cancelText="No"
                              >
                                <Button
                                  size="small"
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  style={{ fontSize: '10px', padding: '2px' }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Popconfirm>
                            </div>
                          )}
                          {isEditable && !demoMode && !classData && (
                            <div style={{ 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: '#bfbfbf'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <PlusOutlined style={{ fontSize: '16px', marginBottom: '4px' }} />
                                <div style={{ fontSize: '11px' }}>Add Class</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Class Modal */}
      <AssignClassModal
        visible={assignModalVisible}
        onCancel={onModalClose}
        onSave={handleSaveClass}
        programCode={programCode}
        semester={semester}
        section={section}
        dayIndex={selectedSlot.dayIndex}
        slotIndex={selectedSlot.slotIndex}
        timeSlots={timeSlots}
        existingClass={existingClass}
        loading={clearClassMutation.isLoading}
      />
    </Space>
  );
};

export default RoutineGrid;
