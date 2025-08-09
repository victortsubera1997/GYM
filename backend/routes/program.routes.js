import express from 'express';
import protect from '../middlewares/auth.middleware.js';
import {
  getLogs,
  createLog,
  deleteLog,
} from '../controllers/program.controller.js';

const router = express.Router();

router.use(protect);

// GET /api/program/logs
router.get('/logs', getLogs);

// POST /api/program/logs
router.post('/logs', createLog);

// DELETE /api/program/logs/:id
router.delete('/logs/:id', deleteLog);

export default router;