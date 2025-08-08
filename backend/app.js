import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import membershipRoutes from './routes/membership.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8081',
  'http://192.168.100.103:8081',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS помилка: Доступ заборонено для origin ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// healthcheck
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// маршрути
app.use('/api/auth', authRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/admin', adminRoutes);

export default app;
