// backend/controllers/auth.controller.js
import User from '../models/User.model.js';
import Membership from '../models/Membership.model.js';
import jwt from 'jsonwebtoken';

// ===== helper: sign token =====
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Small helpers
const parseNumber = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));
const isFiniteNum = (n) => typeof n === 'number' && Number.isFinite(n);

// ---- мапінг в bodyMetrics під нову схему ----
const mapBodyMetricsPatch = (srcRaw = {}) => {
  // підтримуємо старі ключі теж (armsCm → bicepsCm, thighsCm → thighCm, calvesCm → calfCm)
  const src = srcRaw.bodyMetrics ? srcRaw.bodyMetrics : srcRaw;

  const num = (k) => {
    const v = parseNumber(src[k]);
    return isFiniteNum(v) ? v : undefined;
  };

  const patch = {};

  // базові
  if (num('heightCm') !== undefined) patch.heightCm = num('heightCm');

  // вага: приймаємо як weightKg або currentWeightKg
  const incomingWeight =
    num('currentWeightKg') !== undefined ? num('currentWeightKg') : num('weightKg');
  if (incomingWeight !== undefined) patch.currentWeightKg = incomingWeight;

  if (num('goalWeightKg') !== undefined) patch.goalWeightKg = num('goalWeightKg');

  // виміри (підтримка старих назв)
  if (num('neckCm') !== undefined) patch.neckCm = num('neckCm');
  if (num('chestCm') !== undefined) patch.chestCm = num('chestCm');
  if (num('waistCm') !== undefined) patch.waistCm = num('waistCm');
  if (num('hipsCm') !== undefined) patch.hipsCm = num('hipsCm');

  const biceps = num('bicepsCm') ?? num('armsCm');
  if (biceps !== undefined) patch.bicepsCm = biceps;

  const thigh = num('thighCm') ?? num('thighsCm');
  if (thigh !== undefined) patch.thighCm = thigh;

  const calf = num('calfCm') ?? num('calvesCm');
  if (calf !== undefined) patch.calfCm = calf;

  // стать (не числове)
  if (src.sex !== undefined) {
    const allowed = ['male', 'female', 'other', null];
    if (allowed.includes(src.sex)) patch.sex = src.sex;
  }

  // 🎯 важливо: не перетворюємо "age" у birthday автоматично, бо це неточно.
  // Якщо буде `birthday`, можемо зберегти:
  if (src.birthday) {
    const d = new Date(src.birthday);
    if (!isNaN(d.getTime())) patch.birthday = d;
  }

  return patch;
};

