import React, { useEffect, useState } from 'react';
import { Card, Typography, Button, List, Alert } from 'antd';
import { teachersAPI, programsAPI, subjectsAPI, classesAPI } from '../services/api';

const { Title, Text } = Typography;

const DebugPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      // Test teachers API
      await testEndpoint('GET /api/teachers', async () => {
        const response = await teachersAPI.getTeachers();
        return `Success! Received ${response.data.length} teachers.`;
      });
      
      // Test programs API
      await testEndpoint('GET /api/programs', async () => {
        const response = await programsAPI.getPrograms();
        return `Success! Received ${response.data.length} programs.`;
      });
      
      // Test subjects API
      await testEndpoint('GET /api/subjects', async () => {
        const response = await subjectsAPI.getSubjects();
        return `Success! Received ${response.data.length} subjects.`;
      });
      
      // Test classes API
      await testEndpoint('GET /api/classes', async () => {
        const response = await classesAPI.getClasses();
        return `Success! Received ${response.data.length} classes.`;
      });
      
    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testEndpoint = async (name, testFn) => {
    try {
      const startTime = Date.now();
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => [
        ...prev, 
        { name, success: true, message: result, duration }
      ]);
    } catch (error) {
      setTestResults(prev => [
        ...prev, 
        { 
          name, 
          success: false, 
          message: `Error: ${error.message}`, 
          details: error.response?.data || error.toString() 
        }
      ]);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="mb-6">
        <Title level={2}>API Debug Page</Title>
        <Text className="block mb-4">
          This page tests all API endpoints used by the dashboard to ensure they're working correctly.
        </Text>
        <Button 
          type="primary" 
          onClick={runTests} 
          loading={loading}
        >
          Run API Tests
        </Button>
      </Card>
      
      {testResults.length > 0 && (
        <Card>
          <List
            header={<Title level={4}>Test Results</Title>}
            dataSource={testResults}
            renderItem={item => (
              <List.Item>
                <div className="w-full">
                  {item.success ? (
                    <Alert 
                      message={item.name} 
                      description={
                        <div>
                          <Text>{item.message}</Text>
                          <Text className="block text-gray-400">
                            Response time: {item.duration}ms
                          </Text>
                        </div>
                      }
                      type="success" 
                      showIcon
                    />
                  ) : (
                    <Alert 
                      message={item.name} 
                      description={
                        <div>
                          <Text>{item.message}</Text>
                          {item.details && (
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                              {JSON.stringify(item.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      }
                      type="error" 
                      showIcon
                    />
                  )}
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default DebugPage;
