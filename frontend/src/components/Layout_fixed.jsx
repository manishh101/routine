import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  ReadOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import useAuthStore from '../contexts/authStore';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/teachers', icon: <TeamOutlined />, label: 'Teachers' },
    { key: '/programs', icon: <BookOutlined />, label: 'Programs' },
    { key: '/subjects', icon: <ReadOutlined />, label: 'Subjects' },
    { key: '/classes', icon: <ScheduleOutlined />, label: 'Classes' },
    { key: '/routine', icon: <CalendarOutlined />, label: 'Routine' },
  ];

  if (!user) {
    menuItems.push({
      key: '/admin/login',
      icon: <UserOutlined />,
      label: 'Admin Login',
    });
  }

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login'); // Redirect to login after logout
  };

  const userMenuItems = user ? [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <Space direction="vertical" size={0} align="start">
          <Text strong>{user.name}</Text>
          <Text type="secondary" style={{ fontSize: '0.85em' }}>{user.role}</Text>
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ] : [];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={250}
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1001, // Ensure sider is above content on overlap
        }}
      >
        <div style={{
          height: '64px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <ScheduleOutlined style={{ fontSize: '28px', color: '#1677ff' }} />
          {!collapsed && (
            <Title level={4} style={{ margin: '0 0 0 12px', color: '#1677ff', whiteSpace: 'nowrap' }}>
              Routine MS
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, height: 'calc(100vh - 64px)', overflowY: 'auto' }}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 250, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '18px', width: 48, height: 48 }}
            />
            <Title level={3} style={{ margin: '0 0 0 16px', color: '#262626', whiteSpace: 'nowrap' }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'BE Routine Management'}
            </Title>
          </div>
          {user ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" style={{ height: 'auto', padding: '8px' }}>
                <Space>
                  <Avatar icon={<UserOutlined />} src={user.avatarUrl} />
                  {!collapsed && <Text strong style={{display: 'inline-block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user.name}</Text>}
                </Space>
              </Button>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate('/admin/login')}
            >
              Admin Login
            </Button>
          )}
        </Header>
        <Content style={{
          padding: '24px',
          background: '#f0f2f5',
          minHeight: 'calc(100vh - 64px)', // 64px for header
          overflow: 'auto',
        }}>
          <div style={{
            padding: '24px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            minHeight: '100%', // Ensure this div takes full height of Content's padded area
          }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;