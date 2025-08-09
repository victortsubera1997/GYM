import express from 'express';
import protect, { adminOnly } from '../middlewares/auth.middleware.js';

import {
  // базове
  register,
  login,
  getProfile,
  updateProfile,
  getMyData,

  // вага / налаштування приватності
  addWeightEntry,
  listWeightLog,
  deleteWeightEntry,
  updateSettingsPrivacy,

  // адмін
  getAllUsers,
  searchUsers,
  assignMembership,
  deleteUser,

  // check-in
  checkin,
  checkinByQR,
  checkinByQRParam,
} from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * ПУБЛІЧНЕ
 */
router.post('/register', register);
router.post('/login', login);

/**
 * ПРОФІЛЬ КОРИСТУВАЧА
 */
router.get('/profile', protect, getProfile);      // повертає user з bodyMetrics, settings, weightLog (скорочено або з пагінацією)
router.put('/profile', protect, updateProfile);   // оновлює name/phone/password + bodyMetrics (height/weight/etc.)
router.get('/me', protect, getMyData);            // мобільний “лайт” профіль (у т.ч. checkinCode)

/**
 * ВАГА / НАЛАШТУВАННЯ ПРИВАТНОСТІ
 */
router.post('/profile/weight', protect, addWeightEntry);          // { date?: ISO, weightKg: number }
router.get('/profile/weight', protect, listWeightLog);            // ?limit=...&from=...&to=...
router.delete('/profile/weight/:entryId', protect, deleteWeightEntry);

router.patch('/profile/settings', protect, updateSettingsPrivacy); // { privacy: 'public'|'friends'|'private' }

/**
 * АДМІН
 */
router.get('/users', protect, adminOnly, getAllUsers);
// ВАЖЛИВО: search вище за /users/:id, щоби не конфліктувало зі статичним сегментом
router.get('/users/search', protect, adminOnly, searchUsers);
router.post('/assign-membership', protect, adminOnly, assignMembership);
router.delete('/users/:id', protect, adminOnly, deleteUser);

/**
 * CHECK-IN
 */
router.post('/checkin', protect, adminOnly, checkin);
router.post('/checkin/qr', protect, adminOnly, checkinByQR);
router.post('/checkin/:code', protect, adminOnly, checkinByQRParam);

export default router;