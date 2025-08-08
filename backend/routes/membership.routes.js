import express from 'express';
import {
  createMembership,
  getMemberships,
  updateMembership,
  deleteMembership,
} from '../controllers/membership.controller.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

// Створити новий абонемент (захищено)
router.post('/', protect, createMembership);

// Отримати всі абонементи (захищено)
router.get('/', protect, getMemberships);

// Оновити абонемент за ID (захищено)
router.put('/:id', protect, updateMembership);

// Видалити абонемент за ID (захищено)
router.delete('/:id', protect, deleteMembership);

export default router;