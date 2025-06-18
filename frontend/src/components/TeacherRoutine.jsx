import React, { useState } from 'react';
import {
  Card,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Empty,
  Spin,
  Tag,
  Tooltip,
  Button,
  message
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  BookOutlined,
  HomeOutlined,
  ReloadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersAPI, schedulesAPI, timeslotsAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const TeacherRoutine = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const queryClient = useQueryClient();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Fetch teachers
  const { 
    data: teachersData, 
    isLoading: teachersLoading 
  } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getTeachers(),
    staleTime: 5 * 60 * 1000
  });

  // Fetch time slots
  const { 
    data: timeSlotsData, 
    isLoading: timeSlotsLoading 
  } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: () => timeslotsAPI.getTimeSlots(),
    staleTime: 5 * 60 * 1000
  });

  // Fetch teacher schedule
  const { 
    data: scheduleData, 
    isLoading: scheduleLoading,
    error: scheduleError 
  } = useQuery({
    queryKey: ['teacherSchedule', selectedTeacher],
    queryFn: () => schedulesAPI.getTeacherSchedule(selectedTeacher),
    enabled: !!selectedTeacher,
    retry: 1
  });

  // Regenerate teacher schedule mutation
  const regenerateMutation = useMutation({
    mutationFn: () => schedulesAPI.regenerateTeacherSchedule(selectedTeacher),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherSchedule', selectedTeacher]);
      message.success('Teacher schedule regenerated successfully!');
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to regenerate schedule');
    }
  });

  const teachers = teachersData?.data || [];
  const timeSlots = (timeSlotsData?.data?.data || []).sort((a, b) => a.sortOrder - b.sortOrder);
  const schedule = scheduleData?.data?.schedule || {};

  const selectedTeacherObj = teachers.find(t => t._id === selectedTeacher);

  const renderClassInfo = (classData) => {
    if (!classData) return null;

    const getClassTypeColor = (type) => {
      switch (type) {
        case 'L': return 'blue';
        case 'P': return 'green';
        case 'T': return 'orange';
        default: return 'default';
      }
    };

    const getClassTypeText = (type) => {
      switch (type) {
        case 'L': return 'Lecture';
        case 'P': return 'Practical';
        case 'T': return 'Tutorial';
        default: return type;
      }
    };

    return (
      <div style={{ padding: '8px', fontSize: '12px', lineHeight: '1.3' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1677ff' }}>
          {classData.subjectName_display || classData.subjectCode_display}
        </div>
        <div style={{ marginBottom: '2px' }}>
          <Tag color={getClassTypeColor(classData.classType)} size="small">
            {getClassTypeText(classData.classType)}
          </Tag>
        </div>
        <div style={{ marginBottom: '2px', display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: '4px', fontSize: '10px' }} />
          <Text style={{ fontSize: '11px' }}>
            {classData.programCode} - Sem {classData.semester} - Sec {classData.section}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HomeOutlined style={{ marginRight: '4px', fontSize: '10px' }} />
          <Text style={{ fontSize: '11px' }}>
            {classData.roomName_display || 'No Room'}
          </Text>
        </div>
        {classData.notes && (
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
            {classData.notes}
          </div>
        )}
      </div>
    );
  };

  const renderCell = (dayIndex, slotIndex) => {
    const timeSlot = timeSlots.find(slot => slot._id === slotIndex);
    const isBreak = timeSlot?.isBreak;
    const classData = schedule[dayIndex]?.find(cls => cls.slotIndex === slotIndex);

    const cellStyle = {
      height: '100px',
      border: '1px solid #d9d9d9',
      backgroundColor: isBreak ? '#f5f5f5' : (classData ? '#e6f7ff' : 'white'),
      borderColor: classData ? '#1677ff' : '#d9d9d9',
      position: 'relative',
      overflow: 'hidden'
    };

    if (isBreak) {
      return (
        <div style={cellStyle}>
          <div style={{ 
            padding: '8px', 
            textAlign: 'center', 
            color: '#666',
            fontStyle: 'italic'
          }}>
            {timeSlot.label}
          </div>
        </div>
      );
    }

    return (
      <div style={cellStyle}>
        {classData ? (
          renderClassInfo(classData)
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#bfbfbf',
            fontSize: '11px'
          }}>
            Free
          </div>
        )}
      </div>
    );
  };

  const calculateWorkload = () => {
    if (!schedule || Object.keys(schedule).length === 0) return { totalHours: 0, totalClasses: 0 };

    let totalClasses = 0;
    let totalHours = 0;

    Object.values(schedule).forEach(daySchedule => {
      if (Array.isArray(daySchedule)) {
        totalClasses += daySchedule.length;
        daySchedule.forEach(classData => {
          // Assume each class is 1 hour (can be adjusted based on timeSlot duration)
          totalHours += 1;
        });
      }
    });

    return { totalHours, totalClasses };
  };

  const workload = calculateWorkload();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space align="center">
            <UserOutlined style={{ fontSize: '32px', color: '#1677ff' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Teacher Routine Viewer
              </Title>
              <Text type="secondary">
                View individual teacher weekly schedules
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      {/* Teacher Selection */}
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>Select Teacher</span>
          </Space>
        }
        extra={
          selectedTeacher && (
            <Button
              icon={<ReloadOutlined />}
              loading={regenerateMutation.isLoading}
              onClick={() => regenerateMutation.mutate()}
            >
              Regenerate Schedule
            </Button>
          )
        }
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Select
              placeholder="Select a teacher to view their routine"
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              loading={teachersLoading}
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {teachers.map(teacher => (
                <Option key={teacher._id} value={teacher._id}>
                  {teacher.fullName} ({teacher.shortName})
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {teacher.department}
                  </Text>
                </Option>
              ))}
            </Select>
          </Col>
          {selectedTeacherObj && (
            <Col xs={24} md={12}>
              <Space direction="vertical" size="small">
                <Text strong>{selectedTeacherObj.fullName}</Text>
                <Text type="secondary">{selectedTeacherObj.department}</Text>
                <Space>
                  <Tag color="blue">{workload.totalClasses} classes/week</Tag>
                  <Tag color="green">{workload.totalHours} hours/week</Tag>
                </Space>
              </Space>
            </Col>
          )}
        </Row>
      </Card>

      {/* Schedule Display */}
      {selectedTeacher && (
        <>
          {scheduleLoading || timeSlotsLoading ? (
            <Card>
              <Spin tip="Loading teacher schedule..." style={{ width: '100%', textAlign: 'center', padding: '40px' }} />
            </Card>
          ) : scheduleError ? (
            <Card>
              <Alert
                message="Error Loading Schedule"
                description={scheduleError.response?.data?.message || scheduleError.message || 'Failed to load teacher schedule'}
                type="error"
                showIcon
                action={
                  <Button
                    size="small"
                    danger
                    onClick={() => regenerateMutation.mutate()}
                    loading={regenerateMutation.isLoading}
                  >
                    Try Regenerating
                  </Button>
                }
              />
            </Card>
          ) : Object.keys(schedule).length === 0 ? (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical">
                    <Text>No classes assigned to this teacher</Text>
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={() => regenerateMutation.mutate()}
                      loading={regenerateMutation.isLoading}
                    >
                      Generate Schedule
                    </Button>
                  </Space>
                }
              />
            </Card>
          ) : (
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Weekly Schedule - {selectedTeacherObj?.fullName}</span>
                </Space>
              }
            >
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
                            minWidth: '140px'
                          }}
                        >
                          <div>{timeSlot.label}</div>
                          <div style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                            {timeSlot.startTime} - {timeSlot.endTime}
                          </div>
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
                          verticalAlign: 'middle'
                        }}>
                          {dayName}
                        </td>
                        {timeSlots.map((timeSlot) => (
                          <td 
                            key={`${dayIndex}-${timeSlot._id}`} 
                            style={{ 
                              padding: '0', 
                              border: '1px solid #d9d9d9',
                              verticalAlign: 'top'
                            }}
                          >
                            {renderCell(dayIndex, timeSlot._id)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Schedule Summary */}
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Total Classes</Text>
                      <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                        {workload.totalClasses}
                      </Text>
                    </Space>
                  </Col>
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Total Hours</Text>
                      <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                        {workload.totalHours}
                      </Text>
                    </Space>
                  </Col>
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Avg Classes/Day</Text>
                      <Text strong style={{ fontSize: '18px', color: '#faad14' }}>
                        {(workload.totalClasses / 6).toFixed(1)}
                      </Text>
                    </Space>
                  </Col>
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Last Updated</Text>
                      <Text style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px' }} />
                        {scheduleData?.data?.lastGeneratedAt 
                          ? new Date(scheduleData.data.lastGeneratedAt).toLocaleString()
                          : 'Not available'
                        }
                      </Text>
                    </Space>
                  </Col>
                </Row>
              </div>
            </Card>
          )}
        </>
      )}

      {!selectedTeacher && (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Please select a teacher to view their weekly routine"
          />
        </Card>
      )}
    </Space>
  );
};

export default TeacherRoutine;
