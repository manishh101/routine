import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import useAuthStore from './contexts/authStore';

// Import components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Programs from './pages/Programs';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import Routine from './pages/Routine';
import Layout from './components/Layout';
import DebugPage from './pages/DebugPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // No retries to prevent excessive API calls
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount
      refetchOnReconnect: false, // Don't refetch on reconnect
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      cacheTime: 15 * 60 * 1000, // 15 minutes cache
      suspense: false,
      onError: (err) => {
        console.error('Query error:', err);
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
                <Route path="teachers" element={<Teachers />} />
                <Route path="programs" element={<Programs />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="classes" element={<Classes />} />
                <Route path="routine" element={<Routine />} />
                <Route path="debug" element={<DebugPage />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
