import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Typography,
  Alert,
  Tag,
  Spin,
  Row,
  Col,
  message
} from 'antd';
import {
  HomeOutlined,
  BookOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { roomVacancyAPI, roomsAPI, timeSlotsAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const RoomScheduleManager = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomScheduleData, setRoomScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all rooms
  const { 
    data: roomsData, 
    isLoading: roomsLoading 
  } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomsAPI.getRooms(),
  });

  // Fetch time slots
  const { 
    data: timeSlotsData, 
    isLoading: timeSlotsLoading 
  } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: () => timeSlotsAPI.getTimeSlots(),
  });

  const rooms = roomsData?.data?.data || [];
  const timeSlots = timeSlotsData?.data || [];

  const handleRoomSelect = async (roomId) => {
    setSelectedRoomId(roomId);
    setLoading(true);
    
    try {
      const response = await roomVacancyAPI.getRoomSchedule(roomId);
      setRoomScheduleData(response.data);
    } catch (error) {
      console.error('Error fetching room schedule:', error);
      message.error('Failed to fetch room schedule');
      setRoomScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const renderRoomScheduleGrid = () => {
    if (!roomScheduleData || !timeSlots.length) return null;

    const { routine } = roomScheduleData;
    
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  border: '1px solid #d9d9d9',
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  fontWeight: 'bold',
                  minWidth: '100px'
                }}>
                  Time
                </th>
                {dayNames.slice(0, 6).map((day, dayIndex) => (
                  <th key={dayIndex} style={{
                    border: '1px solid #d9d9d9',
                    padding: '8px',
                    backgroundColor: '#fafafa',
                    fontWeight: 'bold',
                    minWidth: '150px'
                  }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot._id}>
                  <td style={{
                    border: '1px solid #d9d9d9',
                    padding: '8px',
                    backgroundColor: timeSlot.isBreak ? '#f8f8f8' : '#fafafa',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {timeSlot.isBreak ? 'BREAK' : `${timeSlot.startTime} - ${timeSlot.endTime}`}
                  </td>
                  {dayNames.slice(0, 6).map((day, dayIndex) => {
                    const classData = routine?.[dayIndex]?.[timeSlot._id];
                    
                    if (timeSlot.isBreak) {
                      return (
                        <td key={dayIndex} style={{
                          border: '1px solid #d9d9d9',
                          padding: '8px',
                          backgroundColor: '#f8f8f8',
                          textAlign: 'center',
                          fontStyle: 'italic',
                          color: '#666'
                        }}>
                          BREAK
                        </td>
                      );
                    }

                    return (
                      <td key={dayIndex} style={{
                        border: '1px solid #d9d9d9',
                        padding: '8px',
                        backgroundColor: classData ? '#e6f7ff' : '#fff',
                        minHeight: '60px'
                      }}>
                        {classData ? (
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: '#1890ff',
                              marginBottom: '4px'
                            }}>
                              <BookOutlined style={{ marginRight: 4 }} />
                              {classData.subjectName}
                            </div>
                            <div style={{ color: '#666', marginBottom: '2px' }}>
                              {classData.programCode}-{classData.semester}-{classData.section}
                            </div>
                            {classData.teacherNames && (
                              <div style={{ color: '#fa8c16', fontSize: '11px' }}>
                                <UserOutlined style={{ marginRight: 2 }} />
                                {classData.teacherNames}
                              </div>
                            )}
                            {classData.classType && (
                              <Tag size="small" color="blue" style={{ marginTop: 2 }}>
                                {classData.classType}
                              </Tag>
                            )}
                          </div>
                        ) : (
                          <div style={{ 
                            color: '#ccc', 
                            fontStyle: 'italic',
                            textAlign: 'center'
                          }}>
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const selectedRoom = rooms.find(room => room._id === selectedRoomId);

  return (
    <Card>
      <Title level={4}>
        <HomeOutlined style={{ marginRight: 8 }} />
        Room Schedule Manager
      </Title>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            placeholder="Select a room"
            style={{ width: '100%' }}
            value={selectedRoomId}
            onChange={handleRoomSelect}
            loading={roomsLoading}
            showSearch
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {rooms.map(room => (
              <Option key={room._id} value={room._id}>
                {room.name} ({room.capacity} seats)
              </Option>
            ))}
          </Select>
        </Col>
        {selectedRoom && (
          <Col span={16}>
            <Alert
              message={
                <Space>
                  <Text strong>Selected Room:</Text>
                  <Text>{selectedRoom.name}</Text>
                  <Text type="secondary">Capacity: {selectedRoom.capacity}</Text>
                  {selectedRoom.building && (
                    <Text type="secondary">Building: {selectedRoom.building}</Text>
                  )}
                </Space>
              }
              type="info"
              showIcon
            />
          </Col>
        )}
      </Row>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading room schedule...</div>
        </div>
      )}

      {!loading && selectedRoomId && !roomScheduleData && (
        <Alert
          message="No Schedule Data"
          description="No schedule data found for the selected room."
          type="warning"
          showIcon
        />
      )}

      {!loading && roomScheduleData && renderRoomScheduleGrid()}
    </Card>
  );
};

export default RoomScheduleManager;
