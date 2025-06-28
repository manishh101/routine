import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import useAuthStore from './contexts/authStore';

// Pages
import HomePage from './pages/Dashboard';
import LoginPage from './pages/Login';
import ProgramRoutineView from './pages/ProgramRoutineView';
import TeacherRoutinePage from './pages/TeacherRoutinePage';
import ProgramRoutineManager from './pages/admin/ProgramRoutineManager';
import Layout from './components/Layout';
import SubjectsManager from './pages/admin/Subjects';
import TeachersManager from './pages/admin/Teachers';
import RoomsManager from './pages/admin/RoomManagement';
import Programs from './pages/admin/Programs';
import TimeSlotManagement from './pages/admin/TimeSlotManagement';
import ExcelDemo from './pages/ExcelDemo';
import TeacherExcelDemo from './pages/TeacherExcelDemo';
import TeacherAPITest from './pages/TeacherAPITest';

// Protected route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { token, user, isInitialized } = useAuthStore();
  
  // Wait for auth store to initialize to prevent redirect loops
  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (requireAdmin && (!user || user.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Create a client outside of the component to prevent recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Only retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      // Add error boundary
      useErrorBoundary: false,
    },
    mutations: {
      retry: false, // Don't retry mutations
    },
  },
});
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#667eea',
            colorSuccess: '#00d4aa',
            colorWarning: '#ffb74d',
            colorError: '#ff6b6b',
            colorInfo: '#4facfe',
            borderRadius: 8,
            wireframe: false,
            fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            fontSize: 14,
            colorBgContainer: '#ffffff',
            colorBgElevated: '#ffffff',
            colorBgLayout: '#fafafa',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            boxShadowSecondary: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
          components: {
            Layout: {
              bodyBg: '#fafafa',
              headerBg: 'rgba(255, 255, 255, 0.8)',
              siderBg: 'rgba(255, 255, 255, 0.95)',
            },
            Menu: {
              itemBg: 'transparent',
              itemSelectedBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              itemHoverBg: '#f5f5f5',
            },
            Card: {
              borderRadiusLG: 12,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              boxShadowHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            Button: {
              borderRadius: 8,
              fontWeight: 500,
            },
            Input: {
              borderRadius: 8,
            },
            Table: {
              borderRadiusLG: 12,
              headerBg: '#fafafa',
            }
          }
        }}
      >
        <Router>
          <Routes>
            {/* Login route - outside of Layout */}
            <Route path="/admin/login" element={<LoginPage />} />
            
            {/* Routes with Layout */}
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<HomePage />} />
              <Route path="program-routine" element={<ProgramRoutineView />} />
              <Route path="teacher-routine" element={<TeacherRoutinePage />} />
              <Route path="excel-demo" element={<ExcelDemo />} />
              <Route path="teacher-excel-demo" element={<TeacherExcelDemo />} />
              <Route path="api-test" element={<TeacherAPITest />} />
              
              {/* Admin Routes - Protected */}
              <Route 
                path="admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <HomePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="program-routine-manager" 
                element={
                  <ProtectedRoute requireAdmin>
                    <ProgramRoutineManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="subjects-manager" 
                element={
                  <ProtectedRoute requireAdmin>
                    <SubjectsManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="teachers-manager" 
                element={
                  <ProtectedRoute requireAdmin>
                    <TeachersManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="rooms-manager" 
                element={
                  <ProtectedRoute requireAdmin>
                    <RoomsManager />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="programs-manager" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Programs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="timeslots-manager" 
                element={
                  <ProtectedRoute requireAdmin>
                    <TimeSlotManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="excel-demo-admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <ExcelDemo />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;