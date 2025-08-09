// backend/app.js
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',   // admin-panel локально
  'http://localhost:8081',   // Expo web
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS помилка: Доступ заборонено для origin ${origin}`), false);
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

// Опціонально (якщо користуєшся адмінкою/тарифами)
app.use('/api/memberships', membershipRoutes);
app.use('/api/admin', adminRoutes);

export default app;