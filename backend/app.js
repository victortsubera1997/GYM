import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import adminRoutes from './routes/admin.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';  // ✅ додано
import programRoutes from './routes/program.routes.js';    // ✅ додано

const app = express();

const allowedOrigins = [
  'http://localhost:3000',           // admin-panel локально
  'http://localhost:8081',           // Expo web
  // ДОДАЙ СЮДИ свій IP (якщо відкриваєш з інших пристроїв у мережі):
  // 'http://192.168.100.103:3000',
  // 'http://192.168.100.103:8081',
];

app.use(cors({
  origin(origin, callback) {
    // Дозволяємо запити без Origin (мобільний додаток/Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const msg = `CORS помилка: Доступ заборонено для origin ${origin}`;
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Healthcheck
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Основні маршрути
app.use('/api/auth', authRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Нові маршрути (щоденник та розклад)
app.use('/api/program', programRoutes);
app.use('/api/schedule', scheduleRoutes);

export default app;