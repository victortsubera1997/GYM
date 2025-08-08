import React, { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function Memberships() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create/Edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [visits, setVisits] = useState('');

  // Delete confirm dialog
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Actions loading
  const [actionLoading, setActionLoading] = useState(false);

  // UI: search + toasts
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const openSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await api.get('/memberships');
      setMemberships(res.data.memberships || []);
    } catch (e) {
      console.error(e);
      openSnack('Не вдалося завантажити абонементи', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (membership = null) => {
    setEditingMembership(membership);
    if (membership) {
      setName(membership.name || '');
      setPrice(membership.price ?? '');
      setDurationDays(membership.durationDays ?? '');
      setVisits(membership.visits ?? '');
    } else {
      setName('');
      setPrice('');
      setDurationDays('');
      setVisits('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMembership(null);
  };

  const handleSave = async () => {
    if (!name.trim() || price === '' || durationDays === '') {
      openSnack('Заповніть назву, ціну та тривалість', 'warning');
      return;
    }

    const payload = {
      name: name.trim(),
      price: Number(price),
      durationDays: Number(durationDays),
      visits: visits === '' ? 0 : Number(visits),
    };

    setActionLoading(true);
    try {
      if (editingMembership) {
        await api.put(`/memberships/${editingMembership._id}`, payload);
        openSnack('Абонемент оновлено', 'success');
      } else {
        await api.post('/memberships', payload);
        openSnack('Абонемент створено', 'success');
      }
      await fetchMemberships();
      handleCloseDialog();
    } catch (error) {
      console.error(error);
      openSnack('Помилка при збереженні абонементу', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = (membership) => {
    setDeleteTarget(membership);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/memberships/${deleteTarget._id}`);
      openSnack('Абонемент видалено', 'success');
      await fetchMemberships();
    } catch (error) {
      console.error(error);
      openSnack('Помилка при видаленні абонементу', 'error');
    } finally {
      setActionLoading(false);
      setOpenDelete(false);
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return memberships;
    return memberships.filter(m =>
      (m.name || '').toLowerCase().includes(q)
      || String(m.price ?? '').toLowerCase().includes(q)
      || String(m.durationDays ?? '').toLowerCase().includes(q)
      || String(m.visits ?? '').toLowerCase().includes(q)
    );
  }, [memberships, search]);

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4">Memberships</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            placeholder="Пошук: назва / ціна / дні / відвідування"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
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
            sx={{ minWidth: 320 }}
          />
          <Button variant="contained" onClick={() => handleOpenDialog()} disabled={actionLoading}>
            Додати абонемент
          </Button>
        </Box>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Назва</TableCell>
            <TableCell>Ціна</TableCell>
            <TableCell>Тривалість (дні)</TableCell>
            <TableCell>Відвідування</TableCell>
            <TableCell width={220}>Дії</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map(m => (
            <TableRow key={m._id}>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.price}</TableCell>
              <TableCell>{m.durationDays}</TableCell>
              <TableCell>{m.visits}</TableCell>
              <TableCell>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenDialog(m)}
                  sx={{ mr: 1 }}
                  disabled={actionLoading}
                >
                  Редагувати
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => confirmDelete(m)}
                  disabled={actionLoading}
                >
                  Видалити
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                Нічого не знайдено
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create/Edit dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingMembership ? 'Редагувати абонемент' : 'Додати абонемент'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 360, mt: 1 }}>
          <TextField
            label="Назва"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={actionLoading}
          />
          <TextField
            label="Ціна"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            disabled={actionLoading}
            inputProps={{ min: 0, step: 1 }}
          />
          <TextField
            label="Тривалість (дні)"
            type="number"
            value={durationDays}
            onChange={e => setDurationDays(e.target.value)}
            required
            disabled={actionLoading}
            inputProps={{ min: 1, step: 1 }}
          />
          <TextField
            label="Відвідування"
            type="number"
            value={visits}
            onChange={e => setVisits(e.target.value)}
            helperText="Необов’язково (0 — необмежено або не рахуємо)"
            disabled={actionLoading}
            inputProps={{ min: 0, step: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={actionLoading}>Скасувати</Button>
          <Button variant="contained" onClick={handleSave} disabled={actionLoading}>
            {editingMembership ? 'Зберегти' : 'Додати'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Підтвердіть видалення</DialogTitle>
        <DialogContent>
          Ви дійсно хочете видалити абонемент
          {' '}
          <b>{deleteTarget?.name}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} disabled={actionLoading}>Скасувати</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={actionLoading}>
            Видалити
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toasts */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
