import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import useAuthStore from './contexts/authStore';

// Import components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Routine from './pages/Routine';
import TeacherSchedule from './pages/TeacherSchedule';
import TeacherRoutinePage from './pages/TeacherRoutinePage';
import RoutineGridDemo from './pages/RoutineGridDemo';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Import admin pages
import Teachers from './pages/admin/Teachers';
import Programs from './pages/admin/Programs';
import Subjects from './pages/admin/Subjects';
import Classes from './pages/admin/Classes';
import RoomManagement from './pages/admin/RoomManagement';
import TimeSlotManagement from './pages/admin/TimeSlotManagement';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Allow one retry on API failures
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount
      refetchOnReconnect: false, // Don't refetch on reconnect
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      cacheTime: 15 * 60 * 1000, // 15 minutes cache
      suspense: false,
      onError: (err) => {
        console.error('Query error:', err);
        // Don't throw app-level errors that could cause routing issues
        return false;
      }
    },
  },
});

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};

function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <Router>
          <div className="min-h-screen bg-white">
            <Routes>
              <Route 
                path="/admin/login" 
                element={!token ? <Login /> : <Navigate to="/dashboard" />} 
              />
              <Route
                path="/"
                element={<Layout />}
              >
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* Public Routes - No authentication required */}
                <Route path="routine" element={<Routine />} />
                <Route path="teacher-schedule" element={<TeacherSchedule />} />
                <Route path="teacher-routine" element={<TeacherRoutinePage />} />
                <Route path="routine-grid-demo" element={<RoutineGridDemo />} />
                
                {/* Admin Protected Routes - Require admin login */}
                <Route 
                  path="teachers" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <Teachers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="programs" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <Programs />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="subjects" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <Subjects />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="classes" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <Classes />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="rooms" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <RoomManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="timeslots" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <TimeSlotManagement />
                    </ProtectedRoute>
                  } 
                />
              </Route>
            </Routes>
          </div>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
