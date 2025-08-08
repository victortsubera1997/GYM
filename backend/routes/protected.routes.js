// routes/protected.routes.js
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, (req, res) => {
  res.json({
    message: '🔐 Захищений маршрут доступний',
    user: req.user,
  });
});

export default router;