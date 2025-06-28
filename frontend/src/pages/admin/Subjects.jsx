import React, { useCallback } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Button, 
  Space,
  Tag,
  Row,
  Col,
  Empty,
  Spin
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  ReadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { subjectsAPI } from '../../services/api';

const { Title, Text } = Typography;

const Subjects = () => {
  const fetchSubjects = useCallback(async () => {
    return await subjectsAPI.getSubjects();
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const subjects = data?.data || [];

  const columns = [
    {
      title: 'Subject Name',
      dataIndex: 'subjectName',
      key: 'name',
      sorter: (a, b) => (a.subjectName || a.name || '').localeCompare(b.subjectName || b.name || ''),
      render: (text, record) => (
        <div>
          <Text strong>{text || record.name || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description || 'No description'}
          </Text>
        </div>
      )
    },
    {
      title: 'Subject Code',
      dataIndex: 'subjectCode',
      key: 'code',
      align: 'center',
      render: (text) => text ? <Tag color="purple">{text}</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      align: 'center',
      sorter: (a, b) => (parseInt(a.credits) || 0) - (parseInt(b.credits) || 0),
      render: (text) => text ? <Tag color="blue">{text} credits</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      align: 'center',
      render: (text) => text ? <Tag>Sem {text}</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      filters: [
        { text: 'Core', value: 'core' },
        { text: 'Elective', value: 'elective' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (text) => {
        let color = 'default';
        if (text === 'core') color = 'volcano';
        else if (text === 'elective') color = 'geekblue';
        return text ? <Tag color={color}>{text.toUpperCase()}</Tag> : <Text type="secondary">N/A</Text>;
      }
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

  const handleEdit = (subject) => {
    console.log('Edit subject:', subject);
    // TODO: Implement edit functionality
  };

  const handleDelete = (subject) => {
    console.log('Delete subject:', subject);
    // TODO: Implement delete functionality
  };

  const handleAddNew = () => {
    console.log('Add new subject');
    // TODO: Implement add functionality
  };

  if (isError) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px', borderRadius: '8px' }}>
        <Title level={4} type="danger">Error Loading Subjects</Title>
        <Text type="secondary">{error?.message || 'An unknown error occurred.'}</Text>
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
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <Space align="center" size="middle">
            <ReadOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Subjects
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                Manage courses and subject information.
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddNew}
            style={{ borderRadius: '6px' }}
          >
            Add New Subject
          </Button>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Total Subjects</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#722ed1', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : subjects.length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Active Subjects</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#52c41a', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : subjects.filter(s => s.isActive !== false).length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Total Credits</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1677ff', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : subjects.reduce((sum, s) => sum + (parseInt(s.credits) || 0), 0)}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Semesters</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fa8c16', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : (new Set(subjects.map(s => s.semester).filter(Boolean)).size || (subjects.length > 0 ? 1 : 0))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Subjects Table */}
      <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={subjects}
          loading={isLoading}
          rowKey={(record) => record._id || record.id || Math.random().toString()}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} subjects`,
            style: { padding: '16px' }
          }}
          scroll={{ x: true }}
          locale={{
            emptyText: (
              <Empty
                image={<ReadOutlined style={{ fontSize: '48px', color: '#ccc' }} />}
                imageStyle={{ height: 60 }}
                description={
                  <span>
                    No subjects found.
                    <br />
                    Want to add the first one?
                  </span>
                }
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddNew}
                  style={{ marginTop: 16 }}
                >
                  Add First Subject
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

export default Subjects;