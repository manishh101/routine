import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, Typography, Layout as AntLayout, Row, Col, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, ScheduleOutlined } from '@ant-design/icons';
import useAuthStore from '../contexts/authStore';

const { Title, Text } = Typography;
const { Content } = AntLayout;

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    clearError();
    const success = await login(values.email, values.password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ece9e6 0%, #ffffff 100%)' }}>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <Card 
          style={{ 
            width: '100%', 
            maxWidth: '400px', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            borderRadius: '12px',
          }}
        >
          <Row justify="center" style={{ marginBottom: '24px' }}>
            <Col>
              <Space direction="vertical" align="center" size="small">
                <ScheduleOutlined style={{ fontSize: '48px', color: '#1677ff' }} />
                <Title level={2} style={{ margin: 0, color: '#262626' }}>
                  Admin Login
                </Title>
                <Text type="secondary">Sign in to manage the system</Text>
              </Space>
            </Col>
          </Row>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={clearError}
              style={{ marginBottom: '24px' }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label={<Text strong>Email Address</Text>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="e.g. admin@example.com"
                style={{ borderRadius: '6px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text strong>Password</Text>}
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="Enter your password"
                style={{ borderRadius: '6px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                icon={<LoginOutlined />}
                block
                style={{ height: '48px', fontSize: '16px', borderRadius: '6px' }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text type="secondary">
              <Link to="/" style={{ color: '#1677ff', fontWeight: 500 }}>
                ← Back to Public View
              </Link>
            </Text>
          </div>
        </Card>
      </Content>
    </AntLayout>
  );
};

export default Login;