import React, { useCallback } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Button, 
  Space,
  Tag,
  Avatar,
  Row,
  Col,
  Empty,
  Spin
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { teachersAPI } from '../../services/api';
// import { useNavigate } from 'react-router-dom'; // Not used

const { Title, Text } = Typography;

const Teachers = () => {
  // const navigate = useNavigate(); // Not used

  const fetchTeachers = useCallback(async () => {
    return await teachersAPI.getTeachers();
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
    retry: 3, // Increased from 1 to 3 retries
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Add timeout handling
    meta: {
      timeout: 30000 // 30 seconds
    }
  });

  const teachers = data?.data || [];

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      align: 'center',
      render: (avatarUrl) => <Avatar icon={<UserOutlined />} size="large" src={avatarUrl} />
    },
    {
      title: 'Name',
      dataIndex: 'teacherName',
      key: 'name',
      sorter: (a, b) => (a.teacherName || a.name || '').localeCompare(b.teacherName || b.name || ''),
      render: (text, record) => (
        <div>
          <Text strong>{text || record.name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.email || 'No email'}
          </Text>
        </div>
      )
    },
    {
      title: 'Short Name',
      dataIndex: 'shortName',
      key: 'shortName',
      align: 'center',
      render: (text) => text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      render: (text) => text || <Text type="secondary">Teacher</Text>
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => text || <Text type="secondary">Not specified</Text>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      align: 'center',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive) => (
        <Tag color={isActive !== false ? 'success' : 'error'}>
          {isActive !== false ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            ghost
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            type="primary" 
            danger 
            ghost
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const handleEdit = (teacher) => {
    console.log('Edit teacher:', teacher);
    // TODO: Implement edit functionality (e.g., open modal with form)
  };

  const handleDelete = (teacher) => {
    console.log('Delete teacher:', teacher);
    // TODO: Implement delete functionality (e.g., show confirmation, call API)
  };

  const handleAddNew = () => {
    console.log('Add new teacher');
    // TODO: Implement add functionality (e.g., open modal with form)
  };

  if (isError) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px', borderRadius: '8px' }}>
        <Title level={4} type="danger">Error Loading Teachers</Title>
        <Text type="secondary">
          {error?.code === 'ECONNABORTED' ? 
            'Request timed out - Backend server may not be running' :
            error?.message || 'An unknown error occurred.'
          }
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
          Error details: {JSON.stringify({
            code: error?.code,
            status: error?.response?.status,
            timeout: error?.code === 'ECONNABORTED'
          })}
        </Text>
        <br />
        <Button 
          type="primary" 
          style={{ marginTop: '24px' }}
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" className="admin-page-header mobile-stack" style={{ marginBottom: '16px' }}>
        <Col xs={24} lg={16}>
          <Space align="center" size="middle" className="mobile-stack-vertical">
            <TeamOutlined style={{ fontSize: '32px', color: '#1677ff' }} />
            <div className="mobile-center">
              <Title level={2} style={{ margin: 0 }}>
                Teachers
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                Manage faculty members and their information.
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} lg={8}>
          <div className="admin-actions" style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAddNew}
              style={{ borderRadius: '6px' }}
            >
              Add New Teacher
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Total Teachers</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1677ff', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : teachers.length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Active Teachers</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#52c41a', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : teachers.filter(t => t.isActive !== false).length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Departments</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#722ed1', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : (new Set(teachers.map(t => t.department).filter(Boolean)).size || (teachers.length > 0 ? 1 : 0) )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Teachers Table */}
      <Card className="mobile-table" style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
         <Table
            columns={columns}
            dataSource={teachers}
            loading={isLoading}
            rowKey={(record) => record._id || record.id || Math.random().toString()}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} teachers`,
              style: { padding: '16px' }
            }}
            scroll={{ x: true }}
            locale={{
              emptyText: (
                <Empty
                  image={<TeamOutlined style={{ fontSize: '48px', color: '#ccc' }} />}
                  imageStyle={{ height: 60 }}
                  description={
                    <span>
                      No teachers found.
                      <br />
                      Ready to add the first one?
                    </span>
                  }
                >
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAddNew}
                    style={{ marginTop: 16 }}
                  >
                    Add First Teacher
                  </Button>
                </Empty>
              )
            }}
            style={{ borderRadius: '8px', overflow: 'hidden' }}
          />
      </Card>
    </Space>
  );
};

export default Teachers;