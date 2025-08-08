import express from 'express';
import protect, { adminOnly } from '../middlewares/auth.middleware.js';
import User from '../models/User.model.js';

const router = express.Router();

/**
 * PUT /api/admin/make-admin/:id
 * Підвищити існуючого користувача до admin.
 */
router.put('/make-admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Користувача не знайдено' });
    u.role = 'admin';
    await u.save();
    res.json({ message: 'Користувач отримав роль admin' });
  } catch (e) {
    console.error('make-admin error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

/**
 * PUT /api/admin/revoke-admin/:id
 * Забрати роль admin → client.
 */
router.put('/revoke-admin/:id', protect, adminOnly, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Користувача не знайдено' });
    u.role = 'client';
    await u.save();
    res.json({ message: 'Роль admin знято' });
  } catch (e) {
    console.error('revoke-admin error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
});

export default router;
