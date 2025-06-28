import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Spin, 
  Empty, 
  Modal, 
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined
} from '@ant-design/icons';
import AssignClassModal from './AssignClassModal';
import ExcelActions from './ExcelActions';
import TeacherExcelActions from './TeacherExcelActions';
import { routinesAPI, timeSlotsAPI } from '../services/api';
import { handleRoutineChangeCache } from '../utils/teacherScheduleCache';
import './RoutineGrid.css';

const { Text } = Typography;

// Demo data function for demonstration purposes
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
          }
        }
      }
    }
  };
};

// Demo time slots data
const getDemoTimeSlots = () => {
  return {
    data: {
      data: [
        {
          _id: '0',
          label: 'Period 1',
          startTime: '7:30',
          endTime: '8:15',
          sortOrder: 0,
          isBreak: false
        },
        {
          _id: '1',
          label: 'Period 2',
          startTime: '8:15',
          endTime: '9:00',
          sortOrder: 1,
          isBreak: false
        },
        {
          _id: '2',
          label: 'Break',
          startTime: '9:00',
          endTime: '9:15',
          sortOrder: 2,
          isBreak: true
        },
        {
          _id: '3',
          label: 'Period 3',
          startTime: '9:15',
          endTime: '10:00',
          sortOrder: 3,
          isBreak: false
        },
        {
          _id: '4',
          label: 'Period 4',
          startTime: '10:00',
          endTime: '10:45',
          sortOrder: 4,
          isBreak: false
        },
        {
          _id: '5',
          label: 'Period 5',
          startTime: '10:45',
          endTime: '11:30',
          sortOrder: 5,
          isBreak: false
        }
      ]
    }
  };
};

