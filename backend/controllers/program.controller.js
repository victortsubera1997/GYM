import mongoose from 'mongoose';
import ProgramLog from '../models/ProgramLog.model.js';

export const getLogs = async (req, res) => {
  try {
    const items = await ProgramLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    console.error('getLogs error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

export const createLog = async (req, res) => {
  try {
    const { title, notes, exercises } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title обовʼязковий' });

    const item = await ProgramLog.create({
      user: req.user._id,
      title,
      notes: notes || '',
      exercises: Array.isArray(exercises) ? exercises : [],
    });

    res.status(201).json({ item });
  } catch (e) {
    console.error('createLog error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

export const deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Невірний id' });
    }

    const doc = await ProgramLog.findOne({ _id: id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Запис не знайдено' });

    await doc.deleteOne();
    res.json({ message: 'Видалено' });
  } catch (e) {
    console.error('deleteLog error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};