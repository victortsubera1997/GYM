import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import {
  getMySchedule,
  createSchedule,
  deleteSchedule,
} from '../controllers/schedule.controller.js';

const router = express.Router();

router.use(protect);

router.get('/', getMySchedule);
router.post('/', createSchedule);
router.delete('/:id', deleteSchedule);

export default router;