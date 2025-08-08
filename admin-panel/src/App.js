import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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
import { ThemeProvider, useThemeMode } from './context/ThemeContext';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Speed';
import GroupIcon from '@mui/icons-material/Group';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const drawerWidth = 240;

const menuItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, to: '/' },
  { label: 'Users', icon: <GroupIcon />, to: '/users' },
  { label: 'Memberships', icon: <CardMembershipIcon />, to: '/memberships' },
  { label: 'Check-in', icon: <QrCodeScannerIcon />, to: '/checkin' },
  { label: 'Scan QR', icon: <CameraAltIcon />, to: '/checkin-qr' },
  { label: 'Профіль', icon: <AccountCircleIcon />, to: '/profile' },
];

const appleDarkPalette = {
  mode: 'dark',
  primary: { main: '#0a84ff' },
  background: { default: '#1e1e1e', paper: '#232323' },
  text: { primary: '#f5f5f7', secondary: '#a1a1aa' },
  divider: 'rgba(255,255,255,0.08)',
};
const appleLightPalette = {
  mode: 'light',
  primary: { main: '#007aff' },
  background: { default: '#f5f5f7', paper: '#fff' },
  text: { primary: '#1d1d1f', secondary: '#6e6e73' },
};

function MainApp() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const muiTheme = React.useMemo(
    () =>
      createTheme({
        palette: mode === 'dark' ? appleDarkPalette : appleLightPalette,
        shape: { borderRadius: 12 },
        typography: {
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          fontWeightRegular: 500,
        },
      }),
    [mode]
  );
  const location = useLocation();
  const currentPath = location.pathname;

  const drawer = (
    <div>
      <Toolbar sx={{ minHeight: 56 }} />
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              component={Link}
              to={item.to}
              selected={currentPath === item.to}
              onClick={() => setMobileOpen(false)}
              sx={{ mb: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Admin Panel</Typography>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {isAuthenticated && (
              <>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Привіт, {user?.name || 'Користувач'}
                </Typography>
                <Button color="inherit" onClick={() => { logout(); window.location.href = '/login'; }}>
                  Вийти
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8, ml: { sm: `${drawerWidth}px` } }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            <Route path="/memberships" element={<PrivateRoute><Memberships /></PrivateRoute>} />
            <Route path="/checkin" element={<PrivateRoute><Checkin /></PrivateRoute>} />
            <Route path="/checkin-qr" element={<PrivateRoute><CheckinQR /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </Box>
      </Box>
    </MuiThemeProvider>
  );
}

function WaitTheme({ children }) {
  const { mode } = useThemeMode();
  if (!mode) return null;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <WaitTheme>
        <MainApp />
      </WaitTheme>
    </ThemeProvider>
  );
}
