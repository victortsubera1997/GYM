import Schedule from '../models/Schedule.model.js';

export const getMySchedule = async (req, res) => {
  try {
    const items = await Schedule.find({ user: req.user._id })
      .sort({ dateTime: 1 })
      .lean();
    res.json({ items });
  } catch (e) {
    console.error('getMySchedule error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { title, date, time, dateTime, notes } = req.body || {};
    let dt;
    if (dateTime) dt = new Date(dateTime);
    else if (date) {
      const t = time || '09:00';
      dt = new Date(`${date}T${t}:00`);
    }
    if (!title || !dt || isNaN(dt.getTime())) {
      return res.status(400).json({ message: 'Невірні дані: title і дата/час обовʼязкові' });
    }

    const item = await Schedule.create({
      user: req.user._id,
      title,
      dateTime: dt,
      notes: notes || '',
    });

    res.status(201).json({ item });
  } catch (e) {
    console.error('createSchedule error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Schedule.findOne({ _id: id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Елемент не знайдено' });

    await doc.deleteOne();
    res.json({ message: 'Видалено' });
  } catch (e) {
    console.error('deleteSchedule error:', e);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};