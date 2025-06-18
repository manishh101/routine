import React from 'react';
import { Card, Button, Result, Space } from 'antd';
import { ScheduleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const Classes = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Result
          icon={<ScheduleOutlined style={{ color: '#faad14' }} />}
          title="Classes Management Moved"
          subTitle="The classes management feature has been replaced with our new comprehensive routine management system."
          extra={
            <Space direction="vertical" size="middle">
              <Button 
                type="primary" 
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/routine')}
              >
                Go to Routine Management
              </Button>
              <Button 
                type="default"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </Space>
          }
        />
        <Card 
          style={{ marginTop: '24px', backgroundColor: '#f6ffed' }}
          bodyStyle={{ padding: '16px' }}
        >
          <h4 style={{ margin: '0 0 8px 0', color: '#389e0d' }}>What's New:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#52c41a' }}>
            <li>Smart scheduling with conflict detection</li>
            <li>Teacher availability tracking</li>
            <li>Room management integration</li>
            <li>Program-semester based curriculum</li>
            <li>Advanced routine optimization</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default Classes;
