import React, { useState, useMemo, useEffect } from 'react';
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
  message,
  Tooltip,
  App
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined,
  WarningOutlined,
  CalendarOutlined
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
  const [lastDeletedClass, setLastDeletedClass] = useState(null);
  const [showUndoButton, setShowUndoButton] = useState(false);

  // Use App.useApp for proper context support in modals
  const { modal } = App.useApp();

  
  const queryClient = useQueryClient();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Fetch routine data (use demo data if in demo mode)
  const { 
    data: fetchedRoutineData, 
    isLoading: routineLoading,
    error: routineError,
    dataUpdatedAt,
    isRefetching 
  } = useQuery({
    queryKey: ['routine', programCode, semester, section],
    queryFn: async () => {
      console.log('RoutineGrid - Fetching routine data for:', { programCode, semester, section });
      if (demoMode) {
        return getDemoRoutineData(programCode, semester, section);
      } else {
        const response = await routinesAPI.getRoutine(programCode, semester, section);
        console.log('RoutineGrid - API response:', response.data);
        
        // Ensure consistent data structure
        if (response.data?.data) {
          return { data: response.data.data };
        } else if (response.data) {
          return { data: response.data };
        } else {
          return { data: { routine: {} } };
        }
      }
    },
    enabled: !providedRoutineData && !teacherViewMode && (demoMode || !!(programCode && semester && section)),
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0 // Don't cache data
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
    // Handle both direct routine data and nested data structures
    let result = {};
    
    if (routineData?.routine) {
      // Case 1: Data structure is { routine: {...} }
      result = routineData.routine;
    } else if (routineData?.data?.routine) {
      // Case 2: Data structure is { data: { routine: {...} } }
      result = routineData.data.routine;
    } else if (routineData?.data) {
      // Case 3: Data structure is just { data: {...} } where data is the routine
      result = routineData.data;
    } else {
      // Case 4: Empty or invalid data
      result = {};
    }
    
    console.log('RoutineGrid - Processing routine data:', {
      rawRoutineData: routineData,
      processedRoutine: result,
      hasData: Object.keys(result).length > 0,
      dataUpdatedAt,
      isRefetching,
      programCode,
      semester,
      section,
      slotCount: Object.values(result).reduce((total, day) => total + Object.keys(day || {}).length, 0),
      dataStructureType: routineData?.routine ? 'routine' : 
                         routineData?.data?.routine ? 'data.routine' :
                         routineData?.data ? 'data' : 'unknown'
    });
    return result;
  }, [routineData, programCode, semester, section, dataUpdatedAt, isRefetching]);

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
    onSuccess: async (result, variables) => {
      const { dayIndex, slotIndex } = variables;
      const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Show undo option
      setShowUndoButton(true);
      setTimeout(() => setShowUndoButton(false), 10000); // Hide after 10 seconds
      
      message.success({
        content: (
          <span>
            ✅ Class cleared successfully from {dayNames[dayIndex]}, {timeSlot?.label || `Slot ${slotIndex}`}
          </span>
        ),
        duration: 3
      });
      
      // Use enhanced cache management for teacher schedule synchronization
      await handleRoutineChangeCache(queryClient, result);
      
      // Invalidate routine queries
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
    },
    onError: (error, variables) => {
      const { dayIndex, slotIndex } = variables;
      const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      console.error('Clear class error:', error);
      message.error({
        content: (
          <div>
            <div>❌ Failed to clear class from {dayNames[dayIndex]}, {timeSlot?.label || `Slot ${slotIndex}`}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {error.response?.data?.message || error.message || 'Unknown error occurred'}
            </div>
          </div>
        ),
        duration: 5
      });
    },
  });
  
  // Clear span group mutation
  const clearSpanGroupMutation = useMutation({
    mutationFn: (spanId) => routinesAPI.clearSpanGroup(spanId),
    onSuccess: async (result, spanId) => {
      const deletedCount = result?.data?.deletedCount || 'Multiple';
      
      // Show undo option
      setShowUndoButton(true);
      setTimeout(() => setShowUndoButton(false), 10000); // Hide after 10 seconds
      
      message.success({
        content: (
          <span>
            ✅ Multi-period class cleared successfully! ({deletedCount} periods removed)
          </span>
        ),
        duration: 3
      });
      
      // Use enhanced cache management for teacher schedule synchronization
      await handleRoutineChangeCache(queryClient, result);
      
      // Invalidate routine queries
      queryClient.invalidateQueries(['routine', programCode, semester, section]);
    },
    onError: (error, spanId) => {
      console.error('Clear span group error:', error);
      message.error({
        content: (
          <div>
            <div>❌ Failed to clear multi-period class</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {error.response?.data?.message || error.message || 'Unknown error occurred'}
            </div>
          </div>
        ),
        duration: 5
      });
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
    const timeSlot = timeSlots.find(ts => ts._id === slotIndex);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (!classData) {
      message.warning('No class found to clear at this time slot');
      return;
    }
    
    if (classData?.spanId) {
      // Multi-period class deletion
      const spanGroupSlots = Object.values(routineGridData[dayIndex] || {})
        .filter(slot => slot?.spanId === classData.spanId);
      
      modal.confirm({
        title: (
          <Space>
            <DeleteOutlined style={{ color: '#ff4d4f' }} />
            <span>Clear Multi-Period Class</span>
          </Space>
        ),
        content: (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
              📚 {classData.subjectName || classData.subjectCode}
            </div>
            <div style={{ marginBottom: '8px' }}>
              🗓️ {dayNames[dayIndex]}, {timeSlot?.label || `Slot ${slotIndex}`}
            </div>
            <div style={{ marginBottom: '8px' }}>
              👨‍🏫 {Array.isArray(classData.teacherNames) 
                ? classData.teacherNames.join(', ') 
                : classData.teacherNames || 'No teacher assigned'}
            </div>
            <div style={{ marginBottom: '12px' }}>
              🏫 {classData.roomName || 'No room assigned'}
            </div>
            <Alert 
              message={`This will clear all ${spanGroupSlots.length} periods of this multi-period class.`}
              type="warning"
              size="small"
              showIcon
            />
          </div>
        ),
        okText: 'Yes, clear all periods',
        okType: 'danger',
        cancelText: 'Cancel',
        width: 500,
        onOk: () => {
          // Store the span group data for potential undo
          setLastDeletedClass({
            classData,
            dayIndex,
            slotIndex,
            type: 'span',
            spanId: classData.spanId
          });
          
          clearSpanGroupMutation.mutate(classData.spanId);
        }
      });
    } else {
      // Single period class deletion
      modal.confirm({
        title: (
          <Space>
            <DeleteOutlined style={{ color: '#ff4d4f' }} />
            <span>Clear Class</span>
          </Space>
        ),
        content: (
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
              📚 {classData.subjectName || classData.subjectCode}
            </div>
            <div style={{ marginBottom: '8px' }}>
              🗓️ {dayNames[dayIndex]}, {timeSlot?.label || `Slot ${slotIndex}`}
            </div>
            <div style={{ marginBottom: '8px' }}>
              👨‍🏫 {Array.isArray(classData.teacherNames) 
                ? classData.teacherNames.join(', ') 
                : classData.teacherNames || 'No teacher assigned'}
            </div>
            <div style={{ marginBottom: '12px' }}>
              🏫 {classData.roomName || 'No room assigned'}
            </div>
            <Alert 
              message="This will remove the class from this time slot."
              type="info"
              size="small"
              showIcon
            />
          </div>
        ),
        okText: 'Yes, clear class',
        okType: 'danger',
        cancelText: 'Cancel',
        width: 500,
        onOk: () => {
          // Store the class data for potential undo
          setLastDeletedClass({
            classData,
            dayIndex,
            slotIndex,
            type: 'single'
          });
          
          clearClassMutation.mutate({ dayIndex, slotIndex });
        }
      });
    }
  };

  // Undo last delete operation
  const handleUndoDelete = async () => {
    if (!lastDeletedClass) {
      message.warning('No recent deletion to undo');
      return;
    }

    try {
      const { classData, dayIndex, slotIndex, type } = lastDeletedClass;
      
      if (type === 'span') {
        // Restore span group - this would require a more complex implementation
        message.info('Undo for multi-period classes is not yet supported. Please recreate the class manually.');
      } else {
        // Restore single class
        await routinesAPI.assignClass(programCode, semester, section, {
          dayIndex,
          slotIndex,
          subjectId: classData.subjectId,
          teacherIds: classData.teacherIds || [],
          roomId: classData.roomId,
          classType: classData.classType,
          notes: classData.notes || ''
        });
        
        message.success('Class restored successfully!');
        queryClient.invalidateQueries(['routine', programCode, semester, section]);
      }
      
      setLastDeletedClass(null);
      setShowUndoButton(false);
    } catch (error) {
      console.error('Undo error:', error);
      message.error('Failed to restore class. Please recreate it manually.');
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
      <style>{`
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
          <Space>
            {!demoMode && !teacherViewMode && showExcelActions && (
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
            )}
            {teacherViewMode && showExcelActions && selectedTeacher && (
              <TeacherExcelActions
                teacherId={selectedTeacher}
                teacherName={selectedTeacherInfo?.name || 'Teacher'}
              />
            )}
            {/* Undo Button */}
            {!demoMode && !teacherViewMode && isEditable && showUndoButton && lastDeletedClass && (
              <Button
                size="small"
                icon={<WarningOutlined />}
                onClick={handleUndoDelete}
                style={{
                  backgroundColor: '#fff7e6',
                  borderColor: '#ffc069',
                  color: '#fa8c16'
                }}
              >
                Undo Delete
              </Button>
            )}
          </Space>
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
                                loading={clearClassMutation.isLoading || clearSpanGroupMutation.isLoading}
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px', 
                                  height: '24px',
                                  width: '24px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #ff4d4f',
                                  boxShadow: '0 2px 8px rgba(255, 77, 79, 0.2)',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearClass(dayIndex, timeSlot._id);
                                }}
                                title={classData?.spanId ? 
                                  "Clear all periods of this multi-period class" : 
                                  "Clear this class"
                                }
                                aria-label={classData?.spanId ? 
                                  "Delete multi-period class" : 
                                  "Delete class"
                                }
                                onMouseEnter={(e) => {
                                  if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = '#ff4d4f';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 77, 79, 0.4)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!e.currentTarget.disabled) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                                    e.currentTarget.style.color = '#ff4d4f';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 77, 79, 0.2)';
                                  }
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
        
        {/* Enhanced Empty State */}
        {!demoMode && !teacherViewMode && isEditable && 
         routineGridData && Object.values(routineGridData).every(day => 
           !day || Object.keys(day).length === 0
         ) && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '2px dashed #d9d9d9',
            margin: '20px 0'
          }}>
            <CalendarOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
            <div style={{ fontSize: '18px', fontWeight: '500', color: '#595959', marginBottom: '8px' }}>
              No Classes Scheduled
            </div>
            <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '16px' }}>
              Click on any time slot to start building your routine
            </div>
            <Space direction="vertical" size="small">
              <div style={{ fontSize: '12px', color: '#bfbfbf' }}>
                💡 Tip: You can also import an existing routine using the import button above
              </div>
            </Space>
          </div>
        )}
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
