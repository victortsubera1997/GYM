// src/pages/Users.js
import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
  Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Select, MenuItem, FormControl, CircularProgress, Box, TextField, Button,
  TablePagination, Snackbar, Alert, InputAdornment, IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

export default function Users() {
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [deleting, setDeleting] = useState({});
  const [adding, setAdding] = useState(false);

  // UI extras
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });

  const openSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  const loadUsersAndMemberships = async () => {
    setLoading(true);
    try {
      const [usersRes, membershipsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/memberships'),
      ]);
      const usersWithFormattedDates = usersRes.data.users.map(user => ({
        ...user,
        membershipStart: user.membershipStart ? user.membershipStart.substring(0, 10) : '',
        membershipEnd: user.membershipEnd ? user.membershipEnd.substring(0, 10) : '',
        membershipId: user.membership?._id || '',
      }));
      setUsers(usersWithFormattedDates);
      setMemberships(membershipsRes.data.memberships);
    } catch (error) {
      console.error('Помилка завантаження користувачів або абонементів', error);
      openSnack('Не вдалося завантажити дані', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndMemberships();
  }, []);

  const handleFieldChange = (userId, field, value) => {
    setUsers(users.map(user => {
      if (user._id !== userId) return user;

      if (field === 'membershipId') {
        const selectedMembership = memberships.find(m => m._id === value);
        if (!selectedMembership) {
          return {
            ...user,
            membershipId: '',
            membershipStart: '',
            membershipEnd: '',
          };
        }
        const today = new Date();
        const isoToday = today.toISOString().substring(0, 10);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + (selectedMembership.durationDays || 30));
        const isoEndDate = endDate.toISOString().substring(0, 10);

        return {
          ...user,
          membershipId: value,
          membershipStart: isoToday,
          membershipEnd: isoEndDate,
        };
      } else {
        return { ...user, [field]: value };
      }
    }));
  };

  const handleSave = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setSaving(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await api.post('/auth/assign-membership', {
        userId,
        membershipId: user.membershipId || null,
        membershipStart: user.membershipStart || null,
        membershipEnd: user.membershipEnd || null,
      });

      const updatedUser = res.data.user;
      setUsers(prevUsers =>
        prevUsers.map(u => u._id === userId ? {
          ...u,
          membershipStart: updatedUser.membershipStart ? updatedUser.membershipStart.substring(0, 10) : '',
          membershipEnd: updatedUser.membershipEnd ? updatedUser.membershipEnd.substring(0, 10) : '',
          membershipId: updatedUser.membership?._id || '',
          membership: updatedUser.membership || null,
        } : u)
      );

      openSnack('Дані успішно збережено', 'success');
    } catch (error) {
      console.error(error);
      openSnack('Помилка збереження', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Ви дійсно хочете видалити користувача "${userName}"?`)) {
      return;
    }
    setDeleting(prev => ({ ...prev, [userId]: true }));
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      openSnack('Користувача видалено', 'success');
    } catch (error) {
      console.error(error);
      openSnack('Помилка видалення', 'error');
    } finally {
      setDeleting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleNewUserChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!newUser.name || !newUser.phone || !newUser.password) {
      openSnack('Заповніть ім’я, телефон та пароль', 'warning');
      return;
    }
    setAdding(true);
    try {
      const payload = {
        name: newUser.name.trim(),
        phone: newUser.phone.trim(),
        password: newUser.password,
      };
      if (newUser.email && newUser.email.trim() !== '') {
        payload.email = newUser.email.trim();
      }

      await api.post('/auth/register', payload);
      await loadUsersAndMemberships();
      setNewUser({ name: '', phone: '', email: '', password: '' });
      openSnack('Користувача додано успішно', 'success');
    } catch (error) {
      console.error(error);
      openSnack('Помилка додавання користувача', 'error');
    } finally {
      setAdding(false);
    }
  };

  // ----- Фільтрація + пагінація (клієнтська) -----
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.membership?.name || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const pagedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // --- JSX РЕНДЕР ---
  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Users</Typography>

      {/* Панель: додати + пошук */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        alignItems: 'start',
        mb: 3,
      }}>
        {/* Додати нового користувача */}
        <Box sx={{
          p: 2, border: '1px solid #ccc', borderRadius: 2, maxWidth: 600,
          background: theme.palette.background.paper,
        }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '1.15rem' }}
          >
            Додати нового користувача
          </Typography>
          <TextField
            label="Ім'я"
            value={newUser.name}
            onChange={e => handleNewUserChange('name', e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Телефон"
            value={newUser.phone}
            onChange={e => handleNewUserChange('phone', e.target.value)}
            fullWidth
            margin="normal"
            placeholder="+421 900 000 000"
            inputProps={{ inputMode: 'tel' }}
          />
          <TextField
            label="Email (необов’язково)"
            value={newUser.email}
            onChange={e => handleNewUserChange('email', e.target.value)}
            fullWidth
            margin="normal"
            type="email"
          />
          <TextField
            label="Пароль"
            type="password"
            value={newUser.password}
            onChange={e => handleNewUserChange('password', e.target.value)}
            fullWidth
            margin="normal"
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={adding}
            >
              {adding ? 'Додавання...' : 'Додати користувача'}
            </Button>
            <Button
              variant="text"
              onClick={() => setNewUser({ name: '', phone: '', email: '', password: '' })}
              disabled={adding}
            >
              Очистити
            </Button>
          </Box>
        </Box>

        {/* Пошук */}
        <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, background: theme.palette.background.paper }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1.15rem' }}>
            Пошук
          </Typography>
          <TextField
            placeholder="Ім'я, телефон або абонемент..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Знайдено: {filteredUsers.length}
          </Typography>
        </Box>
      </Box>

      {/* Таблиця */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Membership</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Assign Membership</TableCell>
            <TableCell>Save Changes</TableCell>
            <TableCell>Delete User</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagedUsers.map(user => (
            <TableRow key={user._id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>{user.membership ? user.membership.name : 'No membership'}</TableCell>
              <TableCell>
                <TextField
                  type="date"
                  value={user.membershipStart}
                  onChange={e => handleFieldChange(user._id, 'membershipStart', e.target.value)}
                  disabled={!user.membershipId}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="date"
                  value={user.membershipEnd}
                  onChange={e => handleFieldChange(user._id, 'membershipEnd', e.target.value)}
                  disabled={!user.membershipId}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <FormControl fullWidth>
                  <Select
                    value={user.membershipId}
                    onChange={e => handleFieldChange(user._id, 'membershipId', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value=''>None</MenuItem>
                    {memberships.map(m => (
                      <MenuItem key={m._id} value={m._id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  onClick={() => handleSave(user._id)}
                  disabled={!!saving[user._id]}
                >
                  {saving[user._id] ? 'Збереження...' : 'Зберегти'}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDelete(user._id, user.name)}
                  disabled={!!deleting[user._id]}
                >
                  {deleting[user._id] ? 'Видалення...' : 'Видалити'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {pagedUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" style={{ color: theme.palette.text.secondary }}>
                Нічого не знайдено
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Пагінація */}
      <TablePagination
        component="div"
        count={filteredUsers.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Тости */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={closeSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
