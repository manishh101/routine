import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, Space, Alert, Spin } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarOutlined } from '@ant-design/icons';
import RoutineGrid from '../components/RoutineGrid';
import { programsAPI, programSemestersAPI, routinesAPI, teachersAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

// This component handles both program routine view and teacher routine view
const ProgramRoutineView = ({ teacherId = null }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Reset semester when program changes
  useEffect(() => {
    if (selectedProgram) {
      setSelectedSemester(null);
    }
  }, [selectedProgram]);

  // Reset section when semester changes
  useEffect(() => {
    if (selectedSemester) {
      setSelectedSection(null);
    }
  }, [selectedSemester]);

  // For teacher view mode
  const teacherMode = !!teacherId;

  // Fetch teacher data if in teacher mode
  const { 
    data: teacherData,
    isLoading: teacherLoading,
    error: teacherError
  } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => teachersAPI.getTeacher(teacherId).then(res => res.data),
    enabled: teacherMode,
    staleTime: 60000, // 1 minute
  });

  const teacher = teacherData?.data;

  // Fetch all programs - Same as Routine Manager
  const { 
    data: programsData, 
    isLoading: programsLoading,
    error: programsError 
  } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programsAPI.getPrograms().then(res => res.data),
    enabled: !teacherMode // Only fetch programs in program view mode
  });

  const programs = Array.isArray(programsData) ? programsData : [];

  // Fetch semesters for selected program - Same as Routine Manager
  const { 
    data: semestersData, 
    isLoading: semestersLoading 
  } = useQuery({
    queryKey: ['program-semesters', selectedProgram],
    queryFn: () => selectedProgram 
      ? programSemestersAPI.getCurriculum(selectedProgram).then(res => res.data.data)
      : Promise.resolve([]),
    enabled: !teacherMode && !!selectedProgram
  });

  const semesters = Array.isArray(semestersData) ? semestersData : [];

  // Available sections - Same as Routine Manager
  const sections = ['AB', 'CD'];

  // Fetch routine data - Same as Routine Manager
  const { 
    data: routineData, 
    isLoading: routineLoading,
    error: routineError,
    refetch: refetchRoutine
  } = useQuery({
    queryKey: teacherMode 
      ? ['teacherSchedule', teacherId] 
      : ['routine', selectedProgram, selectedSemester, selectedSection],
    queryFn: () => {
      if (teacherMode) {
        console.log('Fetching teacher schedule for:', teacherId);
        return teachersAPI.getTeacherSchedule(teacherId).then(res => res.data);
      } else {
        return selectedProgram && selectedSemester && selectedSection
          ? routinesAPI.getRoutine(selectedProgram, selectedSemester, selectedSection)
              .then(res => res.data.data)
          : Promise.resolve(null);
      }
    },
    enabled: teacherMode ? !!teacherId : !!(selectedProgram && selectedSemester && selectedSection),
    staleTime: 30000, // 30 seconds - Same as Routine Manager
  });

  const routine = teacherMode ? (routineData?.data || {}) : (routineData || {});

  // If in teacher mode and there's an error
  if (teacherMode && teacherError) {
    return <Alert 
      message="Error Loading Teacher Data" 
      description={`Failed to load teacher data: ${teacherError.message}`}
      type="error" 
      showIcon 
    />;
  }

  // If in teacher mode and loading teacher data
  if (teacherMode && teacherLoading) {
    return <div className="flex justify-center items-center min-h-[300px]">
      <Spin size="large" tip="Loading teacher data..." />
    </div>;
  }

  // Handle routine data error
  if (routineError) {
    return <Alert 
      message="Error Loading Routine Data" 
      description={`Failed to load routine data: ${routineError.message}`}
      type="error" 
      showIcon 
    />;
  }

  // Render teacher mode UI
  if (teacherMode) {
    if (!teacher) {
      return <Alert 
        message="Teacher Not Found" 
        description="Could not find the selected teacher."
        type="error" 
        showIcon 
      />;
    }

    const { timeSlots, days, routineSlots } = routine;
    
    return (
      <div className="teacher-routine p-6">
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <Title level={2}>{teacher.fullName}'s Schedule</Title>
              <Text type="secondary" className="mb-6 block">
                Department: {teacher.department}
              </Text>
            </div>
            
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={handleExportClick}
              disabled={routineLoading}
            >
              Export Schedule
            </Button>
          </div>
        </Card>

        {routineLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Spin size="large" tip="Loading schedule..." />
          </div>
        ) : timeSlots && days && routineSlots ? (
          <RoutineGrid 
            timeSlots={timeSlots} 
            days={days}
            routineSlots={routineSlots}
            isEditable={false}
            onRefresh={() => {
              refetchRoutine();
              queryClient.invalidateQueries(['teacherSchedule', teacherId]);
            }}
          />
        ) : (
          <Alert 
            message="No Schedule Found" 
            description="Could not find any schedule data for this teacher."
            type="info" 
            showIcon 
          />
        )}
      </div>
    );
  }

  // Render program view UI
  return (
    <div className="program-routine-view p-6">
      <Card className="mb-6">
        <Title level={2}>Class Routine</Title>
        <Text type="secondary" className="mb-6 block">
          View the routine for a specific class (program, semester, and section).
        </Text>
        
        {/* Selection Controls - Same structure as Routine Manager */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Program Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Program</label>
            <Select
              placeholder="Select Program"
              style={{ width: '100%' }}
              value={selectedProgram}
              onChange={(value) => {
                setSelectedProgram(value);
                setSelectedSemester(null); // Reset dependent selections
                setSelectedSection(null);
              }}
              loading={programsLoading}
              notFoundContent={programsError ? 'Error loading programs' : programsLoading ? 'Loading...' : 'No data'}
            >
              {programs.map(program => (
                <Option key={program.code} value={program.code}>
                  {program.name} ({program.code})
                </Option>
              ))}
            </Select>
          </div>
          
          {/* Semester Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Semester</label>
            <Select
              placeholder="Select Semester"
              style={{ width: '100%' }}
              value={selectedSemester}
              onChange={(value) => {
                setSelectedSemester(value);
                setSelectedSection(null); // Reset dependent selection
              }}
              disabled={!selectedProgram}
              loading={semestersLoading}
            >
              {semesters.map(semester => (
                <Option key={semester.semester} value={semester.semester}>
                  Semester {semester.semester}
                </Option>
              ))}
            </Select>
          </div>
          
          {/* Section Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Section</label>
            <Select
              placeholder="Select Section"
              style={{ width: '100%' }}
              value={selectedSection}
              onChange={setSelectedSection}
              disabled={!selectedSemester}
            >
              {sections.map(section => (
                <Option key={section} value={section}>
                  Section {section}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        
        {/* Selection Summary */}
        {selectedProgram && selectedSemester && selectedSection && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <Text strong>
              Viewing routine for: <span className="font-bold">
                {programs.find(p => p.code === selectedProgram)?.name || selectedProgram} - Semester {selectedSemester} - Section {selectedSection}
              </span>
            </Text>
            {/* Debug info for routine data status */}
            <p className="text-xs text-blue-600 mt-1">
              Status: {routineLoading ? 'Loading...' : routineError ? 'Error loading' : routineData ? 'Data loaded' : 'No data'}
              {routineData && routineData.routine && Object.keys(routineData.routine).length > 0 && (
                <span> | Classes found: {Object.values(routineData.routine).reduce((total, day) => total + Object.keys(day).length, 0)}</span>
              )}
              {routineData && routineData.routine && Object.values(routineData.routine).every(day => Object.keys(day).length === 0) && (
                <span className="text-amber-600"> | No classes scheduled for this semester yet</span>
              )}
            </p>
          </div>
        )}
      </Card>
      
      {/* Display the routine grid if all selections are made */}
      {selectedProgram && selectedSemester && selectedSection ? (
        <>
          {/* Display error if routine loading failed */}
          {routineError && (
            <div className="mb-4">
              <Alert
                message="Error Loading Routine"
                description={routineError.response?.data?.message || routineError.message || 'Failed to load routine data'}
                type="error"
                showIcon
                closable
              />
            </div>
          )}
          
          {/* Routine Grid - Same as Routine Manager but read-only */}
          <RoutineGrid
            programCode={selectedProgram}
            semester={selectedSemester}
            section={selectedSection}
            isEditable={false} // Read-only for public view
            demoMode={false}
            routineData={routineData} // Pass the fetched data
            onRefresh={() => {
              refetchRoutine();
              queryClient.invalidateQueries(['routine', selectedProgram, selectedSemester, selectedSection]);
            }}
          />
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <CalendarOutlined className="text-4xl mb-4 text-gray-300" />
          <p className="text-lg mb-2">Class Routine Viewer</p>
          <p>Please select Program, Semester, and Section to view the routine</p>
          <p className="text-sm text-gray-400 mt-2">
            The schedule will display in a clear, easy-to-read format
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgramRoutineView;
