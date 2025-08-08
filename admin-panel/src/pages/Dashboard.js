import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
  Typography,
  Box,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import CountUp from 'react-countup';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usersCount: 0,
    membershipsCount: 0,
  });
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, membershipsRes] = await Promise.all([
          api.get('/auth/users'),
          api.get('/memberships'),
        ]);

        const usersData = usersRes.data.users;
        const membershipsData = membershipsRes.data.memberships;

        setStats({
          usersCount: usersData.length,
          membershipsCount: membershipsData.length,
        });
        setUsers(usersData);
        setMemberships(membershipsData);
        setLoading(false);
      } catch (err) {
        setError('Помилка завантаження статистики');
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress size={60} />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Typography color="error" variant="h6" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Layout>
    );
  }

  // Кількість користувачів на кожен абонемент
  const membershipUserCounts = memberships.map(m => ({
    name: m.name,
    count: users.filter(u => u.membership?._id === m._id).length,
  }));

  // Розподіл користувачів: з абонементом і без
  const usersWithMembership = users.filter(u => u.membership).length;
  const usersWithoutMembership = users.length - usersWithMembership;

  const pieData = [
    { name: 'З абонементом', value: usersWithMembership },
    { name: 'Без абонементу', value: usersWithoutMembership },
  ];

  const cardStyle = {
    p: 4,
    borderRadius: 3,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    },
  };

  const titleStyle = {
    mb: 1,
    fontWeight: 'bold',
    color: '#555',
  };

  const numberStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#1976d2',
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={cardStyle} elevation={3}>
            <Typography sx={titleStyle}>Користувачі</Typography>
            <Typography sx={numberStyle}>
              <CountUp end={stats.usersCount} duration={1.5} />
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={cardStyle} elevation={3}>
            <Typography sx={titleStyle}>Абонементи</Typography>
            <Typography sx={numberStyle}>
              <CountUp end={stats.membershipsCount} duration={1.5} />
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Користувачі за типами абонементів
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={membershipUserCounts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 1 }}>
            <Typography variant="h6" gutterBottom>
              Розподіл користувачів
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
}