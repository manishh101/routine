import React, { useCallback } from 'react';
import { 
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
  Card
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  TeamOutlined,
  BookOutlined,
  ReadOutlined,
  ScheduleOutlined,
  EyeOutlined,
  DashboardFilled,
  CalendarOutlined,
  UserOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { teachersAPI, programsAPI, subjectsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../contexts/authStore';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

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

  const teachers = teachersQuery.data || [];
  const programs = programsQuery.data || [];
  const subjects = subjectsQuery.data || [];

  const isLoading = teachersQuery.isLoading || programsQuery.isLoading || subjectsQuery.isLoading;
  const isFetching = teachersQuery.isFetching || programsQuery.isFetching || subjectsQuery.isFetching;

  const hasError = teachersQuery.isError || programsQuery.isError || subjectsQuery.isError;
  const errorMessages = [
    teachersQuery.error?.message,
    programsQuery.error?.message,
    subjectsQuery.error?.message
  ].filter(Boolean).join(', ');

  // Stats cards are shown to all users
  const stats = [
    { title: 'Total Teachers', value: teachers.length, icon: <TeamOutlined />, color: '#1677ff', path: isAdmin ? '/admin/teachers' : '/teacher-schedule' },
    { title: 'Total Programs', value: programs.length, icon: <BookOutlined />, color: '#52c41a', path: isAdmin ? '/admin/programs' : '' },
    { title: 'Total Subjects', value: subjects.length, icon: <ReadOutlined />, color: '#722ed1', path: isAdmin ? '/admin/subjects' : '' }
  ];

  // Different quick actions based on user role
  const adminQuickActions = [
    { title: 'Manage Teachers', description: 'View, add, or edit faculty members', icon: <TeamOutlined />, path: '/admin/teachers', color: '#1677ff' },
    { title: 'Manage Programs', description: 'Define and update academic programs', icon: <BookOutlined />, path: '/admin/programs', color: '#52c41a' },
    { title: 'Manage Subjects', description: 'Organize course subjects and details', icon: <ReadOutlined />, path: '/admin/subjects', color: '#722ed1' },
    { title: 'View Routine', description: 'Check the complete class schedule grid', icon: <CalendarOutlined />, path: '/routine', color: '#eb2f96' }
  ];

  const userQuickActions = [
    { title: 'View Class Routine', description: 'Check class schedules and timetables', icon: <CalendarOutlined />, path: '/routine', color: '#1677ff' },
    { title: 'Teacher Schedules', description: 'View faculty teaching timetables', icon: <TeamOutlined />, path: '/teacher-schedule', color: '#52c41a' },
    { title: 'My Profile', description: 'Update your account information', icon: <UserOutlined />, path: '/profile', color: '#722ed1' }
  ];
  
  // Use appropriate quick actions based on user role
  const quickActions = isAdmin ? adminQuickActions : userQuickActions;

  // Different getting started guides based on user role
  const adminGettingStarted = [
    { title: 'Set up Programs', description: 'Define your academic programs and semesters' },
    { title: 'Add Teachers', description: 'Register faculty members and their schedules' },
    { title: 'Create Subjects', description: 'Add course subjects and their details' },
    { title: 'Build Routines', description: 'Generate class schedules and timetables' }
  ];

  const userGettingStarted = [
    { title: 'Find your Routine', description: 'Select your program, semester and section' },
    { title: 'Check Teacher Schedules', description: 'View availability of instructors' },
    { title: 'Understand the Schedule', description: 'Learn how to read the class routine grid' },
    { title: 'Stay Updated', description: 'Check routines regularly for any changes' }
  ];

  // Use appropriate getting started guide based on user role
  const gettingStarted = isAdmin ? adminGettingStarted : userGettingStarted;

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
          <Col xs={24} sm={12} lg={8} key={stat.title}>
            <Card
              hoverable={!!stat.path}
              onClick={() => stat.path && navigate(stat.path)}
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

        {/* Getting Started Guide */}
        <Col xs={24} lg={12}>
          <Card 
            title={<Text strong>Getting Started</Text>}
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
            styles={{ body: { padding: '0 16px 16px 16px' } }}
          >
            <List
              itemLayout="horizontal"
              dataSource={gettingStarted}
              renderItem={(item, index) => (
                <List.Item style={{padding: '12px 0'}}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size={32} 
                        style={{ backgroundColor: '#f0f0f0', color: '#666' }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={<Text strong style={{fontSize: '14px'}}>{item.title}</Text>}
                    description={<Text type="secondary" style={{fontSize: '13px'}}>{item.description}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default Dashboard;