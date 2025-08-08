import React, { useRef, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useZxing } from 'react-zxing';
import {
  Box, Typography, Paper, Button, Snackbar, Alert, TextField, Divider, Chip,
} from '@mui/material';

export default function CheckinQR() {
  const { isAuthenticated } = useAuth();
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState('');
  const [user, setUser] = useState(null);
  const lastScanAtRef = useRef(0);
  const processingRef = useRef(false);

  const openSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  const doCheckin = async (code) => {
    if (!code || processingRef.current) return;
    const now = Date.now();
    if (now - lastScanAtRef.current < 1200) return; // анти-дабл скан
    lastScanAtRef.current = now;

    processingRef.current = true;
    setLoading(true);
    setLastCode(code);

    try {
      // Основний шлях — тіло { code } на /auth/checkin/qr
      const res = await api.post('/auth/checkin/qr', { code });
      setUser(res.data.user || null);
      openSnack('Check-in успішний (QR)', 'success');
    } catch (e) {
      // Резервний шлях: /auth/checkin/:code
      try {
        const res = await api.post(`/auth/checkin/${encodeURIComponent(code)}`);
        setUser(res.data.user || null);
        openSnack('Check-in успішний (QR)', 'success');
      } catch (e2) {
        const msg = e2?.response?.data?.message || e?.response?.data?.message || 'Помилка check-in';
        openSnack(msg, 'error');
        setUser(null);
      }
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  const { ref } = useZxing({
    onDecodeResult(decoded) {
      const code = decoded.getText();
      doCheckin(code.trim());
    },
    onDecodeError() {
      // ігноруємо дрібні помилки декодування, щоб не спамити
    },
    timeBetweenDecodingAttempts: 200,
  });

  const handleManual = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = String(form.get('code') || '').trim();
    if (!code) return openSnack('Введіть код', 'warning');
    await doCheckin(code);
  };

  const fmtDate = (d) => (d ? String(d).substring(0, 10) : '');

  const status = (() => {
    if (!user?.membership || !user?.membershipStart || !user?.membershipEnd) {
      return { label: 'Без абонемента', color: 'default' };
    }
    const now = new Date();
    const start = new Date(user.membershipStart);
    const end = new Date(user.membershipEnd);
    if (now < start) return { label: 'Ще не активний', color: 'warning' };
    if (now > end) return { label: 'Прострочений', color: 'error' };
    return { label: 'Активний', color: 'success' };
  })();

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>QR Check-in</Typography>

      {!isAuthenticated && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Потрібна авторизація адміністратора.
        </Alert>
      )}

      <Paper sx={{ p: 2, display: 'grid', gap: 2 }}>
        <Typography variant="subtitle1">Сканер</Typography>
        <Box sx={{ maxWidth: 560 }}>
          <video ref={ref} style={{ width: '100%', borderRadius: 8 }} />
        </Box>

        <Divider />

        <form onSubmit={handleManual}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              name="code"
              label="Або введіть код вручну"
              defaultValue={lastCode}
              size="small"
            />
            <Button type="submit" variant="contained" disabled={loading}>
              Провести вручну
            </Button>
          </Box>
        </form>
      </Paper>

      {user && (
        <Paper sx={{ p: 2, mt: 2, display: 'grid', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{user.name} — {user.phone}</Typography>
            <Chip size="small" label={status.label} color={status.color} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Абонемент: <b>{user.membership ? user.membership.name : '—'}</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Діє: {fmtDate(user.membershipStart)} — {fmtDate(user.membershipEnd)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Залишок відвідувань: <b>{user?.visitsRemaining ?? (user?.membership?.visits > 0 ? 0 : '∞')}</b>
          </Typography>
        </Paper>
      )}

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
