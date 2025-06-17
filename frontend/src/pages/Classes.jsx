import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select,
  TimePicker,
  InputNumber,
  message, 
  Popconfirm, 
  Space,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Empty
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ScheduleOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { classesAPI, teachersAPI, programsAPI, subjectsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Classes = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Memoize fetch functions to prevent infinite re-renders
  const fetchClasses = useCallback(async () => {
    return await classesAPI.getClasses();
  }, []);

  const fetchTeachers = useCallback(async () => {
    return await teachersAPI.getTeachers();
  }, []);

  const fetchPrograms = useCallback(async () => {
    return await programsAPI.getPrograms();
  }, []);

  const fetchSubjects = useCallback(async () => {
    return await subjectsAPI.getSubjects();
  }, []);

  const { data: classesData = {}, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  const classes = classesData.data || [];

  const { data: teachersData = {} } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  const teachers = teachersData.data || [];

  const { data: programsData = {} } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  const programs = programsData.data || [];

  const { data: subjectsData = {} } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
  const subjects = subjectsData.data || [];
  
  const isLoading = isLoadingClasses; // Primarily driven by classes loading

  const createClassMutation = useMutation({
    mutationFn: classesAPI.createClass,
    onSuccess: () => {
      message.success('Class created successfully');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsModalVisible(false);
    },
    onError: (error) => {
      message.error(error.response?.data?.msg || 'Failed to create class');
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => classesAPI.updateClass(id, data),
    onSuccess: () => {
      message.success('Class updated successfully');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsModalVisible(false);
    },
    onError: (error) => {
      message.error(error.response?.data?.msg || 'Failed to update class');
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: classesAPI.deleteClass,
    onSuccess: () => {
      message.success('Class deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (error) => {
      message.error(error.response?.data?.msg || 'Failed to delete class');
    },
  });

  const handleAddClass = () => {
    setEditingClass(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    form.setFieldsValue({
      ...classItem,
      programId: classItem.programId?._id,
      subjectId: classItem.subjectId?._id,
      teacherId: classItem.teacherId?._id,
      startTime: classItem.startTime ? dayjs(classItem.startTime, 'HH:mm') : null,
      endTime: classItem.endTime ? dayjs(classItem.endTime, 'HH:mm') : null,
    });
    setIsModalVisible(true);
  };

  const handleDeleteClass = (id) => {
    deleteClassMutation.mutate(id);
  };

  const onModalCancel = () => {
    setIsModalVisible(false);
    setEditingClass(null);
    form.resetFields();
  };

  const handleSubmit = (values) => {
    const formattedValues = {
      ...values,
      startTime: values.startTime?.format('HH:mm'),
      endTime: values.endTime?.format('HH:mm'),
    };

    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass._id, data: formattedValues });
    } else {
      createClassMutation.mutate(formattedValues);
    }
  };

  const getTypeColor = (type) => {
    const colors = { lecture: 'blue', practical: 'success', tutorial: 'warning' };
    return colors[type?.toLowerCase()] || 'default';
  };

  const getDayColor = (day) => {
    const colors = {
      sunday: 'magenta', monday: 'volcano', tuesday: 'orange', wednesday: 'gold',
      thursday: 'lime', friday: 'green', saturday: 'cyan',
    };
    return colors[day?.toLowerCase()] || 'default';
  };

  const columns = [
    {
      title: 'Subject',
      dataIndex: ['subjectId', 'name'],
      key: 'subject',
      render: (name, record) => name || record.subjectId?.subjectName || <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Teacher',
      dataIndex: ['teacherId', 'name'],
      key: 'teacher',
      render: (name, record) => name || record.teacherId?.teacherName || <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Program',
      dataIndex: ['programId', 'name'],
      key: 'program',
      render: (name, record) => name || record.programId?.programName || <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      filters: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(d => ({ text: d.charAt(0).toUpperCase() + d.slice(1), value: d })),
      onFilter: (value, record) => record.day === value,
      render: (day) => day ? <Tag color={getDayColor(day)}>{day.charAt(0).toUpperCase() + day.slice(1)}</Tag> : <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => (record.startTime && record.endTime) ? `${record.startTime} - ${record.endTime}` : <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Room',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      render: (room) => room ? <Tag color="processing">Room {room}</Tag> : <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [{text: 'Lecture', value: 'lecture'}, {text: 'Practical', value: 'practical'}, {text: 'Tutorial', value: 'tutorial'}],
      onFilter: (value, record) => record.type === value,
      render: (type) => type ? <Tag color={getTypeColor(type)}>{type.charAt(0).toUpperCase() + type.slice(1)}</Tag> : <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      render: (semester) => semester ? <Tag color="geekblue">Sem {semester}</Tag> : <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="primary" ghost icon={<EditOutlined />} size="small" onClick={() => handleEditClass(record)}>Edit</Button>
          <Popconfirm
            title="Delete this class?"
            description="Are you sure you want to delete this class schedule?"
            onConfirm={() => handleDeleteClass(record._id)}
            okText="Yes, Delete"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger ghost icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Row justify="space-between" align="center" style={{ marginBottom: '24px' }}>
          <Col>
            <Space align="center" size="middle">
              <ScheduleOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>Classes Management</Title>
                <Text type="secondary" style={{ fontSize: '15px' }}>Schedule, view, and manage all classes.</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddClass} style={{ borderRadius: '6px' }}>
              Schedule New Class
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={classes}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} classes` }}
          scroll={{ x: true }}
          style={{ borderRadius: '8px', overflow: 'hidden' }}
          locale={{ emptyText: <Empty description="No classes scheduled yet." /> }}
        />
      </Card>

      <Modal
        title={
            <Title level={4} style={{margin:0}}>
                {editingClass ? 'Edit Class Schedule' : 'Schedule New Class'}
            </Title>
        }
        open={isModalVisible}
        onCancel={onModalCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Alert
          message="Collision Detection Notice"
          description="The system will attempt to detect and prevent scheduling conflicts. Please review carefully."
          type="info"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px', borderRadius: '6px' }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item name="programId" label="Program" rules={[{ required: true }]}>
                <Select placeholder="Select program" loading={!programs.length}>
                  {programs.map(p => <Option key={p._id} value={p._id}>{p.name} ({p.code})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="subjectId" label="Subject" rules={[{ required: true }]}>
                <Select placeholder="Select subject" loading={!subjects.length}>
                  {subjects.map(s => <Option key={s._id} value={s._id}>{s.name} ({s.code})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="teacherId" label="Teacher" rules={[{ required: true }]}>
                <Select placeholder="Select teacher" loading={!teachers.length}>
                  {teachers.map(t => <Option key={t._id} value={t._id}>{t.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="day" label="Day of Week" rules={[{ required: true }]}>
                <Select placeholder="Select day">
                  {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(d => 
                    <Option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Select start time" minuteStep={15} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Select end time" minuteStep={15} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="roomNumber" label="Room Number" rules={[{ required: true }]}>
                <Input placeholder="e.g., A101" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="type" label="Class Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="lecture">Lecture</Option>
                  <Option value="practical">Practical</Option>
                  <Option value="tutorial">Tutorial</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="semester" label="Semester" rules={[{ required: true }]}>
                <InputNumber placeholder="e.g., 1" min={1} max={12} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: '24px', marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={onModalCancel} style={{borderRadius: '6px'}}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={createClassMutation.isPending || updateClassMutation.isPending} style={{borderRadius: '6px'}}>
                {editingClass ? 'Update Schedule' : 'Schedule Class'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default Classes;