const RoutineGrid = ({ 
  programCode, 
  semester, 
  section, 
  isEditable = false,
  demoMode = false,
  onCellDoubleClicked = null,
  teacherViewMode = false,
  routineData: providedRoutineData,
  showExcelActions = false,
  selectedTeacher = null,
  selectedTeacherInfo = null
}) => {
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ dayIndex: null, slotIndex: null });
  const [existingClass, setExistingClass] = useState(null);
  
  const queryClient = useQueryClient();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Fetch routine data (use demo data if in demo mode)
  const { 
    data: fetchedRoutineData, 
    isLoading: routineLoading,
    error: routineError 
  } = useQuery({
    queryKey: ['routine', programCode, semester, section],
    queryFn: async () => {
      if (demoMode) {
        return getDemoRoutineData(programCode, semester, section);
      } else {
        const response = await routinesAPI.getRoutine(programCode, semester, section);
        return response.data?.data ? { data: response.data.data } : { data: { routine: {} } };
      }
    },
    enabled: !providedRoutineData && !teacherViewMode && (demoMode || !!(programCode && semester && section)),
    retry: 1
  });
  
  // Use either the provided routine data or fetch new data
  const routineData = providedRoutineData || fetchedRoutineData;

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
        return timeSlotsAPI.getTimeSlots();
      }
    },
    staleTime: 5 * 60 * 1000
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
    // Detailed debug to see exactly what data we're working with
    console.log('RoutineGrid - Creating grid with data:', {
      hasRoutine: !!routine,
      routineType: typeof routine,
      routineIsEmpty: routine && Object.keys(routine).length === 0,
      timeSlotsCount: timeSlots.length,
      teacherViewMode
    });
    
    if (routine) {
      console.log('Routine days available:', Object.keys(routine));
      
      // Check a sample day if available
      const sampleDay = Object.keys(routine)[0];
      if (sampleDay) {
        console.log(`Sample day ${sampleDay} data:`, routine[sampleDay]);
      }
    }
    
    if (!routine || !timeSlots.length) {
      console.log('Cannot create grid: missing routine or timeSlots');
      return {};
    }

    const grid = {};
    dayNames.forEach((dayName, dayIndex) => {
      grid[dayIndex] = {};
      timeSlots.forEach(slot => {
        // Ensure consistent string keys
        grid[dayIndex][slot._id.toString()] = null;
      });
    });

    // Log grid structure after initialization
    console.log('Grid structure initialized with days:', Object.keys(grid));
    
    try {
      // Populate grid with scheduled classes
      Object.keys(routine).forEach(dayIndex => {
        console.log(`Processing day ${dayIndex} slots...`);
        
        const dayData = routine[dayIndex];
        if (!dayData || typeof dayData !== 'object') {
          console.log(`No valid data for day ${dayIndex}`);
          return; // Skip this day
        }
        
        Object.keys(dayData).forEach(slotIndex => {
          const classData = dayData[slotIndex];
          // Convert slotIndex to string for proper comparison since object keys are always strings
          const slotKey = slotIndex.toString();
          
          console.log(`Processing slot ${slotKey} for day ${dayIndex}:`, classData);
          
          if (classData && grid[dayIndex] && grid[dayIndex].hasOwnProperty(slotKey)) {
            console.log(`Adding class to grid[${dayIndex}][${slotKey}]`);
            grid[dayIndex][slotKey] = classData;
          } else {
            console.log(`Cannot add class to grid[${dayIndex}][${slotKey}] - invalid slot`);
          }
        });
      });
    } catch (error) {
      console.error('Error creating routine grid:', error);
    }
    
    // Log final grid for verification
    console.log('Final grid structure created:', grid);
    return grid;
  }, [routine, timeSlots, teacherViewMode]);

  // Helper functions
  const getClassTypeColor = (classType) => {
    switch (classType) {
      case 'L': return 'blue';
      case 'P': return 'green';
      case 'T': return 'orange';
      default: return 'default';
    }
  };

  const getClassTypeText = (classType) => {
    switch (classType) {
      case 'L': return 'Lecture';
      case 'P': return 'Practical';
      case 'T': return 'Tutorial';
      default: return classType;
    }
  };

  const getCellBackgroundColor = (classType) => {
    switch (classType) {
      case 'L': return '#e6f7ff';
      case 'P': return '#f6ffed';
      case 'T': return '#fff7e6';
      default: return '#ffffff';
    }
  };

  const calculateRowSpan = (classData, dayData, slotIndex) => {
    if (!classData?.spanId) return 1;
    if (classData.spanId && !classData.spanMaster) return 0;
    
    const spanGroup = Object.values(dayData || {}).filter(
      slot => slot?.spanId && slot.spanId === classData.spanId
    );
    
    return spanGroup.length;
  };

  const isPartOfSpanGroup = (classData) => {
    return classData?.spanId != null;
  };

  // Clear class mutation
  const clearClassMutation = useMutation({
    mutationFn: ({ dayIndex, slotIndex }) => 
      routinesAPI.clearClass(programCode, semester, section, { dayIndex, slotIndex }),
    onSuccess: async (result) => {
      message.success('Class cleared successfully!');
      
      // Use enhanced cache management for teacher schedule synchronization
      await handleRoutineChangeCache(queryClient, result);
      
      // Invalidate routine queries
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
    },
    onError: (error) => {
      console.error('Clear class error:', error);
      message.error(error.response?.data?.message || 'Failed to clear class');
    },
  });
  
  // Clear span group mutation
  const clearSpanGroupMutation = useMutation({
    mutationFn: (spanId) => routinesAPI.clearSpanGroup(spanId),
    onSuccess: async (result) => {
      message.success('Multi-period class cleared successfully!');
      
      // Use enhanced cache management for teacher schedule synchronization
      await handleRoutineChangeCache(queryClient, result);
      
      // Invalidate routine queries
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
    },
    onError: (error) => {
      console.error('Clear span group error:', error);
      message.error(error.response?.data?.message || 'Failed to clear multi-period class');
    }
  });

  const handleSlotClick = (dayIndex, slotIndex) => {
    if (!isEditable || demoMode) return;
    
    const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
    if (timeSlot?.isBreak) {
      message.info('Cannot assign classes during break time');
      return;
    }

    setSelectedSlot({ dayIndex, slotIndex });
    const existingClassData = routine[dayIndex]?.[slotIndex];
    setExistingClass(existingClassData || null);
    setAssignModalVisible(true);
  };

  const handleClearClass = (dayIndex, slotIndex) => {
    const classData = routineGridData[dayIndex]?.[slotIndex];
    
    if (classData?.spanId) {
      Modal.confirm({
        title: 'Clear Multi-Period Class',
        content: 'This is a multi-period class. All time slots for this class will be cleared. Continue?',
        okText: 'Yes, clear all periods',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: () => {
          clearSpanGroupMutation.mutate(classData.spanId);
        }
      });
    } else {
      clearClassMutation.mutate({ dayIndex, slotIndex });
    }
  };

  const onModalClose = () => {
    setAssignModalVisible(false);
    setSelectedSlot({ dayIndex: null, slotIndex: null });
    setExistingClass(null);
  };

  // Render class cell content
  const renderClassContent = (classData) => {
    if (!classData) {
      // Add debug info
      console.log('No class data to render in RoutineGrid');
      return <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>;
    }
    
    // Debug log to see what class data we have
    console.log('Rendering class cell with data:', {
      subjectName: classData.subjectName,
      roomName: classData.roomName,
      teacherNames: classData.teacherNames,
      programInfo: classData.programSemesterSection
    });

    const classCellContentStyle = {
      fontSize: '12px',
      lineHeight: '1.3'
    };

    const isSpanned = isPartOfSpanGroup(classData);
    const isSpanMaster = classData.spanMaster === true;
    
    return (
      <div style={classCellContentStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1677ff' }}>
          {classData.subjectName || classData.subjectCode}
          {isSpanned && isSpanMaster && (
            <Tag color="blue" size="small" style={{ marginLeft: '4px', fontSize: '9px' }}>
              Multi-period
            </Tag>
          )}
          {teacherViewMode && classData.timeSlot_display && (
            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
              ⏰ {classData.timeSlot_display}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '2px' }}>
          <Tag color={getClassTypeColor(classData.classType)} size="small">
            {getClassTypeText(classData.classType)}
          </Tag>
        </div>
        {!teacherViewMode && (
          <div style={{ marginBottom: '2px', fontSize: '11px' }}>
            👨‍🏫 {Array.isArray(classData.teacherShortNames) 
              ? classData.teacherShortNames.join(', ')
              : classData.teacherShortNames || 'No Teacher'}
          </div>
        )}
        <div style={{ fontSize: '11px' }}>
          🏫 {classData.roomName || 'No Room'}
        </div>
        {classData.notes && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
            📝 {classData.notes}
          </div>
        )}
        {isSpanned && isSpanMaster && classData.spanId && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#1677ff' }}>
            🔄 Multi-period class
          </div>
        )}
      </div>
    );
  };

  const renderCell = (dayIndex, slotIndex) => {
    const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
    const isBreak = timeSlot?.isBreak;
    const classData = routineGridData[dayIndex]?.[slotIndex];

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
      queryClient.invalidateQueries(['teacherSchedules']);
      onModalClose();
    } catch (error) {
      console.error('Assign class error:', error);
      message.error(error.response?.data?.message || 'Failed to assign class');
    }
  };

  const handleSaveSpannedClass = async (classData, slotIndexes) => {
    try {
      const fullClassData = {
        ...classData,
        dayIndex: selectedSlot.dayIndex,
        slotIndexes: slotIndexes,
        programCode,
        semester,
        section
      };
      
      await routinesAPI.assignClassSpanned(fullClassData);
      message.success(`Class assigned successfully across ${slotIndexes.length} periods!`);
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
      queryClient.invalidateQueries(['teacherSchedules']);
      onModalClose();
    } catch (error) {
      console.error('Assign spanned class error:', error);
      
      if (error.response?.data?.conflict) {
        const conflict = error.response.data.conflict;
        message.error(`Conflict in period ${conflict.slotIndex + 1}: ${conflict.type} conflict`);
      } else {
        message.error(error.response?.data?.message || 'Failed to assign spanned class');
      }
    }
  };

  // Show loading or empty state
  if (!teacherViewMode && !demoMode && (!programCode || !semester || !section)) {
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
        <div style={{ width: '100%', textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading routine...</div>
        </div>
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
      <style jsx>{`
        .ag-cell-merged {
          background-color: #e6f7ff;
          box-shadow: 0 0 0 2px #1677ff;
          position: relative;
          z-index: 1;
        }
        
        .ag-cell-spanned-hidden {
          display: none;
        }
        
        .span-marker {
          position: absolute;
          top: 0;
          left: 0;
          width: 0; 
          height: 0;
          border-left: 16px solid #1677ff;
          border-top: 16px solid #1677ff;
          border-right: 16px solid transparent;
          border-bottom: 16px solid transparent;
        }
      `}</style>
      
      <Card 
        title={demoMode ? 'BCT - Semester 1 - Section A (Demo)' : 
              teacherViewMode ? 'Weekly Schedule' : 
              `${programCode} - Semester ${semester} - Section ${section}`}
        extra={
          !demoMode && !teacherViewMode && (
            <ExcelActions
              programCode={programCode}
              semester={semester}
              section={section}
              allowImport={isEditable}
              allowExport={true}
              demoMode={demoMode}
              size="small"
              onImportSuccess={() => {
                message.success('Routine imported successfully!');
                queryClient.invalidateQueries(['routine', programCode, semester, section]);
              }}
              onImportError={(error) => {
                message.error(error?.message || 'Failed to import routine');
              }}
              onExportSuccess={() => {
                message.success('Routine exported successfully!');
              }}
              onExportError={(error) => {
                message.error(error?.message || 'Failed to export routine');
              }}
            />
          ) || (teacherViewMode && showExcelActions && selectedTeacher && (
            <TeacherExcelActions
              teacherId={selectedTeacher}
              teacherName={selectedTeacherInfo?.name || 'Teacher'}
            />
          ))
        }
      >
        <div style={{ overflowX: 'auto', marginTop: '7px' }}>
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

                    const rowSpan = calculateRowSpan(classData, routineGridData[dayIndex], timeSlot._id);
                    
                    if (rowSpan === 0) {
                      return null;
                    }
                    
                    const isSpanMaster = classData?.spanMaster === true;
                    
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
                          cursor: isEditable && !demoMode && !teacherViewMode ? 'pointer' : 'default',
                          ...(isSpanMaster ? { 
                            boxShadow: '0 0 0 2px #1677ff',
                            position: 'relative',
                            zIndex: 1
                          } : {})
                        }}
                        rowSpan={rowSpan > 1 ? rowSpan : undefined}
                        onClick={() => isEditable && !demoMode && !teacherViewMode && handleSlotClick(dayIndex, timeSlot._id)}
                        onDoubleClick={!teacherViewMode && onCellDoubleClicked ? 
                          () => onCellDoubleClicked(dayIndex, timeSlot._id, classData) : 
                          undefined}
                      >
                        <div style={{ padding: '8px', height: '100%' }}>
                          {isSpanMaster && rowSpan > 1 && (
                            <div className="span-marker" title={`Multi-period class (spans ${rowSpan} periods)`}></div>
                          )}
                          {renderClassContent(classData)}
                          {isEditable && !demoMode && !teacherViewMode && classData && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '4px', 
                              right: '4px',
                              zIndex: 10
                            }}>
                              <Button
                                size="small"
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px', 
                                  height: '24px',
                                  width: '24px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  border: '1px solid #ff4d4f',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                  transition: 'all 0.2s ease-in-out'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearClass(dayIndex, timeSlot._id);
                                }}
                                title={classData?.spanId ? "Clear all periods of this class" : "Clear this class"}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ff4d4f';
                                  e.currentTarget.style.color = '#fff';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                                  e.currentTarget.style.color = '#ff4d4f';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              />
                            </div>
                          )}
                          {/* Show program-semester-section in teacher view mode */}
                          {teacherViewMode && classData && classData.programSemesterSection && (
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#666', 
                              marginTop: '4px',
                              borderTop: '1px dashed #ddd',
                              paddingTop: '2px'
                            }}>
                              📚 {classData.programSemesterSection}
                            </div>
                          )}
                          {isEditable && !demoMode && !teacherViewMode && !classData && (
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

      {!teacherViewMode && (
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
      )}
    </Space>
  );
};

export default RoutineGrid;
