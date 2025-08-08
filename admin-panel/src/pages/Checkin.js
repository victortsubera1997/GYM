import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import {
  Box, Typography, TextField, Button, Paper, Divider,
  Snackbar, Alert, List, ListItemButton, ListItemText, Chip
} from '@mui/material';

export default function Checkin() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const openSnack = (m, s = 'success') => setSnack({ open: true, message: m, severity: s });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get('/auth/users/search', { params: { q: query.trim() } });
      setResults(res.data.users || []);
      setSelected(null);
    } catch (e) {
      console.error(e);
      openSnack('Помилка пошуку', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pick = (u) => setSelected(u);

  const statusInfo = (u) => {
    if (!u?.membership || !u?.membershipStart || !u?.membershipEnd) {
      return { label: 'Без абонемента', color: 'default' };
    }
    const now = new Date();
    const start = new Date(u.membershipStart);
    const end = new Date(u.membershipEnd);
    if (now < start) return { label: 'Ще не активний', color: 'warning' };
    if (now > end) return { label: 'Прострочений', color: 'error' };
    return { label: 'Активний', color: 'success' };
  };

  const doCheckin = async () => {
    if (!selected?._id) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/checkin', { userId: selected._id });
      const u = res.data.user;
      setSelected(u);
      openSnack('Check-in успішний', 'success');
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Помилка check-in';
      openSnack(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d) => (d ? String(d).substring(0, 10) : '');

  const stat = statusInfo(selected);

  const visitsText = selected
    ? (selected?.membership?.visits > 0
        ? (selected?.visitsRemaining ?? selected?.membership?.visits)
        : '∞')
    : '';

  const canCheckin =
    selected &&
    stat.color === 'success' &&
    (selected?.membership?.visits <= 0 || (selected?.visitsRemaining ?? 0) > 0);

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Check-in</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="Пошук (ім'я або телефон)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            fullWidth
          />
          <Button variant="contained" onClick={search} disabled={loading}>Шукати</Button>
        </Box>

        <List dense sx={{ mt: 1 }}>
          {results.map((u) => (
            <ListItemButton key={u._id} onClick={() => pick(u)} selected={selected?._id === u._id}>
              <ListItemText
                primary={`${u.name} (${u.phone})`}
                secondary={u.membership ? u.membership.name : 'Без абонемента'}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {selected && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ mr: 1 }}>
              {selected.name} — {selected.phone}
            </Typography>
            <Chip label={stat.label} color={stat.color} size="small" />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: 2 }}>
            <TextField
              label="Абонемент"
              value={selected.membership ? selected.membership.name : '—'}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Відвідування (залишилось)"
              value={selected.membership ? visitsText : '—'}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Початок"
              value={selected.membershipStart ? fmtDate(selected.membershipStart) : '—'}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Кінець"
              value={selected.membershipEnd ? fmtDate(selected.membershipEnd) : '—'}
              InputProps={{ readOnly: true }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={doCheckin}
              disabled={!canCheckin || loading}
            >
              Провести Check-in
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
