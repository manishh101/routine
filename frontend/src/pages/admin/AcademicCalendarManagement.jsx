import React, { useState, useCallback } from 'react';
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
  Spin,
  Alert,
  Statistic,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Timeline
} from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { academicCalendarsAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AcademicCalendarManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch academic calendars
  const fetchCalendars = useCallback(async () => {
    const response = await academicCalendarsAPI.getCalendars();
    return response.data;
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['academic-calendars'],
    queryFn: fetchCalendars,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const calendars = data?.data || [];

  // Create calendar mutation
  const createMutation = useMutation({
    mutationFn: (calendarData) => academicCalendarsAPI.createCalendar(calendarData),
    onSuccess: () => {
      message.success('Academic calendar created successfully');
      queryClient.invalidateQueries(['academic-calendars']);
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(`Failed to create calendar: ${error.response?.data?.message || error.message}`);
    }
  });

  // Update calendar mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academicCalendarsAPI.updateCalendar(id, data),
    onSuccess: () => {
      message.success('Academic calendar updated successfully');
      queryClient.invalidateQueries(['academic-calendars']);
      setIsModalVisible(false);
      setEditingCalendar(null);
      form.resetFields();
    },
    onError: (error) => {
      message.error(`Failed to update calendar: ${error.response?.data?.message || error.message}`);
    }
  });

  // Delete calendar mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => academicCalendarsAPI.deleteCalendar(id),
    onSuccess: () => {
      message.success('Academic calendar deleted successfully');
      queryClient.invalidateQueries(['academic-calendars']);
    },
    onError: (error) => {
      message.error(`Failed to delete calendar: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleCreate = () => {
    setEditingCalendar(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (calendar) => {
    setEditingCalendar(calendar);
    form.setFieldsValue({
      academicYear: calendar.academicYear,
      startDate: calendar.startDate ? dayjs(calendar.startDate) : null,
      endDate: calendar.endDate ? dayjs(calendar.endDate) : null,
      semester1Start: calendar.semester1Start ? dayjs(calendar.semester1Start) : null,
      semester1End: calendar.semester1End ? dayjs(calendar.semester1End) : null,
      semester2Start: calendar.semester2Start ? dayjs(calendar.semester2Start) : null,
      semester2End: calendar.semester2End ? dayjs(calendar.semester2End) : null,
      status: calendar.status,
      description: calendar.description
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format dates
      const formattedValues = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        semester1Start: values.semester1Start ? values.semester1Start.toISOString() : null,
        semester1End: values.semester1End ? values.semester1End.toISOString() : null,
        semester2Start: values.semester2Start ? values.semester2Start.toISOString() : null,
        semester2End: values.semester2End ? values.semester2End.toISOString() : null,
      };
      
      if (editingCalendar) {
        updateMutation.mutate({ 
          id: editingCalendar._id, 
          data: formattedValues 
        });
      } else {
        createMutation.mutate(formattedValues);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: 'Academic Year',
      dataIndex: 'academicYear',
      key: 'academicYear',
      sorter: (a, b) => (a.academicYear || '').localeCompare(b.academicYear || ''),
      render: (text) => (
        <Text strong style={{ fontSize: '14px' }}>{text || 'N/A'}</Text>
      )
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px' }}>
              {record.startDate ? dayjs(record.startDate).format('MMM DD, YYYY') : 'N/A'} - 
              {record.endDate ? dayjs(record.endDate).format('MMM DD, YYYY') : 'N/A'}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.startDate && record.endDate ? 
              `${dayjs(record.endDate).diff(dayjs(record.startDate), 'days')} days` : 
              'Duration not set'}
          </Text>
        </div>
      )
    },
    {
      title: 'Semester 1',
      key: 'semester1',
      render: (_, record) => (
        <div>
          {record.semester1Start && record.semester1End ? (
            <>
              <Text style={{ fontSize: '12px' }}>
                {dayjs(record.semester1Start).format('MMM DD')} - {dayjs(record.semester1End).format('MMM DD')}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {dayjs(record.semester1End).diff(dayjs(record.semester1Start), 'days')} days
              </Text>
            </>
          ) : (
            <Text type="secondary">Not set</Text>
          )}
        </div>
      )
    },
    {
      title: 'Semester 2',
      key: 'semester2',
      render: (_, record) => (
        <div>
          {record.semester2Start && record.semester2End ? (
            <>
              <Text style={{ fontSize: '12px' }}>
                {dayjs(record.semester2Start).format('MMM DD')} - {dayjs(record.semester2End).format('MMM DD')}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {dayjs(record.semester2End).diff(dayjs(record.semester2Start), 'days')} days
              </Text>
            </>
          ) : (
            <Text type="secondary">Not set</Text>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      filters: [
        { text: 'Draft', value: 'DRAFT' },
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Completed', value: 'COMPLETED' },
        { text: 'Archived', value: 'ARCHIVED' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const colors = {
          DRAFT: 'default',
          ACTIVE: 'success',
          COMPLETED: 'processing',
          ARCHIVED: 'warning'
        };
        return (
          <Tag color={colors[status] || 'default'}>
            {status || 'DRAFT'}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: '4px 8px' }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Calendar"
            description="Are you sure you want to delete this academic calendar?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              style={{ padding: '4px 8px' }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (isError) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Academic Calendars"
          description={`Failed to load calendars: ${error?.message || 'Unknown error'}`}
          type="error"
          action={
            <Button size="small" onClick={refetch}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const activeCalendar = calendars.find(c => c.status === 'ACTIVE');
  const currentDate = dayjs();

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[16, 16]}>
        {/* Header */}
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                  Academic Calendar Management
                </Title>
                <Text type="secondary">Manage academic years, semesters, and important dates</Text>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={refetch}
                    loading={isLoading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                  >
                    Add Calendar
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Statistics */}
        <Col span={24}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Calendars"
                  value={calendars.length}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Active Calendar"
                  value={activeCalendar ? 1 : 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Current Academic Year"
                  value={activeCalendar?.academicYear || 'None'}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Days Remaining"
                  value={activeCalendar?.endDate ? 
                    Math.max(0, dayjs(activeCalendar.endDate).diff(currentDate, 'days')) : 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Current Active Calendar Timeline */}
        {activeCalendar && (
          <Col span={24}>
            <Card title="Current Academic Calendar Timeline">
              <Timeline>
                <Timeline.Item color="green">
                  <Text strong>Academic Year Start</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(activeCalendar.startDate).format('MMMM DD, YYYY')}
                  </Text>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <Text strong>Semester 1</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(activeCalendar.semester1Start).format('MMM DD')} - {dayjs(activeCalendar.semester1End).format('MMM DD, YYYY')}
                  </Text>
                </Timeline.Item>
                <Timeline.Item color="purple">
                  <Text strong>Semester 2</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(activeCalendar.semester2Start).format('MMM DD')} - {dayjs(activeCalendar.semester2End).format('MMM DD, YYYY')}
                  </Text>
                </Timeline.Item>
                <Timeline.Item color="red">
                  <Text strong>Academic Year End</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(activeCalendar.endDate).format('MMMM DD, YYYY')}
                  </Text>
                </Timeline.Item>
              </Timeline>
            </Card>
          </Col>
        )}

        {/* Calendars Table */}
        <Col span={24}>
          <Card title="Academic Calendars" extra={
            <Text type="secondary">{calendars.length} calendars</Text>
          }>
            <Spin spinning={isLoading}>
              {calendars.length === 0 && !isLoading ? (
                <Empty 
                  description="No academic calendars found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    Create First Calendar
                  </Button>
                </Empty>
              ) : (
                <Table
                  columns={columns}
                  dataSource={calendars}
                  rowKey="_id"
                  pagination={{
                    total: calendars.length,
                    pageSize: 10,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} of ${total} calendars`,
                    showSizeChanger: true,
                    showQuickJumper: true,
                  }}
                  scroll={{ x: 1000 }}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCalendar ? 'Edit Academic Calendar' : 'Create New Academic Calendar'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCalendar(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="academicYear"
                label="Academic Year"
                rules={[
                  { required: true, message: 'Please enter academic year' }
                ]}
              >
                <Input placeholder="e.g., 2024-2025" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[
                  { required: true, message: 'Please select status' }
                ]}
              >
                <Select placeholder="Select status">
                  <Option value="DRAFT">Draft</Option>
                  <Option value="ACTIVE">Active</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="ARCHIVED">Archived</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Academic Year Start Date"
                rules={[
                  { required: true, message: 'Please select start date' }
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Academic Year End Date"
                rules={[
                  { required: true, message: 'Please select end date' }
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="semester1Start"
                label="Semester 1 Start Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="semester1End"
                label="Semester 1 End Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="semester2Start"
                label="Semester 2 Start Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="semester2End"
                label="Semester 2 End Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Additional notes about this academic calendar"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AcademicCalendarManagement;
