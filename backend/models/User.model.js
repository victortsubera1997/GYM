// backend/models/User.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Логи ваги користувача (для графіків/статистики)
 */
const weightEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: () => new Date() },
    weightKg: { type: Number, required: true }, // зберігаємо в кг (конвертація у клієнті, якщо треба)
    note: { type: String, default: '' },
  },
  { _id: false }
);

/**
 * Поточні антропометричні дані (все у см/кг)
 * — зручно тримати “останній знімок”, а історію — окремо (weightLog)
 */
const bodyMetricsSchema = new mongoose.Schema(
  {
    heightCm: { type: Number, default: null },     // зріст
    currentWeightKg: { type: Number, default: null }, // поточна вага (дублюємо останній weightLog для швидкого доступу)
    goalWeightKg: { type: Number, default: null },  // цільова вага (опційно)
    // виміри
    neckCm: { type: Number, default: null },
    chestCm: { type: Number, default: null },
    waistCm: { type: Number, default: null },
    hipsCm: { type: Number, default: null },
    bicepsCm: { type: Number, default: null },
    thighCm: { type: Number, default: null },
    calfCm: { type: Number, default: null },
    // додатково
    birthday: { type: Date, default: null },        // щоб можна було рахувати вік (опційно)
    sex: { type: String, enum: ['male', 'female', 'other', null], default: null },
  },
  { _id: false }
);

/**
 * Налаштування користувача
 */
const settingsSchema = new mongoose.Schema(
  {
    privacy: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'private',
    },
    units: {
      // зберігаємо в БД в SI (кг/см), але дозволяємо у клієнті налаштувати відображення
      weight: { type: String, enum: ['kg', 'lb'], default: 'kg' },
      length: { type: String, enum: ['cm', 'in'], default: 'cm' },
    },
    leaderboardOptIn: { type: Boolean, default: true }, // участь у рейтингах за замовчуванням увімкнено
    showGymLeaderboard: { type: Boolean, default: true }, // показ у рейтингу залу
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // базове
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },

    // абонемент
    membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },
    membershipStart: { type: Date, default: null },
    membershipEnd: { type: Date, default: null },

    // залишок відвідувань (null — безліміт)
    visitsRemaining: { type: Number, default: null },

    // унікальний код для QR/check-in
    checkinCode: { type: String, unique: true, sparse: true },

    role: { type: String, enum: ['admin', 'client'], default: 'client' },

    // 🆕 антропометрія + історія ваги
    bodyMetrics: { type: bodyMetricsSchema, default: () => ({}) },
    weightLog: { type: [weightEntrySchema], default: [] },

    // 🆕 налаштування та приватність
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Генеруємо checkinCode один раз (якщо ще немає)
userSchema.pre('save', function (next) {
  if (!this.checkinCode) {
    this.checkinCode = crypto.randomBytes(8).toString('hex'); // 16 символів
  }
  next();
});

// Хешування пароля (лише якщо змінювався)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Метод перевірки пароля
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * Хелпер: оновити currentWeightKg з останнього запису логів ваги.
 * Викликай після пушу в weightLog у відповідному контролері.
 */
userSchema.methods.syncCurrentWeightFromLog = function () {
  if (!Array.isArray(this.weightLog) || this.weightLog.length === 0) return;
  const last = this.weightLog[this.weightLog.length - 1];
  if (last?.weightKg) {
    this.bodyMetrics.currentWeightKg = last.weightKg;
  }
};

const User = mongoose.model('User', userSchema);
export default User;