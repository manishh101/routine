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
  routinesAPI,
  subjectsAPI
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
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [currentClassType, setCurrentClassType] = useState(null);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const selectedTimeSlot = timeSlots.find(slot => slot._id === slotIndex);

  // Fetch subjects for this program-semester
  const { 
    data: subjectsData, 
    isLoading: subjectsLoading,
    error: subjectsError 
  } = useQuery({
    queryKey: ['programSemesterSubjects', programCode, semester],
    queryFn: () => {
      console.log('AssignClassModal - Fetching subjects for:', { programCode, semester });
      return subjectsAPI.getSubjectsByProgramAndSemester(programCode, semester);
    },
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
  
  // Debug subjects data
  console.log('AssignClassModal - Subjects Debug:', {
    programCode,
    semester,
    visible,
    subjectsData: subjectsData,
    subjects: subjects,
    subjectsLoading: subjectsLoading,
    subjectsError: subjectsError,
    subjectsLength: subjects.length
  });
  
  // Debug teachers data
  console.log('AssignClassModal - Teachers Debug:', {
    teachersData: teachersData,
    teachers: teachers,
    teachersLoading: teachersLoading,
    teachersLength: teachers.length,
    visible: visible
  });

  // Filter teachers based on availability and class type
  const filterTeachersBasedOnClassType = async (classType) => {
    setCurrentClassType(classType);
    
    // For lab/practical classes, show all teachers
    if (classType === 'P') {
      console.log('Lab/Practical class - showing all teachers');
      setFilteredTeachers(teachers.map(teacher => ({
        ...teacher,
        isAvailable: true,
        reason: 'Lab allows multiple teachers'
      })));
      return;
    }

    // For lecture/tutorial, check availability for current time slot
    if (classType === 'L' || classType === 'T') {
      console.log('Lecture/Tutorial class - checking teacher availability for time slot');
      setChecking(true);
      
      try {
        const availabilityChecks = teachers.map(async (teacher) => {
          try {
            const response = await routinesAPI.checkTeacherAvailability(teacher._id, dayIndex, slotIndex);
            return {
              ...teacher,
              isAvailable: response.data.available,
              conflictDetails: response.data.conflictDetails,
              reason: response.data.available ? 'Available' : 'Busy in this slot'
            };
          } catch (error) {
            console.warn(`Error checking availability for teacher ${teacher.fullName}:`, error);
            return {
              ...teacher,
              isAvailable: true,
              reason: 'Could not verify (assumed available)'
            };
          }
        });

        const teacherAvailability = await Promise.all(availabilityChecks);
        setFilteredTeachers(teacherAvailability);
        
        const availableCount = teacherAvailability.filter(t => t.isAvailable).length;
        console.log(`Teacher availability check complete: ${availableCount}/${teachers.length} available`);
        
      } catch (error) {
        console.error('Error checking teacher availability:', error);
        // Fallback to showing all teachers if availability check fails
        setFilteredTeachers(teachers.map(teacher => ({
          ...teacher,
          isAvailable: true,
          reason: 'Availability check failed'
        })));
      }
      
      setChecking(false);
    }
  };

  // Update filtered teachers when teachers data changes or modal opens
  useEffect(() => {
    if (visible && teachers.length > 0) {
      if (currentClassType) {
        filterTeachersBasedOnClassType(currentClassType);
      } else {
        // Initially show all teachers until class type is selected
        setFilteredTeachers(teachers.map(teacher => ({
          ...teacher,
          isAvailable: true,
          reason: 'Select class type to check availability'
        })));
      }
    }
  }, [teachers, visible, dayIndex, slotIndex]);

  // Set form values when editing existing class
  useEffect(() => {
    if (existingClass && visible) {
      console.log('Modal opened with existing class:', existingClass);
      form.setFieldsValue({
        subjectId: existingClass.subjectId,
        teacherIds: existingClass.teacherIds || [],
        roomId: existingClass.roomId,
        classType: existingClass.classType,
        notes: existingClass.notes || ''
      });
      // Set the class type to trigger teacher filtering
      setCurrentClassType(existingClass.classType);
      if (existingClass.classType) {
        filterTeachersBasedOnClassType(existingClass.classType);
      }
    } else if (visible) {
      console.log('Modal opened for new class');
      form.resetFields();
      setCurrentClassType(null);
      setFilteredTeachers(teachers.map(teacher => ({
        ...teacher,
        isAvailable: true,
        reason: 'Select class type to check availability'
      })));
    }
  }, [existingClass, visible, form, teachers]);

  // Check for room conflicts
  const checkRoomConflicts = async (values) => {
    if (!values.roomId) {
      setConflicts([]);
      return;
    }

    setChecking(true);
    try {
      const response = await routinesAPI.checkRoomAvailability(values.roomId, dayIndex, slotIndex);
      
      if (!response.data.available) {
        const roomName = rooms.find(r => r._id === values.roomId)?.name || 'Unknown Room';
        setConflicts([{
          type: 'room',
          id: values.roomId,
          name: roomName,
          available: false,
          conflictDetails: response.data.conflictDetails
        }]);
      } else {
        setConflicts([]);
      }
    } catch (error) {
      console.error('Error checking room availability:', error);
      setConflicts([]);
    }
    setChecking(false);
  };

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
    // If class type changed, update teacher filtering
    if (changedValues.classType !== undefined) {
      console.log('Class type changed to:', changedValues.classType);
      filterTeachersBasedOnClassType(changedValues.classType);
      
      // Clear teacher selection when switching class types to avoid confusion
      if (changedValues.classType !== currentClassType) {
        form.setFieldsValue({ teacherIds: [] });
      }
    }
    
    // Debounce conflict checking for room availability
    const timeoutId = setTimeout(() => {
      if (allValues.roomId) {
        checkRoomConflicts(allValues);
      }
    }, 500);
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
                label={
                  <Space>
                    <UserOutlined />
                    Teacher(s)
                    {currentClassType === 'P' && (
                      <Tag color="green" size="small">Multiple allowed for labs</Tag>
                    )}
                    {(currentClassType === 'L' || currentClassType === 'T') && (
                      <Tag color="blue" size="small">Availability checked</Tag>
                    )}
                  </Space>
                }
                rules={[{ required: true, message: 'Please select at least one teacher' }]}
                help={
                  currentClassType === 'P' 
                    ? "For practical/lab classes, you can assign multiple teachers"
                    : currentClassType 
                      ? "Only available teachers are shown for lecture/tutorial classes"
                      : "Select class type first to see teacher availability"
                }
              >
                <Select
                  mode="multiple"
                  placeholder={
                    currentClassType === 'P' 
                      ? "Select teacher(s) - Multiple allowed for labs"
                      : currentClassType
                        ? "Select available teacher(s)"
                        : "Select class type first"
                  }
                  loading={teachersLoading || checking}
                  showSearch
                  disabled={!currentClassType}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  maxTagCount="responsive"
                >
                  {filteredTeachers.map(teacher => {
                    const isDisabled = currentClassType !== 'P' && !teacher.isAvailable;
                    
                    return (
                      <Option 
                        key={teacher._id} 
                        value={teacher._id}
                        disabled={isDisabled}
                        style={{
                          opacity: isDisabled ? 0.5 : 1
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            <strong>{teacher.fullName}</strong> ({teacher.shortName})
                            {teacher.department && (
                              <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                                {teacher.department}
                              </Text>
                            )}
                          </span>
                          <div>
                            {currentClassType === 'P' ? (
                              <Tag color="green" size="small">Available</Tag>
                            ) : teacher.isAvailable ? (
                              <Tag color="green" size="small">Free</Tag>
                            ) : (
                              <Tag color="red" size="small">Busy</Tag>
                            )}
                          </div>
                        </div>
                        {!teacher.isAvailable && currentClassType !== 'P' && (
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                            {teacher.reason}
                          </div>
                        )}
                      </Option>
                    );
                  })}
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
