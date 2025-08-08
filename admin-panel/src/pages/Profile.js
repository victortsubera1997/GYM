import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Оновити локальні поля, якщо user оновився
  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const payload = { name, phone };
      if (password) payload.password = password;

      await api.put('/auth/profile', payload);

      setSuccessMsg('Профіль оновлено успішно');
      
      // Логаут після оновлення, щоб оновити токен
      logout();
      window.location.href = '/login';

    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Помилка оновлення профілю');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Профіль користувача
      </Typography>
      <Box
        component="form"
        sx={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 2 }}
        onSubmit={handleSubmit}
      >
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        {successMsg && <Alert severity="success">{successMsg}</Alert>}

        <TextField
          label="Ім’я"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <TextField
          label="Новий пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Залиште порожнім, якщо не хочете змінювати"
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Оновлення...' : 'Оновити профіль'}
        </Button>
      </Box>
    </Layout>
  );
}