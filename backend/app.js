// backend/app.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',           // admin-panel локально
  'http://localhost:8081',           // Expo web
  // ДОДАЙ СЮДИ свій IP для браузера на інших пристроях (адмінка):
  // 'http://192.168.100.103:3000',
  // і для Expo web/dev:
  // 'http://192.168.100.103:8081',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // Postman/curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const msg = `CORS помилка: Доступ заборонено для origin ${origin}`;
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// --- healthcheck (для тесту з телефону/браузера)
app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// --- твої маршрути
app.use('/api/auth', authRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/admin', adminRoutes);

export default app;