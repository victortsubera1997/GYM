import Membership from '../models/Membership.model.js';

// Створити новий абонемент
export const createMembership = async (req, res) => {
  try {
    const { name, price, durationDays, visits } = req.body;

    if (!name || price == null || durationDays == null) {
      return res.status(400).json({ message: 'Заповніть обов’язкові поля: name, price, durationDays' });
    }

    const membership = new Membership({
      name,
      price,
      durationDays,
      visits: visits || 0,
    });

    await membership.save();

    res.status(201).json({ message: 'Абонемент створено', membership });
  } catch (error) {
    console.error('Помилка створення абонементу:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// Отримати всі абонементи
export const getMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.json({ memberships });
  } catch (error) {
    console.error('Помилка отримання абонементів:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// Оновити абонемент за ID
export const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, durationDays, visits } = req.body;

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ message: 'Абонемент не знайдено' });
    }

    if (name !== undefined) membership.name = name;
    if (price !== undefined) membership.price = price;
    if (durationDays !== undefined) membership.durationDays = durationDays;
    if (visits !== undefined) membership.visits = visits;

    await membership.save();

    res.json({ message: 'Абонемент оновлено', membership });
  } catch (error) {
    console.error('Помилка оновлення абонементу:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// Видалити абонемент за ID
export const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ message: 'Абонемент не знайдено' });
    }

    await membership.deleteOne();

    res.json({ message: 'Абонемент видалено' });
  } catch (error) {
    console.error('Помилка видалення абонементу:', error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};