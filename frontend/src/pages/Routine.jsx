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
  // Select // Not used
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import {
  ScheduleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  BookOutlined,
  TeamOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { classesAPI } from '../services/api';

const { Title, Text } = Typography;
// const { Option } = Select; // Not used

const Routine = () => {
  const fetchClasses = useCallback(async () => {
    return await classesAPI.getClasses();
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const classes = data?.data || [];

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ]; // Ensure your data uses these exact formats or adjust

  const listColumns = [
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      width: 120,
      filters: daysOfWeek.map(d => ({ text: d, value: d })),
      onFilter: (value, record) => record.day === value,
      render: (text) => <Tag color="geekblue" style={{ minWidth: '80px', textAlign: 'center', fontWeight: 500 }}>{text || 'N/A'}</Tag>
    },
    {
      title: 'Time',
      key: 'time',
      width: 150,
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1677ff' }} />
          <Text>
            {record.startTime && record.endTime 
              ? `${record.startTime}-${record.endTime}`
              : 'N/A'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Subject',
      key: 'subject',
      render: (_, record) => (
        <Space>
          <BookOutlined style={{ color: '#52c41a' }} />
          <div>
            <Text strong>
              {record.subjectId?.subjectName || record.subjectId?.name || record.subject || 'N/A'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Code: {record.subjectId?.subjectCode || 'N/A'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Teacher',
      key: 'teacher',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#722ed1' }} />
          <div>
            <Text strong>
              {record.teacherId?.teacherName || record.teacherId?.name || record.teacher || 'N/A'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.teacherId?.shortName || 'N/A'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Room',
      dataIndex: 'roomNumber',
      key: 'room',
      width: 100,
      align: 'center',
      render: (text) => text ? <Tag color="volcano">Room {text}</Tag> : <Text type="secondary">N/A</Text>
    },
    {
      title: 'Program',
      key: 'program',
      width: 150,
      render: (_, record) => (
        <Tag color="purple">
          {record.programId?.programName || record.programId?.name || record.program || 'N/A'}
        </Tag>
      )
    }
  ];

  const classesByDayTime = React.useMemo(() => {
    const map = new Map();
    classes.forEach(cls => {
      const key = `${cls.day}-${cls.startTime}-${cls.endTime}`;
      map.set(key, cls);
    });
    return map;
  }, [classes]);

  if (isError) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px', borderRadius: '8px' }}>
        <Title level={4} type="danger">Error Loading Routine</Title>
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
            <ScheduleOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                Class Routine
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                View and manage class schedules.
              </Text>
            </div>
          </Space>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Total Classes</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fa8c16', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : classes.length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Active Days</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#52c41a', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : new Set(classes.map(c => c.day).filter(Boolean)).size}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Unique Rooms</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1677ff', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : new Set(classes.map(c => c.roomNumber).filter(Boolean)).size}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Unique Time Slots</Text>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#722ed1', margin: '8px 0' }}>
              {isLoading ? <Spin size="small" /> : new Set(classes.map(c => `${c.startTime}-${c.endTime}`).filter(t => t !== '--' && t !== 'N/A-N/A')).size}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Weekly Grid View */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <Text strong>Weekly Schedule Grid</Text>
          </Space>
        }
        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: isLoading ? '20px' : '0' }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Spin size="large" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #f0f0f0', padding: '12px 16px', backgroundColor: '#fafafa', textAlign: 'left', fontWeight: 'bold' }}>
                    Time
                  </th>
                  {daysOfWeek.map(day => (
                    <th key={day} style={{ border: '1px solid #f0f0f0', padding: '12px 16px', backgroundColor: '#fafafa', minWidth: '130px', textAlign: 'center', fontWeight: 'bold' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(timeSlot => (
                  <tr key={timeSlot}>
                    <td style={{ border: '1px solid #f0f0f0', padding: '12px 16px', backgroundColor: '#fafafa', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {timeSlot}
                    </td>
                    {daysOfWeek.map(day => {
                      const [startTime, endTime] = timeSlot.split('-');
                      const classForSlot = classesByDayTime.get(`${day}-${startTime}-${endTime}`);
                      return (
                        <td key={`${day}-${timeSlot}`} style={{ border: '1px solid #f0f0f0', padding: '8px', height: '90px', verticalAlign: 'top' }}>
                          {classForSlot ? (
                            <Card size="small" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff', height: '100%' }}>
                              <Text strong style={{ color: '#0958d9', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                                {classForSlot.subjectId?.subjectName || classForSlot.subject || 'N/A'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                <UserOutlined /> {classForSlot.teacherId?.shortName || 'N/A'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                <InfoCircleOutlined /> Room {classForSlot.roomNumber || 'N/A'}
                              </Text>
                            </Card>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bfbfbf' }}>-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* List View */}
      <Card 
        title={
          <Space>
            <ScheduleOutlined />
            <Text strong>All Scheduled Classes</Text>
          </Space>
        }
        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={listColumns}
          dataSource={classes}
          loading={isLoading}
          rowKey={(record) => record._id || record.id || Math.random().toString()}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} classes`,
            style: { padding: '16px' }
          }}
          scroll={{ x: true }}
          locale={{
            emptyText: (
              <Empty
                image={<ScheduleOutlined style={{ fontSize: '48px', color: '#ccc' }} />}
                imageStyle={{ height: 60 }}
                description={<span>No classes scheduled.</span>}
              />
            )
          }}
          style={{ borderRadius: '8px', overflow: 'hidden' }}
        />
      </Card>
    </Space>
  );
};

export default Routine;