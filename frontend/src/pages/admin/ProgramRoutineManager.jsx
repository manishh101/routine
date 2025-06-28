import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, Card, Typography, Button, Alert, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import RoutineGrid from '../../components/RoutineGrid';
import AssignClassModal from '../../components/AssignClassModal';
import { programsAPI, programSemestersAPI, routinesAPI, timeSlotsAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

/**
 * ProgramRoutineManager - Main administrative component for creating and editing program class routines
 * 
 * Prompt 7 Implementation:
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

  // Selection state
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

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

  // Fetch routine data (dependent on all three selections) - Required by Prompt 7
  const { 
    data: routineData, 
    isLoading: routineLoading, 
    error: routineError,
    refetch: refetchRoutine 
  } = useQuery({
    queryKey: ['routine', selectedProgram, selectedSemester, selectedSection],
    queryFn: () => selectedProgram && selectedSemester && selectedSection
      ? routinesAPI.getRoutine(selectedProgram, selectedSemester, selectedSection)
          .then(res => res.data.data)
      : Promise.resolve(null),
    enabled: !!(selectedProgram && selectedSemester && selectedSection),
    staleTime: 30000, // 30 seconds
  });
  
  // Fetch timeslots for Excel export
  const { data: timeSlotsData } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: () => timeSlotsAPI.getTimeSlots(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Handle cell click to open modal - Prompt 7 requirement
  const handleCellClick = (dayIndex, slotIndex, existingClassData = null) => {
    console.log('Cell clicked:', { dayIndex, slotIndex, existingClassData });
    setSelectedCell({
      dayIndex,
      slotIndex,
      existingClass: existingClassData,
      programCode: selectedProgram,
      semester: selectedSemester,
      section: selectedSection,
    });
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
    <div className="program-routine-manager p-6">
      <Card>
        <div className="mb-6">
          <Title level={2} className="mb-4">
            Program Routine Management
          </Title>
          
          {/* Selection Controls */}
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
                {(Array.isArray(programs) ? programs : []).map(program => (
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
                {Array.isArray(semesters) && semesters.map(semester => (
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

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleReset}
                type="default"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Selection Summary - Enhanced Debug Info */}
          {selectedProgram && selectedSemester && selectedSection && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-blue-800">
                Managing routine for: <span className="font-bold">
                  {selectedProgram} - Semester {selectedSemester} - Section {selectedSection}
                </span>
              </p>
              {/* Enhanced debug info for routine data status */}
              <p className="text-xs text-blue-600 mt-1">
                Routine Status: {routineLoading ? 'Loading...' : routineError ? 'Error loading' : routineData ? 'Data loaded' : 'No data'}
                {routineData && routineData.routine && Object.keys(routineData.routine).length > 0 && (
                  <span> | Classes found: {Object.values(routineData.routine).reduce((total, day) => total + Object.keys(day).length, 0)}</span>
                )}
                {routineError && (
                  <span className="text-red-600"> | Error: {routineError.message}</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Routine Grid Display - Prompt 7 Spreadsheet-like View */}
        <div className="routine-grid-container">
          {selectedProgram && selectedSemester && selectedSection ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <Title level={4} className="mb-0">
                  Weekly Schedule Grid - Excel-like View
                </Title>
                <div className="flex gap-2">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => handleCellClick(0, 0, null)} // Default to Sunday, first period
                    disabled={!selectedProgram || !selectedSemester || !selectedSection}
                  >
                    Add New Class
                  </Button>
                  {routineData && (
                    <Button 
                      onClick={() => refetchRoutine()}
                      loading={routineLoading}
                    >
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
              
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
              
              {/* Excel-like Routine Grid - Prompt 7 Implementation */}
              <RoutineGrid
                programCode={selectedProgram}
                semester={selectedSemester}
                section={selectedSection}
                isEditable={true}
                demoMode={false}
                onCellDoubleClicked={handleCellClick}
                routineData={routineData} // Pass the fetched data
                refetchRoutine={refetchRoutine} // Pass refetch function
              />
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <PlusOutlined className="text-4xl mb-4 text-gray-300" />
              <p className="text-lg mb-2">Program Routine Management</p>
              <p>Please select Program, Semester, and Section to view the routine grid</p>
              <p className="text-sm text-gray-400 mt-2">
                The grid will display in a spreadsheet-like format for easy class management
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Assign Class Modal - Prompt 7 Modal Integration */}
      {isModalVisible && selectedCell && (
        <AssignClassModal
          visible={isModalVisible}
          onCancel={handleModalClose}
          onSave={handleAssignmentSuccess} // Simplified - modal handles the API call
          programCode={selectedCell.programCode}
          semester={selectedCell.semester}
          section={selectedCell.section}
          dayIndex={selectedCell.dayIndex}
          slotIndex={selectedCell.slotIndex}
          timeSlots={[]} // Will be fetched inside modal
          existingClass={selectedCell.existingClass}
          loading={false}
        />
      )}
    </div>
  );
};

export default ProgramRoutineManager;