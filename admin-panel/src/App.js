import React, { useState, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Memberships from './pages/Memberships';
import Checkin from './pages/Checkin';
import CheckinQR from './pages/CheckinQR';
import Login from './pages/Login';
import Profile from './pages/Profile';

import PrivateRoute from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { ThemeProvider as ModeProvider, useThemeMode } from './context/ThemeContext';

import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const drawerWidth = 240;

// Твої «яблучні» палітри з правильним background
const lightPalette = {
  mode: 'light',
  primary: { main: '#6d28d9' },
  secondary: { main: '#0891b2' },
  background: { default: '#f5f5f7', paper: '#ffffff' },
  text: { primary: '#1d1d1f', secondary: '#6e6e73' },
};

const darkPalette = {
  mode: 'dark',
  primary: { main: '#7c5cff' },
  secondary: { main: '#22d3ee' },
  background: { default: '#1e1e1e', paper: '#232323' },
  text: { primary: '#e5e7eb', secondary: '#9ca3af' },
};

function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const location = useLocation();

  // Тема MUI з підтримкою color-scheme (важливо для нативних елементів)
  const theme = useMemo(
    () =>
      createTheme({
        palette: mode === 'dark' ? darkPalette : lightPalette,
        typography: {
          fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              ':root': { colorScheme: mode },
            },
          },
        },
      }),
    [mode]
  );

  const menuItems = [
    { label: 'Dashboard', to: '/', icon: <DashboardIcon /> },
    { label: 'Users', to: '/users', icon: <PeopleIcon /> },
    { label: 'Memberships', to: '/memberships', icon: <CardMembershipIcon /> },
    { label: 'Check-in', to: '/checkin', icon: <QrCodeScannerIcon /> },
    { label: 'Check-in QR', to: '/checkin-qr', icon: <QrCode2Icon /> },
    { label: 'Profile', to: '/profile', icon: <PersonIcon /> },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ minHeight: 56 }} />
      <Divider />
      <List sx={{ mt: 1 }}>
        {menuItems.map(({ label, to, icon }) => {
          const selected = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <ListItem key={label} disablePadding>
              <ListItemButton component={Link} to={to} selected={selected} onClick={() => setMobileOpen(false)}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {/* Кореневий контейнер: фарбуємо фон і текст, тягнемо на всю висоту вікна */}
      <Box sx={{ display: 'flex', bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh' }}>
        <AppBar position="fixed" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', backdropFilter: 'saturate(180%) blur(8px)' }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Admin Panel
            </Typography>
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            {isAuthenticated && (
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {/* Бокове меню */}
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="sidebar">
          {/* Мобільний Drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          {/* Постійний Drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Контент */}
        <Box component="main" sx={{ flexGrow: 1, p: 2, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar sx={{ minHeight: 56 }} />
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <Users />
                </PrivateRoute>
              }
            />
            <Route
              path="/memberships"
              element={
                <PrivateRoute>
                  <Memberships />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkin"
              element={
                <PrivateRoute>
                  <Checkin />
                </PrivateRoute>
              }
            />
            <Route
              path="/checkin-qr"
              element={
                <PrivateRoute>
                  <CheckinQR />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
          </Routes>
        </Box>
      </Box>
    </MuiThemeProvider>
  );
}

// Обгортка, щоб твій ThemeContext піднявся над MUI темою
function AppInner() {
  return <Shell />;
}

export default function App() {
  return (
    <ModeProvider>
      <AppInner />
    </ModeProvider>
  );
}