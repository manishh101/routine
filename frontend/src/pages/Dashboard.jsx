import React, { useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Statistic,
  List,
  Space,
  Spin,
  Alert,
  Avatar,
  Tag,
  Empty
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  TeamOutlined,
  BookOutlined,
  ReadOutlined,
  ScheduleOutlined,
  EyeOutlined,
  DashboardFilled,
  CalendarOutlined
} from '@ant-design/icons';
import { teachersAPI, programsAPI, subjectsAPI, classesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();

  // Memoize the fetch functions to prevent infinite re-renders
  const fetchTeachers = useCallback(async () => {
    const response = await teachersAPI.getTeachers();
    return response.data || [];
  }, []);

  const fetchPrograms = useCallback(async () => {
    const response = await programsAPI.getPrograms();
    return response.data || [];
  }, []);

  const fetchSubjects = useCallback(async () => {
    const response = await subjectsAPI.getSubjects();
    return response.data || [];
  }, []);

  const fetchClasses = useCallback(async () => {
    const response = await classesAPI.getClasses();
    return response.data || [];
  }, []);

  const teachersQuery = useQuery({ 
    queryKey: ['teachers_dashboard'], 
    queryFn: fetchTeachers,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  
  const programsQuery = useQuery({ 
    queryKey: ['programs_dashboard'], 
    queryFn: fetchPrograms,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  
  const subjectsQuery = useQuery({ 
    queryKey: ['subjects_dashboard'], 
    queryFn: fetchSubjects,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  
  const classesQuery = useQuery({ 
    queryKey: ['classes_dashboard'], 
    queryFn: fetchClasses,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const teachers = teachersQuery.data || [];
  const programs = programsQuery.data || [];
  const subjects = subjectsQuery.data || [];
  const classes = classesQuery.data || [];

  const isLoading = teachersQuery.isLoading || programsQuery.isLoading || subjectsQuery.isLoading || classesQuery.isLoading;
  const isFetching = teachersQuery.isFetching || programsQuery.isFetching || subjectsQuery.isFetching || classesQuery.isFetching;

  const hasError = teachersQuery.isError || programsQuery.isError || subjectsQuery.isError || classesQuery.isError;
  const errorMessages = [
    teachersQuery.error?.message,
    programsQuery.error?.message,
    subjectsQuery.error?.message,
    classesQuery.error?.message
  ].filter(Boolean).join(', ');

  const stats = [
    { title: 'Total Teachers', value: teachers.length, icon: <TeamOutlined />, color: '#1677ff', path: '/teachers' },
    { title: 'Total Programs', value: programs.length, icon: <BookOutlined />, color: '#52c41a', path: '/programs' },
    { title: 'Total Subjects', value: subjects.length, icon: <ReadOutlined />, color: '#722ed1', path: '/subjects' },
    { title: 'Total Classes', value: classes.length, icon: <ScheduleOutlined />, color: '#fa8c16', path: '/classes' }
  ];

  const quickActions = [
    { title: 'Manage Teachers', description: 'View, add, or edit faculty members', icon: <TeamOutlined />, path: '/teachers', color: '#1677ff' },
    { title: 'Manage Programs', description: 'Define and update academic programs', icon: <BookOutlined />, path: '/programs', color: '#52c41a' },
    { title: 'Manage Subjects', description: 'Organize course subjects and details', icon: <ReadOutlined />, path: '/subjects', color: '#722ed1' },
    { title: 'Manage Classes', description: 'Schedule and oversee class timetables', icon: <ScheduleOutlined />, path: '/classes', color: '#fa8c16' },
    { title: 'View Full Routine', description: 'Check the complete class schedule grid', icon: <CalendarOutlined />, path: '/routine', color: '#eb2f96' }
  ];

  const recentClasses = classes
    .slice() // Create a shallow copy to avoid mutating original data
    .sort((a, b) => {
      // Assuming classes have a createdAt or similar timestamp for "recent"
      // If not, this sort won't be meaningful for "recent"
      // For now, let's just take the first few as an example
      return (b.createdAt || 0) - (a.createdAt || 0); 
    })
    .slice(0, 5);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Page Header */}
      <Row justify="space-between" align="center" style={{ marginBottom: '16px' }}>
          <Space align="center" size="middle">
            <DashboardFilled style={{ fontSize: '32px', color: '#1677ff' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: '15px' }}>
                Welcome to the BE Routine Management System.
              </Paragraph>
            </div>
          </Space>
          {isFetching && !isLoading && <Spin tip="Updating data..." size="small" />}
      </Row>

      {hasError && (
        <Alert
          message="Data Loading Error"
          description={`Failed to load some data. Please check your connection or try refreshing. ${errorMessages ? `Details: ${errorMessages}` : ''}`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card
              hoverable
              onClick={() => navigate(stat.path)}
              style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'}}
              styles={{ body: { padding: '20px' } }}
            >
              <Statistic
                title={<Text style={{fontSize: '15px', color: '#595959'}}>{stat.title}</Text>}
                value={isLoading && stat.value === 0 ? <Spin size="small" /> : stat.value}
                precision={0}
                prefix={<Avatar size="large" icon={stat.icon} style={{ backgroundColor: `${stat.color}20`, color: stat.color, marginRight: '12px' }} />}
                valueStyle={{ color: stat.color, fontSize: '32px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Text strong>Quick Actions</Text>}
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            styles={{ body: { padding: '0 16px 16px 16px' } }}
          >
            <List
              itemLayout="horizontal"
              dataSource={quickActions}
              renderItem={(action) => (
                <List.Item
                  actions={[<Button type="text" shape="circle" icon={<EyeOutlined />} onClick={() => navigate(action.path)} />]}
                  style={{padding: '12px 0'}}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={40} 
                        icon={action.icon} 
                        style={{ backgroundColor: `${action.color}20`, color: action.color }}
                      />
                    }
                    title={
                      <Button type="link" onClick={() => navigate(action.path)} style={{ padding: 0, height: 'auto', fontWeight: 500 }}>
                        {action.title}
                      </Button>
                    }
                    description={<Text type="secondary" style={{fontSize: '13px'}}>{action.description}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Classes */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Text strong>Recently Added Classes</Text>}
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            styles={{ body: { padding: '0 16px 16px 16px' } }}
            extra={
              <Button type="link" onClick={() => navigate('/routine')} icon={<EyeOutlined />}>
                View Full Routine
              </Button>
            }
          >
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
            ) : recentClasses.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={recentClasses}
                renderItem={(classItem) => (
                  <List.Item style={{padding: '12px 0'}}>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size={40} 
                          icon={<ScheduleOutlined />}
                          style={{ backgroundColor: '#e6f7ff', color: '#1677ff' }}
                        />
                      }
                      title={<Text strong>{classItem.subjectId?.name || classItem.subject || 'N/A'}</Text>}
                      description={
                        <Text type="secondary" style={{fontSize: '13px'}}>
                          {classItem.teacherId?.teacherName || classItem.teacher || 'N/A'} • {classItem.day || 'N/A'} • {classItem.startTime || '--'}:{classItem.endTime || '--'}
                        </Text>
                      }
                    />
                    <Tag color="blue">Room {classItem.roomNumber || 'N/A'}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Empty description="No recent classes found." image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Dashboard;