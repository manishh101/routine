import React, { useState } from 'react';
import { Card, Select, Space, Typography, Alert, Spin, Button, Row, Col, Statistic, Tag } from 'antd';
import { UserOutlined, ReloadOutlined, BookOutlined, CalendarOutlined, ClockCircleOutlined, TeamOutlined, DownloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { teachersAPI, timeSlotsAPI, routinesAPI } from '../services/api';
import RoutineGrid from './RoutineGrid';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * Teacher Schedule Manager Component
 * Displays teacher schedules using the same Excel-like grid as class routines
 */
const TeacherScheduleManager = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Fetch teachers list from real API (same as routine manager)
  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachersAPI.getAllTeachers,
    retry: 1,
    staleTime: 30000,
  });

  // Generate teacher schedule from routine data (same source as routine manager)
  const { 
    data: scheduleData, 
    isLoading: scheduleLoading, 
    error: scheduleError,
    refetch: refetchSchedule 
  } = useQuery({
    queryKey: ['teacher-schedule-from-routine', selectedTeacher],
    queryFn: async () => {
      if (!selectedTeacher) return null;
      
      try {
        // Use the teacher schedule API which already generates from RoutineSlot data
        const response = await teachersAPI.getTeacherSchedule(selectedTeacher);
        
        // Log the raw response for debugging
        console.log('Raw teacher schedule response:', response);
        
        // The API response structure should have success and data properties
        // Handle both direct response and data.success patterns
        if (response && response.data && response.data.success === false) {
          throw new Error(response.data.message || 'Failed to load teacher schedule');
        }
        
        if (!response || (typeof response.success !== 'undefined' && !response.success)) {
          throw new Error(response?.message || 'Failed to load teacher schedule');
        }
        
        // The backend already returns data in the correct format
        return response;
      } catch (error) {
        console.error('Error in teacher schedule query:', error);
        throw error;
      }
    },
    enabled: !!selectedTeacher,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  // Fetch time slots from real API (same as routine manager)
  const { data: timeSlotsData } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: () => timeSlotsAPI.getTimeSlots(),
    staleTime: 5 * 60 * 1000,
  });

  const teachers = teachersData?.data || [];
  const selectedTeacherInfo = teachers.find(t => t._id === selectedTeacher);
  const timeSlots = timeSlotsData?.data?.data || [];

  // Transform teacher schedule data to match EXACT routine manager format
  const routineData = React.useMemo(() => {
    // Check for data in both response formats (direct or nested)
    if (!scheduleData) return null;
    
    // Enhanced debugging to see what we're working with
    console.log('Raw scheduleData received:', scheduleData);
    
    // Handle potential response structure variations
    let responseData;
    
    // Check various response structures that could be returned
    if (scheduleData.data?.data) {
      // API might return { data: { data: { ... } } }
      responseData = scheduleData.data.data;
      console.log('Using scheduleData.data.data structure');
    } else if (scheduleData.data) {
      // API might return { data: { ... } }
      responseData = scheduleData.data;
      console.log('Using scheduleData.data structure');
    } else {
      // Direct data structure
      responseData = scheduleData;
      console.log('Using direct scheduleData structure');
    }
    
    // If there's no data object at all, return null
    if (!responseData) {
      console.error('No valid response data found in API response');
      return null;
    }
    
    console.log('Response data structure:', responseData);
    
    // Extract only the fields that routine manager uses
    // Use optional chaining to safely access possibly nested properties
    const programCode = responseData.programCode;
    const semester = responseData.semester;
    const section = responseData.section;
    
    // Ensure routine is properly extracted - this is critical
    let routine = responseData.routine;
    
    // Additional fallbacks to find routine data
    if (!routine && responseData.data) {
      routine = responseData.data.routine;
    }
    
    // Create empty object if routine is not found
    if (!routine || typeof routine !== 'object') {
      console.warn('No routine object found in response - creating empty routine');
      routine = {};
    }
    
    // Detailed logging of the routine structure for debugging
    console.log('Extracted routine object:', routine);
    console.log('Routine days:', Object.keys(routine));
    
    // If there are days, log the content of the first day for deeper inspection
    const firstDay = Object.keys(routine)[0];
    if (firstDay) {
      console.log(`Sample day (${firstDay}) content:`, routine[firstDay]);
    }
    
    // Return in EXACT same structure as routine manager expects
    return {
      programCode: programCode || 'TEACHER_VIEW',
      semester: semester || 'ALL', 
      section: section || 'ALL',
      routine: routine
    };
  }, [scheduleData]);

  // Add detailed diagnostic logging for troubleshooting
  React.useEffect(() => {
    if (routineData) {
      console.log('--------- TEACHER SCHEDULE DIAGNOSTIC ---------');
      console.log('Current routineData structure:', routineData);
      
      if (routineData.routine) {
        const days = Object.keys(routineData.routine);
        console.log(`Routine has ${days.length} day entries`);
        
        days.forEach(day => {
          const slots = routineData.routine[day] || {};
          const slotKeys = Object.keys(slots);
          console.log(`Day ${day}: ${slotKeys.length} slots`);
          
          if (slotKeys.length > 0) {
            const firstSlot = slots[slotKeys[0]];
            console.log(`Sample class data for day ${day}:`, firstSlot);
          }
        });
      }
      console.log('---------------------------------------------');
    }
  }, [routineData]);
  
  // Show demo notice when using demo data - check if we have real API data
  const isUsingDemoData = !teachersData || teachersError;

  const handleTeacherChange = (teacherId) => {
    setSelectedTeacher(teacherId);
  };

  // Calculate schedule statistics for the selected teacher  
  // Using the transformed routine data (same as routine manager)
  const scheduleStats = React.useMemo(() => {
    if (!routineData?.routine) return { totalClasses: 0, uniqueSubjects: 0, busyDays: 0, totalHours: 0 };

    // Log for debugging
    console.log('Calculating stats for routine data:', routineData.routine);
    
    let totalClasses = 0;
    const uniqueSubjects = new Set();
    const busyDays = new Set();
    let totalHours = 0;

    try {
      // Now routineData.routine uses numeric day indices (0-6) - same as routine manager
      Object.entries(routineData.routine).forEach(([dayIndex, daySlots]) => {
        // Make sure daySlots is an object and not null/undefined
        if (daySlots && typeof daySlots === 'object') {
          const slotsForDay = Object.keys(daySlots);
          
          if (slotsForDay.length > 0) {
            busyDays.add(dayIndex);
            console.log(`Day ${dayIndex} has ${slotsForDay.length} slots`);
            
            Object.entries(daySlots).forEach(([slotIndex, classInfo]) => {
              // Ensure the class info is valid
              if (classInfo && typeof classInfo === 'object') {
                totalClasses++;
                totalHours += 1; // Assuming each slot is 1 hour
                
                // Extract subject name safely
                if (classInfo.subjectName) {
                  uniqueSubjects.add(classInfo.subjectName);
                } else if (classInfo.subjectCode) {
                  uniqueSubjects.add(classInfo.subjectCode);
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error calculating schedule statistics:', error);
    }

    return {
      totalClasses,
      uniqueSubjects: uniqueSubjects.size,
      busyDays: busyDays.size,
      totalHours
    };
  }, [routineData]);

  return (
    <div className="teacher-schedule-manager" style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: '1800px', margin: '0 auto' }}>
        
        {/* Backend Connection Notice */}
        {isUsingDemoData && (
          <Alert
            message=" Backend Connection Issue"
            description="Cannot connect to the backend server. Please ensure the backend is running and accessible to view real teacher data."
            type="error"
            showIcon
            style={{
              borderRadius: '12px',
              border: '1px solid #ff4d4f',
              background: 'linear-gradient(135deg, #fff2f0 0%, #ffebe6 100%)'
            }}
            closable
          />
        )}
        
        {/* Modern Header Section */}
        <Card 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            color: 'white'
          }}
        >
          <Row gutter={[32, 24]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TeamOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <Title level={1} style={{ margin: 0, color: 'white', fontSize: '32px', fontWeight: '700' }}>
                      Teacher Schedule Manager
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: '400' }}>
                      Professional schedule management with real-time synchronization
                    </Text>
                  </div>
                </div>
              </Space>
            </Col>
            
            <Col xs={24} lg={10}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <Space direction="vertical" size="medium" style={{ width: '100%' }}>
                  <Text strong style={{ color: 'white', fontSize: '16px', display: 'block' }}>
                     Select Teacher
                  </Text>
                  <Select
                    placeholder={isUsingDemoData ? " Backend not connected - No teachers available" : "Search and select a teacher..."}
                    style={{ width: '100%' }}
                    loading={teachersLoading}
                    onChange={handleTeacherChange}
                    value={selectedTeacher}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    size="large"
                    disabled={isUsingDemoData}
                    dropdownStyle={{
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                      padding: '8px'
                    }}
                    // Custom display for selected value
                    optionLabelProp="label"
                  >
                    {teachers.map(teacher => (
                      <Option 
                        key={teacher._id} 
                        value={teacher._id}
                        label={
                          // Custom label for selected display - horizontal layout
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            maxWidth: '100%',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}>
                              {(teacher.fullName || teacher.name).charAt(0).toUpperCase()}
                            </div>
                            <div style={{ 
                              overflow: 'hidden',
                              flex: 1,
                              minWidth: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#1a1a1a',
                                fontSize: '14px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flexShrink: 1
                              }}>
                                {teacher.fullName || teacher.name}
                              </span>
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#667eea',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                • {teacher.department}
                              </span>
                            </div>
                          </div>
                        }
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {(teacher.fullName || teacher.name).charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              color: '#1a1a1a',
                              fontSize: '15px',
                              marginBottom: '2px'
                            }}>
                              {teacher.fullName || teacher.name}
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#666',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ 
                                background: '#667eea',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}>
                                {teacher.department}
                              </span>
                              <span>
                                {teacher.designation || teacher.shortName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Option>
                    ))}
                  </Select>
                  
                  {isUsingDemoData && (
                    <div style={{
                      background: 'rgba(255, 77, 79, 0.2)',
                      border: '1px solid rgba(255, 77, 79, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      marginTop: '8px'
                    }}>
                      <Text style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                         Backend not connected: Unable to load teachers from database
                      </Text>
                    </div>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Teacher Info & Statistics Card */}
        {selectedTeacherInfo && (
          <Card
            style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'white'
            }}
          >
            <Row gutter={[32, 24]} align="middle">
              <Col xs={24} lg={12}>
                <Space direction="vertical" size="medium" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      width: '60px',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <UserOutlined style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                    <div>
                      <Title level={3} style={{ margin: 0, color: '#1a1a1a', fontWeight: '600' }}>
                        {selectedTeacherInfo.fullName || selectedTeacherInfo.name}
                      </Title>
                      <Space wrap size="small" style={{ marginTop: '8px' }}>
                        <Tag color="blue" style={{ borderRadius: '20px', padding: '4px 12px', border: 'none' }}>
                           {selectedTeacherInfo.department}
                        </Tag>
                        <Tag color="green" style={{ borderRadius: '20px', padding: '4px 12px', border: 'none' }}>
                           {selectedTeacherInfo.designation}
                        </Tag>
                      </Space>
                    </div>
                  </div>
                </Space>
              </Col>
              
              <Col xs={24} lg={12}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card
                      size="small"
                      style={{
                        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <Statistic
                        title="Total Classes"
                        value={scheduleStats.totalClasses}
                        prefix={<ClockCircleOutlined style={{ color: '#667eea' }} />}
                        valueStyle={{ color: '#667eea', fontWeight: '600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      style={{
                        background: 'linear-gradient(135deg, #52c41a20 0%, #73d13d20 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <Statistic
                        title="Subjects"
                        value={scheduleStats.uniqueSubjects}
                        prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                        valueStyle={{ color: '#52c41a', fontWeight: '600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      style={{
                        background: 'linear-gradient(135deg, #fa8c1620 0%, #ffa94020 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <Statistic
                        title="Active Days"
                        value={scheduleStats.busyDays}
                        suffix="/ 7"
                        prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
                        valueStyle={{ color: '#fa8c16', fontWeight: '600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card
                      size="small"
                      style={{
                        background: 'linear-gradient(135deg, #722ed120 0%, #c084fc20 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <Statistic
                        title="Total Hours"
                        value={scheduleStats.totalHours}
                        suffix="hrs"
                        valueStyle={{ color: '#722ed1', fontWeight: '600' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Action Buttons */}
            {selectedTeacher && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Space size="large">
                  <Button 
                    onClick={refetchSchedule}
                    icon={<ReloadOutlined />}
                    loading={scheduleLoading}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      height: '48px',
                      padding: '0 24px',
                      fontWeight: '500'
                    }}
                  >
                    🔄 Refresh Schedule
                  </Button>
                  
                  {/* Debug button to help diagnose issues */}
                  <Button 
                    onClick={() => {
                      console.log('--------- MANUAL DEBUG TRIGGERED ---------');
                      console.log('Current teacher ID:', selectedTeacher);
                      console.log('Current schedule data:', scheduleData);
                      console.log('Current routine data:', routineData);
                      
                      // Check if we have routine data
                      if (routineData?.routine) {
                        const days = Object.keys(routineData.routine);
                        console.log(`Routine has ${days.length} day entries`);
                        
                        // Check each day for slot data
                        days.forEach(day => {
                          const dayData = routineData.routine[day];
                          const slots = Object.keys(dayData || {});
                          console.log(`Day ${day} has ${slots.length} slots:`, slots);
                          
                          // Peek into slot contents
                          if (slots.length > 0) {
                            for (const slotKey of slots) {
                              const slotData = dayData[slotKey];
                              console.log(`  Slot ${slotKey}:`, {
                                subject: slotData.subjectName,
                                room: slotData.roomName,
                                teachers: slotData.teacherNames,
                                classType: slotData.classType,
                                programInfo: slotData.programSemesterSection
                              });
                            }
                          }
                        });
                      } else {
                        console.log('No routine data available for debugging');
                      }
                      
                      console.log('------------------------------------');
                    }}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      height: '48px',
                      padding: '0 24px',
                      fontWeight: '500',
                      background: '#f0f0f0'
                    }}
                  >
                     Debug Info
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        )}

        {/* Modern Schedule Grid Card */}
        {selectedTeacher && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarOutlined style={{ fontSize: '16px', color: 'white' }} />
                </div>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                    Weekly Schedule
                  </span>
                  {selectedTeacherInfo && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                      {selectedTeacherInfo.fullName || selectedTeacherInfo.name} • {selectedTeacherInfo.department}
                    </div>
                  )}
                </div>
              </div>
            }
            style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'white'
            }}
            headStyle={{
              borderBottom: '1px solid #f0f2f5',
              padding: '20px 24px'
            }}
            styles={{
              body: {
                padding: '4px 8px'
              }
            }}
          >
            {scheduleLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
                flexDirection: 'column',
                gap: '16px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                padding: '40px'
              }}>
                <Spin size="large" />
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Loading teacher schedule...
                </Text>
                <Text type="secondary" style={{ fontSize: '14px', textAlign: 'center' }}>
                  Fetching real-time data from the routine system
                </Text>
              </div>
            ) : scheduleError ? (
              <Alert
                message="Unable to Load Schedule"
                description={
                  <div>
                    <p>{scheduleError.response?.data?.message || scheduleError.message}</p>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      This could be due to network issues or the teacher may not have any assigned classes yet.
                    </p>
                  </div>
                }
                type="error"
                showIcon
                style={{
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #fff2f0 0%, #ffebe6 100%)'
                }}
                action={
                  <Button 
                    size="small" 
                    onClick={refetchSchedule}
                    style={{ borderRadius: '8px' }}
                  >
                    Try Again
                  </Button>
                }
              />
            ) : routineData ? (
              // Always show the grid if we have routine data
              // Log what's happening for debugging
              console.log('Rendering RoutineGrid with data:', {
                hasRoutineData: !!routineData,
                hasRoutineProperty: !!(routineData && routineData.routine),
                daysWithClasses: routineData && routineData.routine ? 
                  Object.entries(routineData.routine)
                    .filter(([day, slots]) => slots && typeof slots === 'object' && Object.keys(slots).length > 0)
                    .map(([day]) => day)
                  : []
              }),
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '12px',
                padding: '4px 6px'
              }}>
                <RoutineGrid 
                  teacherViewMode={true}
                  routineData={{ data: routineData }} 
                  isEditable={false}
                  showExcelActions={true}
                  selectedTeacher={selectedTeacher}
                  selectedTeacherInfo={{
                    ...selectedTeacherInfo,
                    name: selectedTeacherInfo?.fullName || selectedTeacherInfo?.name || 'Teacher'
                  }}
                />
              </div>
            ) : (
              <Alert
                message="No Schedule Available"
                description={
                  <div>
                    <p>This teacher does not have any scheduled classes in the current routine.</p>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                      • Check if the teacher is assigned to any subjects<br/>
                      • Verify routine data is up to date<br/>
                      • Contact admin if this seems incorrect
                    </p>
                  </div>
                }
                type="info"
                showIcon
                style={{
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
                  margin: '40px 0'
                }}
              />
            )}
          </Card>
        )}

        {/* Welcome Card for New Users */}
        {!selectedTeacher && (
          <Card
            style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}
          >
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <TeamOutlined style={{ fontSize: '32px', color: 'white' }} />
              </div>
              
              <Title level={3} style={{ color: '#1a1a1a', marginBottom: '16px' }}>
                 Get Started with Teacher Schedules
              </Title>
              
              <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '32px' }}>
                Select a teacher from the dropdown above to view their personalized weekly schedule
              </Text>

              <Row gutter={[24, 16]} style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '12px'
                    }}>
                      <CalendarOutlined style={{ fontSize: '24px', color: '#667eea' }} />
                    </div>
                    <Text strong style={{ color: '#1a1a1a' }}>Real-time Sync</Text>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      Automatically updated from routine changes
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #52c41a20 0%, #73d13d20 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '12px'
                    }}>
                      <DownloadOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    </div>
                    <Text strong style={{ color: '#1a1a1a' }}>Excel Export</Text>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      Professional formatted schedules
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #fa8c1620 0%, #ffa94020 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '12px'
                    }}>
                      <BookOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                    </div>
                    <Text strong style={{ color: '#1a1a1a' }}>Complete View</Text>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      All subjects and time slots
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        )}
      </Space>
    </div>
  );
};

export default TeacherScheduleManager;
