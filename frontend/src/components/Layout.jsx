import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography, Space, Tag } from 'antd';
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
  HomeOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  BankOutlined,
  SettingOutlined,
  BranchesOutlined,
  ExperimentOutlined,
  WarningOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import useAuthStore from '../contexts/authStore';
import './MobileResponsive.css';

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();

  // Handle screen size changes for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768); // Use <= 768 for consistent mobile detection
      
      // Auto-collapse sidebar on tablet and smaller screens
      if (width < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
      
      // Close mobile drawer when screen becomes large
      if (width >= 768) {
        setMobileDrawerVisible(false);
      }
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync Zustand user state with localStorage on mount and storage events
  useEffect(() => {
    const syncUser = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (e) {
          console.error('Error parsing user data:', e);
          // Clear corrupted user data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    };
    
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, [setUser]);

  // Public menu items (available to everyone)
  const publicMenuItems = [
    { 
      key: '/', 
      icon: <DashboardOutlined />, 
      label: 'Dashboard',
      title: collapsed ? 'Dashboard' : undefined
    },
    { 
      key: '/program-routine', 
      icon: <CalendarOutlined />, 
      label: 'Class Routine',
      title: collapsed ? 'Class Routine' : undefined
    },
    { 
      key: '/teacher-routine', 
      icon: <TeamOutlined />, 
      label: 'Teacher Schedule',
      title: collapsed ? 'Teacher Schedule' : undefined
    },
    // { 
    //   key: '/excel-demo', 
    //   icon: <FileExcelOutlined />, 
    //   label: 'Excel Demo',
    //   title: collapsed ? 'Excel Demo' : undefined
    // },
    // { 
    //   key: '/teacher-excel-demo', 
    //   icon: <FileExcelOutlined />, 
    //   label: 'Teacher Excel Demo',
    //   title: collapsed ? 'Teacher Excel Demo' : undefined
    // },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { type: 'divider' },
    { 
      key: 'admin-section', 
      label: collapsed ? '' : 'Admin Panel', 
      type: 'group',
      style: { 
        color: '#667eea', 
        fontWeight: 600,
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        margin: collapsed ? '8px 0 4px 0' : '16px 0 8px 0',
        display: collapsed ? 'none' : 'block'
      }
    },
    { 
      key: '/program-routine-manager', 
      icon: <ScheduleOutlined />, 
      label: 'Routine Manager',
      title: collapsed ? 'Routine Manager' : undefined
    },
    { 
      key: '/teachers-manager', 
      icon: <TeamOutlined />, 
      label: 'Teachers',
      title: collapsed ? 'Teachers' : undefined
    },
    { 
      key: '/programs-manager', 
      icon: <BookOutlined />, 
      label: 'Programs',
      title: collapsed ? 'Programs' : undefined
    },
    { 
      key: '/subjects-manager', 
      icon: <ReadOutlined />, 
      label: 'Subjects',
      title: collapsed ? 'Subjects' : undefined
    },
    { 
      key: '/rooms-manager', 
      icon: <HomeOutlined />, 
      label: 'Rooms',
      title: collapsed ? 'Rooms' : undefined
    },
    { 
      key: '/timeslots-manager', 
      icon: <ClockCircleOutlined />, 
      label: 'Time Slots',
      title: collapsed ? 'Time Slots' : undefined
    },
    { 
      key: '/departments-manager', 
      icon: <BankOutlined />, 
      label: 'Departments',
      title: collapsed ? 'Departments' : undefined
    },
    { type: 'divider' },
    { 
      key: 'system-section', 
      label: collapsed ? '' : 'System Management', 
      type: 'group',
      style: { 
        color: '#52c41a', 
        fontWeight: 600,
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        margin: collapsed ? '8px 0 4px 0' : '16px 0 8px 0',
        display: collapsed ? 'none' : 'block'
      }
    },
    { 
      key: '/academic-calendar-manager', 
      icon: <CalendarOutlined />, 
      label: 'Academic Calendar',
      title: collapsed ? 'Academic Calendar' : undefined
    },
    { 
      key: '/session-manager', 
      icon: <SettingOutlined />, 
      label: 'Session Management',
      title: collapsed ? 'Session Management' : undefined
    },
    { 
      key: '/elective-manager', 
      icon: <BranchesOutlined />, 
      label: 'Elective Management',
      title: collapsed ? 'Elective Management' : undefined
    },
    { 
      key: '/conflict-detection', 
      icon: <WarningOutlined />, 
      label: 'Conflict Detection',
      title: collapsed ? 'Conflict Detection' : undefined
    },
    { type: 'divider' },
    { 
      key: 'core-features-section', 
      label: collapsed ? '' : 'Core Features', 
      type: 'group',
      style: { 
        color: '#722ed1', 
        fontWeight: 600,
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        margin: collapsed ? '8px 0 4px 0' : '16px 0 8px 0',
        display: collapsed ? 'none' : 'block'
      }
    },
    { 
      key: '/analytics-dashboard', 
      icon: <BarChartOutlined />, 
      label: 'Analytics Dashboard',
      title: collapsed ? 'Analytics Dashboard' : undefined
    },
    { 
      key: '/lab-group-manager', 
      icon: <ExperimentOutlined />, 
      label: 'Lab Groups',
      title: collapsed ? 'Lab Groups' : undefined
    },
    { 
      key: '/user-manager', 
      icon: <TeamOutlined />, 
      label: 'User Management',
      title: collapsed ? 'User Management' : undefined
    },
    { 
      key: '/template-manager', 
      icon: <FileTextOutlined />, 
      label: 'Templates',
      title: collapsed ? 'Templates' : undefined
    },
    { 
      key: '/room-vacancy-analysis', 
      icon: <EnvironmentOutlined />, 
      label: 'Room Vacancy',
      title: collapsed ? 'Room Vacancy' : undefined
    },
    // { 
    //   key: '/excel-demo-admin', 
    //   icon: <FileExcelOutlined />, 
    //   label: 'Excel Demo (Admin)',
    //   title: collapsed ? 'Excel Demo (Admin)' : undefined
    // },
  ];

  // Combine menu items based on user role
  let menuItems = [...publicMenuItems];
  
  if (user?.role === 'admin') {
    menuItems = [...publicMenuItems, ...adminMenuItems];
  }

  // Add login button if not logged in
  if (!user) {
    menuItems.push({
      type: 'divider'
    }, {
      key: '/admin/login',
      icon: <UserOutlined />,
      label: 'Admin Login',
      style: { 
        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)', 
        color: '#667eea',
        fontWeight: 500,
        margin: '8px',
        borderRadius: '8px'
      }
    });
  }

  const handleMenuClick = ({ key }) => {
    navigate(key);
    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to general dashboard after logout
    // Close mobile drawer after logout
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileDrawerVisible(!mobileDrawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const userMenuItems = user ? [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#667eea', fontSize: '16px' }} />,
      label: (
        <div style={{ padding: '12px 8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <Avatar 
              size={48}
              icon={<UserOutlined />} 
              src={user.avatarUrl}
              style={{
                background: user?.role === 'admin' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            />
            <div>
              <div style={{
                fontWeight: 700,
                color: '#1f2937',
                fontSize: '16px',
                marginBottom: '4px',
                letterSpacing: '-0.01em'
              }}>
                {user.name || 'Admin User'}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '6px'
              }}>
                {user.email || 'admin@example.com'}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                background: user?.role === 'admin' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                borderRadius: '12px',
                fontSize: '11px',
                color: 'white',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {user?.role === 'admin' && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    background: '#00d4aa',
                    borderRadius: '50%',
                    display: 'inline-block'
                  }} />
                )}
                {user.role || 'User'}
              </div>
            </div>
          </div>
          <div style={{
            padding: '8px 12px',
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(102, 126, 234, 0.1)',
            fontSize: '12px',
            color: '#667eea',
            textAlign: 'center',
            fontWeight: 500
          }}>
            🎉 Welcome back! You're signed in as {user?.role === 'admin' ? 'Administrator' : 'User'}
          </div>
        </div>
      ),
      disabled: true,
      style: {
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
        borderRadius: '16px',
        margin: '0 4px 8px 4px',
        border: '1px solid rgba(102, 126, 234, 0.08)'
      }
    },
    { 
      type: 'divider',
      style: {
        margin: '8px 12px',
        borderColor: 'rgba(102, 126, 234, 0.1)'
      }
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#ffffff', fontSize: '16px' }} />,
      label: (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '4px 0'
        }}>
          <div>
            <div style={{ 
              color: '#ffffff', 
              fontWeight: 600,
              fontSize: '14px',
              marginBottom: '2px'
            }}>
              Sign Out
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 400
            }}>
              You'll be redirected to login
            </div>
          </div>
        </div>
      ),
      onClick: handleLogout,
      style: {
        borderRadius: '12px',
        margin: '4px 8px 4px 8px',
        padding: '8px 12px',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        border: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
      }
    },
  ] : [];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          theme="light"
          width={240}
          collapsedWidth={72}
          style={{
            boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 56,
            bottom: 0,
            zIndex: 1000,
            background: '#ffffff',
            borderRight: '1px solid #e5e5e5',
            transition: 'all 0.2s ease',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultSelectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
            style={{ 
              borderRight: 0, 
              height: '100%', 
              overflowY: 'auto',
              background: 'transparent',
              padding: '8px 0',
            }}
          />
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          {/* Overlay */}
          {mobileDrawerVisible && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1998,
                transition: 'opacity 0.3s ease'
              }}
              onClick={() => setMobileDrawerVisible(false)}
            />
          )}
          
          {/* Mobile Sidebar */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: mobileDrawerVisible ? 0 : '-280px',
              width: '280px',
              height: '100vh',
              background: '#ffffff',
              boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1999,
              transition: 'left 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Mobile Header */}
            <div style={{
              height: '64px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #e5e5e5',
              background: '#fafafa'
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  flex: 1
                }}
                onClick={() => {
                  navigate('/');
                  setMobileDrawerVisible(false);
                }}
              >
                <ScheduleOutlined style={{ 
                  fontSize: '24px', 
                  color: '#667eea',
                  marginRight: '8px'
                }} />
                <span style={{ 
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#333',
                  letterSpacing: '-0.01em'
                }}>
                  Routine MS
                </span>
              </div>
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => setMobileDrawerVisible(false)}
                style={{
                  fontSize: '18px',
                  color: '#666',
                  minWidth: '44px',
                  minHeight: '44px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </div>

            {/* Mobile Menu */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                defaultSelectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{ 
                  borderRight: 0,
                  background: 'transparent',
                  padding: '8px 0',
                }}
              />
            </div>
          </div>
        </>
      )}

      <AntLayout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 72 : 240), 
        transition: 'margin-left 0.2s ease' 
      }}>
        <Header style={{
          height: '56px',
          padding: isMobile ? '0 12px' : '0 16px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 0 rgba(0, 0, 0, 0.1)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          borderBottom: '1px solid #e5e5e5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Hamburger menu button */}
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={toggleSidebar}
              style={{ 
                fontSize: '20px', 
                width: isMobile ? 44 : 40, 
                height: isMobile ? 44 : 40,
                minWidth: isMobile ? 44 : 40,
                minHeight: isMobile ? 44 : 40,
                borderRadius: '50%',
                color: '#606060',
                background: 'transparent',
                border: 'none',
                marginRight: isMobile ? '8px' : '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            />
            
            {/* Logo */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            >
              <ScheduleOutlined style={{ 
                fontSize: isMobile ? '24px' : '28px', 
                color: '#667eea',
                marginRight: isMobile ? '6px' : '8px'
              }} />
              <span style={{ 
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 600,
                color: '#333',
                letterSpacing: '-0.01em',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                display: isMobile && window.innerWidth < 480 ? 'none' : 'block'
              }}>
                Routine MS
              </span>
            </div>
          </div>
          {user ? (
            <Dropdown
              menu={{ 
                items: [
                  {
                    key: 'signout',
                    icon: <LogoutOutlined style={{ color: '#6b7280', fontSize: '16px' }} />,
                    label: (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 4px'
                      }}>
                        <div>
                          <div style={{ 
                            color: '#1f2937', 
                            fontWeight: 600,
                            fontSize: '14px',
                            marginBottom: '2px'
                          }}>
                            Sign Out
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            fontWeight: 400
                          }}>
                            You'll be redirected to login
                          </div>
                        </div>
                      </div>
                    ),
                    onClick: handleLogout,
                    style: {
                      borderRadius: '12px',
                      margin: '8px',
                      padding: '12px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }
                  }
                ]
              }}
              placement="bottomRight"
              trigger={['click']}
              overlayStyle={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e5e5e5',
                background: '#ffffff',
                overflow: 'hidden',
                minWidth: '200px'
              }}
            >
              <Button
                type="primary"
                icon={<LogoutOutlined />}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  border: 'none',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(107, 114, 128, 0.4)',
                  height: '40px'
                }}
              >
                Admin Logout
              </Button>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate('/admin/login')}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                height: '40px'
              }}
            >
              Admin Login
            </Button>
          )}
        </Header>
        <Content style={{
          padding: isMobile ? '12px 8px' : '20px',
          background: '#f9f9f9',
          minHeight: 'calc(100vh - 56px)',
          marginTop: '56px',
          overflow: 'auto',
        }}>
          <div style={{
            padding: isMobile ? '16px' : '24px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            minHeight: 'calc(100vh - 152px)',
            border: '1px solid #e5e5e5',
            maxWidth: '100%',
            overflowX: 'auto'
          }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;