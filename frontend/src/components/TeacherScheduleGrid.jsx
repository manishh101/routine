import React, { useMemo } from 'react';
import { Table, Tag, Space, Typography, Empty } from 'antd';
import { ClockCircleOutlined, BookOutlined, HomeOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Teacher Schedule Grid Component
 * Displays teacher schedule in a table format similar to routine grid
 */
const TeacherScheduleGrid = ({ schedule, teacherInfo }) => {
  const timeSlots = schedule.timeSlots || [];
  const routine = schedule.routine || {};

  // Days of the week
  const days = [
    { key: '0', label: 'Sunday' },
    { key: '1', label: 'Monday' },
    { key: '2', label: 'Tuesday' },
    { key: '3', label: 'Wednesday' },
    { key: '4', label: 'Thursday' },
    { key: '5', label: 'Friday' },
    { key: '6', label: 'Saturday' }
  ];

  // Create table columns - one for time, one for each day
  const columns = [
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      fixed: 'left',
      width: 120,
      render: (time) => (
        <div style={{ 
          textAlign: 'center', 
          fontWeight: 'bold',
          color: '#1890ff',
          fontSize: '12px'
        }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {time}
        </div>
      )
    },
    ...days.map(day => ({
      title: day.label,
      dataIndex: day.key,
      key: day.key,
      width: 180,
      render: (classInfo) => {
        if (!classInfo) {
          return (
            <div style={{ 
              height: '60px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#d9d9d9',
              fontSize: '12px'
            }}>
              Free
            </div>
          );
        }

        return (
          <div style={{ 
            padding: '8px',
            border: '1px solid #e6f7ff',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
            minHeight: '60px'
          }}>
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              {/* Subject */}
              <div style={{ 
                fontWeight: 'bold', 
                color: '#1890ff',
                fontSize: '11px',
                lineHeight: '1.2'
              }}>
                <BookOutlined style={{ marginRight: 4 }} />
                {classInfo.subjectName}
              </div>

              {/* Program & Section */}
              <div style={{ fontSize: '10px', color: '#666' }}>
                {classInfo.programCode}
                {classInfo.section && ` - ${classInfo.section}`}
                {classInfo.classType && (
                  <Tag size="small" color="blue" style={{ marginLeft: 4, fontSize: '9px' }}>
                    {classInfo.classType}
                  </Tag>
                )}
              </div>

              {/* Room */}
              {classInfo.roomName && (
                <div style={{ fontSize: '10px', color: '#fa8c16' }}>
                  <HomeOutlined style={{ marginRight: 2 }} />
                  {classInfo.roomName}
                </div>
              )}
            </Space>
          </div>
        );
      }
    }))
  ];

  // Transform data for table
  const tableData = useMemo(() => {
    return timeSlots.map(timeSlot => {
      const row = {
        key: timeSlot._id,
        time: `${timeSlot.startTime} - ${timeSlot.endTime}`
      };

      // Add class data for each day
      days.forEach(day => {
        const dayRoutine = routine[day.key] || {};
        const classInfo = dayRoutine[timeSlot._id];
        row[day.key] = classInfo;
      });

      return row;
    });
  }, [timeSlots, routine, days]);

  if (!timeSlots.length) {
    return (
      <Empty 
        description="No time slots configured"
        style={{ padding: '40px' }}
      />
    );
  }

  return (
    <div className="teacher-schedule-grid">
      <style jsx>{`
        .teacher-schedule-grid .ant-table-thead > tr > th {
          background: linear-gradient(90deg, #001529 0%, #1890ff 100%) !important;
          color: white !important;
          font-weight: bold !important;
          text-align: center !important;
          border: 1px solid #1890ff !important;
        }
        
        .teacher-schedule-grid .ant-table-tbody > tr > td {
          padding: 8px !important;
          border: 1px solid #f0f0f0 !important;
          vertical-align: top !important;
        }
        
        .teacher-schedule-grid .ant-table-tbody > tr:nth-child(even) {
          background-color: #fafafa;
        }
        
        .teacher-schedule-grid .ant-table-tbody > tr:hover {
          background-color: #e6f7ff !important;
        }
        
        .teacher-schedule-grid .ant-table {
          border: 1px solid #e6f7ff;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .teacher-schedule-grid .ant-table-container {
          border-radius: 8px;
        }
      `}</style>
      
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        scroll={{ x: 1000 }}
        size="small"
        bordered
        style={{ 
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
      
      {/* Legend */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        background: '#fafafa',
        borderRadius: '6px',
        border: '1px solid #e6f7ff'
      }}>
        <Space wrap>
          <Text strong style={{ fontSize: '12px', color: '#666' }}>Legend:</Text>
          <Space size={4}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
              border: '1px solid #1890ff',
              borderRadius: '2px'
            }} />
            <Text style={{ fontSize: '11px' }}>Scheduled Class</Text>
          </Space>
          <Space size={4}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              background: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '2px'
            }} />
            <Text style={{ fontSize: '11px' }}>Free Period</Text>
          </Space>
        </Space>
      </div>
    </div>
  );
};

export default TeacherScheduleGrid;
