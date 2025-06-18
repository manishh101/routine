import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Form,
  Row,
  Col,
  Space,
  Typography,
  Switch,
  Alert,
  Divider
} from 'antd';
import {
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import RoutineGrid from './RoutineGrid';
import { programsAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const RoutineEditor = ({ isAdmin = false }) => {
  const [form] = Form.useForm();
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Fetch programs
  const { 
    data: programsData, 
    isLoading: programsLoading 
  } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programsAPI.getPrograms()
  });

  const programs = programsData?.data || [];

  // No default selection - users must make a choice
  useEffect(() => {
    // Removed default selection logic so nothing is pre-selected
  }, [programs, form]);

  // Get selected program details
  const selectedProgramObj = programs.find(p => p._id === selectedProgram);
  
  // Generate semester options
  const semesterOptions = selectedProgramObj 
    ? Array.from({ length: selectedProgramObj.semesters || 8 }, (_, i) => i + 1)
    : [];

  // Section options
  const sectionOptions = ['AB', 'CD'];

  const handleFormChange = (changedValues, allValues) => {
    if (changedValues.program !== undefined) {
      setSelectedProgram(changedValues.program);
      setSelectedSemester(null);
      setSelectedSection(null);
      form.setFieldsValue({ semester: null, section: null });
    } else if (changedValues.semester !== undefined) {
      setSelectedSemester(changedValues.semester);
      setSelectedSection(null);
      form.setFieldsValue({ section: null });
    } else if (changedValues.section !== undefined) {
      setSelectedSection(changedValues.section);
    }
  };

  const hasCompleteSelection = selectedProgram && selectedSemester && selectedSection;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space align="center">
            <CalendarOutlined style={{ fontSize: '32px', color: '#1677ff' }} />
            <div>
              <Title level={2} style={{ margin: 0 }}>
                {demoMode ? 'Class Routine Demo' : `Class Routine ${isAdmin ? 'Management' : 'Viewer'}`}
              </Title>
              <Text type="secondary">
                {demoMode 
                  ? 'Explore the routine grid with sample data'
                  : isAdmin 
                    ? 'Create and manage class schedules with smart conflict detection'
                    : 'View published class routines'
                }
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space align="center">
            <Text>Demo Mode:</Text>
            <Switch
              checked={demoMode}
              onChange={setDemoMode}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
            {isAdmin && hasCompleteSelection && !demoMode && (
              <>
                <Text>Edit Mode:</Text>
                <Switch
                  checked={editMode}
                  onChange={setEditMode}
                  checkedChildren={<EditOutlined />}
                  unCheckedChildren={<EyeOutlined />}
                />
              </>
            )}
          </Space>
        </Col>
      </Row>

      {/* Program Selection */}
      <Card
        title={
          <Space>
            <FilterOutlined />
            <span>Select Routine</span>
          </Space>
        }
      >
        <Form
          form={form}
          layout="horizontal"
          onValuesChange={handleFormChange}
          disabled={demoMode}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="program"
                label="Program"
                rules={[{ required: true, message: 'Please select a program' }]}
              >
                <Select
                  placeholder="Select program"
                  loading={programsLoading}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {programs.map(program => (
                    <Option key={program._id} value={program._id}>
                      {program.name} ({program.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                name="semester"
                label="Semester"
                rules={[{ required: true, message: 'Please select a semester' }]}
              >
                <Select
                  placeholder="Select semester"
                  disabled={!selectedProgram}
                  allowClear
                >
                  {semesterOptions.map(semester => (
                    <Option key={semester} value={semester}>
                      Semester {semester}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                name="section"
                label="Section"
                rules={[{ required: true, message: 'Please select a section' }]}
              >
                <Select
                  placeholder="Select section"
                  disabled={!selectedSemester}
                  allowClear
                >
                  {sectionOptions.map(section => (
                    <Option key={section} value={section}>
                      Section {section}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {demoMode && (
          <>
            <Divider />
            <Alert
              message="Demo Mode Active"
              description="Showing sample routine data for demonstration. Toggle off Demo Mode to use live data and selection controls."
              type="warning"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </>
        )}

        {isAdmin && editMode && hasCompleteSelection && !demoMode && (
          <>
            <Divider />
            <Alert
              message="Edit Mode Active"
              description="You can now assign, edit, or remove classes. The system will automatically check for teacher and room conflicts."
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </>
        )}
      </Card>

      {/* Routine Grid */}
      {(demoMode || hasCompleteSelection) && (
        <RoutineGrid
          programCode={demoMode ? 'BCT' : selectedProgramObj?.code}
          semester={demoMode ? '1' : selectedSemester}
          section={demoMode ? 'AB' : selectedSection}
          isEditable={isAdmin && editMode && !demoMode}
          demoMode={demoMode}
        />
      )}
    </Space>
  );
};

export default RoutineEditor;
