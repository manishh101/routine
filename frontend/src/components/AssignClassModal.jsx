import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Row,
  Col,
  Tag,
  Card,
  Spin,
  message
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { 
  programSemestersAPI, 
  teachersAPI, 
  roomsAPI, 
  routinesAPI 
} from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AssignClassModal = ({
  visible,
  onCancel,
  onSave,
  programCode,
  semester,
  section,
  dayIndex,
  slotIndex,
  timeSlots,
  existingClass,
  loading
}) => {
  const [form] = Form.useForm();
  const [conflicts, setConflicts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const selectedTimeSlot = timeSlots.find(slot => slot._id === slotIndex);

  // Fetch subjects for this program-semester
  const { 
    data: subjectsData, 
    isLoading: subjectsLoading 
  } = useQuery({
    queryKey: ['programSemesterSubjects', programCode, semester],
    queryFn: () => programSemestersAPI.getSubjectsForSemester(programCode, semester),
    enabled: !!(programCode && semester && visible),
  });

  // Fetch all teachers
  const { 
    data: teachersData, 
    isLoading: teachersLoading 
  } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => teachersAPI.getTeachers(),
    enabled: visible,
  });

  // Fetch all rooms
  const { 
    data: roomsData, 
    isLoading: roomsLoading 
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsAPI.getRooms(),
    enabled: visible,
  });

  const subjects = subjectsData?.data || [];
  const teachers = teachersData?.data || [];
  const rooms = roomsData?.data?.data || [];

  // Set form values when editing existing class
  useEffect(() => {
    if (existingClass && visible) {
      form.setFieldsValue({
        subjectId: existingClass.subjectId,
        teacherIds: existingClass.teacherIds || [],
        roomId: existingClass.roomId,
        classType: existingClass.classType,
        notes: existingClass.notes || ''
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [existingClass, visible, form]);

  // Check for conflicts when form values change
  const checkConflicts = async (values) => {
    if (!values.teacherIds?.length && !values.roomId) return;

    setChecking(true);
    try {
      const conflictChecks = [];

      // Check teacher availability
      if (values.teacherIds?.length > 0) {
        for (const teacherId of values.teacherIds) {
          conflictChecks.push(
            routinesAPI.checkTeacherAvailability(teacherId, dayIndex, slotIndex)
              .then(response => ({
                type: 'teacher',
                id: teacherId,
                name: teachers.find(t => t._id === teacherId)?.fullName || 'Unknown Teacher',
                available: response.data.available,
                conflictDetails: response.data.conflictDetails
              }))
              .catch(() => ({
                type: 'teacher',
                id: teacherId,
                name: teachers.find(t => t._id === teacherId)?.fullName || 'Unknown Teacher',
                available: true
              }))
          );
        }
      }

      // Check room availability
      if (values.roomId) {
        conflictChecks.push(
          routinesAPI.checkRoomAvailability(values.roomId, dayIndex, slotIndex)
            .then(response => ({
              type: 'room',
              id: values.roomId,
              name: rooms.find(r => r._id === values.roomId)?.name || 'Unknown Room',
              available: response.data.available,
              conflictDetails: response.data.conflictDetails
            }))
            .catch(() => ({
              type: 'room',
              id: values.roomId,
              name: rooms.find(r => r._id === values.roomId)?.name || 'Unknown Room',
              available: true
            }))
        );
      }

      const results = await Promise.all(conflictChecks);
      const newConflicts = results.filter(result => !result.available);
      setConflicts(newConflicts);

      // Update available teachers and rooms for smart filtering
      const unavailableTeacherIds = results
        .filter(r => r.type === 'teacher' && !r.available)
        .map(r => r.id);
      
      setAvailableTeachers(teachers.map(teacher => ({
        ...teacher,
        isAvailable: !unavailableTeacherIds.includes(teacher._id)
      })));

      const unavailableRoomIds = results
        .filter(r => r.type === 'room' && !r.available)
        .map(r => r.id);
      
      setAvailableRooms(rooms.map(room => ({
        ...room,
        isAvailable: !unavailableRoomIds.includes(room._id)
      })));

    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
    setChecking(false);
  };

  const handleFormChange = (changedValues, allValues) => {
    // Debounce conflict checking
    const timeoutId = setTimeout(() => checkConflicts(allValues), 500);
    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (conflicts.length > 0) {
        Modal.confirm({
          title: 'Conflicts Detected',
          content: 'There are scheduling conflicts. Do you want to proceed anyway?',
          okText: 'Proceed',
          cancelText: 'Cancel',
          onOk: () => onSave(values)
        });
      } else {
        onSave(values);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const renderConflictAlert = () => {
    if (conflicts.length === 0) return null;

    return (
      <Alert
        message="Scheduling Conflicts Detected"
        description={
          <div>
            {conflicts.map((conflict, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                <Tag color="red">{conflict.type}</Tag>
                <strong>{conflict.name}</strong> is already assigned to:
                {conflict.conflictDetails && (
                  <div style={{ marginLeft: '8px', fontSize: '12px' }}>
                    {conflict.conflictDetails.programCode} - Sem {conflict.conflictDetails.semester} - Sec {conflict.conflictDetails.section}
                    {conflict.conflictDetails.subjectName && ` (${conflict.conflictDetails.subjectName})`}
                  </div>
                )}
              </div>
            ))}
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>
            {existingClass ? 'Edit' : 'Assign'} Class - {dayNames[dayIndex]} {selectedTimeSlot?.label}
          </span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          loading={loading || checking}
          onClick={handleSubmit}
          icon={conflicts.length > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
        >
          {conflicts.length > 0 ? 'Save with Conflicts' : 'Save'}
        </Button>
      ]}
      width={800}
      destroyOnClose
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Time Slot Info */}
        <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Program:</Text> {programCode}
            </Col>
            <Col span={8}>
              <Text strong>Semester:</Text> {semester}
            </Col>
            <Col span={8}>
              <Text strong>Section:</Text> {section}
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '8px' }}>
            <Col span={12}>
              <Text strong>Day:</Text> {dayNames[dayIndex]}
            </Col>
            <Col span={12}>
              <Text strong>Time:</Text> {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
            </Col>
          </Row>
        </Card>

        {/* Conflict Alert */}
        {renderConflictAlert()}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subjectId"
                label={<Space><BookOutlined />Subject</Space>}
                rules={[{ required: true, message: 'Please select a subject' }]}
              >
                <Select
                  placeholder="Select subject"
                  loading={subjectsLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {subjects.map(subject => (
                    <Option key={subject.subjectId} value={subject.subjectId}>
                      {subject.subjectName_display || subject.subjectCode_display}
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {subject.courseType} - {subject.defaultHoursTheory}h Theory, {subject.defaultHoursPractical}h Practical
                      </Text>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="classType"
                label="Class Type"
                rules={[{ required: true, message: 'Please select class type' }]}
              >
                <Select placeholder="Select class type">
                  <Option value="L">
                    <Tag color="blue">Lecture</Tag>
                  </Option>
                  <Option value="P">
                    <Tag color="green">Practical</Tag>
                  </Option>
                  <Option value="T">
                    <Tag color="orange">Tutorial</Tag>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="teacherIds"
                label={<Space><UserOutlined />Teacher(s)</Space>}
                rules={[{ required: true, message: 'Please select at least one teacher' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select teacher(s)"
                  loading={teachersLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {(availableTeachers.length > 0 ? availableTeachers : teachers).map(teacher => (
                    <Option 
                      key={teacher._id} 
                      value={teacher._id}
                      disabled={availableTeachers.length > 0 && !teacher.isAvailable}
                    >
                      <Space>
                        {teacher.fullName} ({teacher.shortName})
                        {availableTeachers.length > 0 && !teacher.isAvailable && (
                          <Tag color="red" size="small">Busy</Tag>
                        )}
                        {availableTeachers.length > 0 && teacher.isAvailable && (
                          <Tag color="green" size="small">Available</Tag>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomId"
                label={<Space><HomeOutlined />Room</Space>}
                rules={[{ required: true, message: 'Please select a room' }]}
              >
                <Select
                  placeholder="Select room"
                  loading={roomsLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {(availableRooms.length > 0 ? availableRooms : rooms).map(room => (
                    <Option 
                      key={room._id} 
                      value={room._id}
                      disabled={availableRooms.length > 0 && !room.isAvailable}
                    >
                      <Space>
                        {room.name}
                        {availableRooms.length > 0 && !room.isAvailable && (
                          <Tag color="red" size="small">Busy</Tag>
                        )}
                        {availableRooms.length > 0 && room.isAvailable && (
                          <Tag color="green" size="small">Available</Tag>
                        )}
                      </Space>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {room.type} - Capacity: {room.capacity}
                      </Text>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <TextArea
              placeholder="Additional notes for this class..."
              rows={3}
            />
          </Form.Item>
        </Form>

        {checking && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Spin tip="Checking for conflicts..." />
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default AssignClassModal;
