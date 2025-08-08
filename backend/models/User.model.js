import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },

  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership', default: null },
  membershipStart: { type: Date, default: null },
  membershipEnd: { type: Date, default: null },

  // залишок відвідувань (null — безліміт)
  visitsRemaining: { type: Number, default: null },

  // унікальний код для QR/check-in
  checkinCode: { type: String, unique: true, sparse: true },

  role: { type: String, enum: ['admin', 'client'], default: 'client' },
}, { timestamps: true });

// Генеруємо checkinCode один раз (якщо ще немає)
userSchema.pre('save', function(next) {
  if (!this.checkinCode) {
    this.checkinCode = crypto.randomBytes(8).toString('hex'); // 16 символів
  }
  next();
});

// Хешування пароля
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

// Перевірка пароля
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
