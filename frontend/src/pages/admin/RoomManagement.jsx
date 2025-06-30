import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RoomManagement = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchText, setSearchText] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch rooms
  const { 
    data: roomsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsAPI.getRooms()
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (roomData) => roomsAPI.createRoom(roomData),
    onSuccess: () => {
      message.success('Room created successfully');
      queryClient.invalidateQueries(['rooms']);
      setModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create room');
    }
  });

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomsAPI.updateRoom(id, data),
    onSuccess: () => {
      message.success('Room updated successfully');
      queryClient.invalidateQueries(['rooms']);
      setModalVisible(false);
      setEditingRoom(null);
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to update room');
    }
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => roomsAPI.deleteRoom(id),
    onSuccess: () => {
      message.success('Room deleted successfully');
      queryClient.invalidateQueries(['rooms']);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete room');
    }
  });

  const rooms = roomsData?.data?.data || [];

  const handleAdd = () => {
    setEditingRoom(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setModalVisible(true);
    form.setFieldsValue(room);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRoom) {
        updateMutation.mutate({ id: editingRoom._id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setEditingRoom(null);
    form.resetFields();
  };

  // Filter rooms based on search
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchText.toLowerCase()) ||
    room.code.toLowerCase().includes(searchText.toLowerCase()) ||
    room.building?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Room Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    {
      title: 'Room Name',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Type',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 130,
      render: (type) => {
        const color = {
          'Classroom': 'green',
          'Laboratory': 'orange',
          'Seminar Hall': 'purple',
          'Auditorium': 'red',
          'Conference Room': 'blue'
        }[type] || 'default';
        return <Tag color={color}>{type}</Tag>;
      }
    },
    {
      title: 'Building',
      dataIndex: 'building',
      key: 'building',
      width: 120
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
      align: 'center'
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      align: 'center'
    },
    {
      title: 'Facilities',
      dataIndex: 'facilities',
      key: 'facilities',
      width: 200,
      render: (facilities) => {
        if (!facilities || facilities.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {facilities.slice(0, 3).map((facility, index) => (
              <Tag key={index} size="small">{facility}</Tag>
            ))}
            {facilities.length > 3 && (
              <Tooltip title={facilities.slice(3).join(', ')}>
                <Tag size="small">+{facilities.length - 3} more</Tag>
              </Tooltip>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Room">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Room">
            <Popconfirm
              title="Delete Room"
              description="Are you sure you want to delete this room?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" className="admin-page-header mobile-stack">
        <Col xs={24} lg={16}>
          <Space align="center" className="mobile-stack-vertical">
            <HomeOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
            <div className="mobile-center">
              <Title level={2} style={{ margin: 0 }}>
                Room Management
              </Title>
              <Text type="secondary">
                Manage classrooms, laboratories, and other facilities
              </Text>
            </div>
          </Space>
        </Col>
        <Col xs={24} lg={8}>
          <div className="admin-actions" style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add Room
            </Button>
          </div>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card>
        <Row gutter={16} className="admin-filters">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search rooms..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* Rooms Table */}
      <Card title={`Rooms (${filteredRooms.length})`}>
        <Table
          columns={columns}
          dataSource={filteredRooms}
          rowKey="_id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} rooms`
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <Space>
            <HomeOutlined />
            <span>{editingRoom ? 'Edit Room' : 'Add New Room'}</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            roomType: 'Classroom',
            floor: 0,
            capacity: 30
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Room Code"
                rules={[
                  { required: true, message: 'Please enter room code' },
                  { max: 10, message: 'Room code must be 10 characters or less' }
                ]}
              >
                <Input placeholder="e.g., R101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Room Name"
                rules={[
                  { required: true, message: 'Please enter room name' },
                  { max: 100, message: 'Room name must be 100 characters or less' }
                ]}
              >
                <Input placeholder="e.g., Computer Lab 1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="roomType"
                label="Room Type"
                rules={[{ required: true, message: 'Please select room type' }]}
              >
                <Select placeholder="Select room type">
                  <Option value="Classroom">Classroom</Option>
                  <Option value="Laboratory">Laboratory</Option>
                  <Option value="Seminar Hall">Seminar Hall</Option>
                  <Option value="Auditorium">Auditorium</Option>
                  <Option value="Conference Room">Conference Room</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="capacity"
                label="Capacity"
                rules={[
                  { required: true, message: 'Please enter capacity' },
                  { type: 'number', min: 1, max: 1000, message: 'Capacity must be between 1-1000' }
                ]}
              >
                <InputNumber 
                  placeholder="30" 
                  style={{ width: '100%' }}
                  min={1}
                  max={1000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="building"
                label="Building"
                rules={[{ max: 50, message: 'Building name must be 50 characters or less' }]}
              >
                <Input placeholder="e.g., Engineering Block" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="floor"
                label="Floor"
                rules={[
                  { type: 'number', min: 0, max: 20, message: 'Floor must be between 0-20' }
                ]}
              >
                <InputNumber 
                  placeholder="1" 
                  style={{ width: '100%' }}
                  min={0}
                  max={20}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="facilities"
            label="Facilities"
          >
            <Select
              mode="tags"
              placeholder="Add facilities (type and press Enter)"
              style={{ width: '100%' }}
            >
              <Option value="Projector">Projector</Option>
              <Option value="Whiteboard">Whiteboard</Option>
              <Option value="Audio System">Audio System</Option>
              <Option value="Air Conditioning">Air Conditioning</Option>
              <Option value="Computers">Computers</Option>
              <Option value="Internet">Internet</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              rows={3}
              placeholder="Additional notes about the room..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default RoomManagement;
