import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, Card, Typography, Button, Alert, message, Space, Row, Col, Spin, Tag, Statistic } from 'antd';
import { PlusOutlined, CalendarOutlined, BookOutlined, ClockCircleOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import RoutineGrid from '../../components/RoutineGrid';
import AssignClassModal from '../../components/AssignClassModal';
import ExcelActions from '../../components/ExcelActions';
import useRoutineSync from '../../hooks/useRoutineSync';
import { programsAPI, programSemestersAPI, routinesAPI, timeSlotsAPI } from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * ProgramRoutineManager - Main administrative component for creating and editing program class routines
 * 
 * Features:
 * - Features a visual grid display that mimics spreadsheet layout (Excel-like)
 * - Three dropdown controls for Program, Semester, and Section selection
 * - Uses @tanstack/react-query for state management with dependent query keys
 * - Integrates with RoutineGrid component that renders HTML table with spreadsheet styling
 * - Interactive cells that open AssignClassModal for class assignment/editing
 * - Automatic refetching when selections change
 * 
 * @component
 */
const ProgramRoutineManager = () => {
  console.log('ProgramRoutineManager mounted');
  const queryClient = useQueryClient();
  const { syncRoutineData, quickRefresh } = useRoutineSync();

  // Selection state
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  
  // Force refresh key for immediate UI updates
  const [refreshKey, setRefreshKey] = useState(0);
  const forceRefresh = () => setRefreshKey(prev => prev + 1);

  // Fetch programs
  const { data: programs, isLoading: programsLoading, error: programsError } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programsAPI.getPrograms().then(res => res.data),
  });

  // Enhanced debug logs
  console.log('Programs for dropdown:', programs, '| type:', typeof programs, '| isArray:', Array.isArray(programs), '| error:', programsError);

  // Fetch semesters (based on selected program)
  const { data: semesters, isLoading: semestersLoading } = useQuery({
    queryKey: ['program-semesters', selectedProgram],
    queryFn: () => selectedProgram 
      ? programSemestersAPI.getCurriculum(selectedProgram).then(res => res.data.data)
      : Promise.resolve([]),
    enabled: !!selectedProgram,
  });

  // Debug log for semesters
  console.log('Semesters data:', semesters, '| type:', typeof semesters, '| isArray:', Array.isArray(semesters));

  // Available sections (hardcoded as per business logic)
  const sections = ['AB', 'CD'];

  // Fetch routine data (dependent on all three selections)
  const { 
    data: routineData, 
    isLoading: routineLoading, 
    error: routineError,
    refetch: refetchRoutine 
  } = useQuery({
    queryKey: ['routine', selectedProgram, selectedSemester, selectedSection],
    queryFn: () => selectedProgram && selectedSemester && selectedSection
      ? routinesAPI.getRoutine(selectedProgram, selectedSemester, selectedSection)
          .then(res => {
            console.log('ProgramRoutineManager - Fresh data fetched:', res.data);
            return res.data.data;
          })
      : Promise.resolve(null),
    enabled: !!(selectedProgram && selectedSemester && selectedSection),
    staleTime: 0, // No stale time - always fresh data
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // Force new data fetch when refreshKey changes
    meta: { refreshKey }
  });
  
  // Fetch timeslots for Excel export
  const { data: timeSlotsData } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: () => timeSlotsAPI.getTimeSlots(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle cell click to open modal
  const handleCellClick = (dayIndex, slotIndex, existingClassData = null) => {
    console.log('Cell clicked:', { dayIndex, slotIndex, existingClassData });
    console.log('Selected program/semester/section:', { selectedProgram, selectedSemester, selectedSection });
    
    const cellData = {
      dayIndex,
      slotIndex,
      existingClass: existingClassData,
      programCode: selectedProgram,
      semester: selectedSemester,
      section: selectedSection,
    };
    
    console.log('Setting selectedCell to:', cellData);
    setSelectedCell(cellData);
    console.log('Setting modal visible to true');
    setIsModalVisible(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCell(null);
  };

  // Handle successful assignment/update - called by modal on success
  const handleAssignmentSuccess = () => {
    handleModalClose();
    // Refetch routine data to show updated grid
    refetchRoutine();
    
    // Invalidate all teacher schedules to ensure data consistency across the app
    queryClient.invalidateQueries(['teacherSchedules']);
    
    // Invalidate all teacher-specific schedules with any key pattern
    queryClient.invalidateQueries({ queryKey: ['teacherSchedule'] });
    
    // Also invalidate the specific pattern used in TeacherRoutinePage
    queryClient.invalidateQueries({ predicate: (query) => {
      return query.queryKey[0] === 'teacherSchedule' || 
             query.queryKey[0] === 'teacher';
    }});
    
    console.log("Invalidated all teacher-related cache keys for data consistency");
  };

  // Reset selections
  const handleReset = () => {
    setSelectedProgram(null);
    setSelectedSemester(null);
    setSelectedSection(null);
  };

  return (
    <div className="program-routine-manager" style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: '1800px', margin: '0 auto' }}>
        
        {/* Modern Header Section */}
        <Card 
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
            color: 'white'
          }}
        >
          <Row gutter={[32, 24]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarOutlined style={{ fontSize: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <Title level={1} style={{ margin: 0, color: 'white', fontSize: '32px', fontWeight: '700' }}>
                      Program Routine Manager
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', fontWeight: '400' }}>
                      Create and manage class schedules for academic programs
                    </Text>
                  </div>
                </div>
              </Space>
            </Col>
            
            <Col xs={24} lg={10}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <Space direction="vertical" size="medium" style={{ width: '100%' }}>
                  <Text strong style={{ color: 'white', fontSize: '16px', display: 'block' }}>
                    🎯 Configure Class Schedule
                  </Text>
                  
                  <Select
                    placeholder="Select Program"
                    style={{ width: '100%', marginBottom: '12px' }}
                    value={selectedProgram}
                    onChange={(value) => {
                      setSelectedProgram(value);
                      setSelectedSemester(null);
                      setSelectedSection(null);
                    }}
                    loading={programsLoading}
                    size="large"
                    dropdownStyle={{
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {(Array.isArray(programs) ? programs : []).map(program => (
                      <Option key={program.code} value={program.code}>
                        {program.name} ({program.code})
                      </Option>
                    ))}
                  </Select>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Select
                      placeholder="Semester"
                      style={{ width: '100%' }}
                      value={selectedSemester}
                      onChange={(value) => {
                        setSelectedSemester(value);
                        setSelectedSection(null);
                      }}
                      disabled={!selectedProgram}
                      loading={semestersLoading}
                      size="large"
                    >
                      {Array.isArray(semesters) && semesters.map(semester => (
                        <Option key={semester.semester} value={semester.semester}>
                          Semester {semester.semester}
                        </Option>
                      ))}
                    </Select>
                    
                    <Select
                      placeholder="Section"
                      style={{ width: '100%' }}
                      value={selectedSection}
                      onChange={setSelectedSection}
                      disabled={!selectedSemester}
                      size="large"
                    >
                      {sections.map(section => (
                        <Option key={section} value={section}>
                          Section {section}
                        </Option>
                      ))}
                    </Select>
                    
                    <Button 
                      onClick={handleReset}
                      size="large"
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        height: '40px'
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
        
        {/* Selection Summary Card - Only visible when all selections are made */}
        {selectedProgram && selectedSemester && selectedSection && (
          <Card 
            style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={16}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    width: '48px', 
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BookOutlined style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div>
                    <Title level={3} style={{ margin: 0, color: '#1a1a1a', fontWeight: '600' }}>
                      {selectedProgram} - Semester {selectedSemester} - Section {selectedSection}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {routineLoading ? 'Loading schedule data...' : 
                       routineError ? 'Error loading schedule' : 
                       !routineData ? 'No schedule data yet' :
                       `${Object.values(routineData.routine || {}).reduce((total, day) => 
                         total + Object.keys(day || {}).length, 0)} classes scheduled`}
                    </Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => refetchRoutine()}
                    loading={routineLoading}
                    style={{ borderRadius: '8px', height: '40px' }}
                  >
                    Refresh Data
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        )}
        
        {/* Routine Grid Card */}
        {selectedProgram && selectedSemester && selectedSection ? (
          <Card
            style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'white'
            }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarOutlined style={{ fontSize: '16px', color: 'white' }} />
                </div>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>
                    Weekly Schedule Grid
                  </span>
                </div>
              </div>
            }
            headStyle={{
              borderBottom: '1px solid #f0f2f5',
              padding: '20px 24px'
            }}
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => handleCellClick(0, 0, null)}
                  style={{ borderRadius: '8px', height: '40px' }}
                >
                  Add New Class
                </Button>
                
                {/* Excel Import/Export Actions */}
                <ExcelActions 
                  programCode={selectedProgram}
                  semester={selectedSemester}
                  section={selectedSection}
                  allowImport={true}
                  allowExport={true}
                  size="middle"
                  style={{ borderRadius: '8px', height: '40px' }}
                  onImportSuccess={async (response) => {
                    console.log('Import success callback triggered:', response);
                    
                    // Show success message with import details
                    const importData = response?.data?.data || response?.data;
                    const importedCount = importData?.slotsImported || 0;
                    const skippedCount = importData?.skippedCells || 0;
                    
                    let successMessage = `Routine imported successfully! ${importedCount} classes added.`;
                    if (skippedCount > 0) {
                      successMessage += ` ${skippedCount} cells skipped.`;
                    }
                    
                    message.success(successMessage, 5);
                    
                    const syncSuccess = await syncRoutineData(selectedProgram, selectedSemester, selectedSection, {
                      verifyData: true,
                      enablePageRefreshFallback: true,
                      onVerificationSuccess: (freshData) => {
                        console.log('✅ Import verification successful - data is visible');
                        forceRefresh();
                      },
                      onVerificationFailed: () => {
                        console.warn('⚠️ Import verification failed - forcing page refresh');
                        window.location.reload();
                      }
                    });
                    
                    if (!syncSuccess) {
                      console.warn('Sync failed, falling back to force refresh...');
                      forceRefresh();
                      setTimeout(() => refetchRoutine(), 500);
                    }
                  }}
                  onImportError={(error) => {
                    message.error('Failed to import routine: ' + (error.response?.data?.message || error.message));
                  }}
                  onExportSuccess={(filename) => {
                    message.success(`Routine exported as ${filename}`);
                  }}
                  onExportError={(error) => {
                    message.error('Failed to export routine: ' + (error.response?.data?.message || error.message));
                  }}
                />
              </Space>
            }
          >
            {/* Display error if routine loading failed */}
            {routineError && (
              <div style={{ marginBottom: '16px' }}>
                <Alert
                  message="Error Loading Routine"
                  description={routineError.response?.data?.message || routineError.message || 'Failed to load routine data'}
                  type="error"
                  showIcon
                  closable
                  style={{ borderRadius: '8px' }}
                />
              </div>
            )}
            
            {/* Routine Grid component */}
            <div style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '12px',
              padding: '12px 8px' 
            }}>
              <RoutineGrid
                programCode={selectedProgram}
                semester={selectedSemester}
                section={selectedSection}
                isEditable={true}
                demoMode={false}
                onCellDoubleClicked={handleCellClick}
                routineData={routineData}
                refetchRoutine={refetchRoutine}
              />
            </div>
          </Card>
        ) : (
          <Card
            style={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}
          >
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <CalendarOutlined style={{ fontSize: '32px', color: 'white' }} />
              </div>
              
              <Title level={3} style={{ color: '#1a1a1a', marginBottom: '16px' }}>
                🚀 Create a Class Schedule
              </Title>
              
              <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '32px' }}>
                Select a Program, Semester, and Section from the options above to begin
              </Text>

              <Row gutter={[24, 16]} style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '12px'
                    }}>
                      <CalendarOutlined style={{ fontSize: '24px', color: '#667eea' }} />
                    </div>
                    <Text strong style={{ color: '#1a1a1a' }}>Visual Schedule</Text>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      Interactive grid-based interface
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #52c41a20 0%, #73d13d20 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '12px'
                    }}>
                      <BookOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    </div>
                    <Text strong style={{ color: '#1a1a1a' }}>Excel Integration</Text>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      Import and export capabilities
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #fa8c1620 0%, #ffa94020 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '12px'
                    }}>
                      <TeamOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                    </div>
                    <Text strong style={{ color: '#1a1a1a' }}>Teacher Sync</Text>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      Automatic teacher schedule updates
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        )}
        
      </Space>
      
      {/* Assign Class Modal */}
      {isModalVisible && selectedCell && (
        <AssignClassModal
          visible={isModalVisible}
          onCancel={handleModalClose}
          onSave={handleAssignmentSuccess}
          programCode={selectedCell.programCode}
          semester={selectedCell.semester}
          section={selectedCell.section}
          dayIndex={selectedCell.dayIndex}
          slotIndex={selectedCell.slotIndex}
          timeSlots={timeSlotsData?.data || []}
          existingClass={selectedCell.existingClass}
          loading={false}
        />
      )}
    </div>
  );
};

export default ProgramRoutineManager;