// ===== Реєстрація =====
export const register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ message: 'Будь ласка, заповніть всі обов’язкові поля' });

    const existingUser = await User.findOne({ phone });
    if (existingUser)
      return res.status(400).json({ message: 'Користувач з таким номером вже існує' });

    const user = new User({ name, phone, email, password });
    await user.save(); // генерується checkinCode + хеш пароля

    const token = signToken(user._id);
    res.status(201).json({
      message: 'Реєстрація успішна',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        membership: user.membership,
        membershipStart: user.membershipStart,
        membershipEnd: user.membershipEnd,
        visitsRemaining: user.visitsRemaining,
        checkinCode: user.checkinCode,
        bodyMetrics: user.bodyMetrics,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error('Помилка реєстрації:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Логін =====
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ message: 'Заповніть всі поля' });

    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Користувача не знайдено' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Невірний пароль' });

    const token = signToken(user._id);
    res.json({
      message: 'Вхід успішний',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        membership: user.membership,
        membershipStart: user.membershipStart,
        membershipEnd: user.membershipEnd,
        visitsRemaining: user.visitsRemaining,
        checkinCode: user.checkinCode,
        bodyMetrics: user.bodyMetrics,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error('Помилка логіну:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Профіль поточного користувача =====
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('membership');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    // повертати вагу коротко (останні 10 записів)
    const weightLogPreview = (user.weightLog || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({ user: { ...user.toObject(), weightLog: weightLogPreview } });
  } catch (error) {
    console.error('Помилка отримання профілю:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Зручний профіль для мобільного (включно з checkinCode) =====
export const getMyData = async (req, res) => {
  try {
    const u = await User.findById(req.user._id)
      .select('-password')
      .populate('membership');
    if (!u) return res.status(404).json({ message: 'Користувача не знайдено' });

    const weightLogPreview = (u.weightLog || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.json({
      id: u._id,
      name: u.name,
      phone: u.phone,
      membership: u.membership,
      membershipStart: u.membershipStart,
      membershipEnd: u.membershipEnd,
      visitsRemaining: u.visitsRemaining,
      checkinCode: u.checkinCode,
      bodyMetrics: u.bodyMetrics,
      settings: u.settings,
      weightLog: weightLogPreview,
    });
  } catch (error) {
    console.error('Помилка отримання даних користувача:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Оновити профіль =====
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, phone, password } = req.body;

    if (!name || !phone)
      return res.status(400).json({ message: 'Ім’я і телефон обов’язкові' });

    const exists = await User.findOne({ phone, _id: { $ne: userId } });
    if (exists) return res.status(400).json({ message: 'Телефон вже використовується іншим користувачем' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    user.name = name;
    user.phone = phone;
    if (password) user.password = password;

    // --- оновлення антропометрії
    const metricsPatch = mapBodyMetricsPatch(req.body);
    let pushedWeight = null;
    if (Object.keys(metricsPatch).length) {
      // якщо прийшла поточна вага — додамо у weightLog
      if (metricsPatch.currentWeightKg !== undefined) {
        pushedWeight = metricsPatch.currentWeightKg;
        user.weightLog = user.weightLog || [];
        user.weightLog.push({
          date: new Date(),
          weightKg: pushedWeight,
          note: 'manual update',
        });
      }
      user.bodyMetrics = {
        ...(user.bodyMetrics || {}),
        ...metricsPatch,
      };
    }

    await user.save();

    res.json({
      message: 'Профіль оновлено',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        bodyMetrics: user.bodyMetrics,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error('Помилка оновлення профілю:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Додати запис ваги =====
export const addWeightEntry = async (req, res) => {
  try {
    const { date, weightKg, note } = req.body;
    const w = parseNumber(weightKg);
    if (!isFiniteNum(w) || w <= 0) return res.status(400).json({ message: 'Невірна вага (kg)' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const entry = { date: date ? new Date(date) : new Date(), weightKg: w, note: note || '' };
    user.weightLog = user.weightLog || [];
    user.weightLog.push(entry);

    // синхронізуємо поточну вагу в bodyMetrics
    user.bodyMetrics = {
      ...(user.bodyMetrics || {}),
      currentWeightKg: w,
    };

    await user.save();

    // повернемо останні 30 записів
    const sorted = [...user.weightLog]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    res.status(201).json({
      message: 'Додано',
      entry,
      weightLog: sorted,
      bodyMetrics: user.bodyMetrics,
    });
  } catch (error) {
    console.error('Помилка додавання ваги:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Отримати журнал ваги =====
export const listWeightLog = async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    let items = user.weightLog || [];
    if (from) items = items.filter((x) => new Date(x.date) >= new Date(from));
    if (to) items = items.filter((x) => new Date(x.date) <= new Date(to));

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lim = parseInt(limit, 10);
    if (Number.isFinite(lim) && lim > 0) items = items.slice(0, lim);

    res.json({ weightLog: items });
  } catch (error) {
    console.error('Помилка отримання журналу ваги:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Видалити запис ваги =====
export const deleteWeightEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    if (!entryId) return res.status(400).json({ message: 'entryId обов’язковий' });

    const result = await User.updateOne(
      { _id: req.user._id },
      { $pull: { weightLog: { _id: entryId } } }
    );

    if (result.modifiedCount === 0) return res.status(404).json({ message: 'Запис не знайдено' });

    // повернемо оновлений список
    const user = await User.findById(req.user._id);
    const sorted = (user.weightLog || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ message: 'Видалено', weightLog: sorted });
  } catch (error) {
    console.error('Помилка видалення запису ваги:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Оновити налаштування приватності =====
export const updateSettingsPrivacy = async (req, res) => {
  try {
    const { privacy } = req.body;
    const allowed = ['public', 'friends', 'private'];
    if (!allowed.includes(privacy)) return res.status(400).json({ message: 'Некоректна приватність' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    user.settings = { ...(user.settings || {}), privacy };
    await user.save();

    res.json({ message: 'Налаштування оновлено', settings: user.settings });
  } catch (error) {
    console.error('Помилка оновлення налаштувань:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Список користувачів (адмін) =====
export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find().populate('membership').select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Помилка отримання користувачів:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Призначити/змінити абонемент (адмін) =====
export const assignMembership = async (req, res) => {
  try {
    const { userId, membershipId, membershipStart, membershipEnd } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (membershipId) {
      const membership = await Membership.findById(membershipId);
      if (!membership) return res.status(404).json({ message: 'Абонемент не знайдено' });

      user.membership = membershipId;
      user.membershipStart = membershipStart ? new Date(membershipStart) : new Date();

      if (membershipEnd) {
        user.membershipEnd = new Date(membershipEnd);
      } else {
        const end = new Date(user.membershipStart);
        end.setDate(end.getDate() + (membership.durationDays || 30));
        user.membershipEnd = end;
      }

      // ініціалізуємо ліміт відвідувань
      if (membership.visits > 0) user.visitsRemaining = membership.visits;
      else user.visitsRemaining = null; // безліміт
    } else {
      user.membership = null;
      user.membershipStart = null;
      user.membershipEnd = null;
      user.visitsRemaining = null;
    }

    await user.save();
    const populated = await User.findById(user._id).populate('membership').select('-password');

    res.json({ message: 'Абонемент користувачу оновлено', user: populated });
  } catch (error) {
    console.error('Помилка призначення абонементу:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Видалити користувача (адмін) =====
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Користувача видалено' });
  } catch (error) {
    console.error('Помилка видалення користувача:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Пошук користувачів (імʼя/телефон) (адмін) =====
export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({ $or: [{ name: regex }, { phone: regex }] })
      .limit(20)
      .populate('membership')
      .select('-password');

    res.json({ users });
  } catch (error) {
    console.error('Помилка пошуку користувачів:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Check-in по userId (адмін) =====
export const checkin = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId обов’язковий' });

    const user = await User.findById(userId).populate('membership');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (!user.membership || !user.membershipStart || !user.membershipEnd)
      return res.status(400).json({ message: 'Абонемент не призначено' });

    const now = new Date();
    if (now < user.membershipStart) return res.status(400).json({ message: 'Абонемент ще не активний' });
    if (now > user.membershipEnd) return res.status(400).json({ message: 'Абонемент прострочений' });

    if (user.membership.visits > 0) {
      if (user.visitsRemaining === null || user.visitsRemaining === undefined) {
        user.visitsRemaining = user.membership.visits;
      }
      if (user.visitsRemaining <= 0)
        return res.status(400).json({ message: 'Вичерпано відвідування' });
      user.visitsRemaining -= 1;
      await user.save();
    }

    const populated = await User.findById(user._id).populate('membership').select('-password');
    res.json({ message: 'Check-in успішний', user: populated, status: 'ok' });
  } catch (error) {
    console.error('Помилка check-in:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Check-in через QR (BODY { code }) (адмін) =====
export const checkinByQR = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'QR код відсутній' });

    const user = await User.findOne({ checkinCode: code }).populate('membership');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const now = new Date();
    if (!user.membership || !user.membershipStart || !user.membershipEnd)
      return res.status(400).json({ message: 'Абонемент не призначено' });
    if (now < user.membershipStart) return res.status(400).json({ message: 'Абонемент ще не активний' });
    if (now > user.membershipEnd) return res.status(400).json({ message: 'Абонемент прострочений' });

    if (user.membership.visits > 0) {
      if (user.visitsRemaining === null || user.visitsRemaining === undefined)
        user.visitsRemaining = user.membership.visits;
      if (user.visitsRemaining <= 0)
        return res.status(400).json({ message: 'Вичерпано відвідування' });
      user.visitsRemaining -= 1;
      await user.save();
    }

    const populated = await User.findById(user._id).populate('membership').select('-password');
    res.json({ message: 'Check-in успішний (QR)', user: populated, status: 'ok' });
  } catch (error) {
    console.error('Помилка check-in через QR:', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};

// ===== Check-in через QR (PARAM /:code) (адмін) =====
export const checkinByQRParam = async (req, res) => {
  try {
    const code = req.params.code;
    if (!code) return res.status(400).json({ message: 'QR код відсутній' });

    const user = await User.findOne({ checkinCode: code }).populate('membership');
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const now = new Date();
    if (!user.membership || !user.membershipStart || !user.membershipEnd)
      return res.status(400).json({ message: 'Абонемент не призначено' });
    if (now < user.membershipStart) return res.status(400).json({ message: 'Абонемент ще не активний' });
    if (now > user.membershipEnd) return res.status(400).json({ message: 'Абонемент прострочений' });

    if (user.membership.visits > 0) {
      if (user.visitsRemaining === null || user.visitsRemaining === undefined)
        user.visitsRemaining = user.membership.visits;
      if (user.visitsRemaining <= 0)
        return res.status(400).json({ message: 'Вичерпано відвідування' });
      user.visitsRemaining -= 1;
      await user.save();
    }

    const populated = await User.findById(user._id).populate('membership').select('-password');
    res.json({ message: 'Check-in успішний (QR)', user: populated, status: 'ok' });
  } catch (error) {
    console.error('Помилка check-in через QR (param):', error);
    res.status(500).json({ message: 'Помилка сервера', error: error.message });
  }
};