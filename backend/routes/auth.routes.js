import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  assignMembership,
  deleteUser,
  searchUsers,
  checkin,
  getMyData,
  checkinByQR,
  checkinByQRParam,
} from '../controllers/auth.controller.js';
import protect, { adminOnly } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Публічне
router.post('/register', register);
router.post('/login', login);

// Профіль
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Дані для мобільного профілю (з checkinCode)
router.get('/me', protect, getMyData);

// Адмін
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/search', protect, adminOnly, searchUsers);
router.post('/assign-membership', protect, adminOnly, assignMembership);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Check-in
router.post('/checkin', protect, adminOnly, checkin);
router.post('/checkin/qr', protect, adminOnly, checkinByQR);
router.post('/checkin/:code', protect, adminOnly, checkinByQRParam);

export default router;
