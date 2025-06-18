import React, { useState } from 'react';
import { Card, Select, Space, Row, Col, Typography, Divider } from 'antd';
import RoutineGridComponent from '../components/RoutineGridComponent';
import RoutineGridComponentIntegrated from '../components/RoutineGridComponentIntegrated';

const { Title, Text } = Typography;
const { Option } = Select;

const RoutineGridDemo = () => {
  const [selectedProgram, setSelectedProgram] = useState('BCT');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSection, setSelectedSection] = useState('AB');

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Routine Grid Component Demo</Title>
      <Text type="secondary">
        Demonstrating the RoutineGridComponent implementation based on GitHub Copilot prompt specifications.
      </Text>

      <Divider />

      {/* Controls */}
      <Card title="Select Routine Parameters" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Program:</Text>
              <Select
                value={selectedProgram}
                onChange={setSelectedProgram}
                style={{ width: '100%' }}
                placeholder="Select Program"
              >
                <Option value="BCT">BCT - Computer Engineering</Option>
                <Option value="BCE">BCE - Electronics & Communication</Option>
                <Option value="BEE">BEE - Electrical Engineering</Option>
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Semester:</Text>
              <Select
                value={selectedSemester}
                onChange={setSelectedSemester}
                style={{ width: '100%' }}
                placeholder="Select Semester"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <Option key={sem} value={sem.toString()}>Semester {sem}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Section:</Text>
              <Select
                value={selectedSection}
                onChange={setSelectedSection}
                style={{ width: '100%' }}
                placeholder="Select Section"
              >
                <Option value="AB">Section AB</Option>
                <Option value="CD">Section CD</Option>
                <Option value="EF">Section EF</Option>
                <Option value="GH">Section GH</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Demo Component with Sample Data */}
      <Card title="📋 RoutineGridComponent (Sample Data)" style={{ marginBottom: '24px' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
          This version uses complete weekly sample data as specified in the GitHub Copilot prompt.
          <br />
          <strong>Features:</strong> 6 days × 6 time slots = 36 possible slots, with 25 classes scheduled and break times.
        </Text>
        
        {/* Routine Statistics */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#e6f7ff' }}>
              <Text strong style={{ color: '#1677ff' }}>Lectures</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>12</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f6ffed' }}>
              <Text strong style={{ color: '#52c41a' }}>Practicals</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>8</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#fff7e6' }}>
              <Text strong style={{ color: '#fa8c16' }}>Tutorials</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>5</div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>
              <Text strong style={{ color: '#666' }}>Break Slots</Text>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>6</div>
            </Card>
          </Col>
        </Row>

        <RoutineGridComponent
          programCode={selectedProgram}
          semester={selectedSemester}
          section={selectedSection}
        />
      </Card>

      {/* Integrated Component with Live Data */}
      <Card title="🔗 RoutineGridComponent (Live Data)" style={{ marginBottom: '24px' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
          This version integrates with your existing API structure and displays live routine data.
        </Text>
        <RoutineGridComponentIntegrated
          programCode={selectedProgram}
          semester={selectedSemester}
          section={selectedSection}
        />
      </Card>

      {/* Implementation Details */}
      <Card title="📝 Implementation Details">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Key Features Implemented:</Title>
            <ul>
              <li><strong>React Query Integration:</strong> Using <code>useQuery</code> for data fetching with proper cache management</li>
              <li><strong>Data Transformation:</strong> Converting API responses to 2D grid structure using <code>useMemo</code></li>
              <li><strong>HTML Table Rendering:</strong> Custom table implementation with responsive design</li>
              <li><strong>State Management:</strong> Loading, error, and empty states handled properly</li>
              <li><strong>Styling:</strong> Color-coded cells based on class type (Lecture=Blue, Practical=Green, Tutorial=Orange)</li>
              <li><strong>Break Handling:</strong> Special rendering for break time slots</li>
            </ul>
          </div>

          <div>
            <Title level={4}>Data Flow:</Title>
            <ol>
              <li><strong>Time Slots:</strong> Fetched via <code>fetchTimeSlotDefinitions()</code> and sorted by <code>sortOrder</code></li>
              <li><strong>Routine Data:</strong> Fetched via <code>fetchRoutine(programCode, semester, section)</code></li>
              <li><strong>Grid Transformation:</strong> Scheduled classes mapped to <code>grid[dayIndex][slotIndex]</code> structure</li>
              <li><strong>Rendering:</strong> HTML table with days as rows and time slots as columns</li>
            </ol>
          </div>

          <div>
            <Title level={4}>API Response Format:</Title>
            <Text code style={{ display: 'block', whiteSpace: 'pre-wrap' }}>
{`// Time Slots API Response
{
  data: [
    {
      _id: 0,
      label: "P1 10:15-11:05",
      startTime: "10:15",
      endTime: "11:05",
      isBreak: false,
      sortOrder: 0
    },
    // ... more slots
  ]
}

// Routine API Response (Transformed to Array)
{
  data: [
    {
      _id: "...",
      programCode: "BCT",
      semester: 1,
      section: "AB",
      dayIndex: 0,
      slotIndex: 0,
      subjectName_display: "Math",
      teacherShortNames_display: ["JD"],
      roomName_display: "101",
      classType: "L",
      notes: "...",
      timeSlot_display: "10:15 - 11:05"
    },
    // ... more classes
  ]
}`}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default RoutineGridDemo;
