import React, { useState } from 'react';
import {
  Card,
  Select,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Spin,
  Alert,
  Empty
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BookOutlined,
  HomeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersAPI, schedulesAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const TeacherScheduleViewer = () => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const queryClient = useQueryClient();

  // Fetch teachers
  const { 
    data: teachersData, 
    isLoading: teachersLoading 
  } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getTeachers()
  });

  // Fetch selected teacher's schedule
  const { 
    data: scheduleData, 
    isLoading: scheduleLoading,
    error: scheduleError,
    refetch: refetchSchedule
  } = useQuery({
    queryKey: ['teacherSchedule', selectedTeacher],
    queryFn: () => schedulesAPI.getTeacherSchedule(selectedTeacher),
    enabled: !!selectedTeacher
  });

  // Regenerate schedule mutation
  const regenerateMutation = useMutation({
    mutationFn: (teacherId) => schedulesAPI.regenerateTeacherSchedule(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries(['teacherSchedule', selectedTeacher]);
    }
  });

  const teachers = teachersData?.data || [];
  const schedule = scheduleData?.data?.schedule || {};
  const selectedTeacherObj = teachers.find(t => t._id === selectedTeacher);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Create table data for the schedule
  const createScheduleTableData = () => {
    if (!schedule || Object.keys(schedule).length === 0) return [];

    // Get all unique slot indices across all days
    const allSlotIndices = new Set();
    Object.values(schedule).forEach(daySchedule => {
      daySchedule.forEach(classItem => {
        allSlotIndices.add(classItem.slotIndex);
      });
    });

    const sortedSlotIndices = Array.from(allSlotIndices).sort((a, b) => a - b);

    return sortedSlotIndices.map(slotIndex => {
      const row = { slotIndex };
      
      dayNames.forEach((dayName, dayIndex) => {
        const daySchedule = schedule[dayIndex] || [];
        const classForSlot = daySchedule.find(c => c.slotIndex === slotIndex);
        row[`day${dayIndex}`] = classForSlot;
      });

      return row;
    });
  };

  const renderClassCell = (classData) => {
    if (!classData) {
      return <div style={{ padding: '8px', color: '#ccc' }}>Free</div>;
    }

    return (
      <div style={{ padding: '8px' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <BookOutlined style={{ color: '#1677ff' }} />
            <Text strong style={{ fontSize: '12px' }}>
              {classData.subjectName}
            </Text>
          </Space>
          
          <Space>
            <CalendarOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '11px' }}>
              {classData.programCode} Sem{classData.semester} {classData.section}
            </Text>
          </Space>
          
          <Space>
            <HomeOutlined style={{ color: '#fa8c16' }} />
            <Text style={{ fontSize: '11px' }}>
              {classData.roomName}
            </Text>
          </Space>
          
          <Tag size="small" color={
            classData.classType === 'L' ? 'blue' : 
            classData.classType === 'P' ? 'green' : 'orange'
          }>
            {classData.classType === 'L' ? 'Lecture' : 
             classData.classType === 'P' ? 'Practical' : 'Tutorial'}
          </Tag>
        </Space>
      </div>
    );
  };

  // Create table columns
  const columns = [
    {
      title: 'Time Slot',
      dataIndex: 'slotIndex',
      key: 'slotIndex',
      width: 100,
      fixed: 'left',
      render: (slotIndex) => (
        <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
          Period {slotIndex + 1}
        </div>
      )
    },
    ...dayNames.map((dayName, dayIndex) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{dayName}</div>
        </div>
      ),
      key: `day${dayIndex}`,
      width: 200,
      render: (_, record) => renderClassCell(record[`day${dayIndex}`])
    }))
  ];

  const tableData = createScheduleTableData();

  // Calculate statistics
  const getScheduleStats = () => {
    if (!schedule || Object.keys(schedule).length === 0) return null;

    let totalClasses = 0;
    const classesByDay = {};
    const classesByType = { L: 0, P: 0, T: 0 };

    dayNames.forEach((_, dayIndex) => {
      const daySchedule = schedule[dayIndex] || [];
      classesByDay[dayIndex] = daySchedule.length;
      totalClasses += daySchedule.length;

      daySchedule.forEach(classItem => {
        if (classesByType.hasOwnProperty(classItem.classType)) {
          classesByType[classItem.classType]++;
        }
      });
    });

    return { totalClasses, classesByDay, classesByType };
  };

  const stats = getScheduleStats();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space align="center">
            <UserOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Teacher Schedule
              </Title>
              <Text type="secondary">
                View individual teacher weekly schedules
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      {/* Teacher Selection */}
      <Card title="Select Teacher">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Select
              style={{ width: '100%' }}
              placeholder="Select a teacher to view their schedule"
              loading={teachersLoading}
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {teachers.map(teacher => (
                <Option key={teacher._id} value={teacher._id}>
                  {teacher.fullName} ({teacher.shortName}) - {teacher.department}
                </Option>
              ))}
            </Select>
          </Col>
          {selectedTeacher && (
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => regenerateMutation.mutate(selectedTeacher)}
                loading={regenerateMutation.isLoading}
              >
                Regenerate
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Schedule Statistics */}
      {selectedTeacher && stats && (
        <Card title={`Schedule Overview - ${selectedTeacherObj?.fullName}`}>
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                  {stats.totalClasses}
                </div>
                <div>Total Classes</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.classesByType.L}
                </div>
                <div>Lectures</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {stats.classesByType.P}
                </div>
                <div>Practicals</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                  {stats.classesByType.T}
                </div>
                <div>Tutorials</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Schedule Table */}
      {selectedTeacher && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>Weekly Schedule</span>
              {selectedTeacherObj && (
                <Tag color="blue">{selectedTeacherObj.shortName}</Tag>
              )}
            </Space>
          }
        >
          {scheduleLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>
                <Text>Loading schedule...</Text>
              </div>
            </div>
          ) : scheduleError ? (
            <Alert
              message="Error Loading Schedule"
              description={scheduleError.message || 'Failed to load teacher schedule'}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={refetchSchedule}>
                  Retry
                </Button>
              }
            />
          ) : tableData.length === 0 ? (
            <Empty
              description="No classes scheduled for this teacher"
              image={<UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                rowKey="slotIndex"
              />
            </div>
          )}
        </Card>
      )}

      {!selectedTeacher && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <Title level={4} style={{ marginTop: '16px' }}>
            Select a Teacher
          </Title>
          <Text type="secondary">
            Choose a teacher from the dropdown above to view their weekly schedule.
          </Text>
        </Card>
      )}
    </Space>
  );
};

export default TeacherScheduleViewer;
